import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ARRIVAL_PER_SEC,
  CAP_PER_KIND,
  FILL_MS,
  RESERVED_MANUAL_KIND,
  STATION_KIND_ORDER,
  UNLOCK_THRESHOLDS,
  advanceClearedThrough,
  backlogForKind,
  formatTaskCount,
  ghostDelta,
  isFresher,
  isStationKind,
  isUnlocked,
  moodFor,
  nextUnlockTarget,
  seedLocalProgress,
  seedSnapshot,
  serverClearBound,
  serverNow,
  stressLevel,
  tasksHandled,
  totalBacklog,
  totalCap,
  unlockThresholdFor,
  type KindState,
  type LineSnapshot,
  type StationKind,
} from '../src/components/landing/line/lineModel.ts';

/** Assert two numbers are equal within a small tolerance (full-precision math). */
function close(actual: number, expected: number, tolerance = 1e-9) {
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `expected ${actual} to be within ${tolerance} of ${expected}`,
  );
}

const T0 = Date.parse('2026-09-10T12:00:00.000Z');
const HOUR = 3_600_000;
const DAY = 24 * HOUR;

function makeSnapshot(unlocked: Partial<Record<StationKind, string | null>> = {}): LineSnapshot {
  const kinds = {} as Record<StationKind, KindState>;
  for (const kind of STATION_KIND_ORDER) {
    kinds[kind] = { handCleared: 0, helpers: 0, unlockedAt: unlocked[kind] ?? null };
  }

  return {
    kinds,
    totalHandCleared: 0,
    unlockedCount: STATION_KIND_ORDER.filter((k) => kinds[k].unlockedAt !== null).length,
    nextThreshold: UNLOCK_THRESHOLDS[0],
    ticket: null,
    snapshotAt: new Date(T0).toISOString(),
    receivedAt: T0,
  };
}

test('a first visit finds every manual kind already at its cap', () => {
  const snapshot = makeSnapshot();
  const r = seedLocalProgress(T0);
  for (const kind of STATION_KIND_ORDER) {
    assert.equal(backlogForKind(snapshot, r, kind, T0), CAP_PER_KIND);
  }
});

test('an automated kind never has anything waiting', () => {
  const snapshot = makeSnapshot({ Intake: new Date(T0 - 30 * DAY).toISOString() });
  const local = seedLocalProgress(T0);
  const r = backlogForKind(snapshot, local, 'Intake', T0);
  assert.equal(r, 0);
});

test('an emptied kind refills to the cap in exactly the fill time', () => {
  const snapshot = makeSnapshot();
  const local = { clearedThrough: { ...seedLocalProgress(T0).clearedThrough, Validate: T0 } };

  assert.equal(backlogForKind(snapshot, local, 'Validate', T0), 0);
  assert.equal(backlogForKind(snapshot, local, 'Validate', T0 + FILL_MS / 2), CAP_PER_KIND / 2);
  const r = backlogForKind(snapshot, local, 'Validate', T0 + FILL_MS);
  assert.equal(r, CAP_PER_KIND);
});

test('a week away and eight hours away look exactly the same', () => {
  const snapshot = makeSnapshot();
  const local = { clearedThrough: { ...seedLocalProgress(T0).clearedThrough, Sync: T0 } };

  const eightHours = backlogForKind(snapshot, local, 'Sync', T0 + 8 * HOUR);
  const oneWeek = backlogForKind(snapshot, local, 'Sync', T0 + 7 * DAY);
  assert.equal(eightHours, oneWeek);
  assert.equal(oneWeek, CAP_PER_KIND);
});

test('clearing one task moves the marker on by exactly one arrival interval', () => {
  const local = { clearedThrough: { ...seedLocalProgress(T0).clearedThrough, Notify: T0 - FILL_MS } };
  const r = advanceClearedThrough(local, 'Notify', 1, T0);
  close(r.clearedThrough.Notify - (T0 - FILL_MS), 1000 / ARRIVAL_PER_SEC);
});

