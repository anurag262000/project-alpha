/**
 * Progression rules — docs/02-split-generator-logic.md step 5, in full:
 * double progression, deload triggers, and adherence-aware adjustment.
 *
 * Pure and dependency-free (runs under `node --test`); the DB side that
 * feeds it lives in db/programRepo.ts.
 */

export interface PerformedSet {
  reps: number;
  weightKg: number;
  isWarmup: boolean;
}

export interface ExercisePlan {
  targetSets: number;
  targetRepMin: number;
  targetRepMax: number;
}

/**
 * Smallest sensible load jump per equipment type. Bodyweight and bands have
 * no meaningful increment, so they progress on reps instead.
 * ponytail: fixed table; make it a per-exercise setting if users ask.
 */
export const INCREMENTS: Record<string, number> = {
  barbell: 2.5,
  machine: 2.5,
  cable: 2.5,
  kettlebell: 4,
  dumbbell: 2,
  band: 0,
  bodyweight: 0,
};

export function incrementFor(equipment: string[]): number {
  const values = equipment.map((e) => INCREMENTS[e]).filter((v) => v !== undefined);
  const loadable = values.filter((v) => v > 0);
  // Multi-equipment rows (e.g. barbell + bench) take the finest real jump.
  return loadable.length > 0 ? Math.min(...loadable) : 0;
}

export type ProgressionKind = 'increase_weight' | 'add_reps' | 'reduce_weight' | 'start';

export interface Prescription {
  kind: ProgressionKind;
  /** Load to put on the bar next session; null when the lift is bodyweight. */
  weightKg: number | null;
  targetRepMin: number;
  targetRepMax: number;
  /** Plain-English trace of which rule fired. */
  reason: string;
}

const working = (sets: PerformedSet[]) => sets.filter((s) => !s.isWarmup);

/** Did every working set reach the top of the rep range at the same load? */
export function hitTopOfRange(sets: PerformedSet[], plan: ExercisePlan): boolean {
  const w = working(sets);
  if (w.length < plan.targetSets) return false;
  const load = Math.max(...w.map((s) => s.weightKg));
  const atLoad = w.filter((s) => s.weightKg >= load);
  return atLoad.length >= plan.targetSets && atLoad.every((s) => s.reps >= plan.targetRepMax);
}

/** Did any working set fall short of the bottom of the rep range? */
export function missedBottomOfRange(sets: PerformedSet[], plan: ExercisePlan): boolean {
  const w = working(sets);
  if (w.length === 0) return false;
  return w.some((s) => s.reps < plan.targetRepMin);
}

/**
 * Double progression (step 5.1-5.3). `history` is that exercise's sessions,
 * most recent first.
 */
export function nextPrescription(
  plan: ExercisePlan,
  history: PerformedSet[][],
  equipment: string[]
): Prescription {
  const increment = incrementFor(equipment);
  const last = history[0] ? working(history[0]) : [];

  if (last.length === 0) {
    return {
      kind: 'start',
      weightKg: null,
      targetRepMin: plan.targetRepMin,
      targetRepMax: plan.targetRepMax,
      reason: `First time on this lift — find a load you can control for ${plan.targetRepMin}-${plan.targetRepMax} reps.`,
    };
  }

  const lastLoad = Math.max(...last.map((s) => s.weightKg));

  // 5.3 — failed the bottom of the range two sessions running → back off.
  const prev = history[1];
  if (
    missedBottomOfRange(history[0], plan) &&
    prev !== undefined &&
    missedBottomOfRange(prev, plan)
  ) {
    const reduced = increment > 0 ? Math.max(0, roundTo(lastLoad * 0.9, increment)) : lastLoad;
    return {
      kind: 'reduce_weight',
      weightKg: reduced,
      targetRepMin: plan.targetRepMin,
      targetRepMax: plan.targetRepMax,
      reason: `Missed ${plan.targetRepMin} reps two sessions in a row — drop to ${reduced} kg and rebuild.`,
    };
  }

  // 5.1 — hit the top of the range on every set → add load, reset to the bottom.
  if (hitTopOfRange(history[0], plan)) {
    if (increment === 0) {
      return {
        kind: 'add_reps',
        weightKg: lastLoad,
        targetRepMin: plan.targetRepMin,
        targetRepMax: plan.targetRepMax + 2,
        reason: `All sets at ${plan.targetRepMax} reps — bodyweight lift, so push the rep target to ${plan.targetRepMax + 2}.`,
      };
    }
    const next = lastLoad + increment;
    return {
      kind: 'increase_weight',
      weightKg: next,
      targetRepMin: plan.targetRepMin,
      targetRepMax: plan.targetRepMax,
      reason: `Hit ${plan.targetRepMax} reps on all ${plan.targetSets} sets — go to ${next} kg and reset to ${plan.targetRepMin} reps.`,
    };
  }

  // 5.2 — otherwise hold load and chase reps.
  const bestReps = Math.max(...last.map((s) => s.reps));
  return {
    kind: 'add_reps',
    weightKg: lastLoad,
    targetRepMin: plan.targetRepMin,
    targetRepMax: plan.targetRepMax,
    reason: `Stay at ${lastLoad} kg and add reps — ${bestReps} of ${plan.targetRepMax} so far.`,
  };
}

