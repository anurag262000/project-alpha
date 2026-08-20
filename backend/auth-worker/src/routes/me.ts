import { Hono } from 'hono';
import type { Bindings } from '../types';
import { dbFor } from '../lib/db';
import { err } from '../lib/http';
import { resolveUser } from '../lib/session';

// Session introspection: who is the bearer of this token?
export const meRoutes = new Hono<{ Bindings: Bindings }>();

meRoutes.get('/me', async (c) => {
  const db = dbFor(c.env);
  const resolved = await resolveUser(db, c.req.header('Authorization'));
  if (!resolved) return err('Not authenticated.', 401);
  return Response.json({ user: { id: resolved.user.id, email: resolved.user.email } });
});