test('clearing more than is waiting never banks progress against work that has not arrived', () => {
  const local = { clearedThrough: { ...seedLocalProgress(T0).clearedThrough, Invoice: T0 - FILL_MS } };

  // Three hundred clicks on a six-task column: the marker stops dead at now.
  const r = advanceClearedThrough(local, 'Invoice', 300, T0);
  assert.equal(r.clearedThrough.Invoice, T0);

  // And tomorrow's pile is therefore identical to what it would have been anyway.
  const snapshot = makeSnapshot();
  assert.equal(backlogForKind(snapshot, r, 'Invoice', T0 + DAY), CAP_PER_KIND);
});

test('clearing everything you can see empties the pile, however long you were away', () => {
  const snapshot = makeSnapshot();
  // Away for a week, so the marker is far further behind than the cap ever showed.
  const local = { clearedThrough: { ...seedLocalProgress(T0).clearedThrough, Sync: T0 - 7 * DAY } };

  const waiting = backlogForKind(snapshot, local, 'Sync', T0);
  assert.equal(waiting, CAP_PER_KIND);

  // Clearing exactly what was on screen must leave nothing behind, not the invisible overflow.
  const r = advanceClearedThrough(local, 'Sync', waiting, T0);
  assert.equal(backlogForKind(snapshot, r, 'Sync', T0), 0);
});

test('a client clock that jumps backwards never yields a negative backlog', () => {
  const snapshot = makeSnapshot();
  const local = { clearedThrough: { ...seedLocalProgress(T0).clearedThrough, Report: T0 } };
  const r = backlogForKind(snapshot, local, 'Report', T0 - HOUR);
  assert.equal(r, 0);
  assert.ok(Number.isFinite(r));
});

test('a missing marker is treated as a full pile rather than an empty one', () => {
  const snapshot = makeSnapshot();
  const r = backlogForKind(snapshot, { clearedThrough: {} as never }, 'Validate', T0);
  assert.equal(r, CAP_PER_KIND);
});

test('the cap shrinks by a whole column for every kind automated', () => {
  assert.equal(totalCap(makeSnapshot()), 6 * CAP_PER_KIND);
  const one = makeSnapshot({ Intake: new Date(T0).toISOString() });
  assert.equal(totalCap(one), 5 * CAP_PER_KIND);
  const r = totalCap(makeSnapshot({
    Intake: new Date(T0).toISOString(),
    Validate: new Date(T0).toISOString(),
    Invoice: new Date(T0).toISOString(),
  }));
  assert.equal(r, 3 * CAP_PER_KIND);
});

test('stress is one when everything manual is full and zero when nothing is waiting', () => {
  const snapshot = makeSnapshot();
  assert.equal(stressLevel(snapshot, seedLocalProgress(T0), T0), 1);

  const emptied = { clearedThrough: {} as Record<StationKind, number> };
  for (const kind of STATION_KIND_ORDER) emptied.clearedThrough[kind] = T0;
  const r = stressLevel(snapshot, emptied, T0);
  assert.equal(r, 0);
});

test('stress is zero rather than NaN once every kind is automated', () => {
  const all: Partial<Record<StationKind, string>> = {};
  for (const kind of STATION_KIND_ORDER) all[kind] = new Date(T0).toISOString();

  const snapshot = makeSnapshot(all);
  const r = stressLevel(snapshot, seedLocalProgress(T0), T0);
  assert.equal(r, 0);
  assert.ok(!Number.isNaN(r));
  assert.equal(totalBacklog(snapshot, seedLocalProgress(T0), T0), 0);
});

