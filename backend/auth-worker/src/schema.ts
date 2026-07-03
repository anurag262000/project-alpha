/**
 * D1 schema for auth-worker. Mirrors the style of mobile/src/db/schema.ts.
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

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
