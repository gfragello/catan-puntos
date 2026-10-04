'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import type { LucideIcon } from 'lucide-react';
import { Castle, Crown, Route, Shield } from 'lucide-react';
import { PLAYER_COLORS, type PlayerScore } from '@/lib/game';
import { Clock, CountUp, DeltaBadge, MovementBadge, Ticker, rankStyles, stats, VICTORY_SCORE, type Delta, type ScoreboardViewProps } from './scoreboard-shared';

const tileBox = 'flex w-[clamp(2.9rem,min(40cqh,5.6vw),7rem)] shrink-0 flex-col items-center justify-center gap-[clamp(0.1rem,2cqh,0.45rem)] rounded-[clamp(0.5rem,8cqh,1.15rem)] border px-[clamp(0.2rem,2cqh,0.6rem)] py-[clamp(0.2rem,3cqh,0.8rem)]';
const tileHead = 'flex items-center gap-[clamp(0.12rem,1.8cqh,0.4rem)] text-[clamp(0.6rem,min(9cqh,1.05vw),1.25rem)] font-black uppercase leading-none tracking-[.08em]';
const tileIcon = 'size-[clamp(0.8rem,min(12cqh,1.35vw),1.7rem)]';
const tileValue = 'font-mono text-[clamp(1.35rem,min(35cqh,4vw),4.5rem)] font-black leading-none tabular-nums';
/* El "+2" ocupa dos caracteres: el casillero de bonos es más ancho, con más padding
   horizontal y un valor algo más compacto para que el texto nunca toque el borde. */
const bonusBox = 'flex w-[clamp(3.4rem,min(48cqh,6.5vw),8rem)] shrink-0 flex-col items-center justify-center gap-[clamp(0.1rem,2cqh,0.45rem)] rounded-[clamp(0.5rem,8cqh,1.15rem)] border px-[clamp(0.5rem,3.5cqh,1rem)] py-[clamp(0.2rem,3cqh,0.8rem)]';
const bonusValue = 'font-mono text-[clamp(1.05rem,min(26cqh,3.2vw),3.4rem)] font-black leading-none tabular-nums';

/** Casillero de estadística: número gigante y alineado en columna entre filas. */
function StatTile({ icon: Icon, label, short, value, scoring }: { icon: LucideIcon; label: string; short: string; value: number; scoring: boolean }) {
  const filled = value > 0;
  return (
    <div title={label} className={`${tileBox} ${scoring && filled ? 'border-[#f2c460]/35 bg-[#f2c460]/[.12]' : 'border-white/10 bg-white/[.05]'} ${filled ? '' : 'opacity-35'}`}>
      <span className={`${tileHead} ${scoring && filled ? 'text-[#f2c460]/80' : 'text-[#8fa3b0]'}`}>
        <Icon aria-hidden className={tileIcon} />
        <span className="[@container(max-height:125px)]:hidden">{short}</span>
      </span>
      <span className={`${tileValue} ${scoring && filled ? 'text-[#f7d98a]' : 'text-white'}`}>{value}</span>
    </div>
  );
}

/** Casillero de bonificación: mantiene su lugar aunque nadie la tenga. */
function BonusTile({ icon: Icon, label, short, active }: { icon: LucideIcon; label: string; short: string; active: boolean }) {
  return (
    <div title={label} className={`${bonusBox} ${active ? 'animate-[glow-breathe_2.4s_ease-in-out_infinite] border-[#f2c460]/50 bg-[#f2c460]/[.16] text-[#f2c460]' : 'border-white/10 bg-white/[.03] text-[#6d8290] opacity-30'}`}>
      <span className={tileHead}>
        <Icon aria-hidden className={tileIcon} />
        <span className="[@container(max-height:125px)]:hidden">{short}</span>
      </span>
      <span className={bonusValue}>+2</span>
    </div>
  );
}

/** Fila de escritorio: textos grandes para leerse desde lejos.
 * Los tamaños escalan con la altura de la fila (container queries). */
