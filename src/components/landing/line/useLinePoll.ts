import { useEffect, useRef } from 'react';
import { fetchLine } from '../../../api/line';
import type { LineSnapshot } from './lineModel';

/**
 * Keeps the shared numbers live while somebody is looking, and stops entirely when they are not.
 *
 * The previous version of this section fetched once and never again, on the grounds that
 * everything on screen could be extrapolated from one snapshot. That is still true of the
 * automation output, but it is not true of what other visitors are doing, and seeing someone
 * else's clears land is most of what makes the section feel shared. So it polls, and every rule
 * below exists to make that cost as close to nothing as possible:
 *
 * - only while the section is on screen and the tab is visible
 * - slower once the numbers stop moving, because a quiet line needs no attention
 * - not at all after a long idle spell, until the visitor does something
 * - slower again on a metered connection, and on repeated errors
 *
 * Errors are never surfaced. A poll that fails just means the numbers are a few seconds stale.
 */

const BASE_INTERVAL_MS = 5000;
const QUIET_INTERVAL_MS = 15_000;
const SAVE_DATA_INTERVAL_MS = 30_000;
/** Unchanged responses before easing off. */
const QUIET_AFTER = 3;
/** Stop entirely after this long with no interaction at all. */
const IDLE_STOP_MS = 600_000;
const ERROR_BACKOFF_MS = [10_000, 30_000, 60_000];

interface Options {
  /** True while the section is on screen. */
  active: boolean;
  onSnapshot: (snapshot: LineSnapshot) => void;
  /** Bumped by the caller whenever the visitor does something, to wake a sleeping poller. */
  interactionNonce: number;
}

function prefersLessData(): boolean {
  const connection = (navigator as { connection?: { saveData?: boolean } }).connection;
  return connection?.saveData === true;
}

export function useLinePoll({ active, onSnapshot, interactionNonce }: Options) {
  const onSnapshotRef = useRef(onSnapshot);
  onSnapshotRef.current = onSnapshot;

  const lastTotal = useRef<number | null>(null);
  const unchanged = useRef(0);
  const errors = useRef(0);
  const lastInteraction = useRef(Date.now());

  useEffect(() => {
    lastInteraction.current = Date.now();
  }, [interactionNonce]);

  useEffect(() => {
    if (!active) return;

    let cancelled = false;
    let timer: number | null = null;

    const nextDelay = () => {
      if (errors.current > 0) {
        return ERROR_BACKOFF_MS[Math.min(errors.current - 1, ERROR_BACKOFF_MS.length - 1)];
      }
      if (prefersLessData()) return SAVE_DATA_INTERVAL_MS;
      return unchanged.current >= QUIET_AFTER ? QUIET_INTERVAL_MS : BASE_INTERVAL_MS;
    };

    const schedule = () => {
      if (cancelled) return;
      timer = window.setTimeout(() => void tick(), nextDelay());
    };

    const tick = async () => {
      if (cancelled) return;

      // Asleep: no interaction for a long while. Wake on the next thing the visitor does.
      if (Date.now() - lastInteraction.current > IDLE_STOP_MS) {
        schedule();
        return;
      }

      if (document.visibilityState !== 'visible') {
        schedule();
        return;
      }

      try {
        const snapshot = await fetchLine();
        if (cancelled) return;

        errors.current = 0;
        unchanged.current =
          lastTotal.current === snapshot.totalHandCleared ? unchanged.current + 1 : 0;
        lastTotal.current = snapshot.totalHandCleared;

        onSnapshotRef.current(snapshot);
      } catch {
        // Stale numbers are not worth telling anyone about.
        if (!cancelled) errors.current += 1;
      }

      schedule();
    };

    schedule();

    // Coming back to the tab should feel current, not five seconds behind.
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        if (timer !== null) window.clearTimeout(timer);
        void tick();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelled = true;
      if (timer !== null) window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [active]);
}
