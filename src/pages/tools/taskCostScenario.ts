/**
 * A `Scenario` is everything the calculator needs to reproduce a result, in model terms
 * (numbers, not the raw strings the form fields hold). It is the unit that gets written to
 * the URL, copied to the clipboard, and exported as CSV, so it lives apart from both the
 * React form state and the math.
 */

import {
  DEFAULT_ASSUMPTIONS,
  DEFAULT_INVESTMENT,
  DEFAULT_SCHEDULE,
  EXAMPLE_INPUTS,
  type Assumptions,
  type DisplayPeriod,
  type Frequency,
  type Investment,
  type TaskCostInputs,
  type WorkingSchedule,
} from './taskCostModel.ts';

export interface Scenario {
  /** Free-text name for the task, e.g. "Invoice processing". Optional, may be empty. */
  taskName: string;
  currentSeconds: number;
  improvedSeconds: number;
  executionsPerPeriod: number;
  frequency: Frequency;
  /** `null` means no hourly cost supplied, so monetary results are omitted. */
  hourlyCost: number | null;
  schedule: WorkingSchedule;
  assumptions: Assumptions;
  investment: Investment;
  /** Which period the results were being viewed in. Presentation, but worth sharing. */
  period: DisplayPeriod;
}

/** The scenario the page opens with, and which "Reset example" restores. */
export const EXAMPLE_SCENARIO: Scenario = {
  taskName: '',
  currentSeconds: EXAMPLE_INPUTS.currentSeconds,
  improvedSeconds: EXAMPLE_INPUTS.improvedSeconds,
  executionsPerPeriod: EXAMPLE_INPUTS.executionsPerPeriod,
  frequency: EXAMPLE_INPUTS.frequency,
  hourlyCost: null,
  schedule: { ...DEFAULT_SCHEDULE },
  assumptions: { ...DEFAULT_ASSUMPTIONS },
  investment: { ...DEFAULT_INVESTMENT },
  period: 'year',
};

/** Strip the presentation-only fields to get the model's input shape. */
export function toInputs(scenario: Scenario): TaskCostInputs {
  return {
    currentSeconds: scenario.currentSeconds,
    improvedSeconds: scenario.improvedSeconds,
    executionsPerPeriod: scenario.executionsPerPeriod,
    frequency: scenario.frequency,
    schedule: scenario.schedule,
    hourlyCost: scenario.hourlyCost,
    assumptions: scenario.assumptions,
    investment: scenario.investment,
  };
}

/** True when every assumption is still at its shipped default. */
export function assumptionsAreDefault(a: Assumptions): boolean {
  return (
    a.adoptionPct === DEFAULT_ASSUMPTIONS.adoptionPct &&
    a.reworkPct === DEFAULT_ASSUMPTIONS.reworkPct &&
    a.improvedReworkPct === DEFAULT_ASSUMPTIONS.improvedReworkPct &&
    a.loadingMultiplier === DEFAULT_ASSUMPTIONS.loadingMultiplier &&
    a.realizationPct === DEFAULT_ASSUMPTIONS.realizationPct
  );
}

/** True when no money has been put behind the fix yet. */
export function investmentIsEmpty(i: Investment): boolean {
  return i.buildCost <= 0 && i.monthlyCost <= 0;
}
