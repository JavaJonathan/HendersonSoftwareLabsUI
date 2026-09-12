import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  decodeScenario,
  encodeScenario,
  hasScenarioParams,
} from '../src/pages/tools/taskCostUrl.ts';
import { EXAMPLE_SCENARIO, type Scenario } from '../src/pages/tools/taskCostScenario.ts';
import { resolveForm, toFormState } from '../src/pages/tools/taskCostForm.ts';

/**
 * The URL is this tool's save file, so it gets the same scrutiny as the math.
 *
 * Two things matter. A link has to survive a round trip exactly, or somebody's shared
 * estimate quietly becomes a different estimate. And a hand-edited or hostile query string
 * has to degrade to something sane rather than rendering NaN across the page.
 */

const filled: Scenario = {
  taskName: 'Invoice processing',
  currentSeconds: 360,
  improvedSeconds: 45,
  executionsPerPeriod: 60,
  frequency: 'week',
  hourlyCost: 26,
  schedule: { workdaysPerWeek: 4, workingWeeksPerYear: 48 },
  assumptions: {
    adoptionPct: 85,
    reworkPct: 6,
    improvedReworkPct: 2,
    loadingMultiplier: 1.3,
    realizationPct: 90,
    uncertaintyPct: 30,
  },
  investment: { buildCost: 9000, monthlyCost: 120, rampMonths: 3, horizonMonths: 24 },
  period: 'month',
};

test('the default scenario encodes to an empty query string', () => {
  // Nothing has been changed, so there is nothing worth putting in the address bar.
  assert.equal(encodeScenario(EXAMPLE_SCENARIO), '');
});

test('a fully specified scenario survives a round trip unchanged', () => {
  const decoded = decodeScenario(encodeScenario(filled));
  assert.deepEqual(decoded, filled);
});

test('a leading question mark is accepted', () => {
  const query = encodeScenario(filled);
  assert.deepEqual(decodeScenario(`?${query}`), decodeScenario(query));
});

test('only changed fields are written', () => {
  const query = encodeScenario({ ...EXAMPLE_SCENARIO, improvedSeconds: 15 });
  assert.equal(query, 'i=15');
});

test('an empty query string gives back the example scenario', () => {
  assert.deepEqual(decodeScenario(''), EXAMPLE_SCENARIO);
});

test('a blank hourly cost stays absent, an explicit zero survives', () => {
  assert.equal(decodeScenario('').hourlyCost, null);
  assert.equal(decodeScenario(encodeScenario({ ...EXAMPLE_SCENARIO, hourlyCost: 0 })).hourlyCost, 0);
});

test('out-of-range values are clamped into something usable', () => {
  const decoded = decodeScenario('wd=99&wk=-4&ad=500&rw=-20&ld=99&hz=9999');
  assert.equal(decoded.schedule.workdaysPerWeek, 7);
  assert.equal(decoded.schedule.workingWeeksPerYear, 0.1);
  assert.equal(decoded.assumptions.adoptionPct, 100);
  assert.equal(decoded.assumptions.reworkPct, 0);
  assert.equal(decoded.assumptions.loadingMultiplier, 3);
  assert.equal(decoded.investment.horizonMonths, 120);
});

test('junk values fall back to the default rather than poisoning the page', () => {
  const decoded = decodeScenario('c=abc&i=&n=NaN&f=zzz&r=potato&p=x');
  assert.equal(decoded.currentSeconds, EXAMPLE_SCENARIO.currentSeconds);
  assert.equal(decoded.improvedSeconds, EXAMPLE_SCENARIO.improvedSeconds);
  assert.equal(decoded.executionsPerPeriod, EXAMPLE_SCENARIO.executionsPerPeriod);
  assert.equal(decoded.frequency, EXAMPLE_SCENARIO.frequency);
  assert.equal(decoded.hourlyCost, null);
  assert.equal(decoded.period, 'year');
});

test('every decoded number is finite, whatever the query string says', () => {
  const decoded = decodeScenario('c=Infinity&i=-Infinity&n=1e999&wd=NaN&bc=-5&mc=abc&rm=1e9');
  const numbers = [
    decoded.currentSeconds,
    decoded.improvedSeconds,
    decoded.executionsPerPeriod,
    decoded.schedule.workdaysPerWeek,
    decoded.schedule.workingWeeksPerYear,
    decoded.investment.buildCost,
    decoded.investment.monthlyCost,
    decoded.investment.rampMonths,
    ...Object.values(decoded.assumptions),
  ];
  for (const value of numbers) assert.ok(Number.isFinite(value), `${value} is not finite`);
});

test('a task name is carried, trimmed to a sane length, and kept out of the math', () => {
  const long = 'x'.repeat(200);
  const decoded = decodeScenario(encodeScenario({ ...EXAMPLE_SCENARIO, taskName: long }));
  assert.equal(decoded.taskName.length, 60);
});

test('a task name with URL-hostile characters round trips intact', () => {
  const taskName = 'Q3 close & "reconciliation" / 50% manual';
  const decoded = decodeScenario(encodeScenario({ ...EXAMPLE_SCENARIO, taskName }));
  assert.equal(decoded.taskName, taskName);
});

test('hasScenarioParams only fires on keys this tool owns', () => {
  assert.equal(hasScenarioParams(''), false);
  assert.equal(hasScenarioParams('?utm_source=slack&ref=twitter'), false);
  assert.equal(hasScenarioParams('?i=15'), true);
  assert.equal(hasScenarioParams('?utm_source=slack&i=15'), true);
});

test('a decoded scenario loads into the form and back out unchanged', () => {
  // The round trip the page actually performs when somebody opens a shared link.
  const form = toFormState(filled);
  const { scenario, errors } = resolveForm(form);
  assert.deepEqual({ ...scenario, period: filled.period }, filled);
  assert.deepEqual(Object.values(errors).filter(Boolean), []);
});
