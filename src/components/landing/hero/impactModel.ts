/**
 * "Hours saved" model, driven by the digital box's real numbers: `employeesAffected` ×
 * `hoursSavedPerEmployeePerWorkday`, accruing once per calendar workday since `since`.
 * `hoursSavedBase()` is the honest running total. The hero adds a small cosmetic "and
 * counting" drift on top while the page is open; that resets on reload, so the persisted
 * total never runs away between visits.
 *
 * As more flows get automated inside the box, bump `employeesAffected` and/or
 * `hoursSavedPerEmployeePerWorkday` independently to reflect the added time savings -
 * `workflows` is a separate manually-bumped count of those flows and isn't derived from
 * the hours math.
 */

export const IMPACT = {
  /** Date the digital box went live. */
  since: new Date(2021, 8, 12),
  /** Employees whose manual work the digital box removes. */
  employeesAffected: 5,
  /** Hours saved per affected employee per workday. */
  hoursSavedPerEmployeePerWorkday: 1,
  /** Cadence, in seconds, of the cosmetic "and counting" tick while the page is open. */
  liveTickSeconds: 26,
  /** Workflows automated to date - bump manually as new automated flows ship. */
  workflows: 6,
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
  return IMPACT.employeesAffected * IMPACT.hoursSavedPerEmployeePerWorkday * workdaysBetween(IMPACT.since, now);
}
