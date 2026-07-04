/**
 * On-device SQLite via expo-sqlite + Drizzle. One database per install.
 * Migrations are bundled .sql files (see metro.config.js + babel config)
 * and applied on launch by useMigrations in app/_layout.tsx.
 */
import { openDatabaseSync } from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as schema from './schema';

export const sqlite = openDatabaseSync('project-alpha.db');
export const db = drizzle(sqlite, { schema });
