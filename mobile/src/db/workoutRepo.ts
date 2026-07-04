/**
 * Workout session + set data access. Sessions are ad-hoc for now
 * (program_day_id null) until the split generator (docs/02) is wired.
 */
import { and, desc, eq } from 'drizzle-orm';
import { db } from './client';
import {
  exercise,
  loggedSet,
  workoutSession,
  type Exercise,
  type LoggedSet,
  type WorkoutSession,
} from './schema';

export function listExercises(): Promise<Exercise[]> {
  return db.select().from(exercise).orderBy(exercise.name);
}

export async function getActiveSession(profileId: string): Promise<WorkoutSession | null> {
  const [row] = await db
    .select()
    .from(workoutSession)
    .where(and(eq(workoutSession.profileId, profileId), eq(workoutSession.status, 'in_progress')))
    .limit(1);
  return row ?? null;
}

export async function startSession(profileId: string): Promise<WorkoutSession> {
  const [row] = await db
    .insert(workoutSession)
    .values({
      profileId,
      date: new Date().toISOString().slice(0, 10),
      startedAt: new Date().toISOString(),
      status: 'in_progress',
    })
    .returning();
  return row;
}

export async function completeSession(sessionId: string): Promise<void> {
  await db
    .update(workoutSession)
    .set({ status: 'completed', completedAt: new Date().toISOString() })
    .where(eq(workoutSession.id, sessionId));
}

export interface LogSetInput {
  sessionId: string;
  exerciseId: string;
  reps: number;
  weightKg: number;
  rpe?: number;
  isWarmup?: boolean;
}

export async function logSet(input: LogSetInput): Promise<LoggedSet> {
  const existing = await db
    .select({ setIndex: loggedSet.setIndex })
    .from(loggedSet)
    .where(and(eq(loggedSet.sessionId, input.sessionId), eq(loggedSet.exerciseId, input.exerciseId)));
  const nextIndex = existing.length === 0 ? 1 : Math.max(...existing.map((s) => s.setIndex)) + 1;

  const [row] = await db
    .insert(loggedSet)
    .values({
      sessionId: input.sessionId,
      exerciseId: input.exerciseId,
      setIndex: nextIndex,
      reps: input.reps,
      weightKg: input.weightKg,
      rpe: input.rpe,
      isWarmup: input.isWarmup ?? false,
      completedAt: new Date().toISOString(),
    })
    .returning();
  return row;
}

export interface SetWithExercise extends LoggedSet {
  exerciseName: string;
}

export async function getSessionSets(sessionId: string): Promise<SetWithExercise[]> {
  const rows = await db
    .select()
    .from(loggedSet)
    .innerJoin(exercise, eq(loggedSet.exerciseId, exercise.id))
    .where(eq(loggedSet.sessionId, sessionId))
    .orderBy(loggedSet.completedAt);
  return rows.map((r) => ({ ...r.logged_set, exerciseName: r.exercise.name }));
}

/** Most recent non-warmup set of an exercise across all sessions ("last time" ghost text). */
export async function lastPerformance(exerciseId: string): Promise<LoggedSet | null> {
  const [row] = await db
    .select()
    .from(loggedSet)
    .where(and(eq(loggedSet.exerciseId, exerciseId), eq(loggedSet.isWarmup, false)))
    .orderBy(desc(loggedSet.completedAt))
    .limit(1);
  return row ?? null;
}

/** True if this weight beats every earlier non-warmup set of the exercise (compute-on-read PR). */
export async function isNewPr(exerciseId: string, weightKg: number, excludeSetId: string): Promise<boolean> {
  const rows = await db
    .select({ id: loggedSet.id, weightKg: loggedSet.weightKg })
    .from(loggedSet)
    .where(and(eq(loggedSet.exerciseId, exerciseId), eq(loggedSet.isWarmup, false)));
  const others = rows.filter((r) => r.id !== excludeSetId);
  return others.length > 0 && others.every((r) => r.weightKg < weightKg);
}

export interface SessionSummary {
  session: WorkoutSession;
  totalSets: number;
  totalVolumeKg: number;
  durationMin: number | null;
}

export async function summarizeSession(sessionId: string): Promise<SessionSummary | null> {
  const [session] = await db.select().from(workoutSession).where(eq(workoutSession.id, sessionId)).limit(1);
  if (!session) return null;
  const sets = await db.select().from(loggedSet).where(eq(loggedSet.sessionId, sessionId));
  const working = sets.filter((s) => !s.isWarmup);
  const totalVolumeKg = working.reduce((sum, s) => sum + s.reps * s.weightKg, 0);
  const durationMin =
    session.startedAt && session.completedAt
      ? Math.max(1, Math.round((Date.parse(session.completedAt) - Date.parse(session.startedAt)) / 60000))
      : null;
  return { session, totalSets: sets.length, totalVolumeKg, durationMin };
}

/** PRs set in this session: exercises whose session-best weight beats all sets logged in other sessions. */
export async function sessionPrs(
  sessionId: string
): Promise<{ exerciseName: string; weightKg: number; reps: number }[]> {
  const sessionSets = await getSessionSets(sessionId);
  const working = sessionSets.filter((s) => !s.isWarmup);
  const byExercise = new Map<string, SetWithExercise>();
  for (const s of working) {
    const best = byExercise.get(s.exerciseId);
    if (!best || s.weightKg > best.weightKg) byExercise.set(s.exerciseId, s);
  }
  const prs: { exerciseName: string; weightKg: number; reps: number }[] = [];
  for (const best of byExercise.values()) {
    const history = await db
      .select({ sessionId: loggedSet.sessionId, weightKg: loggedSet.weightKg })
      .from(loggedSet)
      .where(and(eq(loggedSet.exerciseId, best.exerciseId), eq(loggedSet.isWarmup, false)));
    const beaten = history
      .filter((h) => h.sessionId !== sessionId)
      .every((h) => h.weightKg < best.weightKg);
    const hasHistory = history.some((h) => h.sessionId !== sessionId);
    if (hasHistory && beaten) {
      prs.push({ exerciseName: best.exerciseName, weightKg: best.weightKg, reps: best.reps });
    }
  }
  return prs;
}

export async function recentSessions(profileId: string, limit = 10): Promise<SessionSummary[]> {
  const sessions = await db
    .select()
    .from(workoutSession)
    .where(and(eq(workoutSession.profileId, profileId), eq(workoutSession.status, 'completed')))
    .orderBy(desc(workoutSession.date))
    .limit(limit);
  const out: SessionSummary[] = [];
  for (const s of sessions) {
    const summary = await summarizeSession(s.id);
    if (summary) out.push(summary);
  }
  return out;
}
