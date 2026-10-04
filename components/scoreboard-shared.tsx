'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { Building2, Crown, House, Minus, Plus, Route, Swords, TrendingDown, TrendingUp, X } from 'lucide-react';
import { PLAYER_COLORS, type GameState, type PlayerScore } from '@/lib/game';

export const VICTORY_SCORE = 10;

export const stats = [
  { key: 'settlements', label: 'Poblados (+1)', short: 'POB', scoring: true, icon: House },
  { key: 'cities', label: 'Ciudades (+2)', short: 'CIU', scoring: true, icon: Building2 },
  { key: 'roads', label: 'Caminos', short: 'CAM', scoring: false, icon: Route },
  { key: 'armies', label: 'Ejércitos', short: 'EJE', scoring: false, icon: Swords },
  { key: 'additionalPoints', label: 'Puntos adicionales', short: 'EXT', scoring: true, icon: Plus },
] as const;

export const rankStyles = [
  'bg-gradient-to-br from-[#f2c460] to-[#b9832a] text-[#1c1503] shadow-[0_0_28px_rgba(242,196,96,.45)]',
  'bg-gradient-to-br from-[#dbe4ea] to-[#9fb1bd] text-[#1a232b]',
  'bg-gradient-to-br from-[#d9a06b] to-[#a06a3c] text-[#231303]',
];

export const tickerItems = [
  'El primero en llegar a 10 puntos gana',
  'Poblado +1',
  'Ciudad +2',
  'Camino +1',
  'Camino más largo +2',
  'Ejército más grande +2',
  'Puntos adicionales',
];

export type Delta = { value: number; key: number };

/** Props que comparten las vistas de escritorio y móvil. */
export type ScoreboardViewProps = {
  game: GameState | null;
  standings: PlayerScore[];
  movement: Record<number, number>;
  deltas: Record<number, Delta>;
  error: string;
};

/** Anima un número desde su valor anterior al nuevo (efecto contador de TV). */
export function CountUp({ value, className }: { value: number; className?: string }) {
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

export function Clock({ className = '' }: { className?: string }) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    const update = () => setNow(new Date());
    const timeout = window.setTimeout(update, 0);
    const interval = window.setInterval(update, 1000);
    return () => { window.clearTimeout(timeout); window.clearInterval(interval); };
  }, []);
  return <span className={`font-mono tabular-nums text-[#94a7b5] ${className}`}>{now ? now.toLocaleTimeString('es-AR', { hour12: false }) : '--:--:--'}</span>;
}

/** Haces de luz teñidos con el color del líder que barren el fondo. */
export function BackgroundFX({ color }: { color: string }) {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
      <div className="absolute -top-1/3 left-[-12%] h-[85vh] w-[46vw] animate-[beam-sweep_16s_ease-in-out_infinite] rounded-full opacity-25 blur-3xl" style={{ background: `radial-gradient(closest-side, ${color}, transparent)` }} />
      <div className="absolute -bottom-1/3 right-[-12%] h-[85vh] w-[46vw] animate-[beam-sweep_20s_ease-in-out_infinite_reverse] rounded-full opacity-15 blur-3xl" style={{ background: 'radial-gradient(closest-side, #f2c460, transparent)' }} />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(6,10,14,.8))]" />
    </div>
  );
}

export function MovementBadge({ change, className = '' }: { change: number; className?: string }) {
  const base = `inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-bold ${className}`;
  const icon = 'size-[clamp(0.75rem,12cqh,1.05rem)]';
  if (change > 0) {
    return <span className={`${base} border-emerald-400/25 bg-emerald-400/10 text-emerald-300`}><TrendingUp aria-hidden className={icon} />{change}</span>;
  }
  if (change < 0) {
    return <span className={`${base} border-rose-400/25 bg-rose-400/10 text-rose-300`}><TrendingDown aria-hidden className={icon} />{-change}</span>;
  }
  return <span className={`${base} border-white/10 bg-white/[.04] text-[#5c7280]`}><Minus aria-hidden className={icon} /></span>;
}

export function DeltaBadge({ delta, className = '' }: { delta?: Delta; className?: string }) {
  return (
    <AnimatePresence>
      {delta ? (
        <motion.span
          key={delta.key}
          initial={{ opacity: 0, y: 12, scale: 0.5 }}
          animate={{ opacity: 1, y: -4, scale: 1 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ type: 'spring', stiffness: 380, damping: 22 }}
          className={`absolute -top-3 right-0 rounded-full bg-emerald-400 px-2 py-0.5 font-black text-emerald-950 shadow-[0_0_18px_rgba(52,211,153,.65)] ${className}`}
        >
          +{delta.value}
        </motion.span>
      ) : null}
    </AnimatePresence>
  );
}

/** Barra de noticias con las reglas de puntuación; el estilo lo aporta cada vista. */
export function Ticker({ barClassName = '', textClassName = '', padClassName = '' }: { barClassName?: string; textClassName?: string; padClassName?: string }) {
  return (
    <div className={`relative overflow-hidden border-y border-white/10 bg-[#0c141b]/95 ${barClassName}`}>
      <div className="flex w-max animate-[broadcast-ticker_30s_linear_infinite] whitespace-nowrap">
        {[0, 1].map((dup) => (
          <div key={dup} className="flex items-center" aria-hidden={dup === 1}>
            {tickerItems.map((item) => (
              <span key={`${dup}-${item}`} className={`flex items-center font-semibold uppercase text-[#8fa3b0] ${textClassName}`}>
                <span className={padClassName}>{item}</span>
                <span className="size-1 rounded-full bg-[#d9a441]/70" />
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Cortinilla de victoria con confeti cuando alguien llega a la meta de puntos. */
export function VictoryOverlay({ player, onClose }: { player: PlayerScore; onClose: () => void }) {
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
