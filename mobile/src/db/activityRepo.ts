/**
 * ActivitySnapshot persistence — one row per profile per day, refreshed from
 * Health Connect. Kept separate from logged sets because it is synced, not
 * entered, and has a daily rather than per-set cadence (docs/01).
 */
import { and, eq, gte } from 'drizzle-orm';
import { db } from './client';
import { activitySnapshot, type ActivitySnapshot } from './schema';
import { activityPoints, readDay } from '@/lib/healthConnect';

const isoDate = (d: Date = new Date()) => d.toISOString().slice(0, 10);
const DAY_MS = 86_400_000;

export async function getSnapshot(
  profileId: string,
  date: string = isoDate()
): Promise<ActivitySnapshot | null> {
  const [row] = await db
    .select()
    .from(activitySnapshot)
    .where(and(eq(activitySnapshot.profileId, profileId), eq(activitySnapshot.date, date)))
    .limit(1);
  return row ?? null;
}

/** Insert or update the row for one day. */
async function upsert(
  profileId: string,
  date: string,
  steps: number,
  activeMinutes: number
): Promise<ActivitySnapshot> {
  const points = activityPoints(steps, activeMinutes);
  const existing = await getSnapshot(profileId, date);
  if (existing) {
    const [updated] = await db
      .update(activitySnapshot)
      .set({ steps, activeMinutes, points })
      .where(eq(activitySnapshot.id, existing.id))
      .returning();
    return updated;
  }
  const [created] = await db
    .insert(activitySnapshot)
    .values({ profileId, date, steps, activeMinutes, points, source: 'health_connect' })
    .returning();
  return created;
}

/**
 * Pull today from Health Connect into the local snapshot. Returns the stored
 * row — the previous one untouched if Health Connect had no answer, so a
 * denied permission never wipes a good reading.
 */
export async function syncToday(
  profileId: string,
  now: Date = new Date()
): Promise<ActivitySnapshot | null> {
  const date = isoDate(now);
  const reading = await readDay(now);
  if (!reading) return getSnapshot(profileId, date);
  return upsert(profileId, date, reading.steps, reading.activeMinutes);
}

/** Backfill the trailing week so the progress screen has a trend to draw. */
export async function syncRecentDays(
  profileId: string,
  days = 7,
  now: Date = new Date()
): Promise<void> {
  for (let i = 0; i < days; i++) {
    const day = new Date(now.getTime() - i * DAY_MS);
    const reading = await readDay(day);
    if (reading) await upsert(profileId, isoDate(day), reading.steps, reading.activeMinutes);
  }
}

/** Trailing-week snapshots, oldest first — one entry per day, gaps filled with zeroes. */
export async function weekOfActivity(
  profileId: string,
  now: Date = new Date()
): Promise<{ date: string; steps: number; activeMinutes: number; points: number }[]> {
  const since = isoDate(new Date(now.getTime() - 6 * DAY_MS));
  const rows = await db
    .select()
    .from(activitySnapshot)
    .where(and(eq(activitySnapshot.profileId, profileId), gte(activitySnapshot.date, since)));
  const byDate = new Map(rows.map((r) => [r.date, r]));

  return Array.from({ length: 7 }, (_, i) => {
    const date = isoDate(new Date(now.getTime() - (6 - i) * DAY_MS));
    const row = byDate.get(date);
    return {
      date,
      steps: row?.steps ?? 0,
      activeMinutes: row?.activeMinutes ?? 0,
      points: row?.points ?? 0,
    };
  });
}
