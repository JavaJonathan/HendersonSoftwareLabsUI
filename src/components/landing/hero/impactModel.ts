/**
 * "Hours saved" model - PLACEHOLDER until we have the real figure.
 *
 * When we do, `dailyHours` becomes the sum, across every live client, of
 *   (hours of manual work removed per employee per workday) × (employees affected).
 * `hoursSavedBase()` is then the honest running total, and it only moves once per calendar
 * workday. The hero adds a small cosmetic "and counting" drift on top while the page is
 * open; that resets on reload, so the persisted total never runs away between visits.
 */

export const IMPACT = {
  /** Running total, in hours, as of `since`. */
  base: 120,
  /** The date `base` was measured. */
  since: new Date(2026, 0, 1),
  /** Hours added to the total each Mon–Fri. */
  dailyHours: 8,
  /** Cadence, in seconds, of the cosmetic "and counting" tick while the page is open. */
  liveTickSeconds: 26,
  /** Workflows automated to date. */
  workflows: 8,
};

/** Whole weekdays (Mon–Fri) elapsed from `from` up to `to`. */
export function workdaysBetween(from: Date, to: Date): number {
  const d0 = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
  const d1 = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());
  const totalDays = Math.floor((d1 - d0) / 86_400_000);
  if (totalDays <= 0) return 0;

  const fullWeeks = Math.floor(totalDays / 7);
  let workdays = fullWeeks * 5;

  const startDow = new Date(d0).getUTCDay();
  for (let i = 1; i <= totalDays - fullWeeks * 7; i += 1) {
    const dow = (startDow + i) % 7;
    if (dow !== 0 && dow !== 6) workdays += 1;
  }
  return workdays;
}

/** The honest running total of hours saved - grows once per calendar workday. */
export function hoursSavedBase(now: Date = new Date()): number {
  return IMPACT.base + workdaysBetween(IMPACT.since, now) * IMPACT.dailyHours;
}
