import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  generateProgram,
  selectTemplate,
  volumeBias,
  weeklySetTarget,
  hasEquipment,
  isExcludedByInjury,
  setsPerSessionCap,
  LANDMARKS,
  type ExerciseLike,
  type GeneratorInput,
} from './splitGenerator.ts';

// A library mirroring db/seed.ts closely enough to exercise every rule.
const LIB: ExerciseLike[] = [
  { id: 'bb-bench', name: 'Barbell Bench Press', primaryMuscle: 'chest', secondaryMuscles: [], movementPattern: 'push', equipment: ['barbell', 'bench'], difficulty: 'intermediate' },
  { id: 'db-floor', name: 'Neutral-Grip Dumbbell Floor Press', primaryMuscle: 'chest', secondaryMuscles: [], movementPattern: 'push', equipment: ['dumbbell'], difficulty: 'beginner' },
  { id: 'pushup', name: 'Push-Up', primaryMuscle: 'chest', secondaryMuscles: [], movementPattern: 'push', equipment: ['bodyweight'], difficulty: 'beginner' },
  { id: 'db-fly', name: 'Dumbbell Fly', primaryMuscle: 'chest', secondaryMuscles: [], movementPattern: 'isolation', equipment: ['dumbbell'], difficulty: 'beginner' },
  { id: 'bb-row', name: 'Barbell Row', primaryMuscle: 'back', secondaryMuscles: [], movementPattern: 'pull', equipment: ['barbell'], difficulty: 'intermediate' },
  { id: 'db-row', name: 'Dumbbell Row', primaryMuscle: 'back', secondaryMuscles: [], movementPattern: 'pull', equipment: ['dumbbell'], difficulty: 'beginner' },
  { id: 'cs-row', name: 'Chest-Supported Dumbbell Row', primaryMuscle: 'back', secondaryMuscles: [], movementPattern: 'pull', equipment: ['dumbbell', 'bench'], difficulty: 'beginner' },
  { id: 'pullup', name: 'Pull-Up', primaryMuscle: 'back', secondaryMuscles: [], movementPattern: 'pull', equipment: ['bodyweight'], difficulty: 'intermediate' },
  { id: 'ohp', name: 'Overhead Press', primaryMuscle: 'shoulders', secondaryMuscles: [], movementPattern: 'push', equipment: ['barbell'], difficulty: 'intermediate' },
  { id: 'db-press', name: 'Dumbbell Shoulder Press', primaryMuscle: 'shoulders', secondaryMuscles: [], movementPattern: 'push', equipment: ['dumbbell'], difficulty: 'beginner' },
  { id: 'lat-raise', name: 'Lateral Raise', primaryMuscle: 'shoulders', secondaryMuscles: [], movementPattern: 'isolation', equipment: ['dumbbell'], difficulty: 'beginner' },
  { id: 'bb-curl', name: 'Barbell Curl', primaryMuscle: 'biceps', secondaryMuscles: [], movementPattern: 'isolation', equipment: ['barbell'], difficulty: 'beginner' },
  { id: 'db-curl', name: 'Dumbbell Curl', primaryMuscle: 'biceps', secondaryMuscles: [], movementPattern: 'isolation', equipment: ['dumbbell'], difficulty: 'beginner' },
  { id: 'hammer', name: 'Neutral-Grip Hammer Curl', primaryMuscle: 'biceps', secondaryMuscles: [], movementPattern: 'isolation', equipment: ['dumbbell'], difficulty: 'beginner' },
  { id: 'pushdown', name: 'Cable Triceps Pushdown', primaryMuscle: 'triceps', secondaryMuscles: [], movementPattern: 'isolation', equipment: ['machine'], difficulty: 'beginner' },
  { id: 'oh-ext', name: 'Overhead Triceps Extension', primaryMuscle: 'triceps', secondaryMuscles: [], movementPattern: 'isolation', equipment: ['dumbbell'], difficulty: 'beginner' },
  { id: 'cg-pushup', name: 'Close-Grip Push-Up', primaryMuscle: 'triceps', secondaryMuscles: [], movementPattern: 'push', equipment: ['bodyweight'], difficulty: 'beginner' },
  { id: 'squat', name: 'Barbell Back Squat', primaryMuscle: 'quads', secondaryMuscles: [], movementPattern: 'squat', equipment: ['barbell'], difficulty: 'intermediate' },
  { id: 'goblet', name: 'Goblet Squat', primaryMuscle: 'quads', secondaryMuscles: [], movementPattern: 'squat', equipment: ['dumbbell'], difficulty: 'beginner' },
  { id: 'bw-squat', name: 'Bodyweight Squat', primaryMuscle: 'quads', secondaryMuscles: [], movementPattern: 'squat', equipment: ['bodyweight'], difficulty: 'beginner' },
  { id: 'leg-press', name: 'Leg Press', primaryMuscle: 'quads', secondaryMuscles: [], movementPattern: 'squat', equipment: ['machine'], difficulty: 'beginner' },
  { id: 'deadlift', name: 'Deadlift', primaryMuscle: 'hamstrings', secondaryMuscles: [], movementPattern: 'hinge', equipment: ['barbell'], difficulty: 'advanced' },
  { id: 'rdl', name: 'Romanian Deadlift', primaryMuscle: 'hamstrings', secondaryMuscles: [], movementPattern: 'hinge', equipment: ['barbell'], difficulty: 'intermediate' },
  { id: 'db-rdl', name: 'Dumbbell Romanian Deadlift', primaryMuscle: 'hamstrings', secondaryMuscles: [], movementPattern: 'hinge', equipment: ['dumbbell'], difficulty: 'beginner' },
  { id: 'leg-curl', name: 'Leg Curl', primaryMuscle: 'hamstrings', secondaryMuscles: [], movementPattern: 'isolation', equipment: ['machine'], difficulty: 'beginner' },
  { id: 'hip-thrust', name: 'Hip Thrust', primaryMuscle: 'glutes', secondaryMuscles: [], movementPattern: 'hinge', equipment: ['barbell', 'bench'], difficulty: 'beginner' },
  { id: 'glute-bridge', name: 'Glute Bridge', primaryMuscle: 'glutes', secondaryMuscles: [], movementPattern: 'hinge', equipment: ['bodyweight'], difficulty: 'beginner' },
  { id: 'calf', name: 'Standing Calf Raise', primaryMuscle: 'calves', secondaryMuscles: [], movementPattern: 'isolation', equipment: ['bodyweight'], difficulty: 'beginner' },
  { id: 'plank', name: 'Plank', primaryMuscle: 'core', secondaryMuscles: [], movementPattern: 'isolation', equipment: ['bodyweight'], difficulty: 'beginner' },
  { id: 'deadbug', name: 'Dead Bug', primaryMuscle: 'core', secondaryMuscles: [], movementPattern: 'isolation', equipment: ['bodyweight'], difficulty: 'beginner' },
];

