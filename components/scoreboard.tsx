'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { Building2, Castle, Crown, Flame, House, Minus, Plus, Route, Shield, Swords, TrendingDown, TrendingUp, X } from 'lucide-react';
import { PLAYER_COLORS, type GameState, type PlayerScore } from '@/lib/game';

const VICTORY_SCORE = 10;

const stats = [
  { key: 'settlements', label: 'Poblados', icon: House },
  { key: 'cities', label: 'Ciudades', icon: Building2 },
  { key: 'roads', label: 'Caminos', icon: Route },
  { key: 'armies', label: 'Ejércitos', icon: Swords },
  { key: 'additionalPoints', label: 'Adicionales', icon: Plus },
] as const;

const rankStyles = [
  'bg-gradient-to-br from-[#f2c460] to-[#b9832a] text-[#1c1503] shadow-[0_0_28px_rgba(242,196,96,.45)]',
  'bg-gradient-to-br from-[#dbe4ea] to-[#9fb1bd] text-[#1a232b]',
  'bg-gradient-to-br from-[#d9a06b] to-[#a06a3c] text-[#231303]',
];

const tickerItems = [
  'El primero en llegar a 10 puntos gana',
  'Poblado +1',
  'Ciudad +2',
  'Camino +1',
  'Camino más largo +2',
  'Ejército más grande +2',
  'Puntos adicionales',
];

type Delta = { value: number; key: number };

/** Anima un número desde su valor anterior al nuevo (efecto contador de TV). */
function CountUp({ value, className }: { value: number; className?: string }) {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  useEffect(() => {
    const from = fromRef.current;
    if (from === value) { setDisplay(value); return; }
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 800);
      setDisplay(Math.round(from + (value - from) * (1 - (1 - t) ** 3)));
      if (t < 1) raf = requestAnimationFrame(tick);
      else fromRef.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); fromRef.current = value; };
  }, [value]);
  return <span className={className}>{display}</span>;
}

function Clock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    const update = () => setNow(new Date());
    const timeout = window.setTimeout(update, 0);
    const interval = window.setInterval(update, 1000);
    return () => { window.clearTimeout(timeout); window.clearInterval(interval); };
  }, []);
  return <span className="font-mono text-sm tabular-nums text-[#94a7b5]">{now ? now.toLocaleTimeString('es-AR', { hour12: false }) : '--:--:--'}</span>;
}

/** Haces de luz que teñidos con el color del líder barren el fondo. */
function BackgroundFX({ color }: { color: string }) {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
      <div className="absolute -top-1/3 left-[-12%] h-[85vh] w-[46vw] animate-[beam-sweep_16s_ease-in-out_infinite] rounded-full opacity-25 blur-3xl" style={{ background: `radial-gradient(closest-side, ${color}, transparent)` }} />
      <div className="absolute -bottom-1/3 right-[-12%] h-[85vh] w-[46vw] animate-[beam-sweep_20s_ease-in-out_infinite_reverse] rounded-full opacity-15 blur-3xl" style={{ background: 'radial-gradient(closest-side, #f2c460, transparent)' }} />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(6,10,14,.8))]" />
    </div>
  );
}

