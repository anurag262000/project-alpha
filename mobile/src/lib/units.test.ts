import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cmToFtIn, ftInToCm, fromIsoDate, splitTenths, toIsoDate, KG_PER_LB, round1 } from './units.ts';

test('ISO dates round-trip in local time', () => {
  assert.equal(toIsoDate(new Date(1998, 2, 14)), '1998-03-14');
  const d = fromIsoDate('1998-03-14')!;
  assert.equal(d.getFullYear(), 1998);
  assert.equal(d.getMonth(), 2);
  assert.equal(d.getDate(), 14); // not the 13th, whatever the timezone
  assert.equal(fromIsoDate('14/03/1998'), null);
});

test('height converts both ways and never shows 12 inches', () => {
  assert.deepEqual(cmToFtIn(177.8), { ft: 5, inch: 10 });
  assert.equal(ftInToCm(5, 10), 177.8);
  assert.deepEqual(cmToFtIn(182.7), { ft: 6, inch: 0 }); // 5′11.9″ rolls over
});

test('weight splits into dial columns without a phantom .10', () => {
  assert.deepEqual(splitTenths(81.6), { whole: 81, tenth: 6 });
  assert.deepEqual(splitTenths(79.97), { whole: 80, tenth: 0 });
  // 180 lb dialled in imperial is stored as kilograms
  assert.equal(round1(180 * KG_PER_LB), 81.6);
});