test('the unlock ladder escalates and then runs out', () => {
  assert.equal(unlockThresholdFor(1), UNLOCK_THRESHOLDS[0]);
  assert.equal(unlockThresholdFor(2), UNLOCK_THRESHOLDS[1]);
  assert.equal(unlockThresholdFor(3), UNLOCK_THRESHOLDS[2]);
  assert.equal(unlockThresholdFor(4), UNLOCK_THRESHOLDS[3]);
  const r = unlockThresholdFor(5);
  assert.equal(r, null);
});

test('the reserved manual kind is never offered as the next unlock', () => {
  const snapshot = makeSnapshot();
  snapshot.kinds[RESERVED_MANUAL_KIND].handCleared = 999_999;
  snapshot.kinds.Validate.handCleared = 10;

  const r = nextUnlockTarget(snapshot);
  assert.ok(r !== null);
  assert.notEqual(r.kind, RESERVED_MANUAL_KIND);
  assert.equal(r.kind, 'Validate');
});

test('the next unlock target is the locked kind closest to the threshold', () => {
  const snapshot = makeSnapshot();
  snapshot.kinds.Validate.handCleared = 40;
  snapshot.kinds.Sync.handCleared = 190;
  snapshot.kinds.Notify.handCleared = 12;

  const r = nextUnlockTarget(snapshot);
  assert.equal(r?.kind, 'Sync');
  close(r?.progress ?? 0, 190 / UNLOCK_THRESHOLDS[0]);
});

test('progress toward an unlock never exceeds one', () => {
  const snapshot = makeSnapshot();
  snapshot.kinds.Validate.handCleared = 10_000;
  const r = nextUnlockTarget(snapshot);
  assert.equal(r?.progress, 1);
});

test('automated kinds keep handling work while nobody is watching', () => {
  const snapshot = makeSnapshot({ Intake: new Date(T0 - HOUR).toISOString() });
  const r = tasksHandled(snapshot, T0);
  assert.equal(r, Math.floor((HOUR / 1000) * ARRIVAL_PER_SEC));
});

test('tasks handled counts only automated kinds and never runs backwards', () => {
  const snapshot = makeSnapshot({ Intake: new Date(T0 + HOUR).toISOString() });
  assert.equal(tasksHandled(snapshot, T0), 0);

  const manual = makeSnapshot();
  const r = tasksHandled(manual, T0 + DAY);
  assert.equal(r, 0);
});

test('an unreadable unlock timestamp is ignored rather than poisoning the total', () => {
  const snapshot = makeSnapshot({ Intake: new Date(T0 - HOUR).toISOString() });
  snapshot.kinds.Validate.unlockedAt = 'not-a-date';

  const r = tasksHandled(snapshot, T0);
  assert.ok(Number.isFinite(r));
  assert.equal(r, Math.floor((HOUR / 1000) * ARRIVAL_PER_SEC));
  assert.equal(isUnlocked(snapshot, 'Validate'), false);
});

test('server time advances with the client clock rather than tracking its absolute value', () => {
  const snapshot = makeSnapshot();
  snapshot.snapshotAt = new Date(T0 + 5_000).toISOString();
  snapshot.receivedAt = T0;

  const r = serverNow(snapshot, T0 + 2_000);
  close(r, T0 + 7_000);
});

test('ghost deltas report other people gaining ground and never losing it', () => {
  const before = makeSnapshot();
  before.kinds.Validate.handCleared = 100;
  before.kinds.Sync.handCleared = 50;

  const after = makeSnapshot();
  after.kinds.Validate.handCleared = 112;
  after.kinds.Sync.handCleared = 40;
  after.snapshotAt = new Date(T0 + 5_000).toISOString();

  const r = ghostDelta(before, after);
  assert.deepEqual(r, [{ kind: 'Validate', count: 12 }]);
});

test('identical snapshots produce no ghosts, and the first one produces none either', () => {
  const snapshot = makeSnapshot();
  assert.deepEqual(ghostDelta(snapshot, snapshot), []);
  const r = ghostDelta(null, snapshot);
  assert.deepEqual(r, []);
});