function MovementBadge({ change }: { change: number }) {
  if (change > 0) {
    return <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2 py-0.5 text-xs font-bold text-emerald-300"><TrendingUp aria-hidden className="size-3.5" />{change}</span>;
  }
  if (change < 0) {
    return <span className="inline-flex items-center gap-1 rounded-full border border-rose-400/25 bg-rose-400/10 px-2 py-0.5 text-xs font-bold text-rose-300"><TrendingDown aria-hidden className="size-3.5" />{-change}</span>;
  }
  return <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[.04] px-2 py-0.5 text-xs font-bold text-[#5c7280]"><Minus aria-hidden className="size-3.5" /></span>;
}

function DeltaBadge({ delta }: { delta?: Delta }) {
  return (
    <AnimatePresence>
      {delta ? (
        <motion.span
          key={delta.key}
          initial={{ opacity: 0, y: 12, scale: 0.5 }}
          animate={{ opacity: 1, y: -4, scale: 1 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ type: 'spring', stiffness: 380, damping: 22 }}
          className="absolute -top-3 right-0 rounded-full bg-emerald-400 px-2 py-0.5 text-xs font-black text-emerald-950 shadow-[0_0_18px_rgba(52,211,153,.65)]"
        >
          +{delta.value}
        </motion.span>
      ) : null}
    </AnimatePresence>
  );
}

function Ticker() {
  return (
    <div className="relative overflow-hidden border-y border-white/10 bg-[#0c141b]/95 py-2.5">
      <div className="flex w-max animate-[broadcast-ticker_30s_linear_infinite] whitespace-nowrap">
        {[0, 1].map((dup) => (
          <div key={dup} className="flex items-center" aria-hidden={dup === 1}>
            {tickerItems.map((item) => (
              <span key={`${dup}-${item}`} className="flex items-center text-xs font-semibold uppercase tracking-[.22em] text-[#8fa3b0]">
                <span className="px-5">{item}</span>
                <span className="size-1 rounded-full bg-[#d9a441]/70" />
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Tarjeta gigante del líder con brillo, cuenta progresiva y camino a la victoria. */
function LeaderHero({ player, delta }: { player: PlayerScore; delta?: Delta }) {
  const color = PLAYER_COLORS[player.color];
  const remaining = Math.max(0, VICTORY_SCORE - player.total);
  const pct = Math.min(100, (player.total / VICTORY_SCORE) * 100);
  return (
    <AnimatePresence mode="popLayout">
      <motion.section
        key={player.id}
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -16, scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 200, damping: 26 }}
        className="relative overflow-hidden rounded-3xl border p-6 sm:p-10"
        style={{
          borderColor: `${color}55`,
          background: `linear-gradient(135deg, ${color}1c, transparent 45%), linear-gradient(180deg, rgba(24,39,49,.9), rgba(16,26,34,.95))`,
          boxShadow: `0 0 90px -18px ${color}70, inset 0 1px 0 rgba(255,255,255,.06)`,
        }}
      >
        <div aria-hidden className="absolute inset-y-0 w-1/3 animate-[hero-shine_5.5s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/[.07] to-transparent" />
        <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="min-w-0">
            <div className="mb-3 flex items-center gap-2.5">
              <span className="grid size-9 place-items-center rounded-xl bg-[#d9a441]/15 text-[#f2c460]"><Crown aria-hidden className="size-5" /></span>
              <p className="text-xs font-bold uppercase tracking-[.28em] text-[#f2c460]">Líder de la partida</p>
            </div>
            <h2 className="truncate font-heading text-5xl font-black tracking-tight sm:text-6xl" style={{ textShadow: `0 0 40px ${color}55` }}>{player.name}</h2>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              {stats.map(({ key, label, icon: Icon }) => (
                <span key={key} title={label} className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[.05] px-2.5 py-1.5 text-sm">
                  <Icon aria-hidden className="size-3.5 text-[#8fa3b0]" />
                  <span className="font-bold tabular-nums">{player[key]}</span>
                </span>
              ))}
              {player.hasLongestRoad ? <span title="Camino más largo" className="inline-flex animate-[glow-breathe_2.4s_ease-in-out_infinite] items-center gap-1.5 rounded-lg border border-[#f2c460]/40 bg-[#f2c460]/10 px-2.5 py-1.5 text-sm font-bold text-[#f2c460]"><Crown aria-hidden className="size-3.5" />+2</span> : null}
              {player.hasLargestArmy ? <span title="Ejército más grande" className="inline-flex animate-[glow-breathe_2.4s_ease-in-out_infinite] items-center gap-1.5 rounded-lg border border-[#f2c460]/40 bg-[#f2c460]/10 px-2.5 py-1.5 text-sm font-bold text-[#f2c460]"><Shield aria-hidden className="size-3.5" />+2</span> : null}
            </div>
          </div>
          <div className="relative text-right">
            <DeltaBadge delta={delta} />
            <p className="mb-1 text-[11px] font-bold uppercase tracking-[.28em] text-[#8fa3b0]">Puntos de victoria</p>
            <CountUp value={player.total} className="block font-mono text-8xl font-black tabular-nums leading-none text-[#f2c460] sm:text-9xl" />
            <div className="mt-5 ml-auto w-64 max-w-full">
              <div className="mb-2 flex items-center justify-end gap-2 text-xs font-semibold">
                {remaining === 0 ? (
                  <span className="flex items-center gap-1.5 text-[#f2c460]"><Flame aria-hidden className="size-4" />¡Victoria alcanzada!</span>
                ) : remaining <= 2 ? (
                  <span className="flex animate-pulse items-center gap-1.5 text-[#ff8a5c]"><Flame aria-hidden className="size-4" />¡A {remaining} {remaining === 1 ? 'punto' : 'puntos'} de la victoria!</span>
                ) : (
                  <span className="text-[#8fa3b0]">Camino a la victoria · {remaining} para ganar</span>
                )}
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/[.07]">
                <motion.div
                  initial={false}
                  animate={{ width: `${pct}%` }}
                  transition={{ type: 'spring', stiffness: 90, damping: 20 }}
                  className="h-full rounded-full"
                  style={{ background: `linear-gradient(90deg, ${color}, #f2c460)`, boxShadow: `0 0 14px ${color}aa` }}
                />
              </div>
            </div>
          </div>
        </div>
      </motion.section>
    </AnimatePresence>
  );
}

function StandingRow({ player, rank, movement, delta }: { player: PlayerScore; rank: number; movement: number; delta?: Delta }) {
  const color = PLAYER_COLORS[player.color];
  const pct = Math.min(100, (player.total / VICTORY_SCORE) * 100);
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 260, damping: 30 }}
      className={`relative overflow-hidden rounded-2xl border bg-card/80 backdrop-blur ${rank === 0 ? 'border-[#f2c460]/35 shadow-[0_0_40px_-12px_rgba(242,196,96,.35)]' : 'border-white/10'}`}
    >
      {delta ? <span key={delta.key} aria-hidden className="pointer-events-none absolute inset-0 z-10 rounded-2xl" style={{ animation: 'score-flash 1.4s ease-out forwards' }} /> : null}
      <span aria-hidden className="absolute inset-y-0 left-0 w-1.5" style={{ backgroundColor: color, boxShadow: rank === 0 ? `0 0 16px ${color}` : undefined }} />
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3 py-4 pl-5 pr-5 sm:pl-6">
        <span className={`grid size-11 shrink-0 place-items-center rounded-xl font-mono text-xl font-black tabular-nums ${rank < 3 ? rankStyles[rank] : 'bg-white/[.06] text-[#94a7b5]'}`}>{rank + 1}</span>
        <MovementBadge change={movement} />
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <span className="size-3.5 shrink-0 rounded-full ring-4 ring-white/[.05]" style={{ backgroundColor: color }} />
          <div className="min-w-0">
            <p className="truncate text-lg font-bold leading-tight">{player.name}</p>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              {player.hasLongestRoad ? <span className="inline-flex items-center gap-1 rounded-md bg-[#f2c460]/12 px-1.5 py-0.5 text-[11px] font-bold text-[#f2c460]"><Crown aria-hidden className="size-3" />Camino +2</span> : null}
              {player.hasLargestArmy ? <span className="inline-flex items-center gap-1 rounded-md bg-[#f2c460]/12 px-1.5 py-0.5 text-[11px] font-bold text-[#f2c460]"><Shield aria-hidden className="size-3" />Ejército +2</span> : null}
            </div>
          </div>
        </div>
        <div className="hidden items-center gap-1.5 md:flex">
          {stats.map(({ key, label, icon: Icon }) => (
            <span key={key} title={label} className="inline-flex w-14 flex-col items-center gap-0.5 rounded-lg bg-white/[.04] py-1.5">
              <Icon aria-hidden className="size-3.5 text-[#7d919f]" />
              <span className="text-sm font-bold tabular-nums">{player[key]}</span>
            </span>
          ))}
        </div>
        <div className="relative ml-auto pl-4 text-right">
          <DeltaBadge delta={delta} />
          <CountUp value={player.total} className="font-mono text-4xl font-black tabular-nums text-[#f2c460]" />
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-0 h-1 bg-white/[.04]">
        <motion.div initial={false} animate={{ width: `${pct}%` }} transition={{ type: 'spring', stiffness: 90, damping: 20 }} className="h-full" style={{ background: `linear-gradient(90deg, ${color}88, ${color})`, opacity: player.total >= 8 ? 1 : 0.55 }} />
      </div>
    </motion.div>
  );
}

/** Cortinilla de victoria con confeti cuando alguien llega a 10 puntos. */
function VictoryOverlay({ player, onClose }: { player: PlayerScore; onClose: () => void }) {
  const color = PLAYER_COLORS[player.color];
  useEffect(() => {
    const palette = [color, '#f2c460', '#ffffff'];
    void confetti({ particleCount: 180, spread: 100, origin: { y: 0.55 }, colors: palette, scalar: 1.1 });
    const end = Date.now() + 2800;
    let raf = 0;
    const cannons = () => {
      void confetti({ particleCount: 4, angle: 60, spread: 60, origin: { x: 0, y: 0.7 }, colors: palette });
      void confetti({ particleCount: 4, angle: 120, spread: 60, origin: { x: 1, y: 0.7 }, colors: palette });
      if (Date.now() < end) raf = requestAnimationFrame(cannons);
    };
    cannons();
    const encore = window.setTimeout(() => void confetti({ particleCount: 110, spread: 130, origin: { y: 0.5 }, colors: palette }), 1500);
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => { cancelAnimationFrame(raf); window.clearTimeout(encore); window.removeEventListener('keydown', onKey); };
  }, [color, onClose]);
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-6 backdrop-blur-md">
      <div className="relative max-w-3xl text-center">
        <motion.div
          initial={{ scale: 0, rotate: -18 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.1 }}
          className="mx-auto mb-6 grid size-28 animate-[crown-wiggle_2.6s_ease-in-out_.6s_infinite] place-items-center rounded-3xl"
          style={{ backgroundColor: `${color}22`, boxShadow: `0 0 80px -10px ${color}` }}
        >
          <Crown aria-hidden className="size-14 text-[#f2c460]" />
        </motion.div>
        <motion.h2 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, type: 'spring', stiffness: 160, damping: 18 }} className="bg-gradient-to-b from-[#ffe9ad] via-[#f2c460] to-[#b9832a] bg-clip-text font-heading text-7xl font-black tracking-tight text-transparent drop-shadow-[0_4px_30px_rgba(242,196,96,.35)] sm:text-8xl">
          ¡VICTORIA!
        </motion.h2>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
          <p className="mt-5 flex flex-wrap items-center justify-center gap-3 text-2xl font-bold">
            <span className="size-4 rounded-full ring-4 ring-white/10" style={{ backgroundColor: color }} />
            {player.name}
          </p>
          <p className="mt-2 text-[#94a7b5]">alcanzó los {VICTORY_SCORE} puntos de victoria</p>
          <button type="button" onClick={onClose} className="mt-8 inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[.06] px-5 py-2.5 text-sm font-semibold text-[#dce6ec] transition hover:bg-white/[.1]">
            <X aria-hidden className="size-4" />Seguir viendo el marcador
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
}

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
    <main className="relative min-h-screen bg-background text-foreground">
      <BackgroundFX color={leaderColor} />

      <header className="relative border-b border-white/10 bg-[#0c141b]/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3.5 sm:px-8">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-[#d9a441] text-[#14232d] shadow-[0_0_24px_rgba(217,164,65,.25)]"><Castle aria-hidden className="size-5" /></span>
            <div>
              <p className="font-heading text-lg font-bold leading-tight tracking-tight">Catán</p>
              <p className="text-[11px] uppercase tracking-[.18em] text-[#94a7b5]">{game?.title ?? 'Marcador de partida'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 sm:gap-5">
            <span className="hidden items-center gap-2 rounded-full border border-rose-400/25 bg-rose-400/10 px-3 py-1.5 text-xs font-black uppercase tracking-[.2em] text-rose-300 sm:inline-flex">
              <span className="size-2 animate-[live-ring_1.8s_ease-out_infinite] rounded-full bg-rose-400" />En vivo
            </span>
            <Clock />
            <Link className="rounded-lg border border-white/10 bg-white/[.04] px-4 py-2 text-sm font-semibold text-[#dce6ec] transition hover:bg-white/[.08]" href="/admin">Administrar</Link>
          </div>
        </div>
      </header>

      <section className="relative mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
        {error ? (
          <div className="rounded-2xl border border-red-400/20 bg-red-400/10 p-6 text-red-200">{error}</div>
        ) : !game ? (
          <div className="h-96 animate-pulse rounded-3xl border border-white/10 bg-card" />
        ) : standings.length === 0 ? (
          <div className="grid min-h-80 place-items-center rounded-3xl border border-dashed border-white/15 bg-card px-6 text-center">
            <div><Castle className="mx-auto mb-4 size-10 text-[#d9a441]" /><h2 className="text-2xl font-bold">La mesa está lista</h2><p className="mt-2 text-[#94a7b5]">Agregá participantes desde Administración para comenzar el espectáculo.</p></div>
          </div>
        ) : (
          <div className="space-y-8">
            <LeaderHero player={leader} delta={deltas[leader.id]} />

            <div>
              <div className="mb-4 flex items-center justify-between gap-4">
                <h2 className="font-heading text-xl font-bold tracking-tight">Tabla de posiciones</h2>
                <span className="flex items-center gap-2 text-xs font-medium text-[#708796]">
                  <span className="size-1.5 animate-pulse rounded-full bg-emerald-300 shadow-[0_0_8px_rgba(110,231,183,.9)]" />
                  Actualización automática · {standings.length} {standings.length === 1 ? 'jugador' : 'jugadores'}
                </span>
              </div>
              <div className="space-y-3">
                {standings.map((player, index) => (
                  <StandingRow key={player.id} player={player} rank={index} movement={movement[player.id] ?? 0} delta={deltas[player.id]} />
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      <div className="relative mt-6">
        <Ticker />
      </div>

      <AnimatePresence>
        {winner ? <VictoryOverlay player={winner} onClose={() => setWinner(null)} /> : null}
      </AnimatePresence>
    </main>
  );
}
