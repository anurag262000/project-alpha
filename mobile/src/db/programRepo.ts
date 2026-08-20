/**
 * Program data access — persists what the split generator produces and reads
 * it back as "today's workout", plus the progression / adherence / deload
 * state that docs/02 step 5 needs.
 *
 * Planned rows (program_exercise) stay separate from actual rows
 * (logged_set) so plan-vs-actual and adherence stay computable.
 */
import { and, desc, eq, gte, inArray } from 'drizzle-orm';
import { db } from './client';
import {
  exercise,
  loggedSet,
  program,
  programDay,
  programExercise,
  workoutSession,
  type Exercise,
  type Program,
  type ProgramDay,
  type ProgramExercise,
  type Profile,
} from './schema';
import { generateProgram, type ExerciseLike, type GeneratedProgram } from '@/lib/splitGenerator';
import {
  adherenceAdvice,
  deloadCheck,
  nextPrescription,
  type AdherenceAdvice,
  type DeloadVerdict,
  type PerformedSet,
  type Prescription,
} from '@/lib/progression';

const isoDate = (d: Date = new Date()) => d.toISOString().slice(0, 10);

/** Build the generator's input straight from the stored profile. */
function generatorInputFor(p: Profile) {
  return {
    goal: p.goal,
    experienceLevel: p.experienceLevel,
    trainingDays: p.trainingDays,
    sessionLengthMin: p.sessionLengthMin,
    equipmentAccess: p.equipmentAccess,
    injuries: p.injuries ?? [],
  };
}

/** Preview a program without writing it — used by the onboarding "your plan" step. */
export async function previewProgram(p: Profile): Promise<GeneratedProgram> {
  const library = (await db.select().from(exercise)) as ExerciseLike[];
  return generateProgram(generatorInputFor(p), library);
}

/**
 * Generate a program for this profile and make it the active one, archiving
 * any previous program. Returns the stored row.
 */
export async function generateAndSaveProgram(p: Profile): Promise<Program> {
  const plan = await previewProgram(p);

  await db
    .update(program)
    .set({ status: 'archived' })
    .where(and(eq(program.profileId, p.id), eq(program.status, 'active')));

  const [saved] = await db
    .insert(program)
    .values({
      profileId: p.id,
      name: plan.name,
      goal: plan.goal,
      daysPerWeek: plan.daysPerWeek,
      status: 'active',
      origin: 'generated',
      generatedAt: new Date().toISOString(),
    })
    .returning();

  for (const d of plan.days) {
    const [savedDay] = await db
      .insert(programDay)
      .values({
        programId: saved.id,
        weekday: d.weekday,
        orderIndex: d.orderIndex,
        label: d.label,
      })
      .returning();

    if (d.exercises.length === 0) continue;
    await db.insert(programExercise).values(
      d.exercises.map((e) => ({
        programDayId: savedDay.id,
        exerciseId: e.exerciseId,
        orderIndex: e.orderIndex,
        targetSets: e.targetSets,
        targetRepMin: e.targetRepMin,
        targetRepMax: e.targetRepMax,
        targetRpe: e.targetRpe,
        notes: e.notes,
      }))
    );
  }

  return saved;
}

/**
 * Guarantees the profile has an active program. Profiles created before the
 * generator existed have none, and Home would otherwise dead-end on "no
 * program yet" with no way to get one.
 */
export async function ensureActiveProgram(p: Profile): Promise<Program> {
  const existing = await getActiveProgram(p.id);
  if (existing) return existing;
  return generateAndSaveProgram(p);
}

export async function getActiveProgram(profileId: string): Promise<Program | null> {
  const [row] = await db
    .select()
    .from(program)
    .where(and(eq(program.profileId, profileId), eq(program.status, 'active')))
    .limit(1);
  return row ?? null;
}

export async function getProgramDays(programId: string): Promise<ProgramDay[]> {
  return db
    .select()
    .from(programDay)
    .where(eq(programDay.programId, programId))
    .orderBy(programDay.orderIndex);
}

export interface PlannedExercise {
  plan: ProgramExercise;
  exercise: Exercise;
  /** What to do this session, from the double-progression rules. */
  prescription: Prescription;
}

/** The exercises planned for a program day, in execution order, with progression applied. */
export async function getDayPlan(programDayId: string): Promise<PlannedExercise[]> {
  const rows = await db
    .select()
    .from(programExercise)
    .innerJoin(exercise, eq(programExercise.exerciseId, exercise.id))
    .where(eq(programExercise.programDayId, programDayId))
    .orderBy(programExercise.orderIndex);

  const out: PlannedExercise[] = [];
  for (const r of rows) {
    const plan = r.program_exercise;
    const ex = r.exercise;
    const history = await exerciseHistory(ex.id);
    out.push({
      plan,
      exercise: ex,
      prescription: nextPrescription(
        {
          targetSets: plan.targetSets,
          targetRepMin: plan.targetRepMin,
          targetRepMax: plan.targetRepMax,
        },
        history,
        ex.equipment
      ),
    });
  }
  return out;
}

