/**
 * Pure model for the homepage's shared Line.
 *
 * Six kinds of work arrive continuously. Some are automated and clear themselves; the rest pile
 * up until a visitor clicks them away by hand. Those clicks accumulate across every visitor until
 * a kind crosses a threshold and becomes automated permanently, for everyone.
 *
 * **Time is never stored, only events are.** Every quantity that grows with the clock is `now`
 * minus a timestamp: how much work an automation has got through is derived from when it was
 * switched on, and the size of your backlog is derived from when you last cleared it. The only
 * things ever written down are counts of what people actually did and the moment an automation
 * came online. So nothing has to be ticked on a schedule, nothing decays if the site goes quiet,
 * and nothing is wrong if a write is lost.
 *
 * The backlog is per browser, not shared, and that is deliberate. Arrivals are a world rate while
 * clicks are a human rate, and one motivated visitor clicks thousands of times faster than the
 * world produces work: a genuinely shared pile is either permanently empty or permanently pinned
 * at its cap, with nothing in between. What is shared is the thing that actually matters, which
 * kinds are automated, and that is also the thing the whole section is trying to say.
 *
 * Everything here is plain values in, plain values out. No React, no DOM, and no `Date.now()`
 * inside a function body: every clock-dependent function takes `now`, which is what makes the
 * economy unit-testable (see `tests/lineModel.test.ts`).
 */

/** Tasks of one kind that arrive per second. One every five seconds. */
export const ARRIVAL_PER_SEC = 0.2;

/** The most tasks of one kind that can ever be waiting. */
export const CAP_PER_KIND = 6;

/** An emptied kind is full again in exactly this long, which is why any absence beyond it looks the same. */
export const FILL_MS = (CAP_PER_KIND / ARRIVAL_PER_SEC) * 1000;

/** How long an automated kind takes to eat a task once it lands. Presentation only. */
export const AUTO_DRAIN_MS = 900;

/** Hand-cleared totals that unlock the next automation, in order. */
export const UNLOCK_THRESHOLDS: readonly number[] = [250, 750, 2000, 5000];

export const STATION_KIND_ORDER = [
  'Intake',
  'Validate',
  'Invoice',
  'Notify',
  'Sync',
  'Report',
] as const;

export type StationKind = (typeof STATION_KIND_ORDER)[number];

/**
 * Never automated, however much work goes through it.
 *
 * Partly this keeps the section playable forever: without a kind held back, the ladder completes
 * in about a month and the homepage's centrepiece becomes a still picture. Mostly it is just
 * true. Some work is judgement, and a business that claims otherwise is selling something.
 */
export const RESERVED_MANUAL_KIND: StationKind = 'Report';

/**
 * What each kind of station takes off a person's plate. This list is also the entire anti-abuse
 * story: a visitor picks from these rather than typing anything, so the public write endpoint
 * accepts no free text and there is nothing to moderate.
 */
export const STATION_KINDS: Record<StationKind, { label: string; blurb: string }> = {
  Intake: { label: 'Intake', blurb: 'Catches new orders, leads, and requests' },
  Validate: { label: 'Validate', blurb: 'Checks the details before anything moves' },
  Invoice: { label: 'Invoice', blurb: 'Builds and sends the invoice' },
  Notify: { label: 'Notify', blurb: 'Tells the customer what just happened' },
  Sync: { label: 'Sync', blurb: 'Copies data between tools you already use' },
  Report: { label: 'Report', blurb: 'Judgement calls that should stay yours' },
};

export function isStationKind(value: unknown): value is StationKind {
  return typeof value === 'string' && (STATION_KIND_ORDER as readonly string[]).includes(value);
}

export interface KindState {
  handCleared: number;
  helpers: number;
  /** ISO 8601, server clock. Null while the kind is still done by hand. */
  unlockedAt: string | null;
}