function StandingRow({ player, rank, movement, delta }: { player: PlayerScore; rank: number; movement: number; delta?: Delta }) {
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
      className={`relative flex min-h-0 flex-1 basis-0 items-center overflow-hidden rounded-2xl border [container-type:size] ${isLeader ? '' : 'border-white/10 bg-card/85'}`}
      style={isLeader ? {
        borderColor: `${color}66`,
        background: `linear-gradient(135deg, ${color}30, transparent 55%), rgba(24,39,49,.88)`,
        boxShadow: `0 0 46px -10px ${color}8c`,
      } : undefined}
    >
      {isLeader ? <div aria-hidden className="absolute inset-y-0 w-1/2 animate-[hero-shine_5.5s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/[.09] to-transparent" /> : null}
      {delta ? <span key={delta.key} aria-hidden className="pointer-events-none absolute inset-0 z-10 rounded-2xl" style={{ animation: 'score-flash 1.4s ease-out forwards' }} /> : null}
      <span aria-hidden className="absolute inset-y-0 left-0 w-[clamp(4px,6cqh,10px)]" style={{ backgroundColor: color, boxShadow: isLeader ? `0 0 16px ${color}` : undefined }} />
      <div className="relative flex min-w-0 flex-1 items-center gap-[clamp(0.75rem,7cqh,2rem)] px-[clamp(1rem,4cqh,2rem)] py-[clamp(0.5rem,3cqh,1.5rem)]">
        <span className={`grid size-[clamp(2.75rem,48cqh,6rem)] shrink-0 place-items-center rounded-[clamp(0.6rem,10cqh,1.25rem)] font-mono text-[clamp(1.4rem,23cqh,2.9rem)] font-black tabular-nums ${rank < 3 ? rankStyles[rank] : 'bg-white/[.06] text-[#94a7b5]'}`}>{rank + 1}</span>
        <div className="shrink-0 [@container(max-height:82px)]:hidden"><MovementBadge change={movement} className="text-[clamp(0.85rem,min(11cqh,1.4vw),1.5rem)]" /></div>
        <div className="flex min-w-0 flex-1 items-center gap-[clamp(0.6rem,5cqh,1.75rem)]">
          <div className="flex min-w-0 flex-1 items-center gap-[clamp(0.5rem,4.5cqh,1.2rem)]">
            <span className="size-[clamp(0.65rem,7cqh,1.15rem)] shrink-0 rounded-full ring-[3px] ring-white/[.06]" style={{ backgroundColor: color }} />
            <p className="truncate text-[clamp(1.35rem,min(26cqh,3.4vw),3.25rem)] font-bold leading-tight">{player.name}</p>
            {isLeader ? <Crown aria-label="Líder de la partida" className="size-[clamp(1rem,min(15cqh,2vw),2rem)] shrink-0 animate-[glow-breathe_2.4s_ease-in-out_infinite] text-[#f2c460]" /> : null}
          </div>
          <div className="flex shrink-0 items-stretch gap-[clamp(0.4rem,0.8vw,1.1rem)] [@container(max-height:82px)]:hidden">
            {stats.map(({ key, label, short, scoring, icon }) => (
              <StatTile key={key} icon={icon} label={label} short={short} scoring={scoring} value={player[key]} />
            ))}
            <span aria-hidden className="mx-[clamp(0.2rem,0.4vw,0.6rem)] w-px self-stretch bg-white/15" />
            <BonusTile icon={Route} label="Camino más largo" short="RUTA" active={player.hasLongestRoad} />
            <BonusTile icon={Shield} label="Ejército más grande" short="TROPA" active={player.hasLargestArmy} />
          </div>
        </div>
        <div className="relative ml-auto shrink-0 pl-[clamp(0.75rem,4cqh,1.5rem)] text-right">
          <DeltaBadge delta={delta} className="text-[clamp(0.85rem,min(11cqh,1.3vw),1.6rem)]" />
          {/* min-w de 2 cifras: mantiene las columnas de estadísticas alineadas entre filas */}
          <CountUp value={player.total} className="block min-w-[2ch] font-mono text-[clamp(2.5rem,min(46cqh,7.5vw),7rem)] font-black leading-none tabular-nums text-[#f2c460]" />
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-0 h-[clamp(3px,4cqh,8px)] bg-white/[.04]">
        <motion.div initial={false} animate={{ width: `${pct}%` }} transition={{ type: 'spring', stiffness: 90, damping: 20 }} className="h-full" style={{ background: `linear-gradient(90deg, ${color}88, ${color})`, opacity: player.total >= 8 ? 1 : 0.55 }} />
      </div>
    </motion.div>
  );
}

/** Vista de escritorio: marcador tipo transmisión de TV para ver desde lejos. */
export function ScoreboardDesktop({ game, standings, movement, deltas, error }: ScoreboardViewProps) {
  return (
    <>
      <header className="shrink-0 border-b border-white/10 bg-[#0c141b]/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-8 py-3">
          <div className="flex min-w-0 items-center gap-3.5">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#d9a441] text-[#14232d] shadow-[0_0_28px_rgba(217,164,65,.3)]"><Castle aria-hidden className="size-6" /></span>
            <div className="min-w-0">
              <p className="font-heading text-2xl font-bold leading-tight tracking-tight">Catán</p>
              <p className="truncate text-xs uppercase tracking-[.2em] text-[#94a7b5]">{game?.title ?? 'Marcador de partida'}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-5">
            <span className="inline-flex items-center gap-2 rounded-full border border-rose-400/25 bg-rose-400/10 px-3.5 py-1.5 text-xs font-black uppercase tracking-[.22em] text-rose-300">
              <span className="size-2 animate-[live-ring_1.8s_ease-out_infinite] rounded-full bg-rose-400" />En vivo
            </span>
            <Clock className="text-base" />
            <Link className="rounded-lg border border-white/10 bg-white/[.04] px-5 py-2.5 text-base font-semibold text-[#dce6ec] transition hover:bg-white/[.08]" href="/admin">Administrar</Link>
          </div>
        </div>
      </header>

      <section className="mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col gap-2.5 overflow-hidden px-6 py-4">
        {error ? (
          <div className="flex flex-1 items-center justify-center rounded-2xl border border-red-400/20 bg-red-400/10 p-6 text-center text-lg text-red-200">{error}</div>
        ) : !game ? (
          <div className="min-h-0 flex-1 animate-pulse rounded-2xl border border-white/10 bg-card" />
        ) : standings.length === 0 ? (
          <div className="grid min-h-0 flex-1 place-items-center rounded-2xl border border-dashed border-white/15 bg-card px-6 text-center">
            <div><Castle className="mx-auto mb-4 size-12 text-[#d9a441]" /><h2 className="text-3xl font-bold">La mesa está lista</h2><p className="mt-3 text-lg text-[#94a7b5]">Agregá participantes desde Administración para comenzar el espectáculo.</p></div>
          </div>
        ) : (
          standings.map((player, index) => (
            <StandingRow key={player.id} player={player} rank={index} movement={movement[player.id] ?? 0} delta={deltas[player.id]} />
          ))
        )}
      </section>

      <div className="shrink-0">
        <Ticker barClassName="py-2.5" textClassName="text-sm tracking-[.25em]" padClassName="px-7" />
      </div>
    </>
  );
}
