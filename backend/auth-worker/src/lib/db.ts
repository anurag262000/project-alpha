import { createClient } from '@libsql/client/web';
import { drizzle } from 'drizzle-orm/libsql';
import type { Bindings } from '../types';

// Turso speaks HTTP, so we build an ordinary client per request (no injected
// binding like D1). Import from `@libsql/client/web` — the default entry point
// needs Node TCP APIs the Workers runtime doesn't have.
export const dbFor = (env: Bindings) =>
  drizzle(createClient({ url: env.TURSO_DATABASE_URL, authToken: env.TURSO_AUTH_TOKEN }));

export type DB = ReturnType<typeof dbFor>;
