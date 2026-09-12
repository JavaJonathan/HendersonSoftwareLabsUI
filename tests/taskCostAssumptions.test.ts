import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateTaskCost,
  projectCashflow,
  sensitivity,
  DEFAULT_ASSUMPTIONS,
  DEFAULT_INVESTMENT,
  DEFAULT_SCHEDULE,
  EXAMPLE_INPUTS,
  type Assumptions,
  type Investment,
  type TaskCostInputs,
} from '../src/pages/tools/taskCostModel.ts';

/**
 * The advanced half of the model: assumptions, payback and sensitivity.
 *
 * `taskCostModel.test.ts` pins the core arithmetic. These pin the promise that makes the
 * advanced panel safe to ship, namely that every assumption is a no-op at its default, and
 * that the payback projection agrees with hand arithmetic.
 */

function close(actual: number, expected: number, tolerance = 1e-9) {
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `expected ${actual} to be within ${tolerance} of ${expected}`,
  );
}

const base: TaskCostInputs = {
  ...EXAMPLE_INPUTS,
  schedule: { ...DEFAULT_SCHEDULE },
  assumptions: { ...DEFAULT_ASSUMPTIONS },
  investment: { ...DEFAULT_INVESTMENT },
};

/** `base` with some assumptions overridden. */
function withAssumptions(overrides: Partial<Assumptions>): TaskCostInputs {
  return { ...base, assumptions: { ...DEFAULT_ASSUMPTIONS, ...overrides } };
}

function withInvestment(overrides: Partial<Investment>): Investment {
  return { ...DEFAULT_INVESTMENT, ...overrides };
}

test('every assumption is a no-op at its default', () => {
  // The four-field version of the tool has to produce the plain time x runs answer.
  const r = calculateTaskCost(base);
  close(r.currentAnnualHours, 208.33333333333334, 1e-9);
  close(r.improvedAnnualHours, 20.833333333333332, 1e-9);
  close(r.annualHoursDelta, 187.5);
  close(r.adoptedExecutions, 2500);
});

test('adoption scales the saving and nothing else', () => {
  const r = calculateTaskCost(withAssumptions({ adoptionPct: 50 }));
  // Half the runs move, so half the saving. The current-state cost is untouched.
  close(r.currentAnnualHours, 208.33333333333334, 1e-9);
  close(r.annualHoursDelta, 93.75);
  close(r.adoptedExecutions, 1250);
});

test('zero adoption recovers nothing', () => {
  const r = calculateTaskCost(withAssumptions({ adoptionPct: 0 }));
  close(r.annualHoursDelta, 0);
  close(r.improvedAnnualHours, r.currentAnnualHours);
  assert.equal(r.isIncrease, false);
});

test('rework today raises the current cost and therefore the saving', () => {
  const r = calculateTaskCost(withAssumptions({ reworkPct: 20 }));
  // 300s x 1.2 = 360s per run really spent.
  close(r.currentAnnualHours, 250);
  close(r.annualHoursDelta, 250 - 20.833333333333332, 1e-9);
});

test('rework after the change eats into the saving', () => {
  const withRework = calculateTaskCost(withAssumptions({ improvedReworkPct: 50 }));
  const without = calculateTaskCost(base);
  // 30s x 1.5 = 45s per improved run.
  close(withRework.improvedAnnualHours, (45 * 2500) / 3600, 1e-9);
  assert.ok(withRework.annualHoursDelta < without.annualHoursDelta);
});

test('an improvement that is slower once rework is counted flags as an increase', () => {
  const r = calculateTaskCost({
    ...base,
    currentSeconds: 100,
    improvedSeconds: 90,
    assumptions: { ...DEFAULT_ASSUMPTIONS, improvedReworkPct: 50 },
  });
  // 90s x 1.5 = 135s, worse than the 100s it replaced.
  assert.equal(r.isIncrease, true);
  assert.ok(r.annualHoursDelta < 0);
});

test('the loading multiplier moves money but never hours', () => {
  const plain = calculateTaskCost({ ...base, hourlyCost: 30 });
  const loaded = calculateTaskCost({
    ...withAssumptions({ loadingMultiplier: 1.3 }),
    hourlyCost: 30,
  });
  close(loaded.annualHoursDelta, plain.annualHoursDelta);
  close(loaded.effectiveHourlyCost as number, 39);
  close(loaded.annualValueDelta as number, 187.5 * 39);
});

test('value realization discounts money but never hours', () => {
  const r = calculateTaskCost({
    ...withAssumptions({ realizationPct: 50 }),
    hourlyCost: 30,
  });
  close(r.annualHoursDelta, 187.5);
  close(r.annualValueDelta as number, 187.5 * 0.5 * 30);
});

test('the uncertainty band is symmetric around the estimate', () => {
  const r = calculateTaskCost(base);
  close(r.annualHoursRange.low, 187.5 * 0.75);
  close(r.annualHoursRange.expected, 187.5);
  close(r.annualHoursRange.high, 187.5 * 1.25);
});

test('a zero uncertainty band collapses to the estimate itself', () => {
  const r = calculateTaskCost(withAssumptions({ uncertaintyPct: 0 }));
  close(r.annualHoursRange.low, 187.5);
  close(r.annualHoursRange.high, 187.5);
});

test('out-of-range assumptions are clamped rather than producing nonsense', () => {
  const r = calculateTaskCost(
    withAssumptions({ adoptionPct: 500, reworkPct: -10, realizationPct: Number.NaN }),
  );
  assert.ok(Number.isFinite(r.annualHoursDelta));
  // 500% adoption is treated as 100%, a negative rework rate as none.
  close(r.annualHoursDelta, 187.5);
});

