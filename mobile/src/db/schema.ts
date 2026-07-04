/**
 * Local SQLite schema (Drizzle) — mirrors docs/01-data-model.md.
 * Local-only for now; no sync. Enums are stored as text with a TS union type
 * for safety at the app layer.
 */
import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// Lazy require: Hermes has no global crypto.randomUUID, and a top-level
// expo-crypto import breaks drizzle-kit's Node-side schema parsing.
const newId = (): string => {
  const { randomUUID } = require('expo-crypto') as typeof import('expo-crypto');
  return randomUUID();
};
const uuid = () => text('id').primaryKey().$defaultFn(newId);
const now = () => text().default(sql`(CURRENT_TIMESTAMP)`);

// --- Profile ---------------------------------------------------------------

export const profile = sqliteTable('profile', {
  id: uuid(),
  sex: text('sex').$type<'male' | 'female'>().notNull(),
  dateOfBirth: text('date_of_birth').notNull(), // ISO date
  heightCm: real('height_cm').notNull(),
  goal: text('goal')
    .$type<'fat_loss' | 'muscle_gain' | 'recomp' | 'general_fitness'>()
    .notNull(),
  experienceLevel: text('experience_level')
    .$type<'new' | 'under_1yr' | '1_3yr' | '3yr_plus'>()
    .notNull(),
  activityLevel: text('activity_level')
    .$type<'sedentary' | 'light' | 'moderate' | 'very' | 'extra'>()
    .notNull(),
  trainingDays: text('training_days', { mode: 'json' }).$type<number[]>().notNull(), // 0=Sun..6=Sat
  sessionLengthMin: integer('session_length_min').notNull(),
  preferredTime: text('preferred_time')
    .$type<'morning' | 'midday' | 'evening' | 'flexible'>()
    .notNull(),
  preferredTimeSpecific: text('preferred_time_specific'), // nullable HH:mm
  equipmentAccess: text('equipment_access')
    .$type<'home_minimal' | 'home_full' | 'gym'>()
    .notNull(),
  injuries: text('injuries', { mode: 'json' }).$type<string[]>().default(sql`'[]'`),
  // progressive / nullable
  targetWeightKg: real('target_weight_kg'),
  dietaryPattern: text('dietary_pattern').$type<'omnivore' | 'vegetarian' | 'vegan' | 'other'>(),
  allergies: text('allergies', { mode: 'json' }).$type<string[]>(),
  calCheckinEnabled: integer('cal_checkin_enabled', { mode: 'boolean' }).default(false),
  // cached derived targets (recomputed on weight/activity/goal change)
  bmrKcal: integer('bmr_kcal'),
  tdeeKcal: integer('tdee_kcal'),
  calorieTargetKcal: integer('calorie_target_kcal'),
  proteinG: integer('protein_g'),
  fatG: integer('fat_g'),
  carbG: integer('carb_g'),
  targetsComputedAt: text('targets_computed_at'),
  createdAt: now(),
  updatedAt: now(),
});

// --- Body measurements (time series) --------------------------------------

export const bodyMeasurement = sqliteTable('body_measurement', {
  id: uuid(),
  profileId: text('profile_id')
    .notNull()
    .references(() => profile.id),
  date: text('date').notNull(),
  weightKg: real('weight_kg').notNull(),
  bmi: real('bmi'), // derived at write time from weight + profile height
  bodyFatPct: real('body_fat_pct'),
  waistCm: real('waist_cm'),
  chestCm: real('chest_cm'),
  armCm: real('arm_cm'),
  accuracy: text('accuracy').$type<'estimated' | 'measured'>().notNull(),
  source: text('source').$type<'manual' | 'synced'>().default('manual'),
});

// --- Health screening (1-1 with profile) ----------------------------------

export const healthScreening = sqliteTable('health_screening', {
  id: uuid(),
  profileId: text('profile_id')
    .notNull()
    .references(() => profile.id),
  parqAnswers: text('parq_answers', { mode: 'json' }).$type<boolean[]>().notNull(), // 7 items
  anyFlag: integer('any_flag', { mode: 'boolean' }).notNull(),
  conditions: text('conditions', { mode: 'json' }).$type<string[]>(),
  medications: text('medications', { mode: 'json' }).$type<string[]>(),
  clearedByPhysician: integer('cleared_by_physician', { mode: 'boolean' }).default(false),
  screenedAt: now(),
});

// --- Calorie check-in (phase-1 nutrition) ---------------------------------

export const calorieCheckin = sqliteTable('calorie_checkin', {
  id: uuid(),
  profileId: text('profile_id')
    .notNull()
    .references(() => profile.id),
  date: text('date').notNull(),
  caloriesConsumed: integer('calories_consumed').notNull(),
  proteinG: integer('protein_g'),
  targetSnapshotKcal: integer('target_snapshot_kcal').notNull(),
  source: text('source').$type<'manual' | 'food_log'>().default('manual'),
});

// --- Exercise library (seeded, read-mostly) --------------------------------

