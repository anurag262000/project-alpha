import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  nextPrescription,
  hitTopOfRange,
  missedBottomOfRange,
  incrementFor,
  deloadCheck,
  deloadPrescription,
  adherenceRate,
  adherenceAdvice,
  DEFAULT_DELOAD,
  type ExercisePlan,
  type PerformedSet,
} from './progression.ts';

const PLAN: ExercisePlan = { targetSets: 3, targetRepMin: 6, targetRepMax: 10 };
const set = (reps: number, weightKg: number, isWarmup = false): PerformedSet => ({ reps, weightKg, isWarmup });

// --- Increments ---------------------------------------------------------------

test('increment is the finest real jump the equipment allows', () => {
  assert.equal(incrementFor(['barbell']), 2.5);
  assert.equal(incrementFor(['dumbbell']), 2);
  assert.equal(incrementFor(['barbell', 'bench']), 2.5); // bench is not loadable
  assert.equal(incrementFor(['bodyweight']), 0);
  assert.equal(incrementFor(['band']), 0);
});

// --- Step 5.1: hit the top of the range → add load ----------------------------

test('detects hitting the top of the rep range on every working set', () => {
  assert.equal(hitTopOfRange([set(10, 60), set(10, 60), set(10, 60)], PLAN), true);
  assert.equal(hitTopOfRange([set(10, 60), set(10, 60), set(9, 60)], PLAN), false);
  assert.equal(hitTopOfRange([set(10, 60), set(10, 60)], PLAN), false); // only 2 of 3 sets
});

test('warm-up sets do not count toward progression', () => {
  const withWarmup = [set(12, 20, true), set(10, 60), set(10, 60), set(10, 60)];
  assert.equal(hitTopOfRange(withWarmup, PLAN), true);
  assert.equal(missedBottomOfRange([set(3, 20, true), set(8, 60)], PLAN), false);
});

test('step 5.1 — all sets at the top of the range adds one increment and resets reps', () => {
  const rx = nextPrescription(PLAN, [[set(10, 60), set(10, 60), set(10, 60)]], ['barbell']);
  assert.equal(rx.kind, 'increase_weight');
  assert.equal(rx.weightKg, 62.5);
  assert.equal(rx.targetRepMin, 6);
  assert.match(rx.reason, /62\.5 kg/);
});

test('step 5.1 — a bodyweight lift raises the rep target instead of the load', () => {
  const rx = nextPrescription(PLAN, [[set(10, 0), set(10, 0), set(10, 0)]], ['bodyweight']);
  assert.equal(rx.kind, 'add_reps');
  assert.equal(rx.targetRepMax, 12);
});

// --- Step 5.2: short of the top → hold load, chase reps ------------------------

test('step 5.2 — short of the top of the range holds the load and adds reps', () => {
  const rx = nextPrescription(PLAN, [[set(8, 60), set(8, 60), set(7, 60)]], ['barbell']);
  assert.equal(rx.kind, 'add_reps');
  assert.equal(rx.weightKg, 60);
  assert.match(rx.reason, /8 of 10/);
});

// --- Step 5.3: two failed sessions → back off ----------------------------------

test('step 5.3 — missing the bottom of the range twice running drops the load ~10%', () => {
  const failed = [set(5, 60), set(4, 60), set(4, 60)];
  const rx = nextPrescription(PLAN, [failed, failed], ['barbell']);
  assert.equal(rx.kind, 'reduce_weight');
  assert.equal(rx.weightKg, 55); // 54 rounded to the nearest 2.5
});

test('step 5.3 — one bad session alone does not trigger a back-off', () => {
  const rx = nextPrescription(PLAN, [[set(5, 60), set(5, 60), set(5, 60)], [set(8, 60), set(8, 60), set(8, 60)]], ['barbell']);
  assert.equal(rx.kind, 'add_reps');
});

test('a first-time lift asks the user to find a working load', () => {
  const rx = nextPrescription(PLAN, [], ['barbell']);
  assert.equal(rx.kind, 'start');
  assert.equal(rx.weightKg, null);
});

// --- Deload --------------------------------------------------------------------

test('deload is due after the configured number of weeks on a program', () => {
  assert.equal(deloadCheck(4, [0, 0]).due, false);
  assert.equal(deloadCheck(DEFAULT_DELOAD.maxWeeks, [0, 0]).due, true);
});

test('deload is due after two consecutive sessions stalling on multiple lifts', () => {
  assert.equal(deloadCheck(2, [2, 2]).due, true);
  assert.equal(deloadCheck(2, [2, 1]).due, false); // only one bad session
  assert.equal(deloadCheck(2, [3]).due, false); // not two sessions yet
});

test('a deload week halves volume and backs the load off to ~90%', () => {
  const d = deloadPrescription(PLAN, 100);
  assert.equal(d.targetSets, 2);
  assert.equal(d.weightKg, 90);
  assert.equal(deloadPrescription(PLAN, null).weightKg, null);
});

// --- Adherence ------------------------------------------------------------------

test('adherence rate is capped at 100% even when the user trains extra', () => {
  assert.equal(adherenceRate(4, 8), 0.5);
  assert.equal(adherenceRate(10, 8), 1);
  assert.equal(adherenceRate(0, 0), 1); // nothing planned yet
});

test('good adherence suggests no change', () => {
  assert.equal(adherenceAdvice(7, 8, 4, 60).action, 'none');
});

test('poor adherence on a 4-day program suggests dropping a day, not blaming the user', () => {
  const advice = adherenceAdvice(3, 8, 4, 60);
  assert.equal(advice.action, 'reduce_days');
  assert.match(advice.message, /3 days a week/);
});

test('poor adherence on a minimal 3-day program shortens sessions instead', () => {
  const advice = adherenceAdvice(2, 6, 3, 60);
  assert.equal(advice.action, 'reduce_session_length');
  assert.match(advice.message, /45-minute/);
});

test('poor adherence on an already-minimal program stops suggesting cuts', () => {
  assert.equal(adherenceAdvice(1, 6, 3, 30).action, 'none');
});