/** That exercise's past sessions as arrays of sets, most recent session first. */
export async function exerciseHistory(exerciseId: string, limit = 5): Promise<PerformedSet[][]> {
  const rows = await db
    .select({
      sessionId: loggedSet.sessionId,
      reps: loggedSet.reps,
      weightKg: loggedSet.weightKg,
      isWarmup: loggedSet.isWarmup,
      completedAt: loggedSet.completedAt,
    })
    .from(loggedSet)
    .innerJoin(workoutSession, eq(loggedSet.sessionId, workoutSession.id))
    .where(and(eq(loggedSet.exerciseId, exerciseId), eq(workoutSession.status, 'completed')))
    .orderBy(desc(loggedSet.completedAt));

  const bySession = new Map<string, PerformedSet[]>();
  for (const r of rows) {
    const list = bySession.get(r.sessionId) ?? [];
    list.push({ reps: r.reps, weightKg: r.weightKg, isWarmup: r.isWarmup });
    bySession.set(r.sessionId, list);
  }
  return [...bySession.values()].slice(0, limit);
}

export interface TodaysWorkout {
  program: Program;
  day: ProgramDay | null;
  exercises: PlannedExercise[];
  /** True when today is not one of the user's training days. */
  isRestDay: boolean;
}

/** What the Home screen shows: today's program day, or a rest-day state. */
export async function getTodaysWorkout(
  profileId: string,
  today: Date = new Date()
): Promise<TodaysWorkout | null> {
  const active = await getActiveProgram(profileId);
  if (!active) return null;

  const days = await getProgramDays(active.id);
  const day = days.find((d) => d.weekday === today.getDay()) ?? null;
  if (!day) return { program: active, day: null, exercises: [], isRestDay: true };

  return { program: active, day, exercises: await getDayPlan(day.id), isRestDay: false };
}

/** Planned set count for a day — the denominator for plan-vs-actual. */
export async function plannedSetsForDay(programDayId: string): Promise<number> {
  const rows = await db
    .select({ sets: programExercise.targetSets })
    .from(programExercise)
    .where(eq(programExercise.programDayId, programDayId));
  return rows.reduce((s, r) => s + r.sets, 0);
}

// --- Step 5 state: adherence + deload ---------------------------------------

const DAY_MS = 86_400_000;

export function weeksSince(iso: string | null, now: Date = new Date()): number {
  if (!iso) return 0;
  const started = Date.parse(iso);
  if (Number.isNaN(started)) return 0;
  return Math.max(0, Math.floor((now.getTime() - started) / (7 * DAY_MS)));
}

export interface ProgramStatus {
  program: Program;
  weeksOnProgram: number;
  adherence: AdherenceAdvice;
  deload: DeloadVerdict;
  completedSessions: number;
  plannedSessions: number;
}

/**
 * Adherence over the trailing two weeks plus the deload verdict — the two
 * pieces of step 5 that act on the program rather than a single lift.
 */
export async function getProgramStatus(
  profileId: string,
  p: Profile,
  now: Date = new Date()
): Promise<ProgramStatus | null> {
  const active = await getActiveProgram(profileId);
  if (!active) return null;

  const windowDays = 14;
  const since = isoDate(new Date(now.getTime() - windowDays * DAY_MS));
  const sessions = await db
    .select({ id: workoutSession.id, date: workoutSession.date })
    .from(workoutSession)
    .where(
      and(
        eq(workoutSession.profileId, profileId),
        eq(workoutSession.status, 'completed'),
        gte(workoutSession.date, since)
      )
    );

  const weeksOnProgram = weeksSince(active.generatedAt, now);
  // Only count planned sessions since the program started, so a brand-new
  // program is not immediately judged against two full weeks it never had.
  const daysActive = active.generatedAt
    ? Math.min(windowDays, Math.max(1, Math.round((now.getTime() - Date.parse(active.generatedAt)) / DAY_MS)))
    : windowDays;
  const plannedSessions = Math.max(1, Math.round((active.daysPerWeek * daysActive) / 7));

  return {
    program: active,
    weeksOnProgram,
    completedSessions: sessions.length,
    plannedSessions,
    adherence: adherenceAdvice(sessions.length, plannedSessions, active.daysPerWeek, p.sessionLengthMin),
    deload: deloadCheck(weeksOnProgram, await recentFailureCounts(profileId)),
  };
}