/** One `GET /api/line` response, plus the client-side receipt time the UI stamps onto it. */
export interface LineSnapshot {
  kinds: Record<StationKind, KindState>;
  totalHandCleared: number;
  unlockedCount: number;
  /** Server-sent, so client and server can never disagree about what the goal is. */
  nextThreshold: number | null;
  /** Signed proof of when this was issued, echoed back with clears. Opaque to the client. */
  ticket: string | null;
  snapshotAt: string;
  /** `Date.now()` when this arrived. Set by the client, never by the server. */
  receivedAt: number;
  /** True when this is the local fallback rather than a real answer from the API. */
  offline?: boolean;
}

/** When this browser last emptied each kind, in client-clock milliseconds. */
export interface LocalProgress {
  clearedThrough: Record<StationKind, number>;
}

function emptyKindRecord<T>(make: (kind: StationKind) => T): Record<StationKind, T> {
  const out = {} as Record<StationKind, T>;
  for (const kind of STATION_KIND_ORDER) out[kind] = make(kind);
  return out;
}

/** Milliseconds elapsed on this machine since the snapshot arrived. Never negative. */
function sinceReceived(snapshot: LineSnapshot, now: number): number {
  const elapsed = now - snapshot.receivedAt;
  return Number.isFinite(elapsed) && elapsed > 0 ? elapsed : 0;
}

/**
 * Server time, reconstructed without trusting that the two machines' clocks agree.
 *
 * Unlock timestamps come from the server, so comparing them against a raw client clock would fold
 * in whatever skew the visitor's device has, and a laptop running slow would show an automation
 * that has handled a negative number of tasks. Measuring elapsed time against our own receipt
 * stamp and rebasing onto the server's clock removes that.
 */
export function serverNow(snapshot: LineSnapshot, now: number): number {
  const base = Date.parse(snapshot.snapshotAt);
  if (!Number.isFinite(base)) return now;
  return base + sinceReceived(snapshot, now);
}

export function isUnlocked(snapshot: LineSnapshot, kind: StationKind): boolean {
  const at = snapshot.kinds?.[kind]?.unlockedAt;
  return typeof at === 'string' && Number.isFinite(Date.parse(at));
}

export function unlockedCount(snapshot: LineSnapshot): number {
  return STATION_KIND_ORDER.filter((kind) => isUnlocked(snapshot, kind)).length;
}

/** The kinds still done by hand, in display order. */
export function manualKinds(snapshot: LineSnapshot): StationKind[] {
  return STATION_KIND_ORDER.filter((kind) => !isUnlocked(snapshot, kind));
}

/**
 * How many tasks of one kind are waiting in this browser.
 *
 * An automated kind is always zero: the machine takes them as they land. A manual kind fills at
 * the arrival rate from the moment it was last emptied, and stops at the cap. The cap is what
 * makes a week away and eight hours away identical, and it is why an absence costs nothing: the
 * pile is never written down, it is only ever recomputed.
 */
export function backlogForKind(
  snapshot: LineSnapshot,
  local: LocalProgress,
  kind: StationKind,
  now: number,
): number {
  if (isUnlocked(snapshot, kind)) return 0;

  const since = local.clearedThrough?.[kind];
  if (!Number.isFinite(since)) return CAP_PER_KIND;

  const elapsed = Math.min(Math.max(0, now - since), FILL_MS);
  return Math.floor((elapsed / 1000) * ARRIVAL_PER_SEC);
}

export function totalBacklog(snapshot: LineSnapshot, local: LocalProgress, now: number): number {
  return STATION_KIND_ORDER.reduce(
    (sum, kind) => sum + backlogForKind(snapshot, local, kind, now),
    0,
  );
}

/** The most work that could be waiting right now, which shrinks by a whole column per unlock. */
export function totalCap(snapshot: LineSnapshot): number {
  return manualKinds(snapshot).length * CAP_PER_KIND;
}

/** How buried the machine is, 0 to 1. Zero rather than NaN when there is nothing left to do by hand. */
export function stressLevel(snapshot: LineSnapshot, local: LocalProgress, now: number): number {
  const cap = totalCap(snapshot);
  if (cap <= 0) return 0;
  return Math.min(1, Math.max(0, totalBacklog(snapshot, local, now) / cap));
}

