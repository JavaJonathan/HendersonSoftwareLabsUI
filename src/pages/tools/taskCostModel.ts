/**
 * Pure calculation model for the Repetitive Task Cost Calculator.
 *
 * One question: if a repetitive task gets faster, how much team time comes back, what is
 * that worth, and how long does the fix take to pay for itself?
 *
 * Everything here is plain numbers in, plain numbers out - no React, no formatting, no side
 * effects - so it can be unit-tested in isolation (see `tests/taskCostModel.test.ts`).
 *
 * Durations are handled in whole seconds internally. Full precision is kept throughout;
 * rounding is a display concern only (see `taskCostFormat.ts`).
 *
 * Design rule for every assumption below: at its default value it must be a no-op, so the
 * simple four-field version of the tool produces exactly the naive `time x runs` answer and
 * the advanced panel only ever makes the estimate more specific.
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

/**
 * The judgement calls behind the headline number. Every one of these defaults to a value
 * that changes nothing, so they are safe to ignore and meaningful to tune.
 */
export interface Assumptions {
  /**
   * Share of runs that actually move to the improved way, 0-100. Rarely 100 in practice:
   * exceptions, holdouts and edge cases keep running the old way.
   */
  adoptionPct: number;
  /** Share of runs today that have to be redone because something went wrong, 0-100. */
  reworkPct: number;
  /** Share of runs after the change that have to be redone, 0-100. */
  improvedReworkPct: number;
  /**
   * Multiplier turning a wage into a fully loaded cost (employer taxes, benefits, equipment,
   * overhead). 1 = wage only. 1.25-1.4 is the usual range for a salaried employee.
   */
  loadingMultiplier: number;
  /**
   * Share of recovered time that turns into other useful work, 0-100. Applied to money only,
   * never to the hours figure: an hour saved is an hour saved, but five minutes handed back
   * eleven times a day is harder to bank than one uninterrupted hour.
   */
  realizationPct: number;
  /** Plus/minus band applied to the saving, as a percent of it, 0-100. */
  uncertaintyPct: number;
}

/** What the fix costs and how quickly it lands. Drives payback, ROI and the projection. */
export interface Investment {
  /** One-time cost to build or buy the improvement. */
  buildCost: number;
  /** Recurring monthly cost to run it (licences, hosting, maintenance). */
  monthlyCost: number;
  /**
   * Months before the improvement is fully in use. The benefit ramps in linearly across
   * them: with `rampMonths` 3, month 1 delivers a third of the saving, month 3 all of it.
   */
  rampMonths: number;
  /** How many months the projection covers. */
  horizonMonths: number;
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
  assumptions: Assumptions;
  investment: Investment;
}

/** A low / expected / high triple. `low` is always the smaller of the two bounds. */
export interface Range {
  low: number;
  expected: number;
  high: number;
}

export interface TaskCostResults {
  /** Task runs per year, derived from `executionsPerPeriod`, `frequency` and `schedule`. */
  annualExecutions: number;
  /** Runs per year that move to the improved way, after the adoption assumption. */
  adoptedExecutions: number;
  /** Labor hours per year spent on the task at the current time, including rework. */
  currentAnnualHours: number;
  /** Labor hours per year after the change, blending adopted and not-yet-adopted runs. */
  improvedAnnualHours: number;
  /**
   * `currentAnnualHours - improvedAnnualHours`.
   * Positive = hours recovered. Negative = extra hours required (improved time is slower).
   */
  annualHoursDelta: number;
  /** `annualHoursDelta` widened by the uncertainty assumption. */
  annualHoursRange: Range;
  /** `annualHoursDelta / 8` - the delta expressed in eight-hour workdays. */
  annualEightHourDays: number;
  /**
   * Annual money value of the delta, or `null` when `hourlyCost` is `null`.
   * `hours x realization x hourlyCost x loadingMultiplier`.
   */
  annualValueDelta: number | null;
  /** `annualValueDelta` widened by the uncertainty assumption, or `null`. */
  annualValueRange: Range | null;
  /** The hourly figure actually used for money: `hourlyCost x loadingMultiplier`. */
  effectiveHourlyCost: number | null;
  /** True when the blended improved time is slower than the current time. */
  isIncrease: boolean;
  /**
   * Share of the task's current time removed, 0-1. The headline percentage, and the one
   * figure that is comparable across tasks of wildly different sizes.
   */
  reductionFraction: number;
}

