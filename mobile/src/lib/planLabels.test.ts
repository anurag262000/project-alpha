import { test } from 'node:test';
import assert from 'node:assert/strict';
import { countMuscles, shortDayLabel, topMuscles } from './planLabels.ts';
import type { Muscle } from './splitGenerator.ts';

test('day labels shorten to something a 40px strip cell can hold', () => {
  assert.equal(shortDayLabel('Upper A'), 'Up A');
  assert.equal(shortDayLabel('Lower B'), 'Lo B');
  assert.equal(shortDayLabel('Full Body A'), 'FB A');
  assert.equal(shortDayLabel('Push'), 'Pu'); // no A/B suffix to keep
  assert.equal(shortDayLabel(''), '');
  // Every result stays short enough to render on one line.
  for (const l of ['Upper A', 'Full Body C', 'Legs', 'Pull B']) {
    assert.ok(shortDayLabel(l).length <= 4, l);
  }
});

test('sets by muscle sum per primary muscle and ignore unknown rows', () => {
  const muscles: Record<string, Muscle> = { a: 'chest', b: 'chest', c: 'back' };
  const counts = countMuscles(
    [
      { exerciseId: 'a', targetSets: 4 },
      { exerciseId: 'b', targetSets: 3 },
      { exerciseId: 'c', targetSets: 5 },
      { exerciseId: 'missing', targetSets: 9 }, // not in the library — dropped
    ],
    (id) => muscles[id]
  );
  assert.deepEqual(counts, { chest: 7, back: 5 });
});

test('the bar shows the four biggest muscles, lead first', () => {
  const top = topMuscles({ chest: 4, back: 7, triceps: 3, shoulders: 6, biceps: 2, core: 0 });
  assert.deepEqual(top, [
    ['back', 7],
    ['shoulders', 6],
    ['chest', 4],
    ['triceps', 3],
  ]);
  // A zero count never takes a segment, and an empty day never renders one.
  assert.deepEqual(topMuscles({ core: 0 }), []);
});
