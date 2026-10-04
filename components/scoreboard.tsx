'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { PLAYER_COLORS, type GameState, type PlayerScore } from '@/lib/game';
import { BackgroundFX, VictoryOverlay, VICTORY_SCORE, type Delta } from './scoreboard-shared';
import { ScoreboardDesktop } from './scoreboard-desktop';
import { ScoreboardMobile } from './scoreboard-mobile';

export function Scoreboard() {
  const [game, setGame] = useState<GameState | null>(null);
  const [error, setError] = useState('');
  const [movement, setMovement] = useState<Record<number, number>>({});
  const [deltas, setDeltas] = useState<Record<number, Delta>>({});
  const [winner, setWinner] = useState<PlayerScore | null>(null);
  const prevTotals = useRef(new Map<number, number>());
  const prevRanks = useRef(new Map<number, number>());

  useEffect(() => {
    let active = true;
    // Procesa cada lectura: detecta subidas/bajadas de puestos, saltos de puntaje y cruce de la meta de victoria.
    const ingest = (data: GameState) => {
      setGame(data);
      const standings = [...data.players].sort((left, right) => right.total - left.total || left.id - left.id);
      const ranks = new Map(standings.map((player, index) => [player.id, index]));
      const totals = new Map(standings.map((player) => [player.id, player.total]));
      if (prevTotals.current.size > 0) {
        setMovement((current) => {
          const next = { ...current };
          for (const player of standings) {
            const change = (prevRanks.current.get(player.id) ?? ranks.get(player.id) ?? 0) - (ranks.get(player.id) ?? 0);
            if (change !== 0) next[player.id] = change;
          }
          return next;
        });
        const nextDeltas: Record<number, Delta> = {};
        let key = Date.now();
        for (const player of standings) {
          const prevTotal = prevTotals.current.get(player.id);
          if (prevTotal !== undefined && player.total > prevTotal) nextDeltas[player.id] = { value: player.total - prevTotal, key: key++ };
          if (prevTotal !== undefined && prevTotal < VICTORY_SCORE && player.total >= VICTORY_SCORE) setWinner(player);
        }
        if (Object.keys(nextDeltas).length > 0) {
          setDeltas((current) => ({ ...current, ...nextDeltas }));
          const ids = Object.keys(nextDeltas).map(Number);
          window.setTimeout(() => setDeltas((current) => {
            const rest = { ...current };
            for (const id of ids) delete rest[id];
            return rest;
          }), 2600);
        }
      }
      prevTotals.current = totals;
      prevRanks.current = ranks;
      // Si corrigen el puntaje hacia abajo, se retira la cortinilla de victoria.
      setWinner((current) => {
        if (!current) return current;
        const player = data.players.find((item) => item.id === current.id);
        return player && player.total >= VICTORY_SCORE ? current : null;
      });
    };
    const load = async () => {
      try {
        const response = await fetch('/api/game', { cache: 'no-store' });
        const data = await response.json() as GameState & { error?: string };
        if (!response.ok) throw new Error(data.error || 'No se pudo cargar la partida.');
        if (active) { ingest(data); setError(''); }
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : 'No se pudo cargar la partida.');
      }
    };
    void load();
    const interval = window.setInterval(load, 2000);
    return () => { active = false; window.clearInterval(interval); };
  }, []);

  const standings = useMemo(
    () => (game ? [...game.players].sort((left, right) => right.total - left.total || left.id - left.id) : []),
    [game],
  );

  const leader = standings[0];
  const leaderColor = leader ? PLAYER_COLORS[leader.color] : '#d9a441';

  return (
    <main className="relative flex h-dvh flex-col overflow-hidden bg-background text-foreground">
      <BackgroundFX color={leaderColor} />

      {/* Cada vista decide su presentación según el ancho; CSS evita parpadeos de hidratación. */}
      <div className="relative z-10 flex min-h-0 flex-1 flex-col sm:hidden">
        <ScoreboardMobile game={game} standings={standings} movement={movement} deltas={deltas} error={error} />
      </div>
      <div className="relative z-10 hidden min-h-0 flex-1 flex-col sm:flex">
        <ScoreboardDesktop game={game} standings={standings} movement={movement} deltas={deltas} error={error} />
      </div>

      <AnimatePresence>
        {winner ? <VictoryOverlay player={winner} onClose={() => setWinner(null)} /> : null}
      </AnimatePresence>
    </main>
  );
}
