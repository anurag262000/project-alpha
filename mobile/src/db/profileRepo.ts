/**
 * Profile data access — turns a completed OnboardingDraft into the three
 * rows onboarding produces (profile, first body measurement, health
 * screening), with derived targets cached on the profile per
 * docs/06-health-calculations.md, then generates the training split.
 */
import { and, eq } from 'drizzle-orm';
import { db } from './client';
import { bodyMeasurement, healthScreening, profile, type Profile } from './schema';
import { ageFromDob, computeBMI, computeTargets, suggestActivityLevel } from '@/lib/health';
import type { OnboardingDraft } from '@/store/onboarding';
import { generateAndSaveProgram } from './programRepo';

export async function getProfile(): Promise<Profile | null> {
  const [row] = await db.select().from(profile).limit(1);
  return row ?? null;
}

/** Fields the flow must have filled before we can persist. */
const REQUIRED = [
  'sex', 'dateOfBirth', 'heightCm', 'weightKg', 'goal', 'experienceLevel',
  'lifestyleActivity', 'trainingDays', 'sessionLengthMin', 'preferredTime',
  'equipmentAccess',
] as const;

export function missingDraftFields(draft: OnboardingDraft): string[] {
  return REQUIRED.filter((k) => {
    const v = draft[k];
    return v === undefined || (Array.isArray(v) && v.length === 0);
  });
}

export async function completeOnboarding(draft: OnboardingDraft): Promise<Profile> {
  const missing = missingDraftFields(draft);
  if (missing.length > 0) {
    throw new Error(`Onboarding is incomplete (missing: ${missing.join(', ')}).`);
  }

  const activity = suggestActivityLevel(draft.lifestyleActivity!, draft.trainingDays!.length);
  const targets = computeTargets({
    sex: draft.sex!,
    weightKg: draft.weightKg!,
    heightCm: draft.heightCm!,
    ageYears: ageFromDob(new Date(draft.dateOfBirth!)),
    goal: draft.goal!,
    activity,
  });
  const today = new Date().toISOString().slice(0, 10);
  const nowIso = new Date().toISOString();

  const [created] = await db
    .insert(profile)
    .values({
      sex: draft.sex!,
      dateOfBirth: draft.dateOfBirth!,
      heightCm: draft.heightCm!,
      goal: draft.goal!,
      experienceLevel: draft.experienceLevel!,
      activityLevel: activity,
      trainingDays: draft.trainingDays!,
      sessionLengthMin: draft.sessionLengthMin!,
      preferredTime: draft.preferredTime!,
      equipmentAccess: draft.equipmentAccess!,
      injuries: draft.injuries ?? [],
      bmrKcal: targets.bmr,
      tdeeKcal: targets.tdee,
      calorieTargetKcal: targets.calorieTarget,
      proteinG: targets.macros.proteinG,
      fatG: targets.macros.fatG,
      carbG: targets.macros.carbG,
      targetsComputedAt: nowIso,
    })
    .returning();

  await db.insert(bodyMeasurement).values({
    profileId: created.id,
    date: today,
    weightKg: draft.weightKg!,
    bmi: computeBMI(draft.weightKg!, draft.heightCm!),
    accuracy: draft.weightAccuracy ?? 'estimated',
    source: 'manual',
  });

  const parq = draft.parqAnswers ?? [];
  await db.insert(healthScreening).values({
    profileId: created.id,
    parqAnswers: parq,
    anyFlag: parq.some(Boolean),
  });

  // The profile is only useful once it has a plan attached — generate the
  // split now so Home has a workout to show on first launch (docs/02).
  // A generation failure (e.g. an equipment + injury combination that leaves
  // nothing usable) must not strand the user mid-onboarding: keep the profile,
  // and let ensureActiveProgram() retry on the next launch.
  try {
    await generateAndSaveProgram(created);
  } catch (e) {
    console.warn('[onboarding] program generation failed, retrying at launch:', e);
  }

  return created;
}

/** Weight history, oldest first — the BMI/weight trend on the progress screen. */
export async function measurementHistory(profileId: string) {
  const rows = await db
    .select()
    .from(bodyMeasurement)
    .where(eq(bodyMeasurement.profileId, profileId));
  return rows.sort((a, b) => (a.date < b.date ? -1 : 1));
}

/** Latest weight for target recomputation / progress displays. */
export async function latestMeasurement(profileId: string) {
  const history = await measurementHistory(profileId);
  return history[history.length - 1] ?? null;
}

/**
 * Record a new weigh-in and refresh the cached calorie/macro targets, which
 * docs/01 says are recomputed on weight/activity/goal change.
 */
export async function addMeasurement(
  p: Profile,
  weightKg: number,
  accuracy: 'estimated' | 'measured' = 'measured'
): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);
  const bmi = computeBMI(weightKg, p.heightCm);

  const [existing] = await db
    .select()
    .from(bodyMeasurement)
    .where(and(eq(bodyMeasurement.profileId, p.id), eq(bodyMeasurement.date, today)))
    .limit(1);

  if (existing) {
    await db
      .update(bodyMeasurement)
      .set({ weightKg, bmi, accuracy })
      .where(eq(bodyMeasurement.id, existing.id));
  } else {
    await db.insert(bodyMeasurement).values({
      profileId: p.id,
      date: today,
      weightKg,
      bmi,
      accuracy,
      source: 'manual',
    });
  }

  const targets = computeTargets({
    sex: p.sex,
    weightKg,
    heightCm: p.heightCm,
    ageYears: ageFromDob(new Date(p.dateOfBirth)),
    goal: p.goal,
    activity: p.activityLevel,
  });
  await db
    .update(profile)
    .set({
      bmrKcal: targets.bmr,
      tdeeKcal: targets.tdee,
      calorieTargetKcal: targets.calorieTarget,
      proteinG: targets.macros.proteinG,
      fatG: targets.macros.fatG,
      carbG: targets.macros.carbG,
      targetsComputedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .where(eq(profile.id, p.id));
}
