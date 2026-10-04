import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';

export const games = sqliteTable(
  'games',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    title: text('title').notNull(),
    status: text('status').notNull().default('active'),
    sequence: integer('sequence').notNull().default(0),
    createdAt: integer('created_at').notNull(),
    updatedAt: integer('updated_at').notNull(),
  },
  (table) => [index('idx_games_status').on(table.status)],
);

export const players = sqliteTable(
  'players',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    gameId: integer('game_id')
      .notNull()
      .references(() => games.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    color: text('color').notNull(),
    settlements: integer('settlements').notNull().default(0),
    cities: integer('cities').notNull().default(0),
    roads: integer('roads').notNull().default(0),
    armies: integer('armies').notNull().default(0),
    additionalPoints: integer('additional_points').notNull().default(0),
    createdOrder: integer('created_order').notNull(),
    displayOrder: integer('display_order').notNull().default(0),
    updatedAt: integer('updated_at').notNull(),
  },
  (table) => [
    uniqueIndex('idx_players_game_color').on(table.gameId, table.color),
    index('idx_players_game').on(table.gameId),
  ],
);

export const scoreMilestones = sqliteTable(
  'score_milestones',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    gameId: integer('game_id')
      .notNull()
      .references(() => games.id, { onDelete: 'cascade' }),
    playerId: integer('player_id')
      .notNull()
      .references(() => players.id, { onDelete: 'cascade' }),
    category: text('category').notNull(),
    value: integer('value').notNull(),
    reachedOrder: integer('reached_order').notNull(),
  },
  (table) => [
    uniqueIndex('idx_milestones_player_category_value').on(
      table.playerId,
      table.category,
      table.value,
    ),
    index('idx_milestones_game_category_value').on(
      table.gameId,
      table.category,
      table.value,
    ),
  ],
);

export const adminLoginAttempts = sqliteTable('admin_login_attempts', {
  clientKey: text('client_key').primaryKey(),
  attempts: integer('attempts').notNull().default(0),
  windowStartedAt: integer('window_started_at').notNull(),
  blockedUntil: integer('blocked_until').notNull().default(0),
});
