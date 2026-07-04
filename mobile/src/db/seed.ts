/**
 * Seed exercise library — a compact starter set covering every primary
 * muscle and movement pattern so the split generator and logger have real
 * rows to work with. Idempotent: skips if the table already has rows.
 * Full curated dataset (with attribution/media) comes later.
 */
import { count } from 'drizzle-orm';
import { db } from './client';
import { exercise } from './schema';

type Seed = Omit<typeof exercise.$inferInsert, 'id'>;

const EXERCISES: Seed[] = [
  // chest / push
  { name: 'Barbell Bench Press', primaryMuscle: 'chest', secondaryMuscles: ['triceps', 'shoulders'], movementPattern: 'push', equipment: ['barbell', 'bench'], difficulty: 'intermediate' },
  { name: 'Dumbbell Bench Press', primaryMuscle: 'chest', secondaryMuscles: ['triceps', 'shoulders'], movementPattern: 'push', equipment: ['dumbbell', 'bench'], difficulty: 'beginner' },
  { name: 'Push-Up', primaryMuscle: 'chest', secondaryMuscles: ['triceps', 'core'], movementPattern: 'push', equipment: ['bodyweight'], difficulty: 'beginner' },
  { name: 'Incline Dumbbell Press', primaryMuscle: 'chest', secondaryMuscles: ['shoulders', 'triceps'], movementPattern: 'push', equipment: ['dumbbell', 'bench'], difficulty: 'beginner' },
  // shoulders
  { name: 'Overhead Press', primaryMuscle: 'shoulders', secondaryMuscles: ['triceps', 'core'], movementPattern: 'push', equipment: ['barbell'], difficulty: 'intermediate' },
  { name: 'Dumbbell Shoulder Press', primaryMuscle: 'shoulders', secondaryMuscles: ['triceps'], movementPattern: 'push', equipment: ['dumbbell'], difficulty: 'beginner' },
  { name: 'Lateral Raise', primaryMuscle: 'shoulders', secondaryMuscles: [], movementPattern: 'isolation', equipment: ['dumbbell'], difficulty: 'beginner' },
  // back / pull
  { name: 'Pull-Up', primaryMuscle: 'back', secondaryMuscles: ['biceps'], movementPattern: 'pull', equipment: ['bodyweight'], difficulty: 'intermediate' },
  { name: 'Lat Pulldown', primaryMuscle: 'back', secondaryMuscles: ['biceps'], movementPattern: 'pull', equipment: ['machine'], difficulty: 'beginner' },
  { name: 'Barbell Row', primaryMuscle: 'back', secondaryMuscles: ['biceps', 'core'], movementPattern: 'pull', equipment: ['barbell'], difficulty: 'intermediate' },
  { name: 'Dumbbell Row', primaryMuscle: 'back', secondaryMuscles: ['biceps'], movementPattern: 'pull', equipment: ['dumbbell', 'bench'], difficulty: 'beginner' },
  { name: 'Seated Cable Row', primaryMuscle: 'back', secondaryMuscles: ['biceps'], movementPattern: 'pull', equipment: ['machine'], difficulty: 'beginner' },
  // legs — squat pattern
  { name: 'Barbell Back Squat', primaryMuscle: 'quads', secondaryMuscles: ['glutes', 'core'], movementPattern: 'squat', equipment: ['barbell'], difficulty: 'intermediate' },
  { name: 'Goblet Squat', primaryMuscle: 'quads', secondaryMuscles: ['glutes', 'core'], movementPattern: 'squat', equipment: ['dumbbell', 'kettlebell'], difficulty: 'beginner' },
  { name: 'Leg Press', primaryMuscle: 'quads', secondaryMuscles: ['glutes'], movementPattern: 'squat', equipment: ['machine'], difficulty: 'beginner' },
  { name: 'Walking Lunge', primaryMuscle: 'quads', secondaryMuscles: ['glutes', 'hamstrings'], movementPattern: 'squat', equipment: ['bodyweight', 'dumbbell'], difficulty: 'beginner' },
  // legs — hinge pattern
  { name: 'Deadlift', primaryMuscle: 'hamstrings', secondaryMuscles: ['glutes', 'back', 'core'], movementPattern: 'hinge', equipment: ['barbell'], difficulty: 'advanced' },
  { name: 'Romanian Deadlift', primaryMuscle: 'hamstrings', secondaryMuscles: ['glutes'], movementPattern: 'hinge', equipment: ['barbell', 'dumbbell'], difficulty: 'intermediate' },
  { name: 'Hip Thrust', primaryMuscle: 'glutes', secondaryMuscles: ['hamstrings'], movementPattern: 'hinge', equipment: ['barbell', 'bench'], difficulty: 'beginner' },
  { name: 'Leg Curl', primaryMuscle: 'hamstrings', secondaryMuscles: [], movementPattern: 'isolation', equipment: ['machine'], difficulty: 'beginner' },
  // arms
  { name: 'Barbell Curl', primaryMuscle: 'biceps', secondaryMuscles: [], movementPattern: 'isolation', equipment: ['barbell'], difficulty: 'beginner' },
  { name: 'Dumbbell Curl', primaryMuscle: 'biceps', secondaryMuscles: [], movementPattern: 'isolation', equipment: ['dumbbell'], difficulty: 'beginner' },
  { name: 'Triceps Pushdown', primaryMuscle: 'triceps', secondaryMuscles: [], movementPattern: 'isolation', equipment: ['machine', 'band'], difficulty: 'beginner' },
  { name: 'Overhead Triceps Extension', primaryMuscle: 'triceps', secondaryMuscles: [], movementPattern: 'isolation', equipment: ['dumbbell'], difficulty: 'beginner' },
  // core + calves
  { name: 'Plank', primaryMuscle: 'core', secondaryMuscles: ['shoulders'], movementPattern: 'isolation', equipment: ['bodyweight'], difficulty: 'beginner' },
  { name: 'Hanging Knee Raise', primaryMuscle: 'core', secondaryMuscles: [], movementPattern: 'isolation', equipment: ['bodyweight'], difficulty: 'intermediate' },
  { name: 'Farmer Carry', primaryMuscle: 'core', secondaryMuscles: ['back', 'shoulders'], movementPattern: 'carry', equipment: ['dumbbell', 'kettlebell'], difficulty: 'beginner' },
  { name: 'Standing Calf Raise', primaryMuscle: 'calves', secondaryMuscles: [], movementPattern: 'isolation', equipment: ['machine', 'bodyweight'], difficulty: 'beginner' },
];

export async function seedExercisesIfEmpty(): Promise<void> {
  const [{ value }] = await db.select({ value: count() }).from(exercise);
  if (value > 0) return;
  await db.insert(exercise).values(EXERCISES);
}