const input = (over: Partial<GeneratorInput> = {}): GeneratorInput => ({
  goal: 'muscle_gain',
  experienceLevel: '1_3yr',
  trainingDays: [1, 3, 5],
  sessionLengthMin: 60,
  equipmentAccess: 'gym',
  injuries: [],
  ...over,
});

// --- Step 1: template selection (docs/02 table) -----------------------------

test('step 1 — 2-3 days is full body at any experience', () => {
  for (const exp of ['new', '3yr_plus'] as const) {
    assert.equal(selectTemplate(3, exp).name, 'Full Body');
    assert.equal(selectTemplate(2, exp).days.length, 2);
  }
});

test('step 1 — 4 days splits on experience: plain U/L for novices, undulating for 1yr+', () => {
  assert.equal(selectTemplate(4, 'under_1yr').name, 'Upper / Lower');
  assert.equal(selectTemplate(4, '1_3yr').name, 'Upper / Lower (undulating)');
  assert.deepEqual(
    selectTemplate(4, '1_3yr').days.map((d) => d.label),
    ['Upper Strength', 'Lower Strength', 'Upper Hypertrophy', 'Lower Hypertrophy']
  );
});

test('step 1 — 6 days is PPL×2 only for 1yr+; beginners are steered to upper/lower', () => {
  assert.equal(selectTemplate(6, '3yr_plus').name, 'Push / Pull / Legs ×2');
  assert.equal(selectTemplate(6, 'new').name, 'Upper / Lower ×3');
});

test('step 1 — 5 days for a trained lifter is PPL + upper/lower', () => {
  assert.deepEqual(
    selectTemplate(5, '1_3yr').days.map((d) => d.label),
    ['Push', 'Pull', 'Legs', 'Upper', 'Lower']
  );
});

// --- Step 2: volume landmarks -----------------------------------------------

test('step 2 — fat loss and new lifters sit at MEV, muscle gain at 1yr+ reaches MAV', () => {
  assert.equal(volumeBias('fat_loss', 'new'), 0);
  assert.equal(weeklySetTarget('chest', 'fat_loss', 'new'), LANDMARKS.chest.mev);

  assert.equal(volumeBias('muscle_gain', '3yr_plus'), 1);
  assert.equal(weeklySetTarget('chest', 'muscle_gain', '3yr_plus'), LANDMARKS.chest.mav);
});

test('step 2 — general fitness lands between MEV and MAV', () => {
  const target = weeklySetTarget('chest', 'general_fitness', '1_3yr');
  assert.ok(target > LANDMARKS.chest.mev && target < LANDMARKS.chest.mav, `got ${target}`);
});

