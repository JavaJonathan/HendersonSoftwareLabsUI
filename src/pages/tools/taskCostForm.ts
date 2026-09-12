/**
 * The bridge between what the form holds and what the model wants.
 *
 * Text fields keep their raw string, so a half-typed "1." is never clobbered mid-keystroke;
 * sliders keep a number, because there is nothing to half-type. `resolveForm` turns the
 * whole thing into a clean `Scenario` plus a set of per-field error strings, which means the
 * results panel always has valid numbers to draw even while a field is in a bad state.
 */

import { parseHourly, parseRange } from './parseInput.ts';
import { DEFAULT_SCHEDULE, type Frequency } from './taskCostModel.ts';
import { EXAMPLE_SCENARIO, type Scenario } from './taskCostScenario.ts';

export interface FormState {
  taskName: string;
  currentSeconds: number;
  improvedSeconds: number;
  executionsRaw: string;
  frequency: Frequency;
  hourlyRaw: string;
  workdaysRaw: string;
  weeksRaw: string;

  // Assumptions, all slider-driven.
  loadingMultiplier: number;
  adoptionPct: number;
  reworkPct: number;
  improvedReworkPct: number;
  realizationPct: number;
  uncertaintyPct: number;

  // Investment.
  buildCostRaw: string;
  monthlyCostRaw: string;
  rampMonths: number;
  horizonMonths: number;
}

export interface FormErrors {
  executions: string | null;
  hourly: string | null;
  workdays: string | null;
  weeks: string | null;
  buildCost: string | null;
  monthlyCost: string | null;
}

/** Drop the decimal point when a value is whole, so fields read "5" and not "5.0". */
function numText(value: number): string {
  return String(Math.round(value * 1000) / 1000);
}

export function toFormState(scenario: Scenario): FormState {
  return {
    taskName: scenario.taskName,
    currentSeconds: scenario.currentSeconds,
    improvedSeconds: scenario.improvedSeconds,
    executionsRaw: numText(scenario.executionsPerPeriod),
    frequency: scenario.frequency,
    hourlyRaw: scenario.hourlyCost === null ? '' : numText(scenario.hourlyCost),
    workdaysRaw: numText(scenario.schedule.workdaysPerWeek),
    weeksRaw: numText(scenario.schedule.workingWeeksPerYear),

    loadingMultiplier: scenario.assumptions.loadingMultiplier,
    adoptionPct: scenario.assumptions.adoptionPct,
    reworkPct: scenario.assumptions.reworkPct,
    improvedReworkPct: scenario.assumptions.improvedReworkPct,
    realizationPct: scenario.assumptions.realizationPct,
    uncertaintyPct: scenario.assumptions.uncertaintyPct,

    buildCostRaw: scenario.investment.buildCost === 0 ? '' : numText(scenario.investment.buildCost),
    monthlyCostRaw:
      scenario.investment.monthlyCost === 0 ? '' : numText(scenario.investment.monthlyCost),
    rampMonths: scenario.investment.rampMonths,
    horizonMonths: scenario.investment.horizonMonths,
  };
}

export const EXAMPLE_FORM: FormState = toFormState(EXAMPLE_SCENARIO);

export function resolveForm(form: FormState): { scenario: Scenario; errors: FormErrors } {
  const executions = parseRange(form.executionsRaw, { min: 0, allowEmpty: true, emptyValue: 0 });
  const workdays = parseRange(form.workdaysRaw, {
    min: 1,
    max: 7,
    fallback: DEFAULT_SCHEDULE.workdaysPerWeek,
  });
  const weeks = parseRange(form.weeksRaw, {
    min: 0,
    minExclusive: true,
    max: 52,
    fallback: DEFAULT_SCHEDULE.workingWeeksPerYear,
  });
  const hourly = parseHourly(form.hourlyRaw);
  const buildCost = parseRange(form.buildCostRaw, { min: 0, allowEmpty: true, emptyValue: 0 });
  const monthlyCost = parseRange(form.monthlyCostRaw, { min: 0, allowEmpty: true, emptyValue: 0 });

  return {
    scenario: {
      taskName: form.taskName,
      currentSeconds: form.currentSeconds,
      improvedSeconds: form.improvedSeconds,
      executionsPerPeriod: executions.value,
      frequency: form.frequency,
      hourlyCost: hourly.value,
      schedule: {
        workdaysPerWeek: workdays.value,
        workingWeeksPerYear: weeks.value,
      },
      assumptions: {
        adoptionPct: form.adoptionPct,
        reworkPct: form.reworkPct,
        improvedReworkPct: form.improvedReworkPct,
        loadingMultiplier: form.loadingMultiplier,
        realizationPct: form.realizationPct,
        uncertaintyPct: form.uncertaintyPct,
      },
      investment: {
        buildCost: buildCost.value,
        monthlyCost: monthlyCost.value,
        rampMonths: form.rampMonths,
        horizonMonths: form.horizonMonths,
      },
      period: 'year',
    },
    errors: {
      executions: executions.error,
      hourly: hourly.error,
      workdays: workdays.error,
      weeks: weeks.error,
      buildCost: buildCost.error,
      monthlyCost: monthlyCost.error,
    },
  };
}
