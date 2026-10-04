'use client';

import Link from 'next/link';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type SyntheticEvent,
} from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Building2,
  Castle,
  House,
  LogOut,
  Minus,
  Plus,
  Route,
  Swords,
  Trash2,
  Trophy,
} from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  PLAYER_COLORS,
  type GameState,
  type PlayerColor,
  type ScoreField,
} from '@/lib/game';

const colorLabels: Record<PlayerColor, string> = {
  rojo: 'Rojo',
  azul: 'Azul',
  verde: 'Verde',
  amarillo: 'Amarillo',
  marron: 'Marrón',
  hueso: 'Hueso',
};

const scoreFields: { field: ScoreField; label: string; icon: LucideIcon }[] = [
  { field: 'settlements', label: 'Poblados', icon: House },
  { field: 'cities', label: 'Ciudades', icon: Building2 },
  { field: 'roads', label: 'Caminos', icon: Route },
  { field: 'armies', label: 'Ejércitos', icon: Swords },
  { field: 'additionalPoints', label: 'Puntos adicionales', icon: Trophy },
];

async function requestGame(body?: Record<string, unknown>): Promise<GameState> {
  const response = await fetch(
    '/api/game',
    body
      ? {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }
      : { cache: 'no-store' },
  );
  const data = (await response.json()) as GameState & { error?: string };
  if (!response.ok)
    throw new Error(data.error || 'No se pudo actualizar la partida.');
  return data;
}

