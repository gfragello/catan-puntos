import { addPlayer, readGame, removePlayer, updateScore } from '@/db/game-store';
import { PLAYER_COLORS, type PlayerColor, type ScoreField } from '@/lib/game';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    return Response.json(await readGame());
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'No se pudo leer la partida.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as Record<string, unknown>;
    if (body.action === 'addPlayer') {
      const name = typeof body.name === 'string' ? body.name : '';
      const color = typeof body.color === 'string' ? body.color as PlayerColor : '' as PlayerColor;
      return Response.json(await addPlayer(name, color));
    }
    if (body.action === 'removePlayer') {
      return Response.json(await removePlayer(Number(body.playerId)));
    }
    if (body.action === 'updateScore') {
      const allowedFields: ScoreField[] = ['settlements', 'cities', 'roads', 'armies', 'additionalPoints'];
      const field = (typeof body.field === 'string' ? body.field : '') as ScoreField;
      if (!allowedFields.includes(field) || !Number.isFinite(Number(body.value))) {
        return Response.json({ error: 'Datos de puntaje no válidos.' }, { status: 400 });
      }
      return Response.json(await updateScore(Number(body.playerId), field, Number(body.value)));
    }
    if (body.action === 'colors') {
      return Response.json(PLAYER_COLORS);
    }
    return Response.json({ error: 'Acción no válida.' }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo actualizar la partida.';
    const status = /UNIQUE constraint failed/.test(message) ? 409 : 400;
    return Response.json({ error: status === 409 ? 'Ese color ya está en uso.' : message }, { status });
  }
}
