/**
 * Local SQLite schema (Drizzle) — mirrors docs/01-data-model.md.
 * Local-only for now; no sync. Enums are stored as text with a TS union type
 * for safety at the app layer.
 */
import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

const uuid = () => text('id').primaryKey().$defaultFn(() => crypto.randomUUID());
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

export type Profile = typeof profile.$inferSelect;
export type NewProfile = typeof profile.$inferInsert;
export type BodyMeasurement = typeof bodyMeasurement.$inferSelect;
export type HealthScreening = typeof healthScreening.$inferSelect;
export type CalorieCheckin = typeof calorieCheckin.$inferSelect;
