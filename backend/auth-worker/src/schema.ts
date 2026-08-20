/**
 * Turso (libsql) schema for auth-worker — same SQLite dialect as the old D1
 * setup, see ADR-002. Mirrors the style of mobile/src/db/schema.ts.
 * Deliberately separate from the mobile app's local UserProfile — this is
 * account/session data, not the fitness profile.
 */
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

const uuid = () => text('id').primaryKey().$defaultFn(() => crypto.randomUUID());
const now = () => text().default(sql`(CURRENT_TIMESTAMP)`);

export const users = sqliteTable('users', {
  id: uuid(),
  email: text('email').notNull().unique(), // stored lowercase
  passwordHash: text('password_hash').notNull(),
  passwordSalt: text('password_salt').notNull(),
  // Hard gate: no session is issued until this is true (see routes/auth.ts).
  emailVerified: integer('email_verified', { mode: 'boolean' }).notNull().default(false),
  createdAt: now(),
});

export const sessions = sqliteTable('sessions', {
  token: text('token').primaryKey(), // random 32-byte hex
  userId: text('user_id')
    .notNull()
    .references(() => users.id),
  createdAt: now(),
  expiresAt: integer('expires_at').notNull(), // unix seconds
});

// One active email-verification code per user (userId is the PK, so requesting a
// new code replaces the old one). Codes are stored hashed, never in plaintext.
export const emailCodes = sqliteTable('email_codes', {
  userId: text('user_id')
    .primaryKey()
    .references(() => users.id),
  codeHash: text('code_hash').notNull(),
  codeSalt: text('code_salt').notNull(),
  expiresAt: integer('expires_at').notNull(), // unix seconds
  sentAt: integer('sent_at').notNull(), // unix seconds — for resend cooldown
  attempts: integer('attempts').notNull().default(0),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type EmailCode = typeof emailCodes.$inferSelect;
