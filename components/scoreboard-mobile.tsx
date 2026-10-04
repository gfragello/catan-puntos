'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { Castle, Crown, Route, Shield } from 'lucide-react';
import { PLAYER_COLORS, type PlayerScore } from '@/lib/game';
import { Clock, CountUp, DeltaBadge, Ticker, rankStyles, stats, VICTORY_SCORE, type Delta, type ScoreboardViewProps } from './scoreboard-shared';

/** Fila móvil: compacta, con nombre y chips apilados en dos líneas.
 * Los tamaños escalan con la altura de la fila (container queries). */
function StandingRow({ player, rank, delta }: { player: PlayerScore; rank: number; delta?: Delta }) {
  const color = PLAYER_COLORS[player.color];
  const pct = Math.min(100, (player.total / VICTORY_SCORE) * 100);
  const isLeader = rank === 0;
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 260, damping: 30 }}
      className={`relative flex min-h-0 flex-1 basis-0 items-center overflow-hidden rounded-xl border [container-type:size] ${isLeader ? '' : 'border-white/10 bg-card/85'}`}
      style={isLeader ? {
        borderColor: `${color}66`,
        background: `linear-gradient(135deg, ${color}30, transparent 55%), rgba(24,39,49,.88)`,
        boxShadow: `0 0 46px -10px ${color}8c`,
      } : undefined}
    >
      {isLeader ? <div aria-hidden className="absolute inset-y-0 w-1/2 animate-[hero-shine_5.5s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/[.09] to-transparent" /> : null}
      {delta ? <span key={delta.key} aria-hidden className="pointer-events-none absolute inset-0 z-10 rounded-xl" style={{ animation: 'score-flash 1.4s ease-out forwards' }} /> : null}
      <span aria-hidden className="absolute inset-y-0 left-0 w-[clamp(3px,6cqh,9px)]" style={{ backgroundColor: color, boxShadow: isLeader ? `0 0 14px ${color}` : undefined }} />
      <div className="relative flex min-w-0 flex-1 items-center gap-[clamp(0.5rem,5cqh,1.5rem)] py-[clamp(0.25rem,3cqh,1.25rem)] pl-[clamp(0.8rem,4cqh,1.6rem)] pr-[clamp(0.6rem,3cqh,1.2rem)]">
        <span className={`grid size-[clamp(2rem,42cqh,4.5rem)] shrink-0 place-items-center rounded-[clamp(0.5rem,10cqh,1rem)] font-mono text-[clamp(1rem,20cqh,2.1rem)] font-black tabular-nums ${rank < 3 ? rankStyles[rank] : 'bg-white/[.06] text-[#94a7b5]'}`}>{rank + 1}</span>
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-[clamp(0.15rem,3cqh,0.5rem)]">
          <div className="flex min-w-0 items-center gap-[clamp(0.4rem,4cqh,0.9rem)]">
            <span className="size-[clamp(0.6rem,7cqh,0.9rem)] shrink-0 rounded-full ring-[3px] ring-white/[.06]" style={{ backgroundColor: color }} />
            <p className="truncate text-[clamp(0.95rem,min(17cqh,6.5vw),2.25rem)] font-bold leading-tight">{player.name}</p>
            {isLeader ? <Crown aria-label="Líder de la partida" className="size-[clamp(0.85rem,14cqh,1.4rem)] shrink-0 animate-[glow-breathe_2.4s_ease-in-out_infinite] text-[#f2c460]" /> : null}
          </div>
          <div className="flex flex-wrap items-center gap-[clamp(0.25rem,3cqh,0.6rem)] [@container(max-height:82px)]:hidden">
            {stats.map(({ key, label, icon: Icon }) => (
              <span key={key} title={label} className="inline-flex items-center gap-[clamp(0.2rem,2.5cqh,0.5rem)] rounded-[clamp(0.35rem,6cqh,0.75rem)] bg-white/[.05] px-[clamp(0.4rem,5cqh,1rem)] py-[clamp(0.15rem,2.5cqh,0.5rem)] text-[clamp(0.65rem,11.5cqh,1.3rem)] font-bold tabular-nums">
                <Icon aria-hidden className="size-[clamp(0.7rem,12cqh,1.3rem)] text-[#7d919f]" />
                {player[key]}
              </span>
            ))}
            {player.hasLongestRoad ? <span title="Camino más largo" className="inline-flex animate-[glow-breathe_2.4s_ease-in-out_infinite] items-center gap-[clamp(0.2rem,2.5cqh,0.5rem)] rounded-[clamp(0.35rem,6cqh,0.75rem)] bg-[#f2c460]/12 px-[clamp(0.4rem,5cqh,1rem)] py-[clamp(0.15rem,2.5cqh,0.5rem)] text-[clamp(0.65rem,11.5cqh,1.3rem)] font-bold text-[#f2c460]"><Route aria-hidden className="size-[clamp(0.7rem,12cqh,1.3rem)]" />+2</span> : null}
            {player.hasLargestArmy ? <span title="Ejército más grande" className="inline-flex animate-[glow-breathe_2.4s_ease-in-out_infinite] items-center gap-[clamp(0.2rem,2.5cqh,0.5rem)] rounded-[clamp(0.35rem,6cqh,0.75rem)] bg-[#f2c460]/12 px-[clamp(0.4rem,5cqh,1rem)] py-[clamp(0.15rem,2.5cqh,0.5rem)] text-[clamp(0.65rem,11.5cqh,1.3rem)] font-bold text-[#f2c460]"><Shield aria-hidden className="size-[clamp(0.7rem,12cqh,1.3rem)]" />+2</span> : null}
          </div>
        </div>
        <div className="relative ml-auto shrink-0 pl-[clamp(0.5rem,4cqh,1rem)] text-right">
          <DeltaBadge delta={delta} />
          <CountUp value={player.total} className="block font-mono text-[clamp(1.5rem,38cqh,5rem)] font-black leading-none tabular-nums text-[#f2c460]" />
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-0 h-[clamp(2px,4cqh,6px)] bg-white/[.04]">
        <motion.div initial={false} animate={{ width: `${pct}%` }} transition={{ type: 'spring', stiffness: 90, damping: 20 }} className="h-full" style={{ background: `linear-gradient(90deg, ${color}88, ${color})`, opacity: player.total >= 8 ? 1 : 0.55 }} />
      </div>
    </motion.div>
  );
}

