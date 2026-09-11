import { useCallback, useEffect, useRef, useState } from 'react';
import { beaconClears, flushClears, type ClearCounts } from '../../../api/line';
import { serverClearBound, type LineSnapshot, type StationKind } from './lineModel';

/**
 * Batches a visitor's clears and gets them to the server.
 *
 * Clicks are frequent and individually worthless, so nothing is sent per click. Counts accumulate
 * locally and flush on a handful of natural boundaries, which keeps a busy visitor to a couple of
 * requests for a whole session.
 *
 * The shared counter shown on screen is `server + pending + inflight`, and the four transitions
 * below keep that sum continuous. On success the server's total already includes what it credited,
 * so the same number leaves `inflight` in the same commit: no double count and no dip. On failure
 * the inflight amount returns to pending and waits for the next trigger.
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

  // Mirrors of the refs, so the optimistic display can re-render without the refs driving renders.
  const [optimistic, setOptimistic] = useState<Counts>({});
  const [myClears, setMyClears] = useState(0);

  const snapshotRef = useRef(snapshot);
  snapshotRef.current = snapshot;

  const syncOptimistic = useCallback(() => {
    const merged: Counts = {};
    for (const [kind, n] of Object.entries(pending.current)) {
      merged[kind as StationKind] = (merged[kind as StationKind] ?? 0) + (n ?? 0);
    }
    for (const [kind, n] of Object.entries(inflight.current)) {
      merged[kind as StationKind] = (merged[kind as StationKind] ?? 0) + (n ?? 0);
    }
    setOptimistic(merged);
  }, []);

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
    syncOptimistic();

    const firstTime = (Object.keys(sent) as StationKind[]).filter((kind) => !contributed.current.has(kind));

    try {
      const result = await flushClears(current.ticket, sent as ClearCounts, firstTime);

      for (const kind of firstTime) contributed.current.add(kind);

      // Remove exactly what the server credited. Anything it declined is dropped rather than
      // returned to pending, so a clamped request can never loop forever.
      for (const [kind, n] of Object.entries(sent)) {
        const k = kind as StationKind;
        inflight.current[k] = Math.max(0, (inflight.current[k] ?? 0) - (n ?? 0));
        if (inflight.current[k] === 0) delete inflight.current[k];
        flushed.current[k] = (flushed.current[k] ?? 0) + (n ?? 0);
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
      syncOptimistic();
    }
  }, [onSnapshot, onUnsent, syncOptimistic]);

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
      syncOptimistic();

      if (total(pending.current) >= FLUSH_AT_PENDING) {
        clearTimers();
        void flush();
        return;
      }

      if (idleTimer.current !== null) window.clearTimeout(idleTimer.current);
      idleTimer.current = window.setTimeout(() => void flush(), IDLE_FLUSH_MS);
    },
    [clearTimers, flush, syncOptimistic],
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
      const firstTime = (Object.keys(sent) as StationKind[]).filter((k) => !contributed.current.has(k));
      if (beaconClears(current.ticket, sent as ClearCounts, firstTime)) {
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

  return { registerClears, optimistic, myClears, getFlushed };
}