export const exercise = sqliteTable('exercise', {
  id: uuid(),
  name: text('name').notNull(),
  primaryMuscle: text('primary_muscle')
    .$type<
      | 'chest' | 'back' | 'quads' | 'hamstrings' | 'glutes'
      | 'shoulders' | 'biceps' | 'triceps' | 'core' | 'calves'
    >()
    .notNull(),
  secondaryMuscles: text('secondary_muscles', { mode: 'json' }).$type<string[]>().default(sql`'[]'`),
  movementPattern: text('movement_pattern')
    .$type<'push' | 'pull' | 'hinge' | 'squat' | 'carry' | 'isolation'>()
    .notNull(),
  equipment: text('equipment', { mode: 'json' }).$type<string[]>().notNull(), // barbell, dumbbell, machine, bodyweight, band, kettlebell, bench
  difficulty: text('difficulty').$type<'beginner' | 'intermediate' | 'advanced'>().notNull(),
  instructions: text('instructions').default(''),
  mediaUrl: text('media_url'),
  sourceAttribution: text('source_attribution').default('seed'),
});

// --- Program (plan) ---------------------------------------------------------

export const program = sqliteTable('program', {
  id: uuid(),
  profileId: text('profile_id')
    .notNull()
    .references(() => profile.id),
  name: text('name').notNull(),
  goal: text('goal')
    .$type<'fat_loss' | 'muscle_gain' | 'recomp' | 'general_fitness'>()
    .notNull(), // snapshot of profile.goal at generation time
  daysPerWeek: integer('days_per_week').notNull(),
  status: text('status').$type<'active' | 'archived'>().notNull().default('active'),
  origin: text('origin').$type<'generated' | 'custom'>().notNull(),
  generatedAt: text('generated_at').default(sql`(CURRENT_TIMESTAMP)`),
});

export const programDay = sqliteTable('program_day', {
  id: uuid(),
  programId: text('program_id')
    .notNull()
    .references(() => program.id),
  weekday: integer('weekday'), // 0=Sun..6=Sat; null = "day N of rotation"
  orderIndex: integer('order_index').notNull(),
  label: text('label').notNull(), // e.g. "Upper A"
});

export const programExercise = sqliteTable('program_exercise', {
  id: uuid(),
  programDayId: text('program_day_id')
    .notNull()
    .references(() => programDay.id),
  exerciseId: text('exercise_id')
    .notNull()
    .references(() => exercise.id),
  orderIndex: integer('order_index').notNull(),
  targetSets: integer('target_sets').notNull(),
  targetRepMin: integer('target_rep_min').notNull(),
  targetRepMax: integer('target_rep_max').notNull(),
  targetRpe: real('target_rpe'),
  notes: text('notes'),
});

// --- Workout logging (actual) -----------------------------------------------

export const workoutSession = sqliteTable('workout_session', {
  id: uuid(),
  profileId: text('profile_id')
    .notNull()
    .references(() => profile.id),
  programDayId: text('program_day_id').references(() => programDay.id), // null = ad-hoc session
  date: text('date').notNull(), // ISO date
  startedAt: text('started_at'),
  completedAt: text('completed_at'),
  status: text('status').$type<'in_progress' | 'completed' | 'skipped'>().notNull().default('in_progress'),
});

export const loggedSet = sqliteTable('logged_set', {
  id: uuid(),
  sessionId: text('session_id')
    .notNull()
    .references(() => workoutSession.id),
  exerciseId: text('exercise_id')
    .notNull()
    .references(() => exercise.id), // may differ from plan (substitution)
  programExerciseId: text('program_exercise_id').references(() => programExercise.id), // null = ad-hoc
  setIndex: integer('set_index').notNull(),
  reps: integer('reps').notNull(),
  weightKg: real('weight_kg').notNull(),
  rpe: real('rpe'),
  isWarmup: integer('is_warmup', { mode: 'boolean' }).notNull().default(false),
  completedAt: text('completed_at').default(sql`(CURRENT_TIMESTAMP)`),
});

// --- Passive activity (Health Connect, future) -------------------------------

export const activitySnapshot = sqliteTable('activity_snapshot', {
  id: uuid(),
  profileId: text('profile_id')
    .notNull()
    .references(() => profile.id),
  date: text('date').notNull(),
  steps: integer('steps').notNull().default(0),
  activeMinutes: integer('active_minutes').notNull().default(0),
  points: integer('points').notNull().default(0),
  source: text('source').$type<'health_connect'>().default('health_connect'),
});

export type Profile = typeof profile.$inferSelect;
export type NewProfile = typeof profile.$inferInsert;
export type BodyMeasurement = typeof bodyMeasurement.$inferSelect;
export type HealthScreening = typeof healthScreening.$inferSelect;
export type CalorieCheckin = typeof calorieCheckin.$inferSelect;
export type Exercise = typeof exercise.$inferSelect;
export type Program = typeof program.$inferSelect;
export type ProgramDay = typeof programDay.$inferSelect;
export type ProgramExercise = typeof programExercise.$inferSelect;
export type WorkoutSession = typeof workoutSession.$inferSelect;
export type NewWorkoutSession = typeof workoutSession.$inferInsert;
export type LoggedSet = typeof loggedSet.$inferSelect;
export type NewLoggedSet = typeof loggedSet.$inferInsert;
export type ActivitySnapshot = typeof activitySnapshot.$inferSelect;
