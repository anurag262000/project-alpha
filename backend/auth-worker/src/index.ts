import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { createClient } from '@libsql/client/web';
import { drizzle } from 'drizzle-orm/libsql';
import { eq } from 'drizzle-orm';
import { sessions, users } from './schema';
import { generateSessionToken, hashPassword, verifyPassword } from './crypto';

// TURSO_DATABASE_URL lives in wrangler.toml [vars]; TURSO_AUTH_TOKEN is a
// secret (`wrangler secret put` in prod, `.dev.vars` locally).
type Bindings = { TURSO_DATABASE_URL: string; TURSO_AUTH_TOKEN: string };

const dbFor = (env: Bindings) =>
  drizzle(createClient({ url: env.TURSO_DATABASE_URL, authToken: env.TURSO_AUTH_TOKEN }));

const SESSION_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const app = new Hono<{ Bindings: Bindings }>();

app.use('*', cors());

function err(message: string, status: 400 | 401 | 404 | 409 = 400) {
  return Response.json({ error: message }, { status });
}

async function createSession(db: ReturnType<typeof drizzle>, userId: string) {
  const token = generateSessionToken();
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  await db.insert(sessions).values({ token, userId, expiresAt });
  return token;
}

async function resolveUser(db: ReturnType<typeof drizzle>, authHeader: string | undefined) {
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
  if (!token) return null;
  const [session] = await db.select().from(sessions).where(eq(sessions.token, token)).limit(1);
  if (!session || session.expiresAt < Math.floor(Date.now() / 1000)) return null;
  const [user] = await db.select().from(users).where(eq(users.id, session.userId)).limit(1);
  return user ? { user, token } : null;
}

app.post('/signup', async (c) => {
  const db = dbFor(c.env);
  const body = await c.req
    .json<{ email?: string; password?: string }>()
    .catch(() => ({}) as { email?: string; password?: string });
  const email = body.email?.trim().toLowerCase();
  const password = body.password;

  if (!email || !EMAIL_RE.test(email)) return err('Enter a valid email address.');
  if (!password || password.length < 8) return err('Password must be at least 8 characters.');

  const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existing) return err('An account with this email already exists.', 409);

  const { hash, salt } = await hashPassword(password);
  const [user] = await db
    .insert(users)
    .values({ email, passwordHash: hash, passwordSalt: salt })
    .returning();

  const token = await createSession(db, user.id);
  return Response.json({ token, user: { id: user.id, email: user.email } }, { status: 201 });
});

app.post('/login', async (c) => {
  const db = dbFor(c.env);
  const body = await c.req
    .json<{ email?: string; password?: string }>()
    .catch(() => ({}) as { email?: string; password?: string });
  const email = body.email?.trim().toLowerCase();
  const password = body.password;

  if (!email || !password) return err('Enter your email and password.');

  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user) return err('Invalid email or password.', 401);

  const valid = await verifyPassword(password, user.passwordHash, user.passwordSalt);
  if (!valid) return err('Invalid email or password.', 401);

  const token = await createSession(db, user.id);
  return Response.json({ token, user: { id: user.id, email: user.email } });
});

app.post('/logout', async (c) => {
  const db = dbFor(c.env);
  const token = c.req.header('Authorization')?.replace('Bearer ', '');
  if (token) await db.delete(sessions).where(eq(sessions.token, token));
  return Response.json({ ok: true });
});

app.get('/me', async (c) => {
  const db = dbFor(c.env);
  const resolved = await resolveUser(db, c.req.header('Authorization'));
  if (!resolved) return err('Not authenticated.', 401);
  return Response.json({ user: { id: resolved.user.id, email: resolved.user.email } });
});

export default app;