/** One month of the payback projection. Month 0 is the day the money is spent. */
export interface ProjectionPoint {
  /** 0 for the initial outlay, then 1..horizonMonths. */
  month: number;
  /** Share of the full benefit active this month, 0-1 (the ramp). */
  rampFactor: number;
  /** Gross value recovered this month, before running costs. */
  grossValue: number;
  /** `grossValue - monthlyCost`. */
  netValue: number;
  /** Running total, starting at `-buildCost`. */
  cumulative: number;
}

export interface Projection {
  points: ProjectionPoint[];
  /**
   * First whole month where the running total reaches zero, or `null` if it never does
   * inside the horizon. Month 1 means "inside the first month".
   */
  breakEvenMonth: number | null;
  /** Fractional month of the crossover, for placing a marker on the chart. */
  breakEvenMonthExact: number | null;
  /** Running total at the end of the horizon. */
  netAtHorizon: number;
  /** Running total at month 12, or at the horizon when it is shorter. */
  firstYearNet: number;
  /** Total gross value recovered across the horizon. */
  totalBenefit: number;
  /** `buildCost + monthlyCost x horizonMonths`. */
  totalCost: number;
  /** `(totalBenefit - totalCost) / totalCost`, or `null` when nothing is spent. */
  roi: number | null;
  /**
   * The largest one-time spend that would still break even within 12 months, given the
   * running cost and ramp. Answers "what is this worth paying for?" when no build cost is
   * known yet. `null` when the task does not come out ahead even before any build cost.
   */
  twelveMonthBudget: number | null;
}

/** One bar of the sensitivity (tornado) chart. */
export interface SensitivityEntry {
  /** Short label for the driver being varied, e.g. "How often it runs". */
  label: string;
  /** How it was varied, e.g. "-25% / +25%" - shown so the chart explains itself. */
  note: string;
  /** Result with the driver at its low end. */
  low: number;
  /** Result with the driver at its high end. */
  high: number;
  /** `Math.abs(high - low)` - bars are sorted by this, widest first. */
  swing: number;
}

const SECONDS_PER_HOUR = 3600;
const MONTHS_PER_YEAR = 12;
const HOURS_PER_WORKDAY = 8;

export const DEFAULT_SCHEDULE: WorkingSchedule = {
  workdaysPerWeek: 5,
  workingWeeksPerYear: 50,
};

/** Every assumption at its no-op value, apart from the uncertainty band. */
export const DEFAULT_ASSUMPTIONS: Assumptions = {
  adoptionPct: 100,
  reworkPct: 0,
  improvedReworkPct: 0,
  loadingMultiplier: 1,
  realizationPct: 100,
  uncertaintyPct: 25,
};

export const DEFAULT_INVESTMENT: Investment = {
  buildCost: 0,
  monthlyCost: 0,
  rampMonths: 1,
  horizonMonths: 36,
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
  assumptions: { ...DEFAULT_ASSUMPTIONS },
  investment: { ...DEFAULT_INVESTMENT },
};

/** A finite, non-negative number, or `fallback` (default 0) for anything else. */
function nonNegative(value: number, fallback = 0): number {
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

/** Clamp to a range, mapping NaN / Infinity to `fallback`. */
export function clamp(value: number, min: number, max: number, fallback = min): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}

