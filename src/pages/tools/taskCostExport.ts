/**
 * Turning a scenario into something you can paste into an email or open in a spreadsheet.
 *
 * This is the part a chat window cannot really do: a fixed, checkable artifact that carries
 * its own assumptions and a link back to the live version so the person receiving it can
 * disagree with a number and see what happens.
 */

import {
  formatCount,
  formatDuration,
  formatMoney,
  formatMonths,
  formatPercent,
  formatQuantity,
  frequencyPhrase,
} from './taskCostFormat.ts';
import type { Projection, TaskCostResults } from './taskCostModel.ts';
import type { Scenario } from './taskCostScenario.ts';

export interface ExportBundle {
  scenario: Scenario;
  results: TaskCostResults;
  projection: Projection | null;
  /** Absolute, shareable URL of the scenario. */
  shareUrl: string;
}

/** A filename-safe slug of the task name, for the downloaded CSV. */
export function slugify(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
  return slug || 'task-cost-estimate';
}

/**
 * A plain-text summary sized for a Slack message or the body of an email. Deliberately
 * leads with the caveat-free numbers and puts every assumption underneath, because that is
 * the order the person reading it will ask about them.
 */
export function buildSummaryText(bundle: ExportBundle): string {
  const { scenario, results, projection, shareUrl } = bundle;
  const a = scenario.assumptions;
  const title = scenario.taskName.trim() || 'Repetitive task';
  const lines: string[] = [];

  lines.push(`${title} - what the current way costs`);
  lines.push('');

  lines.push(
    `Today: ${formatDuration(scenario.currentSeconds)} per run, ` +
      `${formatCount(scenario.executionsPerPeriod)} runs ${frequencyPhrase(scenario.frequency)} ` +
      `(${formatCount(results.annualExecutions)} per year)`,
  );
  lines.push(`After the change: ${formatDuration(scenario.improvedSeconds)} per run`);
  lines.push('');

  if (results.isIncrease) {
    lines.push(
      `This would ADD ${formatQuantity(Math.abs(results.annualHoursDelta))} hours per year.`,
    );
  } else {
    lines.push(
      `Time recovered: ${formatQuantity(results.annualHoursDelta)} hours per year ` +
        `(${formatQuantity(results.annualEightHourDays)} eight-hour days, ` +
        `${formatPercent(results.reductionFraction)} of the task)`,
    );
    lines.push(
      `Confidence range: ${formatQuantity(results.annualHoursRange.low)} to ` +
        `${formatQuantity(results.annualHoursRange.high)} hours per year`,
    );
  }

  if (results.annualValueDelta !== null && results.annualValueRange !== null) {
    lines.push(
      `Value of that time: ${formatMoney(results.annualValueDelta)} per year ` +
        `(${formatMoney(results.annualValueRange.low)} to ${formatMoney(results.annualValueRange.high)})`,
    );
  }

  if (projection) {
    lines.push('');
    const horizon = scenario.investment.horizonMonths;
    if (scenario.investment.buildCost > 0 || scenario.investment.monthlyCost > 0) {
      lines.push(
        `Cost to fix: ${formatMoney(scenario.investment.buildCost)} up front` +
          (scenario.investment.monthlyCost > 0
            ? ` plus ${formatMoney(scenario.investment.monthlyCost)} per month`
            : ''),
      );
      lines.push(
        projection.breakEvenMonth === null
          ? `Break-even: not reached within ${horizon} months`
          : `Break-even: ${formatMonths(projection.breakEvenMonthExact ?? projection.breakEvenMonth)}`,
      );
      lines.push(`Net after ${horizon} months: ${formatMoney(projection.netAtHorizon)}`);
      if (projection.roi !== null) {
        lines.push(`Return on the spend: ${formatPercent(projection.roi)}`);
      }
    } else if (projection.twelveMonthBudget !== null) {
      lines.push(
        `A fix costing up to ${formatMoney(projection.twelveMonthBudget)} would pay for ` +
          'itself inside a year.',
      );
    }
  }

  lines.push('');
  lines.push('Assumptions');
  // A monthly rate always uses 12 months, and a weekly one ignores workdays per week.
  // Listing a setting the math did not touch invites an argument about the wrong number.
  if (scenario.frequency === 'workday') {
    lines.push(
      `- Working schedule: ${formatCount(scenario.schedule.workdaysPerWeek)} workdays/week, ` +
        `${formatCount(scenario.schedule.workingWeeksPerYear)} weeks/year`,
    );
  } else if (scenario.frequency === 'week') {
    lines.push(
      `- Working schedule: ${formatCount(scenario.schedule.workingWeeksPerYear)} weeks/year`,
    );
  }
  if (a.adoptionPct !== 100) lines.push(`- Adoption: ${formatCount(a.adoptionPct)}% of runs`);
  if (a.reworkPct > 0 || a.improvedReworkPct > 0) {
    lines.push(
      `- Rework: ${formatCount(a.reworkPct)}% of runs today, ` +
        `${formatCount(a.improvedReworkPct)}% after`,
    );
  }
  if (scenario.hourlyCost !== null) {
    lines.push(
      `- Labor cost: ${formatMoney(scenario.hourlyCost)}/hr` +
        (a.loadingMultiplier !== 1
          ? ` x ${a.loadingMultiplier} fully loaded = ${formatMoney(results.effectiveHourlyCost ?? 0)}/hr`
          : ''),
    );
  }
  if (a.realizationPct !== 100) {
    lines.push(`- Value realization: ${formatCount(a.realizationPct)}% of recovered time`);
  }
  lines.push(`- Confidence band: plus or minus ${formatCount(a.uncertaintyPct)}%`);
  lines.push(
    '- Recovered time is labor capacity, not guaranteed cash savings. It supports more work,',
  );
  lines.push('  faster service or less overtime rather than a smaller payroll.');

  lines.push('');
  lines.push('Run the numbers yourself, every assumption is editable:');
  lines.push(shareUrl);

  return lines.join('\n');
}

