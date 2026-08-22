/**
 * Split generator — implements docs/02-split-generator-logic.md steps 1-4.
 *
 * Rule-based, not learned: every exercise, set count and rep range traces
 * back to a table in this file that you can read. Pure and dependency-free
 * so it runs under `node --test` (see splitGenerator.test.ts) — persistence
 * lives in db/programRepo.ts, progression in progression.ts.
 */
import type { Goal } from './health.ts';

export type Experience = 'new' | 'under_1yr' | '1_3yr' | '3yr_plus';
export type EquipmentAccess = 'home_minimal' | 'home_full' | 'gym';
export type Muscle =
  | 'chest' | 'back' | 'quads' | 'hamstrings' | 'glutes'
  | 'shoulders' | 'biceps' | 'triceps' | 'core' | 'calves';
export type MovementPattern = 'push' | 'pull' | 'hinge' | 'squat' | 'carry' | 'isolation';

/** Structural subset of the `exercise` row the generator needs. */
export interface ExerciseLike {
  id: string;
  name: string;
  primaryMuscle: Muscle;
  secondaryMuscles: string[] | null;
  movementPattern: MovementPattern;
  equipment: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface GeneratorInput {
  goal: Goal;
  experienceLevel: Experience;
  /** 0=Sun..6=Sat, the specific days the user picked. */
  trainingDays: number[];
  sessionLengthMin: number;
  equipmentAccess: EquipmentAccess;
  /** Free-form tags from onboarding, e.g. ["Shoulder", "Lower back"]. */
  injuries: string[];
}

export interface GeneratedExercise {
  exerciseId: string;
  name: string;
  orderIndex: number;
  targetSets: number;
  targetRepMin: number;
  targetRepMax: number;
  targetRpe: number | null;
  notes: string | null;
}

export interface GeneratedDay {
  weekday: number | null;
  orderIndex: number;
  label: string;
  /** What the day is biased toward — shown next to the label ("Upper A · strength"). */
  emphasis: Emphasis;
  exercises: GeneratedExercise[];
}

export interface GeneratedProgram {
  name: string;
  goal: Goal;
  daysPerWeek: number;
  templateName: string;
  days: GeneratedDay[];
  /** Planned working sets per muscle per week — what step 2 actually landed on. */
  weeklyVolume: Partial<Record<Muscle, number>>;
  /** Human-readable rule trace, surfaced in the UI so the plan is auditable. */
  rationale: string[];
}

// --- Step 1: split templates -----------------------------------------------

export type Emphasis = 'strength' | 'hypertrophy' | 'balanced';

interface DayTemplate {
  label: string;
  muscles: Muscle[];
  emphasis: Emphasis;
}

const UPPER: Muscle[] = ['chest', 'back', 'shoulders', 'biceps', 'triceps'];
const LOWER: Muscle[] = ['quads', 'hamstrings', 'glutes', 'calves', 'core'];
const PUSH: Muscle[] = ['chest', 'shoulders', 'triceps'];
const PULL: Muscle[] = ['back', 'biceps'];
const LEGS: Muscle[] = ['quads', 'hamstrings', 'glutes', 'calves'];
const FULL: Muscle[] = ['chest', 'back', 'quads', 'hamstrings', 'shoulders', 'core'];

const day = (label: string, muscles: Muscle[], emphasis: Emphasis = 'balanced'): DayTemplate => ({
  label,
  muscles,
  emphasis,
});

/** True for experience levels the spec steers toward simpler templates. */
const isNovice = (e: Experience) => e === 'new' || e === 'under_1yr';

/**
 * Step 1 — template selection (docs/02 table). Beginners are steered toward
 * Full Body / basic Upper-Lower regardless of requested days, because
 * recovery capacity and movement competency limit them, not exercise variety.
 */
export function selectTemplate(
  daysPerWeek: number,
  experience: Experience
): { name: string; days: DayTemplate[]; note: string } {
  const d = Math.min(Math.max(daysPerWeek, 1), 6);

  if (d <= 3) {
    return {
      name: 'Full Body',
      days: Array.from({ length: d }, (_, i) =>
        day(`Full Body ${String.fromCharCode(65 + i)}`, FULL)
      ),
      note: `${d} training days → full body each session, so every muscle is hit 2-3× a week.`,
    };
  }

  if (d === 4) {
    if (isNovice(experience)) {
      return {
        name: 'Upper / Lower',
        days: [day('Upper A', UPPER), day('Lower A', LOWER), day('Upper B', UPPER), day('Lower B', LOWER)],
        note: '4 days at your experience level → a straight upper/lower split, repeated twice.',
      };
    }
    return {
      name: 'Upper / Lower (undulating)',
      days: [
        day('Upper Strength', UPPER, 'strength'),
        day('Lower Strength', LOWER, 'strength'),
        day('Upper Hypertrophy', UPPER, 'hypertrophy'),
        day('Lower Hypertrophy', LOWER, 'hypertrophy'),
      ],
      note: '4 days with 1yr+ training age → upper/lower with a strength day and a hypertrophy day for each.',
    };
  }

  if (d === 5) {
    if (isNovice(experience)) {
      return {
        name: 'Upper / Lower + Full Body',
        days: [
          day('Upper A', UPPER),
          day('Lower A', LOWER),
          day('Upper B', UPPER),
          day('Lower B', LOWER),
          day('Full Body', FULL),
        ],
        note: '5 days but still building base strength → upper/lower kept simple, with one full-body day.',
      };
    }
    return {
      name: 'Push / Pull / Legs + Upper / Lower',
      days: [
        day('Push', PUSH),
        day('Pull', PULL),
        day('Legs', LEGS),
        day('Upper', UPPER),
        day('Lower', LOWER),
      ],
      note: '5 days → push/pull/legs, then an upper and a lower day to top up weekly volume.',
    };
  }

  // d === 6
  if (isNovice(experience)) {
    return {
      name: 'Upper / Lower ×3',
      days: [
        day('Upper A', UPPER), day('Lower A', LOWER),
        day('Upper B', UPPER), day('Lower B', LOWER),
        day('Upper C', UPPER), day('Lower C', LOWER),
      ],
      note: '6 days requested, but at your experience level upper/lower recovers better than a 6-day PPL.',
    };
  }
  return {
    name: 'Push / Pull / Legs ×2',
    days: [
      day('Push A', PUSH), day('Pull A', PULL), day('Legs A', LEGS),
      day('Push B', PUSH), day('Pull B', PULL), day('Legs B', LEGS),
    ],
    note: '6 days with 1yr+ training age → push/pull/legs run twice a week.',
  };
}

// --- Step 2: weekly volume per muscle --------------------------------------

/**
 * Volume landmarks in working sets per muscle per week (docs/02 step 2).
 * MRV is never a target — it is only the upper bound sanity check.
 */
export const LANDMARKS: Record<Muscle, { mev: number; mav: number; mrv: number }> = {
  chest: { mev: 8, mav: 16, mrv: 22 },
  back: { mev: 8, mav: 16, mrv: 22 },
  quads: { mev: 8, mav: 16, mrv: 20 },
  hamstrings: { mev: 8, mav: 16, mrv: 20 },
  glutes: { mev: 6, mav: 12, mrv: 16 },
  shoulders: { mev: 6, mav: 14, mrv: 20 },
  biceps: { mev: 6, mav: 14, mrv: 20 },
  triceps: { mev: 6, mav: 14, mrv: 18 },
  calves: { mev: 6, mav: 14, mrv: 20 },
  core: { mev: 6, mav: 12, mrv: 16 },
};

const EXPERIENCE_BIAS: Record<Experience, number> = {
  new: 0,
  under_1yr: 0.3,
  '1_3yr': 0.65,
  '3yr_plus': 0.8,
};

/** Fat loss lowers recovery capacity, so it pulls back toward MEV. */
const GOAL_BIAS: Record<Goal, number> = {
  fat_loss: -0.3,
  muscle_gain: 0.2,
  recomp: 0.1,
  general_fitness: 0,
};

const clamp = (n: number, lo: number, hi: number) => Math.min(Math.max(n, lo), hi);

/**
 * Step 2 — where between MEV and MAV this user sits. 0 = MEV, 1 = MAV.
 * `new` experience and `fat_loss` both bias toward MEV; `muscle_gain` at
 * 1yr+ biases toward MAV; `general_fitness` lands near the midpoint.
 */
export function volumeBias(goal: Goal, experience: Experience): number {
  return clamp(EXPERIENCE_BIAS[experience] + GOAL_BIAS[goal], 0, 1);
}

export function weeklySetTarget(muscle: Muscle, goal: Goal, experience: Experience): number {
  const { mev, mav, mrv } = LANDMARKS[muscle];
  const target = Math.round(mev + volumeBias(goal, experience) * (mav - mev));
  return Math.min(target, mrv); // MRV is a ceiling check, never a target
}

// --- Step 4: rep ranges by goal --------------------------------------------

const REP_RANGES: Record<Goal, { min: number; max: number; restSec: number }> = {
  muscle_gain: { min: 6, max: 12, restSec: 120 },
  fat_loss: { min: 10, max: 15, restSec: 60 },
  recomp: { min: 6, max: 12, restSec: 120 },
  general_fitness: { min: 8, max: 15, restSec: 90 },
};

/** Compounds on a strength-emphasis day shift down the rep band. */
function repRange(goal: Goal, emphasis: Emphasis, isCompound: boolean) {
  const base = REP_RANGES[goal];
  if (emphasis === 'strength' && isCompound) {
    return { min: Math.max(4, base.min - 2), max: Math.max(6, base.max - 4) };
  }
  if (emphasis === 'hypertrophy' && !isCompound) {
    return { min: base.min + 2, max: base.max + 3 };
  }
  return { min: base.min, max: base.max };
}

/** RPE target — the spec prescribes intensity by RPE, not heart rate. */
function rpeFor(emphasis: Emphasis, isCompound: boolean): number {
  if (emphasis === 'strength') return isCompound ? 8 : 8.5;
  return isCompound ? 8 : 9;
}

// --- Step 3: equipment + injury filtering ----------------------------------

const AVAILABLE_EQUIPMENT: Record<EquipmentAccess, string[]> = {
  home_minimal: ['bodyweight', 'band', 'dumbbell'],
  home_full: ['bodyweight', 'band', 'dumbbell', 'kettlebell', 'bench', 'barbell'],
  gym: ['bodyweight', 'band', 'dumbbell', 'kettlebell', 'bench', 'barbell', 'machine', 'cable'],
};

/**
 * Injury → movement-exclusion map (docs/06 §7). `exclude` removes the
 * exercise entirely; `prefer` boosts alternatives the spec recommends.
 */
const INJURY_RULES: Record<string, { exclude: RegExp; prefer: RegExp }> = {
  shoulder: {
    exclude: /overhead press|upright row|\bdip\b|behind[- ]neck|barbell bench/i,
    prefer: /neutral[- ]grip|landmine|cable|chest[- ]supported/i,
  },
  lower_back: {
    exclude: /^deadlift$|good morning|barbell row|bent[- ]over row/i,
    prefer: /chest[- ]supported|hip thrust|leg press|machine|seated/i,
  },
  knee: {
    exclude: /leg extension|walking lunge|barbell back squat|jump squat/i,
    prefer: /leg press|hip thrust|box squat|goblet/i,
  },
  wrist: {
    exclude: /barbell curl|barbell bench press|upright row/i,
    prefer: /neutral[- ]grip|dumbbell|ez[- ]bar|cable|machine/i,
  },
  elbow: {
    exclude: /skullcrusher|barbell bench press|overhead press|barbell curl/i,
    prefer: /neutral[- ]grip|pushdown|cable|machine|dumbbell/i,
  },
  hip: {
    exclude: /barbell back squat|walking lunge|deep squat/i,
    prefer: /hip thrust|leg press|partial|machine/i,
  },
};

/** Onboarding stores display labels ("Lower back"); rules key off tags. */
export function normalizeInjury(tag: string): string {
  return tag.trim().toLowerCase().replace(/[\s-]+/g, '_');
}

export function isExcludedByInjury(name: string, injuries: string[]): boolean {
  return injuries
    .map(normalizeInjury)
    .some((tag) => INJURY_RULES[tag]?.exclude.test(name) ?? false);
}

function injuryPreferenceBoost(name: string, injuries: string[]): number {
  return injuries
    .map(normalizeInjury)
    .reduce((score, tag) => score + (INJURY_RULES[tag]?.prefer.test(name) ? 2 : 0), 0);
}

export function hasEquipment(ex: ExerciseLike, access: EquipmentAccess): boolean {
  const available = AVAILABLE_EQUIPMENT[access];
  return ex.equipment.every((e) => available.includes(e));
}

const COMPOUND_PATTERNS: MovementPattern[] = ['push', 'pull', 'hinge', 'squat'];
const isCompound = (ex: ExerciseLike) => COMPOUND_PATTERNS.includes(ex.movementPattern);

/**
 * How good a piece of kit is for a *primary* lift. Double progression needs a
 * load increment, so a band or bodyweight movement makes a poor main compound
 * even when it is the alphabetically first option: you cannot add 2.5 kg to a
 * band. Bench scores 0 because it is never the loaded implement — the score is
 * the max across an exercise's equipment, so "barbell + bench" still scores 5.
 */
const EQUIPMENT_PRIORITY: Record<string, number> = {
  barbell: 5,
  machine: 4,
  dumbbell: 4,
  kettlebell: 3,
  bodyweight: 2,
  band: 1,
  bench: 0,
};

function equipmentScore(ex: ExerciseLike): number {
  return Math.max(0, ...ex.equipment.map((e) => EQUIPMENT_PRIORITY[e] ?? 0));
}

const DIFFICULTY_RANK = { beginner: 0, intermediate: 1, advanced: 2 } as const;

/** Novices should not be handed advanced lifts as their main movement. */
function difficultyPenalty(ex: ExerciseLike, experience: Experience): number {
  const rank = DIFFICULTY_RANK[ex.difficulty];
  if (isNovice(experience) && rank === 2) return 6;
  if (experience === 'new' && rank === 1) return 2;
  return 0;
}

// --- Generation ------------------------------------------------------------

/** Minutes a working set costs, including its rest — used for the time cap. */
function minutesPerSet(goal: Goal): number {
  return (REP_RANGES[goal].restSec + 40) / 60;
}

/** Rest between working sets for a goal — shown on the plan and day sheets. */
export const restSecFor = (goal: Goal): number => REP_RANGES[goal].restSec;

/** Rough session length for a set count: 8 min warm-up + sets x (work + rest). */
export const estimatedMinutes = (sets: number, goal: Goal): number =>
  Math.round(8 + sets * minutesPerSet(goal));

/** How many working sets fit in the user's session length (8 min warm-up). */
export function setsPerSessionCap(sessionLengthMin: number, goal: Goal): number {
  return Math.max(6, Math.floor((sessionLengthMin - 8) / minutesPerSet(goal)));
}

export function generateProgram(
  input: GeneratorInput,
  library: ExerciseLike[]
): GeneratedProgram {
  const { goal, experienceLevel, trainingDays, sessionLengthMin, equipmentAccess, injuries } = input;
  const daysPerWeek = trainingDays.length;
  const rationale: string[] = [];

  // Step 1 — template
  const template = selectTemplate(daysPerWeek, experienceLevel);
  rationale.push(template.note);

  // Step 3 (filter) — equipment + injuries, applied once up front
  const usable = library
    .filter((ex) => hasEquipment(ex, equipmentAccess))
    .filter((ex) => !isExcludedByInjury(ex.name, injuries));

  if (injuries.length > 0) {
    const removed = library.length - library.filter((ex) => !isExcludedByInjury(ex.name, injuries)).length;
    rationale.push(
      `${injuries.join(', ')} flagged → ${removed} exercise${removed === 1 ? '' : 's'} excluded and safer alternatives preferred.`
    );
  }
  if (usable.length === 0) {
    throw new Error('No exercises match this equipment and injury combination.');
  }

  // Step 2 — how many times per week is each muscle trained by this template?
  const sessionsPerMuscle = new Map<Muscle, number>();
  for (const d of template.days) {
    for (const m of d.muscles) sessionsPerMuscle.set(m, (sessionsPerMuscle.get(m) ?? 0) + 1);
  }

  const bias = volumeBias(goal, experienceLevel);
  rationale.push(
    bias <= 0.15
      ? 'Volume starts at MEV — the minimum that still drives progress, which is the right call in a deficit or while movement quality is still developing.'
      : bias >= 0.85
        ? 'Volume targets MAV — the best growth-per-fatigue ratio for your training age and goal.'
        : 'Volume sits between MEV and MAV, a balanced starting point that leaves room to add sets.'
  );

  const weeklyTarget = new Map<Muscle, number>();
  for (const m of sessionsPerMuscle.keys()) {
    weeklyTarget.set(m, weeklySetTarget(m, goal, experienceLevel));
  }

  const setCap = setsPerSessionCap(sessionLengthMin, goal);
  const reps = REP_RANGES[goal];
  rationale.push(
    `${reps.min}-${reps.max} reps with ~${reps.restSec}s rest, and up to ${setCap} working sets per session to fit ${sessionLengthMin} minutes.`
  );

  // Step 3 + 4 — build each day
  const weeklyVolume: Partial<Record<Muscle, number>> = {};
  // How many times each muscle has already been trained earlier in the week.
  // Rotation keys off this, not the day index: in an upper/lower split the
  // lower days are indices 1 and 3, so a global index would hand both the same
  // slot and skip the best option entirely.
  const occurrences = new Map<Muscle, number>();

  const days: GeneratedDay[] = template.days.map((dayTpl, dayIndex) => {
    const chosen: { ex: ExerciseLike; sets: number; compound: boolean }[] = [];
    const usedIds = new Set<string>();

    for (const muscle of dayTpl.muscles) {
      const perWeek = weeklyTarget.get(muscle) ?? 0;
      const timesTrained = sessionsPerMuscle.get(muscle) ?? 1;
      // "target_sets = share of the weekly muscle volume / times trained per week"
      const sessionSets = clamp(Math.round(perWeek / timesTrained), 2, 8);

      // ~3-4 sets per exercise → how many slots this muscle gets today
      const slots = clamp(Math.ceil(sessionSets / 4), 1, 3);
      const occurrence = occurrences.get(muscle) ?? 0;
      occurrences.set(muscle, occurrence + 1);

      const picks = pickForMuscle(
        usable, muscle, slots, usedIds, experienceLevel, injuries, occurrence
      );
      if (picks.length === 0) continue;

      // Spread the day's sets across the chosen exercises, remainder to the first
      // (compound) slot since that is the highest-value work.
      const base = Math.floor(sessionSets / picks.length);
      let remainder = sessionSets - base * picks.length;
      for (const ex of picks) {
        const sets = clamp(base + (remainder-- > 0 ? 1 : 0), 2, 5);
        chosen.push({ ex, sets, compound: isCompound(ex) });
        usedIds.add(ex.id);
      }
    }

    // Step 3 ordering — compound → carry → isolation, so fatigue accumulates
    // only after the most valuable work is done.
    const rank = (c: { ex: ExerciseLike }) =>
      isCompound(c.ex) ? 0 : c.ex.movementPattern === 'carry' ? 1 : 2;
    chosen.sort((a, b) => rank(a) - rank(b));

    // Session-length cap — trim from the end (isolation first).
    let total = chosen.reduce((s, c) => s + c.sets, 0);
    while (total > setCap && chosen.length > 1) {
      const last = chosen[chosen.length - 1];
      if (last.sets > 2) {
        last.sets -= 1;
        total -= 1;
      } else {
        total -= last.sets;
        chosen.pop();
      }
    }

    const exercises: GeneratedExercise[] = chosen.map((c, i) => {
      const r = repRange(goal, dayTpl.emphasis, c.compound);
      weeklyVolume[c.ex.primaryMuscle] = (weeklyVolume[c.ex.primaryMuscle] ?? 0) + c.sets;
      return {
        exerciseId: c.ex.id,
        name: c.ex.name,
        orderIndex: i,
        targetSets: c.sets,
        targetRepMin: r.min,
        targetRepMax: r.max,
        targetRpe: rpeFor(dayTpl.emphasis, c.compound),
        notes: null,
      };
    });

    return {
      weekday: trainingDays[dayIndex] ?? null,
      orderIndex: dayIndex,
      label: dayTpl.label,
      emphasis: dayTpl.emphasis,
      exercises,
    };
  });

  const goalLabel: Record<Goal, string> = {
    fat_loss: 'Fat Loss',
    muscle_gain: 'Muscle Gain',
    recomp: 'Recomp',
    general_fitness: 'General Fitness',
  };

  return {
    name: `${template.name} — ${goalLabel[goal]}`,
    goal,
    daysPerWeek,
    templateName: template.name,
    days,
    weeklyVolume,
    rationale,
  };
}

/**
 * Pick `slots` exercises for one muscle on one day: a compound first (most
 * fatiguing, most valuable), then isolation to fill remaining volume.
 * `occurrence` is how many times this muscle has already been trained this
 * week — it rotates the compound so the second chest day differs from the
 * first, while occurrence 0 always gets the highest-scoring option.
 */
function pickForMuscle(
  library: ExerciseLike[],
  muscle: Muscle,
  slots: number,
  usedIds: Set<string>,
  experience: Experience,
  injuries: string[],
  occurrence: number
): ExerciseLike[] {
  const candidates = library.filter((ex) => ex.primaryMuscle === muscle && !usedIds.has(ex.id));
  if (candidates.length === 0) return [];

  // Injury preference dominates (×3 outranks any equipment gap), then the
  // most loadable implement, then difficulty suitability. Name order is only
  // the final tiebreak, so selection stays deterministic without letting the
  // alphabet decide that a band beats a barbell.
  const score = (ex: ExerciseLike) =>
    injuryPreferenceBoost(ex.name, injuries) * 3 +
    equipmentScore(ex) -
    difficultyPenalty(ex, experience);

  const byScore = (a: ExerciseLike, b: ExerciseLike) => score(b) - score(a) || a.name.localeCompare(b.name);
  const compounds = candidates.filter(isCompound).sort(byScore);
  const isolation = candidates.filter((ex) => !isCompound(ex)).sort(byScore);

  const picks: ExerciseLike[] = [];
  if (compounds.length > 0) {
    // Occurrence 0 gets the best option; later sessions rotate for variety.
    picks.push(compounds[occurrence % compounds.length]);
  }
  const pool = [...isolation, ...compounds.filter((c) => !picks.includes(c))];
  for (const ex of pool) {
    if (picks.length >= slots) break;
    if (!picks.includes(ex)) picks.push(ex);
  }
  return picks.slice(0, slots);
}
