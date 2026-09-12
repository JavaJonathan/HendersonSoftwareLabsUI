/**
 * Scenario <-> query string. The whole point of the tool is that a result can be sent to
 * someone else, so the URL is the save file: no account, no server, no storage.
 *
 * Two rules keep the links short and durable:
 *   1. Only values that differ from the default are written, so an untouched field costs
 *      nothing and a shared link stays readable.
 *   2. Decoding never trusts what it reads. Every value is clamped into a sane range, and
 *      anything unparseable falls back to the default rather than failing the whole parse.
 */

import {
  clamp,
  DEFAULT_ASSUMPTIONS,
  DEFAULT_INVESTMENT,
  DEFAULT_SCHEDULE,
  type DisplayPeriod,
  type Frequency,
} from './taskCostModel.ts';
import { EXAMPLE_SCENARIO, type Scenario } from './taskCostScenario.ts';

const FREQ_TO_CODE: Record<Frequency, string> = { workday: 'd', week: 'w', month: 'm' };
const CODE_TO_FREQ: Record<string, Frequency> = { d: 'workday', w: 'week', m: 'month' };

/** Longest task name we will round-trip. Keeps a hand-edited URL from getting silly. */
const MAX_NAME = 60;

/** Trim trailing zeros so 30 encodes as "30", not "30.0000". */
function num(value: number): string {
  return String(Math.round(value * 10000) / 10000);
}

export function encodeScenario(scenario: Scenario): string {
  const params = new URLSearchParams();
  const put = (key: string, value: number, fallback: number) => {
    if (Math.abs(value - fallback) > 1e-9) params.set(key, num(value));
  };

  const name = scenario.taskName.trim().slice(0, MAX_NAME);
  if (name) params.set('t', name);

  put('c', scenario.currentSeconds, EXAMPLE_SCENARIO.currentSeconds);
  put('i', scenario.improvedSeconds, EXAMPLE_SCENARIO.improvedSeconds);
  put('n', scenario.executionsPerPeriod, EXAMPLE_SCENARIO.executionsPerPeriod);
  if (scenario.frequency !== EXAMPLE_SCENARIO.frequency) {
    params.set('f', FREQ_TO_CODE[scenario.frequency]);
  }
  if (scenario.hourlyCost !== null) params.set('r', num(scenario.hourlyCost));

  put('wd', scenario.schedule.workdaysPerWeek, DEFAULT_SCHEDULE.workdaysPerWeek);
  put('wk', scenario.schedule.workingWeeksPerYear, DEFAULT_SCHEDULE.workingWeeksPerYear);

  const a = scenario.assumptions;
  put('ad', a.adoptionPct, DEFAULT_ASSUMPTIONS.adoptionPct);
  put('rw', a.reworkPct, DEFAULT_ASSUMPTIONS.reworkPct);
  put('rw2', a.improvedReworkPct, DEFAULT_ASSUMPTIONS.improvedReworkPct);
  put('ld', a.loadingMultiplier, DEFAULT_ASSUMPTIONS.loadingMultiplier);
  put('rz', a.realizationPct, DEFAULT_ASSUMPTIONS.realizationPct);
  put('un', a.uncertaintyPct, DEFAULT_ASSUMPTIONS.uncertaintyPct);

  const v = scenario.investment;
  put('bc', v.buildCost, DEFAULT_INVESTMENT.buildCost);
  put('mc', v.monthlyCost, DEFAULT_INVESTMENT.monthlyCost);
  put('rm', v.rampMonths, DEFAULT_INVESTMENT.rampMonths);
  put('hz', v.horizonMonths, DEFAULT_INVESTMENT.horizonMonths);

  if (scenario.period !== EXAMPLE_SCENARIO.period) params.set('p', 'm');

  return params.toString();
}

/**
 * Read a scenario out of a query string, falling back to the example for anything missing
 * or malformed. Always returns a usable scenario, never throws.
 */
export function decodeScenario(search: string): Scenario {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);

  /** A clamped number from the URL, or `fallback` when absent / unparseable. */
  const read = (key: string, min: number, max: number, fallback: number): number => {
    const raw = params.get(key);
    if (raw === null || raw.trim() === '') return fallback;
    const n = Number(raw);
    return Number.isFinite(n) ? clamp(n, min, max, fallback) : fallback;
  };

  const freqCode = params.get('f');
  const frequency: Frequency =
    freqCode !== null && freqCode in CODE_TO_FREQ
      ? CODE_TO_FREQ[freqCode]
      : EXAMPLE_SCENARIO.frequency;

  const hourlyRaw = params.get('r');
  const hourlyParsed = hourlyRaw === null ? null : Number(hourlyRaw);
  const hourlyCost =
    hourlyParsed !== null && Number.isFinite(hourlyParsed)
      ? clamp(hourlyParsed, 0, 100000, 0)
      : null;

  const period: DisplayPeriod = params.get('p') === 'm' ? 'month' : 'year';

  return {
    taskName: (params.get('t') ?? '').slice(0, MAX_NAME),
    // 24 hours is the ceiling for a single run of a "repetitive task".
    currentSeconds: Math.round(read('c', 0, 86400, EXAMPLE_SCENARIO.currentSeconds)),
    improvedSeconds: Math.round(read('i', 0, 86400, EXAMPLE_SCENARIO.improvedSeconds)),
    executionsPerPeriod: read('n', 0, 1000000, EXAMPLE_SCENARIO.executionsPerPeriod),
    frequency,
    hourlyCost,
    schedule: {
      workdaysPerWeek: read('wd', 1, 7, DEFAULT_SCHEDULE.workdaysPerWeek),
      workingWeeksPerYear: read('wk', 0.1, 52, DEFAULT_SCHEDULE.workingWeeksPerYear),
    },
    assumptions: {
      adoptionPct: read('ad', 0, 100, DEFAULT_ASSUMPTIONS.adoptionPct),
      reworkPct: read('rw', 0, 100, DEFAULT_ASSUMPTIONS.reworkPct),
      improvedReworkPct: read('rw2', 0, 100, DEFAULT_ASSUMPTIONS.improvedReworkPct),
      loadingMultiplier: read('ld', 1, 3, DEFAULT_ASSUMPTIONS.loadingMultiplier),
      realizationPct: read('rz', 0, 100, DEFAULT_ASSUMPTIONS.realizationPct),
      uncertaintyPct: read('un', 0, 100, DEFAULT_ASSUMPTIONS.uncertaintyPct),
    },
    investment: {
      buildCost: read('bc', 0, 10000000, DEFAULT_INVESTMENT.buildCost),
      monthlyCost: read('mc', 0, 1000000, DEFAULT_INVESTMENT.monthlyCost),
      rampMonths: Math.round(read('rm', 0, 36, DEFAULT_INVESTMENT.rampMonths)),
      horizonMonths: Math.round(read('hz', 1, 120, DEFAULT_INVESTMENT.horizonMonths)),
    },
    period,
  };
}

/** True when the query string carries at least one field this tool recognises. */
export function hasScenarioParams(search: string): boolean {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  const known = [
    't', 'c', 'i', 'n', 'f', 'r', 'wd', 'wk',
    'ad', 'rw', 'rw2', 'ld', 'rz', 'un',
    'bc', 'mc', 'rm', 'hz', 'p',
  ];
  return known.some((key) => params.has(key));
}