/** Wrap a CSV cell, escaping quotes and anything that would break a column. */
function cell(value: string | number): string {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function row(...values: (string | number)[]): string {
  return values.map(cell).join(',');
}

/**
 * A three-section CSV: the inputs that were entered, the results they produce, and the
 * month-by-month projection. Opens cleanly in Excel, Sheets and Numbers.
 */
export function buildCsv(bundle: ExportBundle): string {
  const { scenario, results, projection } = bundle;
  const a = scenario.assumptions;
  const v = scenario.investment;
  const rows: string[] = [];

  rows.push(row('Henderson Software Labs - repetitive task cost estimate'));
  rows.push(row('Task', scenario.taskName.trim() || 'Repetitive task'));
  rows.push(row('Generated', new Date().toISOString().slice(0, 10)));
  rows.push(row('Source', bundle.shareUrl));
  rows.push('');

  rows.push(row('Section', 'Item', 'Value', 'Unit'));
  rows.push(row('Input', 'Current time per run', scenario.currentSeconds, 'seconds'));
  rows.push(row('Input', 'Time per run after improvement', scenario.improvedSeconds, 'seconds'));
  rows.push(row('Input', 'Runs per period', scenario.executionsPerPeriod, scenario.frequency));
  rows.push(row('Input', 'Workdays per week', scenario.schedule.workdaysPerWeek, 'days'));
  rows.push(row('Input', 'Working weeks per year', scenario.schedule.workingWeeksPerYear, 'weeks'));
  rows.push(row('Input', 'Hourly labor cost', scenario.hourlyCost ?? '', 'USD/hr'));
  rows.push(row('Assumption', 'Adoption', a.adoptionPct, '%'));
  rows.push(row('Assumption', 'Rework today', a.reworkPct, '%'));
  rows.push(row('Assumption', 'Rework after improvement', a.improvedReworkPct, '%'));
  rows.push(row('Assumption', 'Fully loaded cost multiplier', a.loadingMultiplier, 'x'));
  rows.push(row('Assumption', 'Value realization', a.realizationPct, '%'));
  rows.push(row('Assumption', 'Confidence band', a.uncertaintyPct, '+/- %'));
  rows.push(row('Investment', 'One-time build cost', v.buildCost, 'USD'));
  rows.push(row('Investment', 'Running cost', v.monthlyCost, 'USD/month'));
  rows.push(row('Investment', 'Ramp to full use', v.rampMonths, 'months'));
  rows.push(row('Investment', 'Projection horizon', v.horizonMonths, 'months'));

  rows.push(row('Result', 'Runs per year', round(results.annualExecutions), 'runs'));
  rows.push(row('Result', 'Current time per year', round(results.currentAnnualHours), 'hours'));
  rows.push(row('Result', 'Time per year after', round(results.improvedAnnualHours), 'hours'));
  rows.push(row('Result', 'Hours recovered per year', round(results.annualHoursDelta), 'hours'));
  rows.push(row('Result', 'Low estimate', round(results.annualHoursRange.low), 'hours/yr'));
  rows.push(row('Result', 'High estimate', round(results.annualHoursRange.high), 'hours/yr'));
  rows.push(row('Result', 'In eight-hour days', round(results.annualEightHourDays), 'days/yr'));
  rows.push(row('Result', 'Share of the task removed', round(results.reductionFraction * 100), '%'));
  if (results.annualValueDelta !== null) {
    rows.push(row('Result', 'Value recovered per year', round(results.annualValueDelta), 'USD'));
  }
  if (projection) {
    rows.push(row('Result', 'Break-even month', projection.breakEvenMonth ?? 'not within horizon', ''));
    rows.push(row('Result', 'Net at horizon', round(projection.netAtHorizon), 'USD'));
    if (projection.roi !== null) {
      rows.push(row('Result', 'Return on spend', round(projection.roi * 100), '%'));
    }
  }

  if (projection) {
    rows.push('');
    rows.push(row('Month', 'Ramp', 'Gross value (USD)', 'Net value (USD)', 'Cumulative (USD)'));
    for (const point of projection.points) {
      rows.push(
        row(
          point.month,
          round(point.rampFactor, 3),
          round(point.grossValue),
          round(point.netValue),
          round(point.cumulative),
        ),
      );
    }
  }

  return rows.join('\n');
}

function round(value: number, decimals = 2): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}
