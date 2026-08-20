import { eq } from 'drizzle-orm';
import { sessions, users } from '../schema';
import { generateSessionToken } from './crypto';
import type { DB } from './db';

export const SESSION_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days

// Issue a fresh session token for a user and persist it.
export async function createSession(db: DB, userId: string) {
  const token = generateSessionToken();
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  await db.insert(sessions).values({ token, userId, expiresAt });
  return token;
}

// Turn a raw `Authorization` header into the current user, or null if the
// token is missing, unknown, or expired.
export async function resolveUser(db: DB, authHeader: string | undefined) {
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
  if (!token) return null;
  const [session] = await db.select().from(sessions).where(eq(sessions.token, token)).limit(1);
  if (!session || session.expiresAt < Math.floor(Date.now() / 1000)) return null;
  const [user] = await db.select().from(users).where(eq(users.id, session.userId)).limit(1);
  return user ? { user, token } : null;
}