function roundTo(value: number, step: number): number {
  if (step <= 0) return value;
  return Math.round(value / step) * step;
}

// --- Deload ----------------------------------------------------------------

export interface DeloadOptions {
  /** Weeks on a program before a deload is suggested (docs/02: 4-6, tunable). */
  maxWeeks: number;
  /** How many exercises must stall in one session for it to count as failed. */
  failedExercisesPerSession: number;
}

export const DEFAULT_DELOAD: DeloadOptions = { maxWeeks: 5, failedExercisesPerSession: 2 };

export interface DeloadVerdict {
  due: boolean;
  reason: string | null;
}

/**
 * Deload trigger (step 5): either a fixed number of weeks on the program, or
 * two consecutive sessions where progression failed across multiple exercises.
 * `failedPerSession` is most-recent-first.
 */
export function deloadCheck(
  weeksOnProgram: number,
  failedPerSession: number[],
  opts: DeloadOptions = DEFAULT_DELOAD
): DeloadVerdict {
  if (weeksOnProgram >= opts.maxWeeks) {
    return {
      due: true,
      reason: `${weeksOnProgram} weeks on this program — take a deload week before the next block.`,
    };
  }
  const [a, b] = failedPerSession;
  if (
    a !== undefined && b !== undefined &&
    a >= opts.failedExercisesPerSession &&
    b >= opts.failedExercisesPerSession
  ) {
    return {
      due: true,
      reason: `Progression stalled on ${a} and ${b} lifts in your last two sessions — deload before pushing again.`,
    };
  }
  return { due: false, reason: null };
}

/** A deload week: half the volume, ~90% of the load. */
export function deloadPrescription(plan: ExercisePlan, weightKg: number | null) {
  return {
    targetSets: Math.max(1, Math.round(plan.targetSets / 2)),
    targetRepMin: plan.targetRepMin,
    targetRepMax: plan.targetRepMax,
    weightKg: weightKg == null ? null : Math.round(weightKg * 0.9 * 2) / 2,
  };
}

// --- Adherence -------------------------------------------------------------

export const ADHERENCE_THRESHOLD = 0.7;

export interface AdherenceAdvice {
  rate: number;
  action: 'reduce_days' | 'reduce_session_length' | 'none';
  message: string;
}

export function adherenceRate(completedSessions: number, plannedSessions: number): number {
  if (plannedSessions <= 0) return 1;
  return Math.min(1, completedSessions / plannedSessions);
}

/**
 * Adherence-aware adjustment (step 5): when completion drops below the
 * threshold, suggest a smaller program rather than letting the plan fail
 * silently. The plan adapts to real behaviour — the user was not wrong.
 */
export function adherenceAdvice(
  completedSessions: number,
  plannedSessions: number,
  daysPerWeek: number,
  sessionLengthMin: number
): AdherenceAdvice {
  const rate = adherenceRate(completedSessions, plannedSessions);
  if (rate >= ADHERENCE_THRESHOLD) {
    return { rate, action: 'none', message: 'Adherence is on track.' };
  }
  // Trim days first while there are enough to cut; otherwise shorten sessions.
  if (daysPerWeek > 3) {
    return {
      rate,
      action: 'reduce_days',
      message: `You've hit ${Math.round(rate * 100)}% of planned sessions. Dropping to ${daysPerWeek - 1} days a week will be easier to keep up.`,
    };
  }
  if (sessionLengthMin > 30) {
    const shorter = Math.max(30, sessionLengthMin - 15);
    return {
      rate,
      action: 'reduce_session_length',
      message: `You've hit ${Math.round(rate * 100)}% of planned sessions. Shorter ${shorter}-minute sessions will be easier to keep up.`,
    };
  }
  return {
    rate,
    action: 'none',
    message: `You've hit ${Math.round(rate * 100)}% of planned sessions. This is already a minimal program — consistency matters more than volume right now.`,
  };
}