test('step 2 — MRV is never exceeded', () => {
  for (const muscle of Object.keys(LANDMARKS) as (keyof typeof LANDMARKS)[]) {
    const target = weeklySetTarget(muscle, 'muscle_gain', '3yr_plus');
    assert.ok(target <= LANDMARKS[muscle].mrv, `${muscle}: ${target} > MRV`);
  }
});

// --- Step 3: equipment + injury filtering ------------------------------------

test('step 3 — equipment is a requirement set, not a list of alternatives', () => {
  const bench = LIB.find((e) => e.id === 'bb-bench')!;
  assert.equal(hasEquipment(bench, 'gym'), true);
  assert.equal(hasEquipment(bench, 'home_full'), true); // has barbell + bench
  assert.equal(hasEquipment(bench, 'home_minimal'), false); // no barbell

  const goblet = LIB.find((e) => e.id === 'goblet')!;
  assert.equal(hasEquipment(goblet, 'home_minimal'), true); // dumbbell only
});

test('step 3 — a home_minimal program uses only bodyweight/band/dumbbell', () => {
  const program = generateProgram(input({ equipmentAccess: 'home_minimal' }), LIB);
  const byId = new Map(LIB.map((e) => [e.id, e]));
  const allowed = ['bodyweight', 'band', 'dumbbell'];
  for (const day of program.days) {
    assert.ok(day.exercises.length > 0, `${day.label} is empty`);
    for (const ex of day.exercises) {
      for (const kit of byId.get(ex.exerciseId)!.equipment) {
        assert.ok(allowed.includes(kit), `${ex.name} needs ${kit}`);
      }
    }
  }
});

test('step 3 — injuries exclude the mapped movements (docs/06 §7)', () => {
  assert.equal(isExcludedByInjury('Overhead Press', ['Shoulder']), true);
  assert.equal(isExcludedByInjury('Deadlift', ['Lower back']), true);
  assert.equal(isExcludedByInjury('Romanian Deadlift', ['Lower back']), false); // RDL survives
  assert.equal(isExcludedByInjury('Barbell Curl', ['Wrist']), true);
  assert.equal(isExcludedByInjury('Dumbbell Curl', ['Wrist']), false);

  const program = generateProgram(input({ injuries: ['Lower back'] }), LIB);
  const names = program.days.flatMap((d) => d.exercises.map((e) => e.name));
  assert.ok(!names.includes('Deadlift'));
  assert.ok(!names.includes('Barbell Row'));
});

test('step 3 — a gym user gets the barbell press, not the alphabetically-first band', () => {
  // Regression: with all selection scores tied, ordering fell back to
  // name.localeCompare, which put "Band Chest Press" ahead of "Barbell Bench
  // Press" for a gym user. A band has no load increment, so it is a poor
  // primary compound under double progression.
  const program = generateProgram(input({ trainingDays: [1, 2, 4, 5] }), LIB);
  const first = program.days[0].exercises[0].name;
  assert.equal(first, 'Barbell Bench Press', `primary chest lift was ${first}`);
});

test('step 3 — a home_minimal user still gets the most loadable option available', () => {
  const program = generateProgram(input({ equipmentAccess: 'home_minimal', trainingDays: [1, 2, 4, 5] }), LIB);
  const names = program.days.flatMap((d) => d.exercises.map((e) => e.name));
  // Dumbbell work is loadable; bands are the last resort, not the default.
  assert.ok(names.includes('Neutral-Grip Dumbbell Floor Press') || names.includes('Dumbbell Row'), names.join());
});

test('step 3 — compounds are ordered before isolation within a day', () => {
  const program = generateProgram(input({ trainingDays: [1, 2, 4, 5] }), LIB);
  const compound = new Set(['push', 'pull', 'hinge', 'squat']);
  const byId = new Map(LIB.map((e) => [e.id, e]));
  for (const day of program.days) {
    let seenIsolation = false;
    for (const ex of day.exercises) {
      const isCompound = compound.has(byId.get(ex.exerciseId)!.movementPattern);
      if (!isCompound) seenIsolation = true;
      else assert.ok(!seenIsolation, `${day.label}: ${ex.name} (compound) came after isolation`);
    }
  }
});

test('step 3 — no exercise is prescribed twice in the same day', () => {
  const program = generateProgram(input({ trainingDays: [1, 2, 3, 4, 5] }), LIB);
  for (const day of program.days) {
    const ids = day.exercises.map((e) => e.exerciseId);
    assert.equal(new Set(ids).size, ids.length, `${day.label} repeats an exercise`);
  }
});

// --- Step 4: sets, reps, session length --------------------------------------

