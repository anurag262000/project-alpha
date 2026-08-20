/**
 * Seed exercise library — covers every primary muscle and movement pattern
 * at every equipment tier, so the split generator can build a real program
 * for home_minimal as well as gym.
 *
 * `equipment` is a REQUIREMENT SET: the user must have *all* of it for the
 * exercise to be selectable (see splitGenerator.hasEquipment). Variants that
 * differ only by kit are separate rows ("Goblet Squat" vs "Barbell Back
 * Squat") rather than one row listing alternatives.
 *
 * Reconciles by name on every launch: new rows are inserted and equipment /
 * classification fixes land on existing installs, without touching the
 * logged_set rows that reference an exercise id.
 */
import { eq } from 'drizzle-orm';
import { db } from './client';
import { exercise } from './schema';

type Seed = Omit<typeof exercise.$inferInsert, 'id'>;

const EXERCISES: Seed[] = [
  // --- chest ---------------------------------------------------------------
  { name: 'Barbell Bench Press', primaryMuscle: 'chest', secondaryMuscles: ['triceps', 'shoulders'], movementPattern: 'push', equipment: ['barbell', 'bench'], difficulty: 'intermediate' },
  { name: 'Dumbbell Bench Press', primaryMuscle: 'chest', secondaryMuscles: ['triceps', 'shoulders'], movementPattern: 'push', equipment: ['dumbbell', 'bench'], difficulty: 'beginner' },
  { name: 'Neutral-Grip Dumbbell Floor Press', primaryMuscle: 'chest', secondaryMuscles: ['triceps'], movementPattern: 'push', equipment: ['dumbbell'], difficulty: 'beginner' },
  { name: 'Incline Dumbbell Press', primaryMuscle: 'chest', secondaryMuscles: ['shoulders', 'triceps'], movementPattern: 'push', equipment: ['dumbbell', 'bench'], difficulty: 'beginner' },
  { name: 'Push-Up', primaryMuscle: 'chest', secondaryMuscles: ['triceps', 'core'], movementPattern: 'push', equipment: ['bodyweight'], difficulty: 'beginner' },
  { name: 'Band Chest Press', primaryMuscle: 'chest', secondaryMuscles: ['triceps', 'shoulders'], movementPattern: 'push', equipment: ['band'], difficulty: 'beginner' },
  { name: 'Cable Fly', primaryMuscle: 'chest', secondaryMuscles: [], movementPattern: 'isolation', equipment: ['machine'], difficulty: 'beginner' },
  { name: 'Dumbbell Fly', primaryMuscle: 'chest', secondaryMuscles: [], movementPattern: 'isolation', equipment: ['dumbbell'], difficulty: 'beginner' },

  // --- shoulders -----------------------------------------------------------
  { name: 'Overhead Press', primaryMuscle: 'shoulders', secondaryMuscles: ['triceps', 'core'], movementPattern: 'push', equipment: ['barbell'], difficulty: 'intermediate' },
  { name: 'Dumbbell Shoulder Press', primaryMuscle: 'shoulders', secondaryMuscles: ['triceps'], movementPattern: 'push', equipment: ['dumbbell'], difficulty: 'beginner' },
  { name: 'Neutral-Grip Landmine Press', primaryMuscle: 'shoulders', secondaryMuscles: ['triceps', 'chest'], movementPattern: 'push', equipment: ['barbell'], difficulty: 'beginner' },
  { name: 'Lateral Raise', primaryMuscle: 'shoulders', secondaryMuscles: [], movementPattern: 'isolation', equipment: ['dumbbell'], difficulty: 'beginner' },
  { name: 'Band Lateral Raise', primaryMuscle: 'shoulders', secondaryMuscles: [], movementPattern: 'isolation', equipment: ['band'], difficulty: 'beginner' },
  { name: 'Cable Face Pull', primaryMuscle: 'shoulders', secondaryMuscles: ['back'], movementPattern: 'isolation', equipment: ['machine'], difficulty: 'beginner' },
  { name: 'Band Face Pull', primaryMuscle: 'shoulders', secondaryMuscles: ['back'], movementPattern: 'isolation', equipment: ['band'], difficulty: 'beginner' },

  // --- back ----------------------------------------------------------------
  { name: 'Pull-Up', primaryMuscle: 'back', secondaryMuscles: ['biceps'], movementPattern: 'pull', equipment: ['bodyweight'], difficulty: 'intermediate' },
  { name: 'Lat Pulldown', primaryMuscle: 'back', secondaryMuscles: ['biceps'], movementPattern: 'pull', equipment: ['machine'], difficulty: 'beginner' },
  { name: 'Barbell Row', primaryMuscle: 'back', secondaryMuscles: ['biceps', 'core'], movementPattern: 'pull', equipment: ['barbell'], difficulty: 'intermediate' },
  { name: 'Dumbbell Row', primaryMuscle: 'back', secondaryMuscles: ['biceps'], movementPattern: 'pull', equipment: ['dumbbell'], difficulty: 'beginner' },
  { name: 'Chest-Supported Dumbbell Row', primaryMuscle: 'back', secondaryMuscles: ['biceps'], movementPattern: 'pull', equipment: ['dumbbell', 'bench'], difficulty: 'beginner' },
  { name: 'Seated Cable Row', primaryMuscle: 'back', secondaryMuscles: ['biceps'], movementPattern: 'pull', equipment: ['machine'], difficulty: 'beginner' },
  { name: 'Band Lat Pulldown', primaryMuscle: 'back', secondaryMuscles: ['biceps'], movementPattern: 'pull', equipment: ['band'], difficulty: 'beginner' },
  { name: 'Band Pull-Apart', primaryMuscle: 'back', secondaryMuscles: ['shoulders'], movementPattern: 'isolation', equipment: ['band'], difficulty: 'beginner' },
  { name: 'Inverted Row', primaryMuscle: 'back', secondaryMuscles: ['biceps'], movementPattern: 'pull', equipment: ['bodyweight'], difficulty: 'beginner' },

  // --- quads ---------------------------------------------------------------
  { name: 'Barbell Back Squat', primaryMuscle: 'quads', secondaryMuscles: ['glutes', 'core'], movementPattern: 'squat', equipment: ['barbell'], difficulty: 'intermediate' },
  { name: 'Box Squat', primaryMuscle: 'quads', secondaryMuscles: ['glutes'], movementPattern: 'squat', equipment: ['barbell', 'bench'], difficulty: 'intermediate' },
  { name: 'Goblet Squat', primaryMuscle: 'quads', secondaryMuscles: ['glutes', 'core'], movementPattern: 'squat', equipment: ['dumbbell'], difficulty: 'beginner' },
  { name: 'Leg Press', primaryMuscle: 'quads', secondaryMuscles: ['glutes'], movementPattern: 'squat', equipment: ['machine'], difficulty: 'beginner' },
  { name: 'Bodyweight Squat', primaryMuscle: 'quads', secondaryMuscles: ['glutes'], movementPattern: 'squat', equipment: ['bodyweight'], difficulty: 'beginner' },
  { name: 'Walking Lunge', primaryMuscle: 'quads', secondaryMuscles: ['glutes', 'hamstrings'], movementPattern: 'squat', equipment: ['bodyweight'], difficulty: 'beginner' },
  { name: 'Bulgarian Split Squat', primaryMuscle: 'quads', secondaryMuscles: ['glutes'], movementPattern: 'squat', equipment: ['dumbbell'], difficulty: 'intermediate' },
  { name: 'Leg Extension', primaryMuscle: 'quads', secondaryMuscles: [], movementPattern: 'isolation', equipment: ['machine'], difficulty: 'beginner' },

  // --- hamstrings ----------------------------------------------------------
  { name: 'Deadlift', primaryMuscle: 'hamstrings', secondaryMuscles: ['glutes', 'back', 'core'], movementPattern: 'hinge', equipment: ['barbell'], difficulty: 'advanced' },
  { name: 'Romanian Deadlift', primaryMuscle: 'hamstrings', secondaryMuscles: ['glutes'], movementPattern: 'hinge', equipment: ['barbell'], difficulty: 'intermediate' },
  { name: 'Dumbbell Romanian Deadlift', primaryMuscle: 'hamstrings', secondaryMuscles: ['glutes'], movementPattern: 'hinge', equipment: ['dumbbell'], difficulty: 'beginner' },
  { name: 'Leg Curl', primaryMuscle: 'hamstrings', secondaryMuscles: [], movementPattern: 'isolation', equipment: ['machine'], difficulty: 'beginner' },
  { name: 'Band Leg Curl', primaryMuscle: 'hamstrings', secondaryMuscles: [], movementPattern: 'isolation', equipment: ['band'], difficulty: 'beginner' },
  { name: 'Nordic Hamstring Curl', primaryMuscle: 'hamstrings', secondaryMuscles: [], movementPattern: 'isolation', equipment: ['bodyweight'], difficulty: 'advanced' },

  // --- glutes --------------------------------------------------------------
  { name: 'Hip Thrust', primaryMuscle: 'glutes', secondaryMuscles: ['hamstrings'], movementPattern: 'hinge', equipment: ['barbell', 'bench'], difficulty: 'beginner' },
  { name: 'Dumbbell Hip Thrust', primaryMuscle: 'glutes', secondaryMuscles: ['hamstrings'], movementPattern: 'hinge', equipment: ['dumbbell'], difficulty: 'beginner' },
  { name: 'Glute Bridge', primaryMuscle: 'glutes', secondaryMuscles: ['hamstrings'], movementPattern: 'hinge', equipment: ['bodyweight'], difficulty: 'beginner' },
  { name: 'Cable Kickback', primaryMuscle: 'glutes', secondaryMuscles: [], movementPattern: 'isolation', equipment: ['machine'], difficulty: 'beginner' },

  // --- biceps --------------------------------------------------------------
  { name: 'Barbell Curl', primaryMuscle: 'biceps', secondaryMuscles: [], movementPattern: 'isolation', equipment: ['barbell'], difficulty: 'beginner' },
  { name: 'Dumbbell Curl', primaryMuscle: 'biceps', secondaryMuscles: [], movementPattern: 'isolation', equipment: ['dumbbell'], difficulty: 'beginner' },
  { name: 'Neutral-Grip Hammer Curl', primaryMuscle: 'biceps', secondaryMuscles: [], movementPattern: 'isolation', equipment: ['dumbbell'], difficulty: 'beginner' },
  { name: 'Band Curl', primaryMuscle: 'biceps', secondaryMuscles: [], movementPattern: 'isolation', equipment: ['band'], difficulty: 'beginner' },

  // --- triceps -------------------------------------------------------------
  { name: 'Cable Triceps Pushdown', primaryMuscle: 'triceps', secondaryMuscles: [], movementPattern: 'isolation', equipment: ['machine'], difficulty: 'beginner' },
  { name: 'Band Triceps Pushdown', primaryMuscle: 'triceps', secondaryMuscles: [], movementPattern: 'isolation', equipment: ['band'], difficulty: 'beginner' },
  { name: 'Overhead Triceps Extension', primaryMuscle: 'triceps', secondaryMuscles: [], movementPattern: 'isolation', equipment: ['dumbbell'], difficulty: 'beginner' },
  { name: 'Close-Grip Push-Up', primaryMuscle: 'triceps', secondaryMuscles: ['chest'], movementPattern: 'push', equipment: ['bodyweight'], difficulty: 'beginner' },

  // --- calves --------------------------------------------------------------
  { name: 'Standing Calf Raise', primaryMuscle: 'calves', secondaryMuscles: [], movementPattern: 'isolation', equipment: ['bodyweight'], difficulty: 'beginner' },
  { name: 'Dumbbell Calf Raise', primaryMuscle: 'calves', secondaryMuscles: [], movementPattern: 'isolation', equipment: ['dumbbell'], difficulty: 'beginner' },
  { name: 'Seated Calf Raise', primaryMuscle: 'calves', secondaryMuscles: [], movementPattern: 'isolation', equipment: ['machine'], difficulty: 'beginner' },

  // --- core ----------------------------------------------------------------
  { name: 'Plank', primaryMuscle: 'core', secondaryMuscles: ['shoulders'], movementPattern: 'isolation', equipment: ['bodyweight'], difficulty: 'beginner' },
  { name: 'Dead Bug', primaryMuscle: 'core', secondaryMuscles: [], movementPattern: 'isolation', equipment: ['bodyweight'], difficulty: 'beginner' },
  { name: 'Hanging Knee Raise', primaryMuscle: 'core', secondaryMuscles: [], movementPattern: 'isolation', equipment: ['bodyweight'], difficulty: 'intermediate' },
  { name: 'Farmer Carry', primaryMuscle: 'core', secondaryMuscles: ['back', 'shoulders'], movementPattern: 'carry', equipment: ['dumbbell'], difficulty: 'beginner' },
  { name: 'Cable Woodchop', primaryMuscle: 'core', secondaryMuscles: [], movementPattern: 'isolation', equipment: ['machine'], difficulty: 'beginner' },
];

/**
 * Insert missing exercises and update classification on existing ones.
 * Matched by name so ids — and the logged sets pointing at them — survive.
 */
export async function seedExercises(): Promise<void> {
  const existing = await db.select().from(exercise);
  const byName = new Map(existing.map((e) => [e.name, e]));

  const toInsert = EXERCISES.filter((e) => !byName.has(e.name));
  if (toInsert.length > 0) await db.insert(exercise).values(toInsert);

  for (const seed of EXERCISES) {
    const row = byName.get(seed.name);
    if (!row) continue;
    const stale =
      row.primaryMuscle !== seed.primaryMuscle ||
      row.movementPattern !== seed.movementPattern ||
      row.difficulty !== seed.difficulty ||
      JSON.stringify(row.equipment) !== JSON.stringify(seed.equipment);
    if (!stale) continue;
    await db
      .update(exercise)
      .set({
        primaryMuscle: seed.primaryMuscle,
        secondaryMuscles: seed.secondaryMuscles,
        movementPattern: seed.movementPattern,
        equipment: seed.equipment,
        difficulty: seed.difficulty,
      })
      .where(eq(exercise.id, row.id));
  }
}
