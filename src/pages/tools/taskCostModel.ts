/**
 * Pure calculation model for the Repetitive Task Cost Visualizer.
 *
 * One question: if a repetitive task gets faster, how much team time comes back?
 * Everything here is plain numbers in, plain numbers out - no React, no formatting,
 * no side effects - so it can be unit-tested in isolation (see `tests/taskCostModel.test.ts`).
 *
 * Durations are handled in whole seconds internally. Full precision is kept throughout;
 * rounding is a display concern only (see `taskCostFormat.ts`).
 */

export type Frequency = 'workday' | 'week' | 'month';

/** Which period the results are shown for. Monthly figures are annual totals / 12. */
export type DisplayPeriod = 'year' | 'month';

export interface WorkingSchedule {
  /** Days worked per week. Sensible range 1-7. Fractions allowed (e.g. 4.5). */
  workdaysPerWeek: number;
  /** Weeks worked per year. Sensible range greater than 0, up to 52. Fractions allowed. */
  workingWeeksPerYear: number;
}

export interface TaskCostInputs {
  /** Time to run the task once today, in seconds. Negatives / NaN are treated as 0. */
  currentSeconds: number;
  /** Estimated time to run the task once after improvement, in seconds. A user estimate. */
  improvedSeconds: number;
  /** Total runs across the whole team, per `frequency` period. Fractions allowed (e.g. 0.5 / week). */
  executionsPerPeriod: number;
  frequency: Frequency;
  schedule: WorkingSchedule;
  /**
   * Hourly labor cost. `null` means "not supplied" - monetary results are omitted entirely.
   * An explicit `0` is a valid value and still produces (zero) monetary results.
   */
  hourlyCost: number | null;
}

export interface TaskCostResults {
  /** Task runs per year, derived from `executionsPerPeriod`, `frequency` and `schedule`. */
  annualExecutions: number;
  /** Labor hours per year spent on the task at the current time. */
  currentAnnualHours: number;
  /** Labor hours per year at the improved time. */
  improvedAnnualHours: number;
  /**
   * `currentAnnualHours - improvedAnnualHours`.
   * Positive = hours recovered. Negative = extra hours required (improved time is slower).
   */
  annualHoursDelta: number;
  /** `annualHoursDelta / 8` - the delta expressed in eight-hour workdays. */
  annualEightHourDays: number;
  /** `annualHoursDelta * hourlyCost`, or `null` when `hourlyCost` is `null`. */
  annualValueDelta: number | null;
  /** True when the improved estimate is slower than the current time. */
  isIncrease: boolean;
}

const SECONDS_PER_HOUR = 3600;
const MONTHS_PER_YEAR = 12;
const HOURS_PER_WORKDAY = 8;

export const DEFAULT_SCHEDULE: WorkingSchedule = {
  workdaysPerWeek: 5,
  workingWeeksPerYear: 50,
};

/**
 * The illustrative scenario the page loads with, and which "Reset example" restores:
 * a 5-minute task cut to 30 seconds, run 10 times per workday, 5 days a week, 50 weeks a year.
 */
export const EXAMPLE_INPUTS: TaskCostInputs = {
  currentSeconds: 5 * 60,
  improvedSeconds: 30,
  executionsPerPeriod: 10,
  frequency: 'workday',
  schedule: { ...DEFAULT_SCHEDULE },
  hourlyCost: null,
};

/** A finite, non-negative number, or `fallback` (default 0) for anything else. */
function nonNegative(value: number, fallback = 0): number {
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

/**
 * Task runs per year.
 *   workday: executions x workdays/week x weeks/year
 *   week:    executions x weeks/year
 *   month:   executions x 12  (independent of the working schedule)
 */
export function annualExecutions(
  executionsPerPeriod: number,
  frequency: Frequency,
  schedule: WorkingSchedule,
): number {
  const execs = nonNegative(executionsPerPeriod);
  if (execs === 0) return 0;

  if (frequency === 'month') {
    return execs * MONTHS_PER_YEAR;
  }

  const weeksPerYear = nonNegative(schedule.workingWeeksPerYear);
  if (frequency === 'week') {
    return execs * weeksPerYear;
  }

  // 'workday'
  const daysPerWeek = nonNegative(schedule.workdaysPerWeek);
  return execs * daysPerWeek * weeksPerYear;
}

export function calculateTaskCost(inputs: TaskCostInputs): TaskCostResults {
  const currentSeconds = nonNegative(inputs.currentSeconds);
  const improvedSeconds = nonNegative(inputs.improvedSeconds);

  const execs = annualExecutions(inputs.executionsPerPeriod, inputs.frequency, inputs.schedule);

  const currentAnnualHours = (currentSeconds * execs) / SECONDS_PER_HOUR;
  const improvedAnnualHours = (improvedSeconds * execs) / SECONDS_PER_HOUR;
  const annualHoursDelta = currentAnnualHours - improvedAnnualHours;
  const annualEightHourDays = annualHoursDelta / HOURS_PER_WORKDAY;

  const hasCost =
    inputs.hourlyCost !== null && Number.isFinite(inputs.hourlyCost) && inputs.hourlyCost >= 0;
  const annualValueDelta = hasCost ? annualHoursDelta * (inputs.hourlyCost as number) : null;

  return {
    annualExecutions: execs,
    currentAnnualHours,
    improvedAnnualHours,
    annualHoursDelta,
    annualEightHourDays,
    annualValueDelta,
    isIncrease: improvedSeconds > currentSeconds,
  };
}

/**
 * Scale an annual figure to the chosen display period.
 * Monthly = annual / 12, i.e. a monthly average across the year.
 */
export function forPeriod(annualValue: number, period: DisplayPeriod): number {
  return period === 'month' ? annualValue / MONTHS_PER_YEAR : annualValue;
}

export { SECONDS_PER_HOUR, MONTHS_PER_YEAR, HOURS_PER_WORKDAY };
