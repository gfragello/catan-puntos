import { getD1 } from './index';
import { PLAYER_COLORS, type GameState, type PlayerColor, type PlayerScore, type ScoreField } from '@/lib/game';

type GameRow = { id: number; title: string; sequence: number; updatedAt: number };
type PlayerRow = {
  id: number;
  name: string;
  color: PlayerColor;
  settlements: number;
  cities: number;
  roads: number;
  armies: number;
  additionalPoints: number;
  createdOrder: number;
};
type MilestoneRow = { playerId: number; category: string; value: number; reachedOrder: number };

const scoreColumns: Record<ScoreField, string> = {
  settlements: 'settlements',
  cities: 'cities',
  roads: 'roads',
  armies: 'armies',
  additionalPoints: 'additional_points',
};

async function getOrCreateGame(): Promise<GameRow> {
  const db = getD1();
  const current = await db.prepare(
    'SELECT id, title, sequence, updated_at AS updatedAt FROM games WHERE status = ? ORDER BY id DESC LIMIT 1',
  ).bind('active').first<GameRow>();

  if (current) return current;

  const now = Date.now();
  const inserted = await db.prepare(
    'INSERT INTO games (title, status, sequence, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
  ).bind('Partida en curso', 'active', 0, now, now).run();
  const id = Number(inserted.meta.last_row_id);
  return { id, title: 'Partida en curso', sequence: 0, updatedAt: now };
}

function findHolder(
  players: PlayerRow[],
  milestones: MilestoneRow[],
  category: 'roads' | 'armies',
  threshold: number,
) {
  const maximum = Math.max(0, ...players.map((player) => player[category]));
  if (maximum < threshold) return null;

  return players
    .filter((player) => player[category] === maximum)
    .sort((left, right) => {
      const leftOrder = milestones.find(
        (milestone) => milestone.playerId === left.id && milestone.category === category && milestone.value === maximum,
      )?.reachedOrder ?? Number.MAX_SAFE_INTEGER;
      const rightOrder = milestones.find(
        (milestone) => milestone.playerId === right.id && milestone.category === category && milestone.value === maximum,
      )?.reachedOrder ?? Number.MAX_SAFE_INTEGER;
      return leftOrder - rightOrder || left.createdOrder - right.createdOrder;
    })[0]?.id ?? null;
}

export async function readGame(): Promise<GameState> {
  const db = getD1();
  const game = await getOrCreateGame();
  const [playersResult, milestonesResult] = await db.batch([
    db.prepare(
      `SELECT id, name, color, settlements, cities, roads, armies,
       additional_points AS additionalPoints, created_order AS createdOrder
       FROM players WHERE game_id = ? ORDER BY created_order ASC`,
    ).bind(game.id),
    db.prepare(
      'SELECT player_id AS playerId, category, value, reached_order AS reachedOrder FROM score_milestones WHERE game_id = ?',
    ).bind(game.id),
  ]);

  const players = playersResult.results as unknown as PlayerRow[];
  const milestones = milestonesResult.results as unknown as MilestoneRow[];
  const longestRoadHolder = findHolder(players, milestones, 'roads', 5);
  const largestArmyHolder = findHolder(players, milestones, 'armies', 3);

  const scores: PlayerScore[] = players.map((player) => {
    const hasLongestRoad = player.id === longestRoadHolder;
    const hasLargestArmy = player.id === largestArmyHolder;
    return {
      id: player.id,
      name: player.name,
      color: player.color,
      settlements: player.settlements,
      cities: player.cities,
      roads: player.roads,
      armies: player.armies,
      additionalPoints: player.additionalPoints,
      hasLongestRoad,
      hasLargestArmy,
      total:
        player.settlements +
        player.cities * 2 +
        player.roads +
        player.additionalPoints +
        (hasLongestRoad ? 2 : 0) +
        (hasLargestArmy ? 2 : 0),
    };
  });

  scores.sort((left, right) => right.total - left.total || left.id - right.id);
  return { id: game.id, title: game.title, updatedAt: game.updatedAt, players: scores };
}

export async function addPlayer(name: string, color: PlayerColor) {
  if (!(color in PLAYER_COLORS)) throw new Error('Color no válido.');
  const cleanName = name.trim().slice(0, 40);
  if (!cleanName) throw new Error('Ingresá el nombre del participante.');

  const db = getD1();
  const game = await getOrCreateGame();
  const count = await db.prepare('SELECT COUNT(*) AS total FROM players WHERE game_id = ?').bind(game.id).first<{ total: number }>();
  if (Number(count?.total ?? 0) >= 6) throw new Error('La partida admite hasta seis participantes.');

  const now = Date.now();
  const nextOrder = game.sequence + 1;
  await db.batch([
    db.prepare('UPDATE games SET sequence = ?, updated_at = ? WHERE id = ?').bind(nextOrder, now, game.id),
    db.prepare(
      `INSERT INTO players
       (game_id, name, color, settlements, cities, roads, armies, additional_points, created_order, updated_at)
       VALUES (?, ?, ?, 0, 0, 0, 0, 0, ?, ?)`,
    ).bind(game.id, cleanName, color, nextOrder, now),
  ]);
  return readGame();
}

export async function removePlayer(playerId: number) {
  const db = getD1();
  const game = await getOrCreateGame();
  const now = Date.now();
  await db.batch([
    db.prepare('DELETE FROM players WHERE id = ? AND game_id = ?').bind(playerId, game.id),
    db.prepare('UPDATE games SET updated_at = ? WHERE id = ?').bind(now, game.id),
  ]);
  return readGame();
}

export async function updateScore(playerId: number, field: ScoreField, requestedValue: number) {
  const column = scoreColumns[field];
  if (!column) throw new Error('Puntaje no válido.');
  const value = Math.max(0, Math.min(99, Math.trunc(requestedValue)));
  const db = getD1();
  const game = await getOrCreateGame();
  const player = await db.prepare(
    `SELECT id, ${column} AS currentValue FROM players WHERE id = ? AND game_id = ?`,
  ).bind(playerId, game.id).first<{ id: number; currentValue: number }>();
  if (!player) throw new Error('No se encontró el participante.');

  const now = Date.now();
  const nextSequence = game.sequence + 1;
  const statements = [
    db.prepare('UPDATE games SET sequence = ?, updated_at = ? WHERE id = ?').bind(nextSequence, now, game.id),
    db.prepare(`UPDATE players SET ${column} = ?, updated_at = ? WHERE id = ? AND game_id = ?`).bind(value, now, playerId, game.id),
  ];

  if ((field === 'roads' || field === 'armies') && value > player.currentValue) {
    for (let milestone = player.currentValue + 1; milestone <= value; milestone += 1) {
      statements.push(
        db.prepare(
          'INSERT OR IGNORE INTO score_milestones (game_id, player_id, category, value, reached_order) VALUES (?, ?, ?, ?, ?)',
        ).bind(game.id, playerId, field, milestone, nextSequence),
      );
    }
  }

  await db.batch(statements);
  return readGame();
}