test('a stale snapshot is refused so the shared counter cannot stutter backwards', () => {
  const current = makeSnapshot();
  const older = makeSnapshot();
  older.snapshotAt = new Date(T0 - 5_000).toISOString();
  const newer = makeSnapshot();
  newer.snapshotAt = new Date(T0 + 5_000).toISOString();

  assert.equal(isFresher(older, current), false);
  assert.equal(isFresher(current, current), false);
  assert.equal(isFresher(newer, current), true);
  const r = isFresher(newer, null);
  assert.equal(r, true);
});

test('the clear bound matches the API clamp across the shared reference table', () => {
  // Mirrors LineGameRules.ClearBound in HendersonSoftwareLabsAPI. A drift between the two repos is
  // otherwise silent, showing up only as clears being quietly rejected in production.
  const table: Array<[number, number]> = [
    [0, 6],
    [5, 7],
    [30, 12],
    [300, 66],
    [900, 186],
    [5000, 186],
  ];

  for (const [elapsed, expected] of table) {
    assert.equal(serverClearBound(elapsed), expected, `elapsed ${elapsed}`);
  }

  const r = serverClearBound(Number.NaN);
  assert.equal(r, CAP_PER_KIND);
  assert.equal(serverClearBound(-40), CAP_PER_KIND);
});

test('the mood needs a real change to flip, not a wobble on the boundary', () => {
  assert.equal(moodFor(0, 'calm'), 'calm');
  // Sitting just past the threshold is not enough to leave calm.
  assert.equal(moodFor(0.3, 'calm'), 'calm');
  assert.equal(moodFor(0.4, 'calm'), 'busy');
  // And coming back down needs to clear it by the same margin.
  assert.equal(moodFor(0.2, 'busy'), 'busy');
  const r = moodFor(0.1, 'busy');
  assert.equal(r, 'calm');
  assert.equal(moodFor(0.9, 'busy'), 'swamped');
  // Still swamped at 0.65: leaving that bucket needs to clear 0.70 by the same margin.
  assert.equal(moodFor(0.65, 'swamped'), 'swamped');
  assert.equal(moodFor(0.6, 'swamped'), 'busy');
});

test('the offline line is honest: one kind automated and no invented community numbers', () => {
  const r = seedSnapshot(T0);
  assert.equal(r.offline, true);
  assert.equal(r.unlockedCount, 1);
  assert.equal(r.totalHandCleared, 0);
  assert.equal(r.ticket, null);
  assert.equal(STATION_KIND_ORDER.filter((k) => isUnlocked(r, k)).length, 1);
  for (const kind of STATION_KIND_ORDER) {
    assert.equal(r.kinds[kind].handCleared, 0);
    assert.equal(r.kinds[kind].helpers, 0);
  }
});

test('formatTaskCount groups thousands and never renders NaN or a negative zero', () => {
  assert.equal(formatTaskCount(0), '0');
  assert.equal(formatTaskCount(1284320), '1,284,320');
  assert.equal(formatTaskCount(12.9), '12');
  assert.equal(formatTaskCount(Number.NaN), '0');
  assert.equal(formatTaskCount(-0), '0');
  const r = formatTaskCount(Number.POSITIVE_INFINITY);
  assert.equal(r, '0');
});

test('only the known station kinds are accepted', () => {
  assert.ok(isStationKind('Invoice'));
  assert.ok(!isStationKind('invoice'));
  assert.ok(!isStationKind('Dropped'));
  const r = isStationKind(null);
  assert.equal(r, false);
});

test('no em dash or en dash reaches the visitor through this feature copy', () => {
  const copy = JSON.stringify(STATION_KIND_ORDER) + JSON.stringify(seedSnapshot(T0));
  // Built from char codes so this file does not itself contain the characters it bans.
  const banned = new RegExp(`[${String.fromCharCode(0x2014, 0x2013)}]`);
  assert.ok(!banned.test(copy), 'house style forbids em and en dashes in user-facing copy');
});
