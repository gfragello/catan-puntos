import { env } from 'cloudflare:workers';
import { getD1 } from '@/db';

export const ADMIN_COOKIE = 'catan_admin_session';

const SESSION_DURATION_SECONDS = 12 * 60 * 60;
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const encoder = new TextEncoder();

function requireSessionSecret() {
  const secret = env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('ADMIN_SESSION_SECRET no está configurado correctamente.');
  }
  return secret;
}

async function sign(value: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(requireSessionSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(value));
  return Array.from(new Uint8Array(signature), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function safeEqual(left: string, right: string) {
  const length = Math.max(left.length, right.length);
  let difference = left.length ^ right.length;
  for (let index = 0; index < length; index += 1) {
    difference |= (left.charCodeAt(index) || 0) ^ (right.charCodeAt(index) || 0);
  }
  return difference === 0;
}

function readCookie(cookieHeader: string | null, name: string) {
  if (!cookieHeader) return undefined;
  for (const part of cookieHeader.split(';')) {
    const [cookieName, ...value] = part.trim().split('=');
    if (cookieName === name) return decodeURIComponent(value.join('='));
  }
  return undefined;
}

export async function createAdminSession() {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_DURATION_SECONDS;
  const payload = String(expiresAt);
  return `${payload}.${await sign(payload)}`;
}

export async function verifyAdminSession(token?: string) {
  if (!token) return false;
  const [expiresAtText, signature, ...rest] = token.split('.');
  if (!expiresAtText || !signature || rest.length > 0 || !/^\d+$/.test(expiresAtText)) return false;
  const expiresAt = Number(expiresAtText);
  if (!Number.isSafeInteger(expiresAt) || expiresAt <= Math.floor(Date.now() / 1000)) return false;
  const expected = await sign(expiresAtText);
  return safeEqual(signature, expected);
}

export async function isAdminRequest(request: Request) {
  return verifyAdminSession(readCookie(request.headers.get('cookie'), ADMIN_COOKIE));
}

export function verifyAdminPin(pin: string) {
  const configuredPin = env.ADMIN_PIN ?? '';
  return /^\d{8}$/.test(pin) && /^\d{8}$/.test(configuredPin) && safeEqual(pin, configuredPin);
}

export function adminSessionCookie(token: string, request: Request) {
  const secure = new URL(request.url).protocol === 'https:' ? '; Secure' : '';
  return `${ADMIN_COOKIE}=${encodeURIComponent(token)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${SESSION_DURATION_SECONDS}${secure}`;
}

export function clearAdminSessionCookie(request: Request) {
  const secure = new URL(request.url).protocol === 'https:' ? '; Secure' : '';
  return `${ADMIN_COOKIE}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${secure}`;
}

async function clientKey(request: Request) {
  const address = request.headers.get('cf-connecting-ip') ?? request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local';
  return sign(`login:${address}`);
}

export async function loginAllowance(request: Request) {
  const key = await clientKey(request);
  const row = await getD1().prepare(
    'SELECT attempts, window_started_at AS windowStartedAt, blocked_until AS blockedUntil FROM admin_login_attempts WHERE client_key = ?',
  ).bind(key).first<{ attempts: number; windowStartedAt: number; blockedUntil: number }>();
  const now = Date.now();
  if (row && row.blockedUntil > now) {
    return { allowed: false, retryAfter: Math.max(1, Math.ceil((row.blockedUntil - now) / 1000)) };
  }
  return { allowed: true, retryAfter: 0 };
}

export async function recordFailedLogin(request: Request) {
  const db = getD1();
  const key = await clientKey(request);
  const now = Date.now();
  const row = await db.prepare(
    'SELECT attempts, window_started_at AS windowStartedAt FROM admin_login_attempts WHERE client_key = ?',
  ).bind(key).first<{ attempts: number; windowStartedAt: number }>();
  const insideWindow = Boolean(row && now - row.windowStartedAt < ATTEMPT_WINDOW_MS);
  const attempts = insideWindow ? Number(row?.attempts ?? 0) + 1 : 1;
  const windowStartedAt = insideWindow ? Number(row?.windowStartedAt) : now;
  const blockedUntil = attempts >= MAX_ATTEMPTS ? now + ATTEMPT_WINDOW_MS : 0;
  await db.prepare(
    `INSERT INTO admin_login_attempts (client_key, attempts, window_started_at, blocked_until)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(client_key) DO UPDATE SET attempts = excluded.attempts,
       window_started_at = excluded.window_started_at, blocked_until = excluded.blocked_until`,
  ).bind(key, attempts, windowStartedAt, blockedUntil).run();
}

export async function clearLoginAttempts(request: Request) {
  await getD1().prepare('DELETE FROM admin_login_attempts WHERE client_key = ?').bind(await clientKey(request)).run();
}