test('step 4 — rep ranges follow the goal band', () => {
  const cut = generateProgram(input({ goal: 'fat_loss', experienceLevel: 'new' }), LIB);
  for (const ex of cut.days.flatMap((d) => d.exercises)) {
    assert.ok(ex.targetRepMin >= 10 && ex.targetRepMax <= 18, `${ex.name} ${ex.targetRepMin}-${ex.targetRepMax}`);
  }

  const bulk = generateProgram(input({ goal: 'muscle_gain' }), LIB);
  for (const ex of bulk.days.flatMap((d) => d.exercises)) {
    assert.ok(ex.targetRepMin >= 4 && ex.targetRepMax <= 15, `${ex.name} ${ex.targetRepMin}-${ex.targetRepMax}`);
  }
});

test('step 4 — a strength day pulls compound reps below the hypertrophy band', () => {
  const program = generateProgram(input({ trainingDays: [1, 2, 4, 5], experienceLevel: '3yr_plus' }), LIB);
  const strengthDay = program.days.find((d) => d.label === 'Upper Strength')!;
  assert.ok(strengthDay.exercises[0].targetRepMin < 6, 'first compound should be heavier on a strength day');
});

test('step 4 — planned sets per session respect the session-length cap', () => {
  for (const minutes of [30, 45, 60, 90]) {
    const program = generateProgram(input({ sessionLengthMin: minutes }), LIB);
    const cap = setsPerSessionCap(minutes, 'muscle_gain');
    for (const day of program.days) {
      const total = day.exercises.reduce((s, e) => s + e.targetSets, 0);
      assert.ok(total <= cap, `${minutes}min ${day.label}: ${total} sets > cap ${cap}`);
    }
  }
});

test('step 4 — every prescribed exercise has a usable set/rep prescription', () => {
  const program = generateProgram(input(), LIB);
  for (const ex of program.days.flatMap((d) => d.exercises)) {
    assert.ok(ex.targetSets >= 2 && ex.targetSets <= 5, `${ex.name} sets ${ex.targetSets}`);
    assert.ok(ex.targetRepMin < ex.targetRepMax, `${ex.name} rep range inverted`);
    assert.ok(ex.targetRpe !== null && ex.targetRpe >= 6 && ex.targetRpe <= 10);
  }
});

// --- Whole-program invariants -------------------------------------------------

test('generates a complete program for every goal / experience / days combination', () => {
  const goals = ['fat_loss', 'muscle_gain', 'recomp', 'general_fitness'] as const;
  const levels = ['new', 'under_1yr', '1_3yr', '3yr_plus'] as const;
  const access = ['home_minimal', 'home_full', 'gym'] as const;

  for (const goal of goals) {
    for (const experienceLevel of levels) {
      for (const equipmentAccess of access) {
        for (const days of [2, 3, 4, 5, 6]) {
          const trainingDays = [1, 2, 3, 4, 5, 6].slice(0, days);
          const program = generateProgram(
            input({ goal, experienceLevel, equipmentAccess, trainingDays }),
            LIB
          );
          const label = `${goal}/${experienceLevel}/${equipmentAccess}/${days}d`;
          assert.equal(program.days.length, days, label);
          for (const day of program.days) {
            assert.ok(day.exercises.length >= 2, `${label} ${day.label}: only ${day.exercises.length} exercises`);
          }
          assert.ok(program.rationale.length >= 3, `${label} missing rationale`);
        }
      }
    }
  }
});

test('training days are pinned to the weekdays the user picked', () => {
  const program = generateProgram(input({ trainingDays: [1, 3, 6] }), LIB);
  assert.deepEqual(program.days.map((d) => d.weekday), [1, 3, 6]);
});

test('the first session for a muscle gets the best compound, not a rotation slot', () => {
  // Regression: rotation keyed off the global day index, so in an upper/lower
  // split both lower days landed on slot 1 and the barbell RDL was never
  // prescribed at all.
  const program = generateProgram(
    input({ trainingDays: [1, 2, 4, 5], injuries: ['Lower back'] }),
    LIB
  );
  const firstLower = program.days[1];   // Lower Strength
  const secondLower = program.days[3];  // Lower Hypertrophy
  const hamstringPick = (d: typeof firstLower) =>
    d.exercises.find((e) => /Romanian Deadlift/.test(e.name))?.name;

  assert.equal(hamstringPick(firstLower), 'Romanian Deadlift');
  assert.equal(hamstringPick(secondLower), 'Dumbbell Romanian Deadlift');
});

test('repeated days in a split are not identical sessions', () => {
  const program = generateProgram(input({ trainingDays: [1, 2, 4, 5], experienceLevel: 'new' }), LIB);
  const upperA = program.days[0].exercises.map((e) => e.name).join();
  const upperB = program.days[2].exercises.map((e) => e.name).join();
  assert.notEqual(upperA, upperB, 'Upper A and Upper B prescribe the same exercises');
});

test('throws rather than silently returning an empty plan when nothing is usable', () => {
  assert.throws(() => generateProgram(input({ equipmentAccess: 'home_minimal' }), [LIB[0]]));
});
