import type { Config } from 'drizzle-kit';
import { config } from 'dotenv';

// Credentials live in backend/.env (shared across workers), not per-worker.
config({ path: '../.env' });

export default {
  schema: './src/schema.ts',
  out: './drizzle',
  dialect: 'turso',
  dbCredentials: {
    url: process.env.TURSO_DATABASE_URL!,
    // Optional: `turso dev` (local) needs no token; the hosted DB does.
    ...(process.env.TURSO_AUTH_TOKEN ? { authToken: process.env.TURSO_AUTH_TOKEN } : {}),
  },
} satisfies Config;
