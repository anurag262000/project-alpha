/**
 * Health & nutrition calculations — implements docs/06-health-calculations.md.
 * Pure functions, no dependencies, so they're unit-testable in isolation.
 *
 * Sources: Mifflin-St Jeor (BMR), WHO (BMI), ISSN/ACSM (protein & calorie
 * guidance). None of these numbers are invented.
 */

export type Sex = 'male' | 'female';
export type Goal = 'fat_loss' | 'muscle_gain' | 'recomp' | 'general_fitness';

/** Final 5-tier activity level that feeds the TDEE multiplier. */
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'very' | 'extra';

/** Lifestyle NEAT captured in onboarding (4 options, no "extra"). */
export type LifestyleActivity = 'sedentary' | 'light' | 'moderate' | 'very';

export const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  very: 1.725,
  extra: 1.9,
};

const ACTIVITY_ORDER: ActivityLevel[] = ['sedentary', 'light', 'moderate', 'very', 'extra'];

export type BmiCategory = 'underweight' | 'normal' | 'overweight' | 'obese';

// --- Age -------------------------------------------------------------------

export function ageFromDob(dob: Date, now: Date = new Date()): number {
  let age = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--;
  return age;
}

// --- BMI -------------------------------------------------------------------

export function computeBMI(weightKg: number, heightCm: number): number {
  const m = heightCm / 100;
  return round1(weightKg / (m * m));
}

export function bmiCategory(bmi: number): BmiCategory {
  if (bmi < 18.5) return 'underweight';
  if (bmi < 25) return 'normal';
  if (bmi < 30) return 'overweight';
  return 'obese';
}

// --- Energy ----------------------------------------------------------------

/** Mifflin-St Jeor. Returns kcal/day (unrounded for downstream precision). */
export function computeBMR(p: {
  sex: Sex;
  weightKg: number;
  heightCm: number;
  ageYears: number;
}): number {
  const base = 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.ageYears;
  return base + (p.sex === 'male' ? 5 : -161);
}

/**
 * Suggest the activity tier: start from the lifestyle NEAT answer, bump one
 * tier up when training 5+ days/week (docs/06 §3 auto-suggestion rule).
 */
export function suggestActivityLevel(
  lifestyle: LifestyleActivity,
  trainingDaysPerWeek: number
): ActivityLevel {
  const idx = ACTIVITY_ORDER.indexOf(lifestyle);
  const bumped = trainingDaysPerWeek >= 5 ? idx + 1 : idx;
  return ACTIVITY_ORDER[Math.min(bumped, ACTIVITY_ORDER.length - 1)];
}

export function computeTDEE(bmr: number, activity: ActivityLevel): number {
  return bmr * ACTIVITY_MULTIPLIERS[activity];
}

/** Daily calorie target by goal, with safety floors (docs/06 §4). */
export function calorieTarget(p: {
  tdee: number;
  bmr: number;
  goal: Goal;
  sex: Sex;
}): number {
  let target: number;
  switch (p.goal) {
    case 'fat_loss':
      target = p.tdee * 0.8;
      break;
    case 'muscle_gain':
      target = p.tdee * 1.1;
      break;
    case 'recomp':
      target = p.tdee * 0.95;
      break;
    case 'general_fitness':
    default:
      target = p.tdee;
  }
  // Never below BMR, and never below the absolute safety floor.
  const hardFloor = p.sex === 'male' ? 1500 : 1200;
  target = Math.max(target, p.bmr, hardFloor);
  return Math.round(target);
}

export interface MacroTargets {
  proteinG: number;
  fatG: number;
  carbG: number;
}

/** Protein first, then fat (25% cals, hormonal floor), carbs fill the rest. */
export function macroTargets(p: {
  calories: number;
  weightKg: number;
  goal: Goal;
}): MacroTargets {
  const proteinPerKg =
    p.goal === 'fat_loss' || p.goal === 'recomp' ? 2.0 : p.goal === 'muscle_gain' ? 1.8 : 1.6;
  const proteinG = Math.round(proteinPerKg * p.weightKg);

  const fatFromCalories = (0.25 * p.calories) / 9;
  const fatFloor = 0.6 * p.weightKg;
  const fatG = Math.round(Math.max(fatFromCalories, fatFloor));

  const carbCalories = p.calories - proteinG * 4 - fatG * 9;
  const carbG = Math.max(0, Math.round(carbCalories / 4));

  return { proteinG, fatG, carbG };
}

// --- Convenience bundle ----------------------------------------------------

export interface TargetsInput {
  sex: Sex;
  weightKg: number;
  heightCm: number;
  ageYears: number;
  goal: Goal;
  activity: ActivityLevel;
}

export interface TargetsBundle {
  bmi: number;
  bmiCategory: BmiCategory;
  bmr: number; // rounded for display
  tdee: number; // rounded for display
  calorieTarget: number;
  macros: MacroTargets;
}

/** One call that produces every derived number for the profile/plan-ready screen. */
export function computeTargets(input: TargetsInput): TargetsBundle {
  const bmi = computeBMI(input.weightKg, input.heightCm);
  const bmr = computeBMR(input);
  const tdee = computeTDEE(bmr, input.activity);
  const calories = calorieTarget({ tdee, bmr, goal: input.goal, sex: input.sex });
  const macros = macroTargets({ calories, weightKg: input.weightKg, goal: input.goal });
  return {
    bmi,
    bmiCategory: bmiCategory(bmi),
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    calorieTarget: calories,
    macros,
  };
}

// --- helpers ---------------------------------------------------------------

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