function ScoreControl({
  label,
  icon: Icon,
  value,
  onChange,
}: {
  label: string;
  icon: LucideIcon;
  value: number;
  onChange: (
    value: number,
    source: 'increment' | 'decrement' | 'input',
  ) => void;
}) {
  const [draft, setDraft] = useState(String(value));

  const commit = (
    next: number,
    source: 'increment' | 'decrement' | 'input',
  ) => {
    const safe = Math.max(0, Math.min(99, Math.trunc(next || 0)));
    setDraft(String(safe));
    onChange(safe, source);
  };

  return (
    <div className="rounded-xl border border-white/10 bg-black/10 p-3">
      <label className="mb-2 flex items-center gap-2 text-sm font-medium text-[#a9bac5]">
        <Icon className="size-4 text-[#d9a441]" aria-hidden="true" />
        {label}
      </label>
      <div className="grid grid-cols-[40px_minmax(54px,1fr)_40px] items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon-lg"
          aria-label={`Restar uno a ${label}`}
          onClick={() => commit(Number(draft) - 1, 'decrement')}
        >
          <Minus />
        </Button>
        <Input
          aria-label={label}
          className="h-10 border-white/10 bg-[#101b24] text-center font-mono text-lg font-bold"
          inputMode="numeric"
          min={0}
          max={99}
          type="number"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={() => commit(Number(draft), 'input')}
          onKeyDown={(event) => {
            if (event.key === 'Enter') event.currentTarget.blur();
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="icon-lg"
          aria-label={`Sumar uno a ${label}`}
          onClick={() => commit(Number(draft) + 1, 'increment')}
        >
          <Plus />
        </Button>
      </div>
    </div>
  );
}

export function AdminPanel() {
  const [game, setGame] = useState<GameState | null>(null);
  const [name, setName] = useState('');
  const [color, setColor] = useState<PlayerColor>('rojo');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [openPlayers, setOpenPlayers] = useState<string[]>([]);

  const mutate = useCallback(async (body: Record<string, unknown>) => {
    setSaving(true);
    try {
      const updated = await requestGame(body);
      setGame(updated);
      setError('');
      return updated;
    } catch (mutationError) {
      const message =
        mutationError instanceof Error
          ? mutationError.message
          : 'No se pudo actualizar la partida.';
      setError(message);
      throw mutationError;
    } finally {
      setSaving(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    void requestGame()
      .then((loaded) => {
        if (active) {
          setGame(loaded);
          setError('');
        }
      })
      .catch((refreshError: unknown) => {
        if (active)
          setError(
            refreshError instanceof Error
              ? refreshError.message
              : 'No se pudo cargar la partida.',
          );
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const context = document.modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const register = async () => {
      await context.registerTool(
        {
          name: 'get_game_state',
          title: 'Consultar marcador',
          description:
            'Obtiene los participantes, puntajes, bonificaciones y totales visibles de la partida actual.',
          inputSchema: {
            type: 'object',
            properties: {},
            additionalProperties: false,
          },
          annotations: { readOnlyHint: true, untrustedContentHint: false },
          execute: async () => requestGame(),
        },
        { signal: lifecycle.signal },
      );
      await context.registerTool(
        {
          name: 'update_player_score',
          title: 'Actualizar puntaje',
          description:
            'Actualiza uno de los contadores de un participante y refresca el marcador visible.',
          inputSchema: {
            type: 'object',
            properties: {
              playerId: { type: 'integer', minimum: 1 },
              field: {
                type: 'string',
                enum: [
                  'settlements',
                  'cities',
                  'roads',
                  'armies',
                  'additionalPoints',
                ],
              },
              value: { type: 'integer', minimum: 0, maximum: 99 },
            },
            required: ['playerId', 'field', 'value'],
            additionalProperties: false,
          },
          annotations: { readOnlyHint: false, untrustedContentHint: false },
          execute: async (input) => {
            const value = input as {
              playerId?: unknown;
              field?: unknown;
              value?: unknown;
            };
            const fields: ScoreField[] = [
              'settlements',
              'cities',
              'roads',
              'armies',
              'additionalPoints',
            ];
            if (
              !Number.isInteger(value.playerId) ||
              !fields.includes(value.field as ScoreField) ||
              !Number.isInteger(value.value)
            ) {
              throw new Error('Los datos del puntaje no son válidos.');
            }
            const updated = await mutate({
              action: 'updateScore',
              playerId: value.playerId,
              field: value.field,
              value: value.value,
            });
            return {
              updated: true,
              player:
                updated.players.find(
                  (player) => player.id === value.playerId,
                ) ?? null,
            };
          },
        },
        { signal: lifecycle.signal },
      );
    };
    void register().catch(() => undefined);
    return () => lifecycle.abort();
  }, [mutate]);

  const usedColors = useMemo(
    () => new Set(game?.players.map((player) => player.color) ?? []),
    [game],
  );

  const addParticipant = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const updated = await mutate({ action: 'addPlayer', name, color });
      setName('');
      const remaining = (Object.keys(PLAYER_COLORS) as PlayerColor[]).find(
        (candidate) =>
          !updated.players.some((player) => player.color === candidate),
      );
      if (remaining) setColor(remaining);
    } catch {
      // El mensaje ya se muestra en el panel.
    }
  };

  const removeParticipant = async (playerId: number, playerName: string) => {
    if (!window.confirm(`¿Quitar a ${playerName} de la partida?`)) return;
    try {
      await mutate({ action: 'removePlayer', playerId });
      setOpenPlayers((current) =>
        current.filter((value) => value !== String(playerId)),
      );
    } catch {
      /* El mensaje ya se muestra. */
    }
  };

  const moveParticipant = async (playerId: number, direction: -1 | 1) => {
    if (!game) return;
    const index = game.players.findIndex((player) => player.id === playerId);
    const destination = index + direction;
    if (index < 0 || destination < 0 || destination >= game.players.length)
      return;
    const orderedIds = game.players.map((player) => player.id);
    [orderedIds[index], orderedIds[destination]] = [
      orderedIds[destination],
      orderedIds[index],
    ];
    try {
      await mutate({ action: 'reorderPlayers', playerIds: orderedIds });
    } catch {
      /* El mensaje ya se muestra. */
    }
  };

  const openNextParticipant = (playerId: number) => {
    if (!game || game.players.length < 2) return;
    const index = game.players.findIndex((player) => player.id === playerId);
    const next = game.players[(index + 1) % game.players.length];
    setOpenPlayers([String(next.id)]);
    window.requestAnimationFrame(() => {
      document
        .getElementById(`player-${next.id}`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  };

  const logout = async () => {
    await fetch('/api/admin/session', { method: 'DELETE' });
    window.location.reload();
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-white/10 bg-[#101b24]/90">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-[#d9a441] text-[#14232d]">
              <Castle className="size-5" />
            </span>
            <div>
              <p className="font-heading text-lg font-bold">Administración</p>
              <p className="text-xs text-[#94a7b5]">
                Catán · Marcador de partida
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="rounded-lg border border-white/10 bg-white/[.04] px-4 py-2 text-sm font-semibold transition hover:bg-white/[.08]"
            >
              Ver panel
            </Link>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Cerrar sesión"
              title="Cerrar sesión"
              onClick={() => {
                void logout();
              }}
            >
              <LogOut />
            </Button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-7 sm:px-8 sm:py-10">
        <div className="mb-8">
          <p className="mb-1 text-sm font-medium text-[#d9a441]">
            Control de mesa
          </p>
          <h1 className="text-3xl font-bold tracking-tight">
            Participantes y puntajes
          </h1>
          <p className="mt-2 text-[#94a7b5]">
            Los cambios aparecen automáticamente en el panel de resultados.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-6 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200"
          >
            {error}
          </div>
        )}

        <form
          onSubmit={addParticipant}
          className="mb-8 rounded-2xl border border-white/10 bg-card p-5 sm:p-6"
        >
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold">Agregar participante</h2>
              <p className="text-sm text-[#94a7b5]">
                {game?.players.length ?? 0} de 6 lugares ocupados
              </p>
            </div>
          </div>
          <div className="grid gap-4 lg:grid-cols-[minmax(220px,1fr)_minmax(360px,1.5fr)_auto] lg:items-end">
            <div>
              <label
                htmlFor="participant-name"
                className="mb-2 block text-sm font-medium text-[#a9bac5]"
              >
                Nombre
              </label>
              <Input
                id="participant-name"
                className="h-11 border-white/10 bg-[#101b24]"
                maxLength={40}
                placeholder="Ej. Valentina"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </div>
            <fieldset>
              <legend className="mb-2 text-sm font-medium text-[#a9bac5]">
                Color
              </legend>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(PLAYER_COLORS) as PlayerColor[]).map(
                  (candidate) => {
                    const disabled = usedColors.has(candidate);
                    return (
                      <button
                        key={candidate}
                        type="button"
                        disabled={disabled}
                        aria-label={colorLabels[candidate]}
                        aria-pressed={color === candidate}
                        onClick={() => setColor(candidate)}
                        className="group relative grid size-11 place-items-center rounded-xl border border-white/10 bg-black/10 transition hover:bg-white/[.04] disabled:cursor-not-allowed disabled:opacity-25"
                      >
                        <span
                          className={`size-5 rounded-full ${color === candidate ? 'ring-2 ring-white ring-offset-2 ring-offset-[#182731]' : ''}`}
                          style={{ backgroundColor: PLAYER_COLORS[candidate] }}
                        />
                        <span className="sr-only">
                          {colorLabels[candidate]}
                        </span>
                      </button>
                    );
                  },
                )}
              </div>
            </fieldset>
            <Button
              type="submit"
              className="h-11 px-5 font-bold"
              disabled={
                saving ||
                !name.trim() ||
                usedColors.has(color) ||
                (game?.players.length ?? 0) >= 6
              }
            >
              <Plus />
              Agregar
            </Button>
          </div>
        </form>

        {!game ? (
          <div className="h-64 animate-pulse rounded-2xl bg-card" />
        ) : game.players.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 p-12 text-center text-[#94a7b5]">
            Agregá el primer participante para comenzar a puntuar.
          </div>
        ) : (
          <Accordion
            value={openPlayers}
            onValueChange={setOpenPlayers}
            className="gap-3"
          >
            {game.players.map((player, index) => {
              const nextPlayer =
                game.players[(index + 1) % game.players.length];
              return (
                <AccordionItem
                  id={`player-${player.id}`}
                  value={String(player.id)}
                  key={player.id}
                  className="overflow-hidden rounded-2xl border border-white/10 bg-card"
                >
                  <div
                    className="h-1.5"
                    style={{ backgroundColor: PLAYER_COLORS[player.color] }}
                  />
                  <AccordionTrigger className="w-full rounded-none px-5 py-4 hover:bg-white/[.03] hover:no-underline sm:px-6">
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        className="size-4 shrink-0 rounded-full"
                        style={{ backgroundColor: PLAYER_COLORS[player.color] }}
                      />
                      <div className="min-w-0">
                        <h2 className="truncate text-xl font-bold">
                          {player.name}
                        </h2>
                        <p className="text-sm capitalize text-[#94a7b5]">
                          {colorLabels[player.color]} ·{' '}
                          <strong className="text-[#f2c460]">
                            {player.total} puntos
                          </strong>
                        </p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-5 pb-5 sm:px-6 sm:pb-6">
                    <div className="grid gap-3 sm:grid-cols-2">
                      {scoreFields.map(({ field, label, icon }) => (
                        <ScoreControl
                          key={`${field}-${player[field]}`}
                          label={label}
                          icon={icon}
                          value={player[field]}
                          onChange={(value, source) => {
                            const body =
                              field === 'cities' && source === 'increment'
                                ? { action: 'addCity', playerId: player.id }
                                : {
                                    action: 'updateScore',
                                    playerId: player.id,
                                    field,
                                    value,
                                  };
                            void mutate(body).catch(() => undefined);
                          }}
                        />
                      ))}
                    </div>
                    {(player.hasLongestRoad || player.hasLargestArmy) && (
                      <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-[#f2c460]">
                        {player.hasLongestRoad && (
                          <span className="rounded-full bg-[#d9a441]/10 px-3 py-1.5">
                            Camino más largo +2
                          </span>
                        )}
                        {player.hasLargestArmy && (
                          <span className="rounded-full bg-[#d9a441]/10 px-3 py-1.5">
                            Ejército más grande +2
                          </span>
                        )}
                      </div>
                    )}
                    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
                      <div className="flex items-center gap-2">
                        <span className="mr-1 text-xs font-medium text-[#94a7b5]">
                          Orden
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          disabled={saving || index === 0}
                          aria-label={`Subir a ${player.name}`}
                          title="Subir"
                          onClick={() => {
                            void moveParticipant(player.id, -1);
                          }}
                        >
                          <ArrowUp />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          disabled={saving || index === game.players.length - 1}
                          aria-label={`Bajar a ${player.name}`}
                          title="Bajar"
                          onClick={() => {
                            void moveParticipant(player.id, 1);
                          }}
                        >
                          <ArrowDown />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          disabled={saving}
                          aria-label={`Quitar a ${player.name}`}
                          title="Quitar participante"
                          onClick={() => {
                            void removeParticipant(player.id, player.name);
                          }}
                        >
                          <Trash2 />
                        </Button>
                      </div>
                      {game.players.length > 1 && (
                        <Button
                          type="button"
                          variant="secondary"
                          disabled={saving}
                          onClick={() => openNextParticipant(player.id)}
                        >
                          Siguiente: {nextPlayer.name}
                          <ArrowRight />
                        </Button>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}
      </section>
    </main>
  );
}
