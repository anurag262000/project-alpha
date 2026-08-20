import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import type { Bindings } from '../types';
import { users, sessions } from '../schema';
import { dbFor } from '../lib/db';
import { err } from '../lib/http';
import { createSession } from '../lib/session';
import { hashPassword, verifyPassword } from '../lib/crypto';
import { issueAndSendCode, CooldownError } from '../lib/verification';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Email/password endpoints: create an account, exchange credentials for a
// session, and revoke a session.
export const authRoutes = new Hono<{ Bindings: Bindings }>();

authRoutes.post('/signup', async (c) => {
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

  // Hard gate: no session yet — email a code and make the client verify first.
  // A send failure shouldn't 500 signup: the code is stored, so the client can
  // resend from the verify screen.
  try {
    await issueAndSendCode(c.env, db, user.id, email);
  } catch (e) {
    console.error('signup: failed to send verification code', e);
  }
  return Response.json({ verificationRequired: true, email: user.email }, { status: 201 });
});

authRoutes.post('/login', async (c) => {
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

  // Hard gate: unverified accounts can't get a session. Re-send a code (best
  // effort — swallow cooldown) and tell the client to route to verification.
  if (!user.emailVerified) {
    try {
      await issueAndSendCode(c.env, db, user.id, email);
    } catch (e) {
      if (!(e instanceof CooldownError)) console.error('login: failed to resend verification code', e);
    }
    return Response.json(
      { error: 'Please verify your email to continue.', verificationRequired: true, email: user.email },
      { status: 403 },
    );
  }

  const token = await createSession(db, user.id);
  return Response.json({ token, user: { id: user.id, email: user.email } });
});

authRoutes.post('/logout', async (c) => {
  const db = dbFor(c.env);
  const token = c.req.header('Authorization')?.replace('Bearer ', '');
  if (token) await db.delete(sessions).where(eq(sessions.token, token));
  return Response.json({ ok: true });
});
