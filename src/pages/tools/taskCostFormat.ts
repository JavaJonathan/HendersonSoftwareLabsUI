/**
 * Display formatting for the task-cost tool. Kept apart from `taskCostModel.ts` so the
 * math stays pure and string/locale concerns live in one place.
 *
 * Guiding rule from the spec: round only for display, and never let a small but non-zero
 * result render as a flat "0".
 */

import type { DisplayPeriod, Frequency } from './taskCostModel.ts';

/** Decimals to show for an hours/days figure, scaled to its magnitude. */
function decimalsFor(abs: number): number {
  if (abs === 0) return 0;
  if (abs >= 100) return 1;
  if (abs >= 1) return 1;
  if (abs >= 0.1) return 2;
  return 3;
}

/**
 * Format a number of hours (or eight-hour days) for display.
 * Whole numbers show with no decimals; small non-zero values keep enough precision to
 * stay visibly non-zero, falling back to "< 0.01" only when they truly round away.
 */
export function formatQuantity(value: number): string {
  if (!Number.isFinite(value)) return '0';
  if (value === 0) return '0';
  if (Number.isInteger(value)) return value.toLocaleString('en-US');

  const abs = Math.abs(value);
  for (let decimals = decimalsFor(abs); decimals <= 6; decimals += 1) {
    const text = value.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    if (Number(text.replace(/,/g, '')) !== 0) return text;
  }
  return value > 0 ? '< 0.01' : '> -0.01';
}

/** Format a monetary amount. Cents are shown only for amounts under $100. */
export function formatMoney(value: number): string {
  if (!Number.isFinite(value)) return '$0';
  const abs = Math.abs(value);
  const decimals = abs !== 0 && abs < 100 ? 2 : 0;
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * A short money label for chart axes and tight chips: "$0", "$8.5k", "$1.2M".
 * Loses precision on purpose - the exact figure is always available elsewhere.
 */
export function formatMoneyCompact(value: number): string {
  if (!Number.isFinite(value) || value === 0) return '$0';
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  if (abs >= 1000000) return `${sign}$${trimZero(abs / 1000000)}M`;
  if (abs >= 1000) return `${sign}$${trimZero(abs / 1000)}k`;
  return `${sign}$${Math.round(abs).toLocaleString('en-US')}`;
}

/** One decimal place, with a trailing ".0" removed. */
function trimZero(value: number): string {
  const text = value.toFixed(1);
  return text.endsWith('.0') ? text.slice(0, -2) : text;
}

/** Format a count of task runs (may be fractional, e.g. 0.5 per week). */
export function formatCount(value: number): string {
  if (!Number.isFinite(value)) return '0';
  return value.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

/** "62%" - a 0-1 fraction as a whole-number percentage. */
export function formatPercent(fraction: number, decimals = 0): string {
  if (!Number.isFinite(fraction)) return '0%';
  return `${(fraction * 100).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}%`;
}

/**
 * "7 months", "1 month", "2 yrs 3 mo" - a payback period in the unit that reads best.
 * Anything under a month is reported as "under a month" rather than a misleading "0".
 */
export function formatMonths(months: number): string {
  if (!Number.isFinite(months) || months <= 0) return 'immediately';
  if (months < 1) return 'under a month';
  const whole = Math.round(months);
  if (whole < 12) return `${whole} ${whole === 1 ? 'month' : 'months'}`;
  const years = Math.floor(whole / 12);
  const rest = whole % 12;
  const yearPart = `${years} ${years === 1 ? 'yr' : 'yrs'}`;
  return rest === 0 ? yearPart : `${yearPart} ${rest} mo`;
}

/** "5m 00s", "30s", "1h 05m 00s" - a duration in seconds, spelled out compactly. */
export function formatDuration(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return '0s';
  const rounded = Math.round(totalSeconds);
  const hours = Math.floor(rounded / 3600);
  const minutes = Math.floor((rounded % 3600) / 60);
  const seconds = rounded % 60;

  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (hours > 0 || minutes > 0) {
    parts.push(hours > 0 ? `${minutes.toString().padStart(2, '0')}m` : `${minutes}m`);
    parts.push(`${seconds.toString().padStart(2, '0')}s`);
  } else {
    parts.push(`${seconds}s`);
  }
  return parts.join(' ');
}

const PERIOD_NOUN: Record<DisplayPeriod, string> = { year: 'year', month: 'month' };
const PERIOD_SUFFIX: Record<DisplayPeriod, string> = { year: '/yr', month: '/mo' };

export function periodNoun(period: DisplayPeriod): string {
  return PERIOD_NOUN[period];
}

/** "per year" / "per month (avg)" - the monthly form flags that it is an average. */
export function perPeriodLabel(period: DisplayPeriod): string {
  return period === 'month' ? 'per month (avg)' : 'per year';
}

export function hoursUnit(period: DisplayPeriod): string {
  return `hrs${PERIOD_SUFFIX[period]}`;
}

export function moneyUnit(period: DisplayPeriod): string {
  return PERIOD_SUFFIX[period];
}

const FREQUENCY_PHRASE: Record<Frequency, string> = {
  workday: 'per workday',
  week: 'per week',
  month: 'per month',
};

export function frequencyPhrase(frequency: Frequency): string {
  return FREQUENCY_PHRASE[frequency];
}