/**
 * How many lifts stalled in each of the last two completed sessions — the
 * second half of the deload trigger.
 */
async function recentFailureCounts(profileId: string): Promise<number[]> {
  const sessions = await db
    .select({ id: workoutSession.id })
    .from(workoutSession)
    .where(and(eq(workoutSession.profileId, profileId), eq(workoutSession.status, 'completed')))
    .orderBy(desc(workoutSession.date))
    .limit(2);
  if (sessions.length === 0) return [];

  const counts: number[] = [];
  for (const s of sessions) {
    const sets = await db
      .select({
        exerciseId: loggedSet.exerciseId,
        reps: loggedSet.reps,
        isWarmup: loggedSet.isWarmup,
        programExerciseId: loggedSet.programExerciseId,
      })
      .from(loggedSet)
      .where(eq(loggedSet.sessionId, s.id));

    const planIds = [...new Set(sets.map((x) => x.programExerciseId).filter((x): x is string => !!x))];
    if (planIds.length === 0) {
      counts.push(0);
      continue;
    }
    const plans = await db
      .select()
      .from(programExercise)
      .where(inArray(programExercise.id, planIds));
    const planById = new Map(plans.map((pl) => [pl.id, pl]));

    const stalled = new Set<string>();
    for (const st of sets) {
      if (st.isWarmup || !st.programExerciseId) continue;
      const pl = planById.get(st.programExerciseId);
      if (pl && st.reps < pl.targetRepMin) stalled.add(st.exerciseId);
    }
    counts.push(stalled.size);
  }
  return counts;
}

// --- Progress screen aggregates ----------------------------------------------

export interface MuscleVolume {
  muscle: string;
  sets: number;
  targetSets: number;
}

/**
 * Working sets logged per muscle over the trailing week, against what the
 * active program plans — this is the plan-vs-actual the data model exists for.
 */
export async function weeklyVolumeByMuscle(
  profileId: string,
  now: Date = new Date()
): Promise<MuscleVolume[]> {
  const since = isoDate(new Date(now.getTime() - 7 * DAY_MS));
  const rows = await db
    .select({ muscle: exercise.primaryMuscle, isWarmup: loggedSet.isWarmup })
    .from(loggedSet)
    .innerJoin(workoutSession, eq(loggedSet.sessionId, workoutSession.id))
    .innerJoin(exercise, eq(loggedSet.exerciseId, exercise.id))
    .where(and(eq(workoutSession.profileId, profileId), gte(workoutSession.date, since)));

  const actual = new Map<string, number>();
  for (const r of rows) {
    if (r.isWarmup) continue;
    actual.set(r.muscle, (actual.get(r.muscle) ?? 0) + 1);
  }

  const planned = new Map<string, number>();
  const active = await getActiveProgram(profileId);
  if (active) {
    const days = await getProgramDays(active.id);
    if (days.length > 0) {
      const plans = await db
        .select({ muscle: exercise.primaryMuscle, sets: programExercise.targetSets })
        .from(programExercise)
        .innerJoin(exercise, eq(programExercise.exerciseId, exercise.id))
        .where(inArray(programExercise.programDayId, days.map((d) => d.id)));
      for (const p of plans) planned.set(p.muscle, (planned.get(p.muscle) ?? 0) + p.sets);
    }
  }

  const muscles = new Set([...actual.keys(), ...planned.keys()]);
  return [...muscles]
    .map((muscle) => ({
      muscle,
      sets: actual.get(muscle) ?? 0,
      targetSets: planned.get(muscle) ?? 0,
    }))
    .sort((a, b) => b.targetSets - a.targetSets || a.muscle.localeCompare(b.muscle));
}

/** Training-day streak: consecutive days back from today that were either completed or rest days. */
export async function currentStreak(
  profileId: string,
  trainingDays: number[],
  now: Date = new Date()
): Promise<number> {
  if (trainingDays.length === 0) return 0;
  const rows = await db
    .select({ date: workoutSession.date })
    .from(workoutSession)
    .where(and(eq(workoutSession.profileId, profileId), eq(workoutSession.status, 'completed')));
  const done = new Set(rows.map((r) => r.date));

  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const d = new Date(now.getTime() - i * DAY_MS);
    const isTrainingDay = trainingDays.includes(d.getDay());
    if (!isTrainingDay) continue; // rest days never break a streak
    if (done.has(isoDate(d))) streak++;
    else if (i === 0) continue; // today is not missed until it is over
    else break;
  }
  return streak;
}
