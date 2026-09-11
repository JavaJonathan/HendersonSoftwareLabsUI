import { useCallback, useEffect, useRef, useState } from 'react';
import { beaconClears, flushClears, type ClearCounts } from '../../../api/line';
import { serverClearBound, type LineSnapshot, type StationKind } from './lineModel';

/**
 * Batches a visitor's clears and gets them to the server.
 *
 * Clicks are frequent and individually worthless, so nothing is sent per click. Counts accumulate
 * locally in `pending` and flush on a handful of natural boundaries (idle, a size threshold,
 * leaving the section, or the page hiding), which keeps a busy visitor to a couple of requests for
 * a whole session. `inflight` tracks a batch between the moment it leaves `pending` and the moment
 * its request resolves, purely so a second batch can start accumulating in `pending` without
 * double-counting the first; nothing on screen reads it directly; the section's own displayed
 * total is just the server's own snapshot plus the personal `myClears` counter below.
 *
 * On success, the server's own returned snapshot is applied as the new truth (see `onSnapshot`),
 * so `inflight` simply empties: no dip, no double count. On failure, the inflight amount returns
 * to `pending` and waits for the next trigger.
 */

const IDLE_FLUSH_MS = 5000;
const FLUSH_AT_PENDING = 25;
const RETRY_DELAYS_MS = [2000, 6000, 15000];
/** After a 429 there is no point trying again soon; keep accumulating quietly instead. */
const RATE_LIMIT_COOLDOWN_MS = 600_000;
/** An offline visitor can click for a long time. Past this, extra clears are dropped rather than hoarded. */
const MAX_PENDING = 600;

type Counts = Partial<Record<StationKind, number>>;

const total = (counts: Counts) => Object.values(counts).reduce((sum, n) => sum + (n ?? 0), 0);

/** Which kinds in this batch this visitor has never sent before, for the first-clear unlock nudge. */
const firstTimeKinds = (sent: Counts, contributed: Set<StationKind>): StationKind[] =>
  (Object.keys(sent) as StationKind[]).filter((kind) => !contributed.has(kind));

interface Options {
  snapshot: LineSnapshot | null;
  /** True while the section is on screen. Leaving view is itself a flush trigger. */
  active: boolean;
  onSnapshot: (snapshot: LineSnapshot) => void;
  /** Raised when a flush fails in a way worth mentioning once, quietly. */
  onUnsent: (unsent: boolean) => void;
}

