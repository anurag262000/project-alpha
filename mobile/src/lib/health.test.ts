import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  computeBMI,
  bmiCategory,
  computeBMR,
  computeTDEE,
  calorieTarget,
  macroTargets,
  suggestActivityLevel,
  computeTargets,
  ageFromDob,
} from './health.ts';

// Worked example from docs/06-health-calculations.md §5:
// Male, 30y, 178cm, 82kg, moderately active (1.55), goal fat loss.
test('doc-06 worked example (male 82kg/178cm/30y, moderate, fat loss)', () => {
  const bmi = computeBMI(82, 178);
  assert.equal(bmi, 25.9);
  assert.equal(bmiCategory(bmi), 'overweight');

  const bmr = computeBMR({ sex: 'male', weightKg: 82, heightCm: 178, ageYears: 30 });
  assert.equal(Math.round(bmr), 1788); // 1787.5

  const tdee = computeTDEE(bmr, 'moderate');
  assert.equal(Math.round(tdee), 2771);

  const cals = calorieTarget({ tdee, bmr, goal: 'fat_loss', sex: 'male' });
  assert.equal(cals, 2217);

  const m = macroTargets({ calories: cals, weightKg: 82, goal: 'fat_loss' });
  assert.equal(m.proteinG, 164);
  assert.equal(m.fatG, 62);
  // carbs fill the rest (consistent gram-based subtraction ~251)
  assert.ok(m.carbG >= 249 && m.carbG <= 253, `carbG=${m.carbG}`);
});

// Persona shown in the prototype plan-ready screen.
test('prototype persona (male 81.6kg/178cm/28y, moderate, fat loss)', () => {
  const t = computeTargets({
    sex: 'male',
    weightKg: 81.6,
    heightCm: 178,
    ageYears: 28,
    goal: 'fat_loss',
    activity: 'moderate',
  });
  assert.equal(t.bmi, 25.8);
  assert.equal(t.tdee, 2780);
  assert.equal(t.calorieTarget, 2224);
  assert.equal(t.macros.proteinG, 163);
  assert.equal(t.macros.fatG, 62);
  assert.ok(t.macros.carbG >= 253 && t.macros.carbG <= 254, `carbG=${t.macros.carbG}`);
});

test('calorie target respects the BMR / hard floor for aggressive deficits', () => {
  // Small person whose 20% cut would dip under the floor.
  const bmr = computeBMR({ sex: 'female', weightKg: 50, heightCm: 158, ageYears: 25 });
  const tdee = computeTDEE(bmr, 'sedentary');
  const cals = calorieTarget({ tdee, bmr, goal: 'fat_loss', sex: 'female' });
  assert.ok(cals >= bmr, 'never below BMR');
  assert.ok(cals >= 1200, 'never below the female hard floor');
});

test('activity tier bumps one level at 5+ training days', () => {
  assert.equal(suggestActivityLevel('moderate', 3), 'moderate');
  assert.equal(suggestActivityLevel('moderate', 5), 'very');
  assert.equal(suggestActivityLevel('very', 6), 'extra');
  assert.equal(suggestActivityLevel('extra' as any, 6), 'extra'); // capped
});

test('ageFromDob handles birthday not yet reached this year', () => {
  const now = new Date('2026-07-03');
  assert.equal(ageFromDob(new Date('1998-06-12'), now), 28);
  assert.equal(ageFromDob(new Date('1998-08-01'), now), 27); // birthday later this year
});