/**
 * Records that `count` tasks of a kind were cleared.
 *
 * The `Math.min(now, ...)` is the load-bearing line in this file. **You can empty the pile, but
 * you cannot bank progress against work that has not arrived yet.** Clicking three hundred times
 * on a six-task column moves the marker to now and no further, so tomorrow's pile is exactly the
 * same as it would have been. That is the whole argument the section is making, expressed as a
 * clamp: manual effort clears what is in front of you and buys you nothing beyond that.
 */
export function advanceClearedThrough(
  local: LocalProgress,
  kind: StationKind,
  count: number,
  now: number,
): LocalProgress {
  if (!(count > 0)) return local;

  const stored = Number.isFinite(local.clearedThrough?.[kind])
    ? local.clearedThrough[kind]
    : now - FILL_MS;

  // Never treat the marker as further behind than the cap, because work beyond the cap was never
  // shown and so was never really there. Without this, someone returning after a week clears all
  // six visible tasks and is left staring at the overflow that had silently piled up behind them,
  // which reads as the game refusing to accept that they did the work.
  const since = Math.max(stored, now - FILL_MS);

  return {
    clearedThrough: {
      ...local.clearedThrough,
      [kind]: Math.min(now, since + count * (1000 / ARRIVAL_PER_SEC)),
    },
  };
}

/** A first visit: every manual kind already at its cap, because that is what a backlog is. */
export function seedLocalProgress(now: number): LocalProgress {
  return { clearedThrough: emptyKindRecord(() => now - FILL_MS) };
}

/**
 * The hand-cleared total that unlocks the next automation, or null once the ladder is spent.
 * Mirrors LineGameRules.UnlockThresholdFor in the API; the seeded first automation occupies
 * index 0, so the first threshold a visitor can actually reach is UNLOCK_THRESHOLDS[0].
 */
export function unlockThresholdFor(unlocked: number): number | null {
  const index = Math.max(0, unlocked - 1);
  return index < UNLOCK_THRESHOLDS.length ? UNLOCK_THRESHOLDS[index] : null;
}

/** Which kind is closest to being automated next, and how far along it is. */
export function nextUnlockTarget(
  snapshot: LineSnapshot,
): { kind: StationKind; threshold: number; progress: number } | null {
  const threshold = snapshot.nextThreshold ?? unlockThresholdFor(unlockedCount(snapshot));
  if (threshold === null || !(threshold > 0)) return null;

  let best: { kind: StationKind; cleared: number } | null = null;
  for (const kind of STATION_KIND_ORDER) {
    if (kind === RESERVED_MANUAL_KIND || isUnlocked(snapshot, kind)) continue;
    const cleared = snapshot.kinds?.[kind]?.handCleared ?? 0;
    if (best === null || cleared > best.cleared) best = { kind, cleared };
  }

  if (best === null) return null;

  return {
    kind: best.kind,
    threshold,
    progress: Math.min(1, Math.max(0, best.cleared / threshold)),
  };
}

/**
 * Everything the automated kinds have got through since they came online. An automation handles
 * exactly what arrives, so this is elapsed time at the arrival rate, and it keeps climbing at
 * three in the morning with nobody on the site.
 */
export function tasksHandled(snapshot: LineSnapshot, now: number): number {
  const serverTime = serverNow(snapshot, now);

  return STATION_KIND_ORDER.reduce((sum, kind) => {
    const at = Date.parse(snapshot.kinds?.[kind]?.unlockedAt ?? '');
    if (!Number.isFinite(at)) return sum;

    const elapsed = serverTime - at;
    if (!(elapsed > 0)) return sum;

    return sum + Math.floor((elapsed / 1000) * ARRIVAL_PER_SEC);
  }, 0);
}