export function useLineClicks({ snapshot, active, onSnapshot, onUnsent }: Options) {
  const pending = useRef<Counts>({});
  const inflight = useRef<Counts>({});
  const contributed = useRef<Set<StationKind>>(new Set());
  /**
   * Cumulative per-kind total this visitor has actually sent to the server. The activity feed
   * uses it to net its own contributions out of the next poll's delta, so a clear the visitor
   * just made does not come back a few seconds later labelled "someone cleared".
   */
  const flushed = useRef<Counts>({});
  const idleTimer = useRef<number | null>(null);
  const retryTimer = useRef<number | null>(null);
  const retryIndex = useRef(0);
  const cooldownUntil = useRef(0);
  const sending = useRef(false);

  const [myClears, setMyClears] = useState(0);

  const snapshotRef = useRef(snapshot);
  snapshotRef.current = snapshot;

  const clearTimers = useCallback(() => {
    if (idleTimer.current !== null) window.clearTimeout(idleTimer.current);
    if (retryTimer.current !== null) window.clearTimeout(retryTimer.current);
    idleTimer.current = null;
    retryTimer.current = null;
  }, []);

  const flush = useCallback(async () => {
    if (sending.current) return;
    if (Date.now() < cooldownUntil.current) return;
    if (total(pending.current) === 0) return;

    const current = snapshotRef.current;
    if (!current) return;

    sending.current = true;
    const sent = pending.current;
    pending.current = {};
    inflight.current = { ...inflight.current };
    for (const [kind, n] of Object.entries(sent)) {
      inflight.current[kind as StationKind] = (inflight.current[kind as StationKind] ?? 0) + (n ?? 0);
    }

    const firstTime = firstTimeKinds(sent, contributed.current);

    try {
      const result = await flushClears(current.ticket, sent as ClearCounts, firstTime);

      for (const kind of firstTime) contributed.current.add(kind);

      // The request has resolved, so its whole `sent` amount leaves `inflight` regardless of the
      // outcome: `onSnapshot` below applies the server's own truthful total, and anything the
      // server declined (the per-kind clamp, or the per-IP daily budget) is dropped rather than
      // returned to pending, so a clamped request can never loop forever.
      //
      // `flushed` is different: it exists only so the activity feed can recognise the visitor's
      // own contribution in a later poll and not report it back as a stranger's, so it must track
      // what the server actually confirmed (`result.accepted`), not what was merely attempted. The
      // two can differ under the daily budget, and crediting the attempt instead of the outcome
      // would let a stranger's later clear be silently netted out as the visitor's own.
      for (const [kind, n] of Object.entries(sent)) {
        const k = kind as StationKind;
        inflight.current[k] = Math.max(0, (inflight.current[k] ?? 0) - (n ?? 0));
        if (inflight.current[k] === 0) delete inflight.current[k];
        flushed.current[k] = (flushed.current[k] ?? 0) + (result.accepted[k] ?? 0);
      }

      retryIndex.current = 0;
      onUnsent(false);
      onSnapshot(result.snapshot);
    } catch (err) {
      const status = (err as { status?: number })?.status;

      for (const [kind, n] of Object.entries(sent)) {
        const k = kind as StationKind;
        inflight.current[k] = Math.max(0, (inflight.current[k] ?? 0) - (n ?? 0));
        if (inflight.current[k] === 0) delete inflight.current[k];
        pending.current[k] = (pending.current[k] ?? 0) + (n ?? 0);
      }

      if (status === 429) {
        cooldownUntil.current = Date.now() + RATE_LIMIT_COOLDOWN_MS;
      } else {
        const delay = RETRY_DELAYS_MS[Math.min(retryIndex.current, RETRY_DELAYS_MS.length - 1)];
        retryIndex.current += 1;
        if (retryIndex.current <= RETRY_DELAYS_MS.length) {
          retryTimer.current = window.setTimeout(() => void flush(), delay);
        }
      }

      onUnsent(true);
    } finally {
      sending.current = false;
    }
  }, [onSnapshot, onUnsent]);

  /** Record cleared tasks. Called once per column clear, not once per token. */
  const registerClears = useCallback(
    (kind: StationKind, count: number) => {
      if (!(count > 0)) return;

      const current = snapshotRef.current;
      // Self-clamp to the bound the server would apply anyway, so an honest flush always comes
      // back fully accepted and the displayed total never has to walk backwards.
      const elapsedSeconds = current ? Math.max(0, (Date.now() - current.receivedAt) / 1000) : 0;
      const bound = serverClearBound(elapsedSeconds);

      const already = pending.current[kind] ?? 0;
      const room = Math.max(0, Math.min(bound - already, MAX_PENDING - total(pending.current)));
      const take = Math.min(count, room);

      setMyClears((n) => n + count);
      if (take <= 0) return;

      pending.current[kind] = already + take;

      if (total(pending.current) >= FLUSH_AT_PENDING) {
        clearTimers();
        void flush();
        return;
      }

      if (idleTimer.current !== null) window.clearTimeout(idleTimer.current);
      idleTimer.current = window.setTimeout(() => void flush(), IDLE_FLUSH_MS);
    },
    [clearTimers, flush],
  );

  // Leaving the section is a natural boundary: send what is held rather than waiting for a timer
  // that may never fire because the visitor has scrolled on.
  const wasActive = useRef(active);
  useEffect(() => {
    if (wasActive.current && !active) void flush();
    wasActive.current = active;
  }, [active, flush]);

  useEffect(() => {
    // The page going away is the one case a normal request cannot survive, so it goes out as a
    // beacon and the pending counts are cleared optimistically: there is no response to wait for.
    const sendBeacon = () => {
      if (total(pending.current) === 0) return;
      const current = snapshotRef.current;
      if (!current) return;

      const sent = pending.current;
      const firstTime = firstTimeKinds(sent, contributed.current);
      if (beaconClears(current.ticket, sent as ClearCounts, firstTime)) {
        // A beacon has no response, so unlike the flush path there is no `accepted` figure to
        // credit `flushed` with: this optimistically assumes the full send was counted. Being
        // wrong here costs at most a few clears mislabelled in the activity feed on this
        // visitor's own next poll, which is the same order of inaccuracy the beacon path already
        // accepts elsewhere for not knowing its own outcome.
        for (const [kind, n] of Object.entries(sent)) {
          flushed.current[kind as StationKind] = (flushed.current[kind as StationKind] ?? 0) + (n ?? 0);
        }
        pending.current = {};
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === 'hidden') sendBeacon();
    };
    const onOnline = () => void flush();

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', sendBeacon);
    window.addEventListener('online', onOnline);

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', sendBeacon);
      window.removeEventListener('online', onOnline);
    };
  }, [flush]);

  useEffect(() => clearTimers, [clearTimers]);

  /** Cumulative per-kind total this visitor has sent to the server, for the feed to net out. */
  const getFlushed = useCallback((kind: StationKind) => flushed.current[kind] ?? 0, []);

  return { registerClears, myClears, getFlushed };
}