/** A percentage 0-100 expressed as a 0-1 share. Anything invalid falls back to `fallback`. */
function share(pct: number, fallback = 1): number {
  if (!Number.isFinite(pct)) return fallback;
  return clamp(pct, 0, 100, fallback * 100) / 100;
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

/** Widen a signed value by `pct` percent, keeping `low` as the smaller bound. */
function toRange(expected: number, pct: number): Range {
  const band = Math.abs(expected) * share(pct, 0);
  return { low: expected - band, expected, high: expected + band };
}

export function calculateTaskCost(inputs: TaskCostInputs): TaskCostResults {
  const currentSeconds = nonNegative(inputs.currentSeconds);
  const improvedSeconds = nonNegative(inputs.improvedSeconds);
  const a = inputs.assumptions ?? DEFAULT_ASSUMPTIONS;

  const execs = annualExecutions(inputs.executionsPerPeriod, inputs.frequency, inputs.schedule);
  const adoption = share(a.adoptionPct);
  const adoptedExecutions = execs * adoption;

  // Rework means the task gets done again, so it multiplies the time each run really takes.
  const currentPerRun = currentSeconds * (1 + share(a.reworkPct, 0));
  const improvedPerRun = improvedSeconds * (1 + share(a.improvedReworkPct, 0));

  // Runs that have not adopted the change still cost the current time.
  const blendedPerRun = improvedPerRun * adoption + currentPerRun * (1 - adoption);

  const currentAnnualHours = (currentPerRun * execs) / SECONDS_PER_HOUR;
  const improvedAnnualHours = (blendedPerRun * execs) / SECONDS_PER_HOUR;
  const annualHoursDelta = currentAnnualHours - improvedAnnualHours;
  const annualEightHourDays = annualHoursDelta / HOURS_PER_WORKDAY;

  const hasCost =
    inputs.hourlyCost !== null && Number.isFinite(inputs.hourlyCost) && inputs.hourlyCost >= 0;
  const loading = Number.isFinite(a.loadingMultiplier) ? Math.max(0, a.loadingMultiplier) : 1;
  const effectiveHourlyCost = hasCost ? (inputs.hourlyCost as number) * loading : null;
  const annualValueDelta =
    effectiveHourlyCost === null
      ? null
      : annualHoursDelta * share(a.realizationPct) * effectiveHourlyCost;

  return {
    annualExecutions: execs,
    adoptedExecutions,
    currentAnnualHours,
    improvedAnnualHours,
    annualHoursDelta,
    annualHoursRange: toRange(annualHoursDelta, a.uncertaintyPct),
    annualEightHourDays,
    annualValueDelta,
    annualValueRange:
      annualValueDelta === null ? null : toRange(annualValueDelta, a.uncertaintyPct),
    effectiveHourlyCost,
    isIncrease: blendedPerRun > currentPerRun,
    reductionFraction: currentAnnualHours > 0 ? annualHoursDelta / currentAnnualHours : 0,
  };
}

/** Share of the full benefit active in a given month, under a linear ramp. */
function rampFactorFor(month: number, rampMonths: number): number {
  return rampMonths <= 1 ? 1 : Math.min(1, month / rampMonths);
}

/**
 * Month-by-month cash position, starting from `-buildCost` and adding the net value each
 * month once the ramp is applied. Returns `null` when there is no money figure to project.
 */
export function projectCashflow(
  results: TaskCostResults,
  investment: Investment,
): Projection | null {
  if (results.annualValueDelta === null) return null;

  const horizon = Math.round(clamp(investment.horizonMonths, 1, 120, 36));
  const ramp = Math.round(clamp(investment.rampMonths, 0, 36, 1));
  const buildCost = nonNegative(investment.buildCost);
  const monthlyCost = nonNegative(investment.monthlyCost);
  const monthlyGross = results.annualValueDelta / MONTHS_PER_YEAR;

  const points: ProjectionPoint[] = [
    { month: 0, rampFactor: 0, grossValue: 0, netValue: -buildCost, cumulative: -buildCost },
  ];

  let cumulative = -buildCost;
  let totalBenefit = 0;
  let breakEvenMonth: number | null = null;
  let breakEvenMonthExact: number | null = null;
  let firstYearNet = -buildCost;

  for (let month = 1; month <= horizon; month += 1) {
    const rampFactor = rampFactorFor(month, ramp);
    const grossValue = monthlyGross * rampFactor;
    const netValue = grossValue - monthlyCost;
    const previous = cumulative;
    cumulative += netValue;
    totalBenefit += grossValue;

    if (breakEvenMonth === null && previous < 0 && cumulative >= 0) {
      breakEvenMonth = month;
      // Straight-line interpolation inside the month that crosses zero.
      breakEvenMonthExact = netValue === 0 ? month : month - 1 + -previous / netValue;
    }

    if (month <= MONTHS_PER_YEAR) firstYearNet = cumulative;

    points.push({ month, rampFactor, grossValue, netValue, cumulative });
  }

  // Nothing was spent up front, so the very first profitable month is the break-even month.
  if (breakEvenMonth === null && buildCost === 0 && (points[1]?.cumulative ?? 0) > 0) {
    breakEvenMonth = 1;
    breakEvenMonthExact = 1;
  }

  const totalCost = buildCost + monthlyCost * horizon;

  // What could you afford to spend up front and still be square within a year?
  const twelveMonthHorizon = Math.min(MONTHS_PER_YEAR, horizon);
  let twelveMonthNet = 0;
  for (let month = 1; month <= twelveMonthHorizon; month += 1) {
    twelveMonthNet += monthlyGross * rampFactorFor(month, ramp) - monthlyCost;
  }

  return {
    points,
    breakEvenMonth,
    breakEvenMonthExact,
    netAtHorizon: cumulative,
    firstYearNet,
    totalBenefit,
    totalCost,
    roi: totalCost > 0 ? (totalBenefit - totalCost) / totalCost : null,
    twelveMonthBudget: twelveMonthNet > 0 ? twelveMonthNet : null,
  };
}

/**
 * How much the answer moves when one input at a time is varied over a plausible range,
 * everything else held still. Sorted widest swing first, so the top bar is the assumption
 * worth spending five more minutes getting right.
 *
 * The measured figure is annual money when an hourly cost is supplied, annual hours when
 * it is not.
 */
export function sensitivity(inputs: TaskCostInputs): SensitivityEntry[] {
  const base = calculateTaskCost(inputs);
  const useMoney = base.annualValueDelta !== null;
  const measure = (i: TaskCostInputs) => {
    const r = calculateTaskCost(i);
    return useMoney ? (r.annualValueDelta ?? 0) : r.annualHoursDelta;
  };

  const a = inputs.assumptions;
  const scale = (n: number, factor: number) => nonNegative(n) * factor;
  // Rounded before use, so the bar matches the range printed on its label exactly.
  const adoptionLow = Math.round(clamp(a.adoptionPct * 0.7, 0, 100, 70));

  const variants: { label: string; note: string; low: TaskCostInputs; high: TaskCostInputs }[] = [
    {
      label: 'Current time per run',
      note: '-25% / +25%',
      low: { ...inputs, currentSeconds: scale(inputs.currentSeconds, 0.75) },
      high: { ...inputs, currentSeconds: scale(inputs.currentSeconds, 1.25) },
    },
    {
      label: 'How often it runs',
      note: '-25% / +25%',
      low: { ...inputs, executionsPerPeriod: scale(inputs.executionsPerPeriod, 0.75) },
      high: { ...inputs, executionsPerPeriod: scale(inputs.executionsPerPeriod, 1.25) },
    },
    {
      label: 'Time after improvement',
      note: '2x slower / 2x faster',
      low: { ...inputs, improvedSeconds: scale(inputs.improvedSeconds, 2) },
      high: { ...inputs, improvedSeconds: scale(inputs.improvedSeconds, 0.5) },
    },
    {
      label: 'Adoption',
      note: `${adoptionLow}% / 100%`,
      low: { ...inputs, assumptions: { ...a, adoptionPct: adoptionLow } },
      high: { ...inputs, assumptions: { ...a, adoptionPct: 100 } },
    },
  ];

  if (useMoney) {
    variants.push({
      label: 'Hourly labor cost',
      note: '-20% / +20%',
      low: { ...inputs, hourlyCost: scale(inputs.hourlyCost ?? 0, 0.8) },
      high: { ...inputs, hourlyCost: scale(inputs.hourlyCost ?? 0, 1.2) },
    });
  }

  if (a.reworkPct > 0) {
    const reworkHigh = Math.round(clamp(a.reworkPct * 2, 0, 100, 0));
    variants.push({
      label: 'Rework today',
      note: `0% / ${reworkHigh}%`,
      low: { ...inputs, assumptions: { ...a, reworkPct: 0 } },
      high: { ...inputs, assumptions: { ...a, reworkPct: reworkHigh } },
    });
  }

  return variants
    .map((v) => {
      const low = measure(v.low);
      const high = measure(v.high);
      return { label: v.label, note: v.note, low, high, swing: Math.abs(high - low) };
    })
    .filter((entry) => entry.swing > 1e-9)
    .sort((x, y) => y.swing - x.swing);
}

/**
 * Scale an annual figure to the chosen display period.
 * Monthly = annual / 12, i.e. a monthly average across the year.
 */
export function forPeriod(annualValue: number, period: DisplayPeriod): number {
  return period === 'month' ? annualValue / MONTHS_PER_YEAR : annualValue;
}

export { SECONDS_PER_HOUR, MONTHS_PER_YEAR, HOURS_PER_WORKDAY };
