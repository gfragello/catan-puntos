import {
  adminSessionCookie,
  clearAdminSessionCookie,
  clearLoginAttempts,
  createAdminSession,
  isAdminRequest,
  loginAllowance,
  recordFailedLogin,
  verifyAdminPin,
} from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  return Response.json({ authenticated: await isAdminRequest(request) }, {
    headers: { 'Cache-Control': 'no-store' },
  });
}

export async function POST(request: Request) {
  const allowance = await loginAllowance(request);
  if (!allowance.allowed) {
    return Response.json({ error: 'Demasiados intentos. Esperá unos minutos.' }, {
      status: 429,
      headers: { 'Retry-After': String(allowance.retryAfter), 'Cache-Control': 'no-store' },
    });
  }

  const body = await request.json().catch(() => ({})) as { pin?: unknown };
  const pin = typeof body.pin === 'string' ? body.pin : '';
  if (!verifyAdminPin(pin)) {
    await recordFailedLogin(request);
    return Response.json({ error: 'PIN incorrecto.' }, {
      status: 401,
      headers: { 'Cache-Control': 'no-store' },
    });
  }

  await clearLoginAttempts(request);
  const token = await createAdminSession();
  return Response.json({ authenticated: true }, {
    headers: {
      'Set-Cookie': adminSessionCookie(token, request),
      'Cache-Control': 'no-store',
    },
  });
}

export async function DELETE(request: Request) {
  return Response.json({ authenticated: false }, {
    headers: {
      'Set-Cookie': clearAdminSessionCookie(request),
      'Cache-Control': 'no-store',
    },
  });
}