/**
 * The most clears of one kind the server will credit for a given accumulation time. Mirrors
 * LineGameRules.ClearBound exactly; the unit test pins both to the same table of values, because
 * a drift between the repos is otherwise silent and shows up only as clears being quietly
 * rejected in production. The client self-clamps to this before crediting anything optimistically,
 * so an honest flush always comes back fully accepted.
 */
export function serverClearBound(elapsedSeconds: number): number {
  const elapsed = Math.min(Math.max(Number.isFinite(elapsedSeconds) ? elapsedSeconds : 0, 0), 900);
  return Math.min(CAP_PER_KIND + Math.ceil(ARRIVAL_PER_SEC * elapsed), 400);
}

/** What other people cleared between two snapshots. Increases only; never reports a decrease. */
export function ghostDelta(
  previous: LineSnapshot | null,
  next: LineSnapshot,
): Array<{ kind: StationKind; count: number }> {
  if (!previous) return [];

  const out: Array<{ kind: StationKind; count: number }> = [];
  for (const kind of STATION_KIND_ORDER) {
    const before = previous.kinds?.[kind]?.handCleared ?? 0;
    const after = next.kinds?.[kind]?.handCleared ?? 0;
    if (after > before) out.push({ kind, count: after - before });
  }

  return out;
}

/**
 * Whether a response is newer than what is already applied.
 *
 * Without this, a GET served from the API's own short cache can land after our POST and briefly
 * erase our contribution, which reads as the counter stuttering backwards. One comparison kills
 * the entire class of bug.
 */
export function isFresher(next: LineSnapshot, current: LineSnapshot | null): boolean {
  if (!current) return true;

  const a = Date.parse(next.snapshotAt);
  const b = Date.parse(current.snapshotAt);
  if (!Number.isFinite(a)) return false;
  if (!Number.isFinite(b)) return true;

  return a > b;
}

/**
 * The line shown when the API cannot be reached. One kind automated so the contrast still reads,
 * and **no invented community numbers**: the counters are honestly zero and the UI says why. A
 * marketing page inventing social proof when its own backend is down would be the worst possible
 * version of this feature.
 */
export function seedSnapshot(now: number): LineSnapshot {
  const iso = new Date(now).toISOString();

  return {
    kinds: emptyKindRecord((kind) => ({
      handCleared: 0,
      helpers: 0,
      unlockedAt: kind === 'Intake' ? new Date(now - FILL_MS).toISOString() : null,
    })),
    totalHandCleared: 0,
    unlockedCount: 1,
    nextThreshold: UNLOCK_THRESHOLDS[0],
    ticket: null,
    snapshotAt: iso,
    receivedAt: now,
    offline: true,
  };
}

export type Mood = 'calm' | 'busy' | 'swamped';

/** What the machine's mood chip says, so the state is never carried by colour alone. */
export const MOOD_LABELS: Record<Mood, string> = {
  calm: 'Keeping up',
  busy: 'Falling behind',
  swamped: 'Swamped',
};

/**
 * The machine's mood, with hysteresis.
 *
 * Anything that picks buckets off a continuous value flickers when it sits on a boundary, and a
 * face that twitches between calm and worried twenty times a second is both ugly and unreadable.
 * Crossing a threshold therefore requires overshooting it, so a mood change means something
 * actually happened.
 */
export function moodFor(stress: number, previous: Mood): Mood {
  const value = Number.isFinite(stress) ? stress : 0;
  const margin = 0.08;
  const lower = 0.25;
  const upper = 0.7;

  if (previous === 'calm') return value > lower + margin ? (value > upper + margin ? 'swamped' : 'busy') : 'calm';
  if (previous === 'swamped') return value < upper - margin ? (value < lower - margin ? 'calm' : 'busy') : 'swamped';

  if (value > upper + margin) return 'swamped';
  if (value < lower - margin) return 'calm';
  return 'busy';
}

/** Thousands-separated, and never "NaN" or "-0" whatever it is handed. */
export function formatTaskCount(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return '0';
  return Math.floor(value).toLocaleString('en-US');
}