test('reductionFraction is the share of the task removed', () => {
  close(calculateTaskCost(base).reductionFraction, 0.9);
  close(calculateTaskCost(withAssumptions({ adoptionPct: 50 })).reductionFraction, 0.45);
});

test('reductionFraction is zero rather than NaN when there is no task', () => {
  const r = calculateTaskCost({ ...base, currentSeconds: 0, improvedSeconds: 0 });
  assert.equal(r.reductionFraction, 0);
});

test('no hourly cost means no projection at all', () => {
  const r = calculateTaskCost(base);
  assert.equal(projectCashflow(r, DEFAULT_INVESTMENT), null);
});

test('payback on a $5,000 build matches hand arithmetic', () => {
  // $5,625/yr recovered = $468.75/month, against $5,000 spent on day one.
  const r = calculateTaskCost({ ...base, hourlyCost: 30 });
  const p = projectCashflow(r, withInvestment({ buildCost: 5000, horizonMonths: 36 }));
  assert.ok(p);
  close(p.points[0].cumulative, -5000);
  assert.equal(p.breakEvenMonth, 11);
  close(p.breakEvenMonthExact as number, 10 + 312.5 / 468.75, 1e-9);
  close(p.firstYearNet, 625);
  close(p.netAtHorizon, 11875);
  close(p.totalBenefit, 16875);
  close(p.totalCost, 5000);
  close(p.roi as number, 2.375);
});

test('a running cost is subtracted every month', () => {
  const r = calculateTaskCost({ ...base, hourlyCost: 30 });
  const p = projectCashflow(r, withInvestment({ buildCost: 0, monthlyCost: 100 }));
  assert.ok(p);
  close(p.points[1].netValue, 468.75 - 100);
  close(p.totalCost, 100 * 36);
});

test('a fix that never earns the money back reports no break-even', () => {
  const r = calculateTaskCost({ ...base, hourlyCost: 30 });
  const p = projectCashflow(r, withInvestment({ buildCost: 1000000, horizonMonths: 12 }));
  assert.ok(p);
  assert.equal(p.breakEvenMonth, null);
  assert.ok(p.netAtHorizon < 0);
});

test('a running cost above the saving never breaks even', () => {
  const r = calculateTaskCost({ ...base, hourlyCost: 30 });
  const p = projectCashflow(r, withInvestment({ buildCost: 100, monthlyCost: 10000 }));
  assert.ok(p);
  assert.equal(p.breakEvenMonth, null);
  assert.equal(p.twelveMonthBudget, null);
});

test('the ramp phases the benefit in evenly', () => {
  const r = calculateTaskCost({ ...base, hourlyCost: 30 });
  const p = projectCashflow(r, withInvestment({ rampMonths: 3 }));
  assert.ok(p);
  close(p.points[1].rampFactor, 1 / 3);
  close(p.points[2].rampFactor, 2 / 3);
  close(p.points[3].rampFactor, 1);
  close(p.points[4].rampFactor, 1);
  close(p.points[1].grossValue, 468.75 / 3);
  // Eleven months of full benefit rather than twelve, because of the ramp.
  close(p.twelveMonthBudget as number, 468.75 * 11);
});

test('the twelve-month budget is what a fix could cost and still break even', () => {
  const r = calculateTaskCost({ ...base, hourlyCost: 30 });
  const p = projectCashflow(r, DEFAULT_INVESTMENT);
  assert.ok(p);
  close(p.twelveMonthBudget as number, 5625);

  // Spending exactly that much should land on zero at the twelve-month mark.
  const spent = projectCashflow(r, withInvestment({ buildCost: 5625 }));
  assert.ok(spent);
  close(spent.firstYearNet, 0);
});

test('a horizon shorter than a year still reports a sane budget', () => {
  const r = calculateTaskCost({ ...base, hourlyCost: 30 });
  const p = projectCashflow(r, withInvestment({ horizonMonths: 6 }));
  assert.ok(p);
  assert.equal(p.points.length, 7);
  close(p.twelveMonthBudget as number, 468.75 * 6);
});

test('sensitivity ranks the drivers by how far they move the answer', () => {
  const entries = sensitivity(base);
  assert.ok(entries.length >= 4);
  assert.equal(entries[0].label, 'Current time per run');
  // Sorted widest swing first, and every bar actually moves something.
  for (let i = 1; i < entries.length; i += 1) {
    assert.ok(entries[i - 1].swing >= entries[i].swing);
    assert.ok(entries[i].swing > 0);
  }
  close(entries[0].swing, 104.16666666666667, 1e-9);
});

test('sensitivity measures money once an hourly cost exists, and adds it as a driver', () => {
  const withoutCost = sensitivity(base).map((e) => e.label);
  const withCost = sensitivity({ ...base, hourlyCost: 30 });
  assert.ok(!withoutCost.includes('Hourly labor cost'));
  assert.ok(withCost.some((e) => e.label === 'Hourly labor cost'));
  // Measured in dollars now: the runs driver swings 93.75 hours x $30.
  const runs = withCost.find((e) => e.label === 'How often it runs');
  assert.ok(runs);
  close(runs.swing, 93.75 * 30, 1e-9);
});

test('rework only appears as a driver once it is actually in play', () => {
  assert.ok(!sensitivity(base).some((e) => e.label === 'Rework today'));
  const withRework = sensitivity(withAssumptions({ reworkPct: 10 }));
  assert.ok(withRework.some((e) => e.label === 'Rework today'));
});

test('sensitivity on an empty scenario returns nothing rather than a row of zeros', () => {
  const entries = sensitivity({ ...base, currentSeconds: 0, improvedSeconds: 0 });
  assert.equal(entries.length, 0);
});
