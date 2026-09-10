import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  annualExecutions,
  calculateTaskCost,
  forPeriod,
  DEFAULT_SCHEDULE,
  EXAMPLE_INPUTS,
  type TaskCostInputs,
} from '../src/pages/tools/taskCostModel.ts';
import { formatQuantity } from '../src/pages/tools/taskCostFormat.ts';

/** Assert two numbers are equal within a small tolerance (full-precision math). */
function close(actual: number, expected: number, tolerance = 1e-9) {
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `expected ${actual} to be within ${tolerance} of ${expected}`,
  );
}

const base: TaskCostInputs = { ...EXAMPLE_INPUTS, schedule: { ...DEFAULT_SCHEDULE } };

test('default example scenario matches the spec figures', () => {
  const r = calculateTaskCost(base);
  close(r.annualExecutions, 2500);
  close(r.currentAnnualHours, 750000 / 3600); // 208.333...
  close(r.improvedAnnualHours, 75000 / 3600); // 20.833...
  close(r.annualHoursDelta, 187.5);
  close(r.annualEightHourDays, 23.4375);
  assert.equal(r.annualValueDelta, null);
  assert.equal(r.isIncrease, false);
});

test('optional $30/hour yields $5,625 of recovered value', () => {
  const r = calculateTaskCost({ ...base, hourlyCost: 30 });
  close(r.annualValueDelta as number, 5625);
});

test('an explicit hourly cost of 0 still produces (zero) monetary results', () => {
  const r = calculateTaskCost({ ...base, hourlyCost: 0 });
  assert.equal(r.annualValueDelta, 0);
});

test('zero executions -> zero everywhere, no NaN', () => {
  const r = calculateTaskCost({ ...base, executionsPerPeriod: 0 });
  close(r.annualExecutions, 0);
  close(r.currentAnnualHours, 0);
  close(r.annualHoursDelta, 0);
  close(r.annualEightHourDays, 0);
  assert.ok(Number.isFinite(r.annualHoursDelta));
});

test('zero current task time -> zero current hours', () => {
  const r = calculateTaskCost({ ...base, currentSeconds: 0, improvedSeconds: 0 });
  close(r.currentAnnualHours, 0);
  close(r.improvedAnnualHours, 0);
  close(r.annualHoursDelta, 0);
});

test('unchanged task time -> nothing recovered', () => {
  const r = calculateTaskCost({ ...base, improvedSeconds: base.currentSeconds });
  close(r.annualHoursDelta, 0);
  assert.equal(r.isIncrease, false);
});

test('increased task time -> negative delta and isIncrease flag', () => {
  const r = calculateTaskCost({ ...base, currentSeconds: 30, improvedSeconds: 300 });
  assert.ok(r.annualHoursDelta < 0);
  assert.equal(r.isIncrease, true);
  close(r.annualHoursDelta, (30 - 300) * 2500 / 3600);
});

test('negative / NaN inputs are treated as zero, never leak NaN', () => {
  const r = calculateTaskCost({
    ...base,
    currentSeconds: -60,
    improvedSeconds: Number.NaN,
    executionsPerPeriod: -5,
  });
  assert.ok(Number.isFinite(r.annualHoursDelta));
  close(r.annualExecutions, 0);
  close(r.annualHoursDelta, 0);
});

test('equivalent annual execution counts match across frequency modes', () => {
  // 10/workday x 5 x 50 = 2500/yr;  50/week x 50 = 2500/yr;  ~208.333/month x 12 = 2500/yr
  const perWorkday = calculateTaskCost({ ...base, frequency: 'workday', executionsPerPeriod: 10 });
  const perWeek = calculateTaskCost({ ...base, frequency: 'week', executionsPerPeriod: 50 });
  const perMonth = calculateTaskCost({ ...base, frequency: 'month', executionsPerPeriod: 2500 / 12 });

  close(perWorkday.annualExecutions, 2500);
  close(perWeek.annualExecutions, 2500);
  close(perMonth.annualExecutions, 2500);
  close(perWeek.annualHoursDelta, perWorkday.annualHoursDelta);
  close(perMonth.annualHoursDelta, perWorkday.annualHoursDelta);
});

test('monthly frequency ignores the working schedule', () => {
  const a = calculateTaskCost({
    ...base,
    frequency: 'month',
    executionsPerPeriod: 100,
    schedule: { workdaysPerWeek: 3, workingWeeksPerYear: 12 },
  });
  const b = calculateTaskCost({
    ...base,
    frequency: 'month',
    executionsPerPeriod: 100,
    schedule: { workdaysPerWeek: 7, workingWeeksPerYear: 52 },
  });
  close(a.annualExecutions, 1200);
  close(b.annualExecutions, 1200);
  close(a.annualHoursDelta, b.annualHoursDelta);
});

test('supports fractional execution rates', () => {
  const r = calculateTaskCost({ ...base, frequency: 'week', executionsPerPeriod: 0.5 });
  close(r.annualExecutions, 25); // 0.5 x 50 weeks
});

test('forPeriod: monthly is the annual figure divided by 12', () => {
  const r = calculateTaskCost(base);
  close(forPeriod(r.annualHoursDelta, 'month'), 187.5 / 12);
  close(forPeriod(r.annualHoursDelta, 'year'), 187.5);
  close(
    forPeriod(r.annualHoursDelta, 'month') * 12,
    forPeriod(r.annualHoursDelta, 'year'),
  );
});

test('annualExecutions is a pure function of its three inputs', () => {
  close(annualExecutions(10, 'workday', DEFAULT_SCHEDULE), 2500);
  close(annualExecutions(50, 'week', DEFAULT_SCHEDULE), 2500);
  close(annualExecutions(100, 'month', DEFAULT_SCHEDULE), 1200);
});

test('formatQuantity keeps small non-zero results visibly non-zero', () => {
  assert.equal(formatQuantity(0), '0');
  assert.equal(formatQuantity(187.5), '187.5');
  assert.equal(formatQuantity(200), '200');
  assert.notEqual(formatQuantity(0.004), '0');
  assert.notEqual(formatQuantity(0.0004), '0');
});