/** Vista móvil: header compacto, filas en dos líneas y ticker fino. */
export function ScoreboardMobile({ game, standings, deltas, error }: ScoreboardViewProps) {
  return (
    <>
      <header className="shrink-0 border-b border-white/10 bg-[#0c141b]/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-2 px-3 py-2">
          <div className="flex min-w-0 items-center gap-2">
            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#d9a441] text-[#14232d] shadow-[0_0_24px_rgba(217,164,65,.25)]"><Castle aria-hidden className="size-4" /></span>
            <div className="min-w-0">
              <p className="font-heading text-base font-bold leading-tight tracking-tight">Catán</p>
              <p className="hidden truncate text-[11px] uppercase tracking-[.18em] text-[#94a7b5] min-[420px]:block">{game?.title ?? 'Marcador de partida'}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="hidden items-center gap-1.5 rounded-full border border-rose-400/25 bg-rose-400/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[.18em] text-rose-300 min-[420px]:inline-flex">
              <span className="size-1.5 animate-[live-ring_1.8s_ease-out_infinite] rounded-full bg-rose-400" />En vivo
            </span>
            <span className="hidden min-[420px]:inline"><Clock className="text-sm" /></span>
            <Link className="rounded-lg border border-white/10 bg-white/[.04] px-2.5 py-1.5 text-xs font-semibold text-[#dce6ec] transition hover:bg-white/[.08]" href="/admin">Administrar</Link>
          </div>
        </div>
      </header>

      <section className="mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col gap-1.5 overflow-hidden px-2.5 py-2">
        {error ? (
          <div className="flex flex-1 items-center justify-center rounded-2xl border border-red-400/20 bg-red-400/10 p-6 text-center text-red-200">{error}</div>
        ) : !game ? (
          <div className="min-h-0 flex-1 animate-pulse rounded-2xl border border-white/10 bg-card" />
        ) : standings.length === 0 ? (
          <div className="grid min-h-0 flex-1 place-items-center rounded-2xl border border-dashed border-white/15 bg-card px-6 text-center">
            <div><Castle className="mx-auto mb-3 size-9 text-[#d9a441]" /><h2 className="text-xl font-bold">La mesa está lista</h2><p className="mt-2 text-sm text-[#94a7b5]">Agregá participantes desde Administración para comenzar el espectáculo.</p></div>
          </div>
        ) : (
          standings.map((player, index) => (
            <StandingRow key={player.id} player={player} rank={index} delta={deltas[player.id]} />
          ))
        )}
      </section>

      <div className="shrink-0">
        <Ticker barClassName="py-1.5" textClassName="text-[10px] tracking-[.18em]" padClassName="px-4" />
      </div>
    </>
  );
}
