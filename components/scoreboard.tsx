'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Building2, Castle, Crown, House, Medal, Plus, Route, Shield, Swords } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PLAYER_COLORS, type GameState } from '@/lib/game';

const headings = [
  { label: 'Poblados', icon: House },
  { label: 'Ciudades', icon: Building2 },
  { label: 'Caminos', icon: Route },
  { label: 'Camino más largo', icon: Crown },
  { label: 'Ejércitos', icon: Swords },
  { label: 'Ejército más grande', icon: Shield },
  { label: 'Puntos adicionales', icon: Plus },
];

export function Scoreboard() {
  const [game, setGame] = useState<GameState | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const response = await fetch('/api/game', { cache: 'no-store' });
        const data = await response.json() as GameState & { error?: string };
        if (!response.ok) throw new Error(data.error || 'No se pudo cargar la partida.');
        if (active) { setGame(data); setError(''); }
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : 'No se pudo cargar la partida.');
      }
    };
    void load();
    const interval = window.setInterval(load, 2000);
    return () => { active = false; window.clearInterval(interval); };
  }, []);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-white/10 bg-[#101b24]/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-[#d9a441] text-[#14232d] shadow-[0_0_24px_rgba(217,164,65,.2)]"><Castle aria-hidden="true" className="size-5" /></span>
            <div><p className="font-heading text-lg font-bold tracking-tight">Catán</p><p className="text-xs uppercase tracking-[.18em] text-[#94a7b5]">Marcador de partida</p></div>
          </div>
          <Link className="rounded-lg border border-white/10 bg-white/[.04] px-4 py-2 text-sm font-semibold text-[#dce6ec] transition hover:bg-white/[.08]" href="/admin">Administrar</Link>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-7 sm:px-8 sm:py-10">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div><p className="mb-1 text-sm font-medium text-[#d9a441]">{game?.title ?? 'Partida en curso'}</p><h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">Resultados</h1></div>
          <div className="flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-sm text-emerald-300">
            <span className="size-2 rounded-full bg-emerald-300 shadow-[0_0_10px_rgba(110,231,183,.8)]" />Actualización en vivo
          </div>
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-400/20 bg-red-400/10 p-6 text-red-200">{error}</div>
        ) : !game ? (
          <div className="h-64 animate-pulse rounded-2xl border border-white/10 bg-card" />
        ) : game.players.length === 0 ? (
          <div className="grid min-h-64 place-items-center rounded-2xl border border-dashed border-white/15 bg-card px-6 text-center">
            <div><Castle className="mx-auto mb-4 size-8 text-[#d9a441]" /><h2 className="text-xl font-bold">La mesa está lista</h2><p className="mt-2 text-[#94a7b5]">Agregá participantes desde Administración para comenzar.</p></div>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-card shadow-2xl shadow-black/20">
            <Table className="min-w-[850px]">
              <TableHeader className="bg-white/[.035]"><TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="sticky left-0 z-10 min-w-48 bg-[#182731] px-5 text-[#94a7b5]">Participante</TableHead>
                {headings.map(({ label, icon: Icon }) => <TableHead key={label} className="w-24 text-center text-[#94a7b5]" title={label}><span className="inline-flex size-9 items-center justify-center rounded-lg bg-white/[.05]" aria-label={label}><Icon className="size-4" aria-hidden="true" /></span></TableHead>)}
                <TableHead className="w-28 px-5 text-right text-[#d9a441]" title="Puntaje total"><span className="inline-flex items-center gap-2"><Medal className="size-4" /> Total</span></TableHead>
              </TableRow></TableHeader>
              <TableBody>{game.players.map((player, index) => (
                <TableRow key={player.id} className="border-white/10 hover:bg-white/[.025]">
                  <TableCell className="sticky left-0 z-10 bg-card px-5 py-5"><div className="flex items-center gap-3"><span className="size-3 rounded-full ring-4 ring-white/[.04]" style={{ backgroundColor: PLAYER_COLORS[player.color] }} /><div><p className="font-semibold">{player.name}</p><p className="text-xs text-[#708796]">#{index + 1}</p></div></div></TableCell>
                  <TableCell className="text-center text-lg font-semibold">{player.settlements}</TableCell>
                  <TableCell className="text-center text-lg font-semibold">{player.cities}</TableCell>
                  <TableCell className="text-center text-lg font-semibold">{player.roads}</TableCell>
                  <TableCell className="text-center">{player.hasLongestRoad ? <Crown className="mx-auto size-5 text-[#d9a441]" aria-label="Sí" /> : <span className="text-[#536976]">—</span>}</TableCell>
                  <TableCell className="text-center text-lg font-semibold">{player.armies}</TableCell>
                  <TableCell className="text-center">{player.hasLargestArmy ? <Shield className="mx-auto size-5 text-[#d9a441]" aria-label="Sí" /> : <span className="text-[#536976]">—</span>}</TableCell>
                  <TableCell className="text-center text-lg font-semibold">{player.additionalPoints}</TableCell>
                  <TableCell className="px-5 text-right font-mono text-3xl font-bold text-[#f2c460]">{player.total}</TableCell>
                </TableRow>
              ))}</TableBody>
            </Table>
          </div>
        )}
        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-xs text-[#708796]"><span>Los poblados y caminos suman 1 punto.</span><span>Las ciudades y bonificaciones suman 2 puntos.</span></div>
      </section>
    </main>
  );
}
