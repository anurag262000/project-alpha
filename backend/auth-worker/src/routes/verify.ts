import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import type { Bindings } from '../types';
import { users } from '../schema';
import { dbFor } from '../lib/db';
import { err } from '../lib/http';
import { createSession } from '../lib/session';
import { issueAndSendCode, checkCode, CooldownError } from '../lib/verification';

// Email-verification endpoints. `/request` (re)sends a code; `/confirm` checks
// it, marks the email verified, and — since this is a hard gate — issues the
// first session. We reveal the same generic result whether or not an account
// exists, to avoid leaking which emails are registered.
export const verifyRoutes = new Hono<{ Bindings: Bindings }>();

verifyRoutes.post('/verify/request', async (c) => {
  const db = dbFor(c.env);
  const body = await c.req.json<{ email?: string }>().catch(() => ({}) as { email?: string });
  const email = body.email?.trim().toLowerCase();
  if (!email) return err('Enter your email address.');

  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  // Don't disclose existence, and no-op if already verified.
  if (user && !user.emailVerified) {
    try {
      await issueAndSendCode(c.env, db, user.id, email);
    } catch (e) {
      if (e instanceof CooldownError) {
        return Response.json({ error: e.message, retryAfter: e.retryAfter }, { status: 429 });
      }
      // Don't 500 or leak — the code is stored; surface send issues in logs.
      console.error('verify/request: failed to send verification code', e);
    }
  }
  return Response.json({ ok: true });
});

verifyRoutes.post('/verify/confirm', async (c) => {
  const db = dbFor(c.env);
  const body = await c.req
    .json<{ email?: string; code?: string }>()
    .catch(() => ({}) as { email?: string; code?: string });
  const email = body.email?.trim().toLowerCase();
  const code = body.code?.trim();
  if (!email || !code) return err('Enter your email and the code.');

  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user) return err('Invalid or expired code.', 400);
  if (user.emailVerified) return err('This email is already verified. Please log in.', 409);

  const result = await checkCode(db, user.id, code);
  if (!result.ok) {
    const message =
      result.reason === 'expired'
        ? 'That code has expired. Request a new one.'
        : result.reason === 'too_many'
          ? 'Too many attempts. Request a new code.'
          : result.reason === 'no_code'
            ? 'No active code. Request a new one.'
            : 'Invalid code.';
    const status = result.reason === 'too_many' ? 429 : 400;
    return Response.json({ error: message }, { status });
  }

  await db.update(users).set({ emailVerified: true }).where(eq(users.id, user.id));
  const token = await createSession(db, user.id);
  return Response.json({ token, user: { id: user.id, email: user.email } });
});
