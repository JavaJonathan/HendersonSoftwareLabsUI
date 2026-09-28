import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { useInView, useReducedMotion } from 'framer-motion';
import { fetchLine } from '../../../api/line';
import { PRESETS, type PresetId } from './presets';
import { loadLocal, loadPreset, loadSeenUnlocks, removeLegacyLineStorage, saveLocal, savePreset, saveSeenUnlocks } from './lineStorage';
import {
  STATION_KINDS, STATION_KIND_ORDER, advanceClearedThrough, backlogForKind, ghostDelta,
  isFresher, isUnlocked, moodFor, nextUnlockTarget, seedLocalProgress,
  seedSnapshot, stressLevel, totalBacklog, totalCap,
  type LineSnapshot, type LocalProgress, type Mood, type StationKind,
} from './lineModel';
import { type LaneView } from './Conveyor';
import { type FeedRow } from './ActivityFeed';
import { useLineClicks } from './useLineClicks';
import { useLinePoll } from './useLinePoll';

/**
 * The backlog is recomputed from the clock, so the view needs a heartbeat to show arrivals. Work
 * arrives once every five seconds per kind, so a one-second tick is already finer than anything
 * the model can change, and it re-renders the whole section, so there is no reason to go faster.
 */
const TICK_MS = 1000;
const ANNOUNCE_THROTTLE_MS = 3000;
/** How long to gather a burst of the visitor's own clears into one feed line. */
const FEED_COALESCE_MS = 800;
/** The feed shows this many events; a newer one pushes the oldest out. */
const FEED_MAX_ROWS = 4;

/** Dev-only shortcut so every state is reachable in one navigation instead of a five-thousand-click grind. */
function debugMode(): string | null {
  if (!import.meta.env.DEV || typeof window === 'undefined') return null;
  return new URLSearchParams(window.location.search).get('lineDebug');
}

function debugOverride(local: LocalProgress, now: number): LocalProgress {
  const mode = debugMode();
  if (mode === 'full') return seedLocalProgress(now);
  if (mode === 'empty') {
    const emptied = seedLocalProgress(now);
    for (const kind of STATION_KIND_ORDER) emptied.clearedThrough[kind] = now;
    return emptied;
  }
  return local;
}

export function useLineExperience() {
  const reduce = useReducedMotion() ?? false;
  const theme = useTheme();
  const compact = useMediaQuery(theme.breakpoints.down('sm'));
  const sectionRef = useRef<HTMLDivElement>(null);
  const observed = useInView(sectionRef, { margin: '0px 0px -15% 0px' });
  // `?lineDebug=live` keeps the section running regardless of visibility. Intersection observers
  // and rAF are both inert in a headless or non-compositing browser, so without this the section
  // is permanently paused there and none of its time-based behaviour can be exercised.
  const inView = observed || debugMode() === 'live';

  const [snapshot, setSnapshot] = useState<LineSnapshot | null>(null);
  const [local, setLocal] = useState<LocalProgress>(() => debugOverride(loadLocal(Date.now()), Date.now()));
  const [presetId, setPresetId] = useState<PresetId>(loadPreset);
  const [, setTick] = useState(0);

  const [mood, setMood] = useState<Mood>('calm');
  const [feedRows, setFeedRows] = useState<FeedRow[]>([]);
  const [announcement, setAnnouncement] = useState('');
  const [arrival, setArrival] = useState('');
  const [unsent, setUnsent] = useState(false);
  const [everCleared, setEverCleared] = useState(false);
  const [interactionNonce, setInteractionNonce] = useState(0);

  const seenUnlocks = useRef<Set<StationKind>>(loadSeenUnlocks());
  const feedId = useRef(0);
  const feedBuffer = useRef<Map<StationKind, number>>(new Map());
  const feedTimer = useRef<number | null>(null);
  /**
   * The last snapshot whose deltas were fed to the activity feed. Kept out of React state so the
   * feed side effects run once, not twice under StrictMode's updater double-invoke.
   */
  const lastFedSnapshot = useRef<LineSnapshot | null>(null);
  /** How much of this visitor's own flushed clears the feed has already netted out of poll deltas. */
  const ghostAccounted = useRef<Partial<Record<StationKind, number>>>({});
  const getFlushedRef = useRef<(kind: StationKind) => number>(() => 0);
  const announceAt = useRef(0);
  const announceBuffer = useRef<{ tasks: number; kinds: Set<StationKind> }>({ tasks: 0, kinds: new Set() });
  const announceTimer = useRef<number | null>(null);

  useEffect(removeLegacyLineStorage, []);

  const persistLocal = useCallback(saveLocal, []);

  /** Append one line to the activity feed, keeping only the most recent few. */
  const pushFeed = useCallback((kind: StationKind | null, text: string) => {
    setFeedRows((rows) => [{ id: (feedId.current += 1), kind, text }, ...rows].slice(0, FEED_MAX_ROWS));
  }, []);

  /**
   * Gather a burst of the visitor's own clears into one feed line.
   *
   * At a couple of clicks a second, one line per click is spam. Each kind's count accumulates and
   * one line lands after a short quiet, or when a different kind is cleared. Other people's clears
   * arrive already batched by the poll, so they go straight through.
   */
  const feedOwnClear = useCallback(
    (kind: StationKind, count: number) => {
      if (!(count > 0)) return;
      const buffer = feedBuffer.current;
      buffer.set(kind, (buffer.get(kind) ?? 0) + count);

      const flush = () => {
        for (const [k, n] of feedBuffer.current) {
          pushFeed(k, `you cleared ${n} ${STATION_KINDS[k].label}`);
        }
        feedBuffer.current = new Map();
        feedTimer.current = null;
      };

      if (feedTimer.current !== null) window.clearTimeout(feedTimer.current);
      feedTimer.current = window.setTimeout(flush, FEED_COALESCE_MS);
    },
    [pushFeed],
  );

  /**
   * Applies a snapshot, refusing anything stale.
   *
   * The API caches its read for a couple of seconds, so a poll can easily land after a write that
   * already included our contribution. Without the freshness guard that reads as the shared
   * counter stuttering backwards, which is exactly the kind of small wrongness that makes a page
   * feel broken.
   *
   * The feed deltas are computed here against a ref rather than inside the `setSnapshot` updater,
   * because React double-invokes updaters under StrictMode and a persistent feed would then show
   * every other-visitor clear twice.
   */
  const applySnapshot = useCallback(
    (next: LineSnapshot) => {
      const prev = lastFedSnapshot.current;
      if (!isFresher(next, prev)) return;
      lastFedSnapshot.current = next;

      for (const delta of ghostDelta(prev, next)) {
        // Net out this visitor's own flushed clears, so their action does not echo back a few
        // seconds later as a stranger's.
        const mineAvailable = Math.max(
          0,
          getFlushedRef.current(delta.kind) - (ghostAccounted.current[delta.kind] ?? 0),
        );
        const mine = Math.min(delta.count, mineAvailable);
        ghostAccounted.current[delta.kind] = (ghostAccounted.current[delta.kind] ?? 0) + mine;

        const others = delta.count - mine;
        if (others > 0) {
          pushFeed(delta.kind, `someone cleared ${others} ${STATION_KINDS[delta.kind].label}`);
        }
      }

      setSnapshot(next);
    },
    [pushFeed],
  );

  useEffect(() => {
    let cancelled = false;

    fetchLine()
      .then((fresh) => {
        if (!cancelled) applySnapshot(fresh);
      })
      .catch(() => {
        // A toy must never be able to break the homepage, so there is no error state here: the
        // game is fully playable locally and the shared numbers say honestly that they are absent.
        if (!cancelled) applySnapshot(seedSnapshot(Date.now()));
      });

  return () => {
      cancelled = true;
    };
  }, [applySnapshot]);

  useLinePoll({ active: inView, onSnapshot: applySnapshot, interactionNonce });

  const { registerClears, myClears, getFlushed } = useLineClicks({
    snapshot,
    active: inView,
    onSnapshot: applySnapshot,
    onUnsent: setUnsent,
  });
  getFlushedRef.current = getFlushed;

  // The heartbeat. The backlog is a function of the clock, so without this nothing would appear to
  // arrive until something else caused a render.
  useEffect(() => {
    if (!inView) return;
    const id = window.setInterval(() => setTick((n) => n + 1), TICK_MS);
    return () => window.clearInterval(id);
  }, [inView]);

  const now = Date.now();
  const lanes: LaneView[] = useMemo(() => {
    const preset = PRESETS[presetId];
    if (!snapshot) return [];

    return STATION_KIND_ORDER.map((kind, index) => ({
      kind,
      waiting: backlogForKind(snapshot, local, kind, now),
      automated: isUnlocked(snapshot, kind),
      taskLabel: preset.jobKinds[index % preset.jobKinds.length],
    }));
    // `now` is intentionally part of this: the whole point is that it recomputes as time passes.
  }, [snapshot, local, presetId, now]);

  const waitingTotal = snapshot ? totalBacklog(snapshot, local, now) : 0;
  const capTotal = snapshot ? totalCap(snapshot) : 0;
  const stress = snapshot ? stressLevel(snapshot, local, now) : 0;
  const target = snapshot ? nextUnlockTarget(snapshot) : null;

  useEffect(() => {
    setMood((previous) => moodFor(stress, previous));
  }, [stress]);

  /** One utterance per few seconds, coalesced, so a burst of clearing does not flood a screen reader. */
  const announceCleared = useCallback((kind: StationKind, count: number) => {
    const buffer = announceBuffer.current;
    buffer.tasks += count;
    buffer.kinds.add(kind);

    const emit = () => {
      const { tasks, kinds } = announceBuffer.current;
      if (tasks === 0) return;

      const message =
        kinds.size === 1
          ? `Cleared ${tasks} ${STATION_KINDS[[...kinds][0]].label} ${tasks === 1 ? 'task' : 'tasks'}.`
          : `Cleared ${tasks} tasks across ${kinds.size} kinds.`;

      setAnnouncement(message);
      announceAt.current = Date.now();
      announceBuffer.current = { tasks: 0, kinds: new Set() };
    };

    const since = Date.now() - announceAt.current;
    if (since >= ANNOUNCE_THROTTLE_MS) {
      emit();
      return;
    }

    if (announceTimer.current === null) {
      announceTimer.current = window.setTimeout(() => {
        announceTimer.current = null;
        emit();
      }, ANNOUNCE_THROTTLE_MS - since);
    }
  }, []);

  const clear = useCallback(
    (kind: StationKind, count: number, options?: { announce?: boolean }) => {
      if (!(count > 0)) return;

      const at = Date.now();
      setLocal((current) => {
        const next = advanceClearedThrough(current, kind, count, at);
        persistLocal(next);
        return next;
      });
      registerClears(kind, count);
      setInteractionNonce((n) => n + 1);
      setEverCleared(true);
      feedOwnClear(kind, count);
      if (options?.announce !== false) announceCleared(kind, count);
    },
    [announceCleared, feedOwnClear, persistLocal, registerClears],
  );

  /** A single token tapped on the belt. Never announced: one utterance per token is the firehose. */
  const clearOne = useCallback((kind: StationKind) => clear(kind, 1, { announce: false }), [clear]);

  const clearKind = useCallback(
    (kind: StationKind, viaKeyboard: boolean) => {
      const waiting = snapshot ? backlogForKind(snapshot, local, kind, Date.now()) : 0;
      // A keyboard user already hears the button's own label change, so announcing as well would
      // say it twice.
      clear(kind, waiting, { announce: !viaKeyboard });
    },
    [clear, local, snapshot],
  );

  const clearAll = useCallback(
    (viaKeyboard: boolean) => {
      if (!snapshot) return;
      const at = Date.now();
      let total = 0;
      const kinds: StationKind[] = [];

      for (const kind of STATION_KIND_ORDER) {
        const waiting = backlogForKind(snapshot, local, kind, at);
        if (waiting > 0) {
          clear(kind, waiting, { announce: false });
          total += waiting;
          kinds.push(kind);
        }
      }

      if (total > 0 && !viaKeyboard) {
        setAnnouncement(`Cleared ${total} tasks across ${kinds.length} kinds.`);
        announceAt.current = Date.now();
      }
    },
    [clear, local, snapshot],
  );

  // An unlock is the one moment worth interrupting for. It is marked seen once per browser, so a
  // reload does not replay someone else's.
  useEffect(() => {
    if (!snapshot) return;

    for (const kind of STATION_KIND_ORDER) {
      if (!isUnlocked(snapshot, kind) || seenUnlocks.current.has(kind)) continue;

      seenUnlocks.current.add(kind);
      saveSeenUnlocks(seenUnlocks.current);

      pushFeed(kind, `${STATION_KINDS[kind].label} is automated now, it clears itself from here on`);
      setAnnouncement(
        `${STATION_KINDS[kind].label} is now automated. It clears itself from here on, for everyone.`,
      );
      // Its column is gone, so the marker moves up: nothing of that kind is waiting any more.
      setLocal((current) => {
        const next = { clearedThrough: { ...current.clearedThrough, [kind]: Date.now() } };
        persistLocal(next);
        return next;
      });
    }
  }, [snapshot, persistLocal, pushFeed]);

  useEffect(() => {
    if (!inView || !snapshot || arrival) return;

    const automated = STATION_KIND_ORDER.filter((k) => isUnlocked(snapshot, k)).length;
    const manual = STATION_KIND_ORDER.length - automated;
    setArrival(
      `Six kinds of work arrive here. ${automated} ${automated === 1 ? 'is' : 'are'} automated and ` +
        `clear ${automated === 1 ? 'itself' : 'themselves'}. ${manual} are still done by hand, with ` +
        `${waitingTotal} waiting. Use the buttons below to clear one kind, or clear everything.`,
    );
  }, [inView, snapshot, arrival, waitingTotal]);

  useEffect(() => () => {
    if (feedTimer.current !== null) window.clearTimeout(feedTimer.current);
    if (announceTimer.current !== null) window.clearTimeout(announceTimer.current);
  }, []);

  function selectPreset(id: PresetId) {
    setPresetId(id);
    savePreset(id);
  }

  const feedShown: FeedRow[] =
    feedRows.length > 0
      ? feedRows
      : [
          {
            id: -1,
            kind: null,
            text:
              waitingTotal === 0 && capTotal > 0
                ? 'nothing waiting, the line is clear'
                : "your clears and other visitors' show up here",
          },
        ];

  return {
    reduce, compact, sectionRef, inView, snapshot, myClears, target, lanes, mood,
    waitingTotal, capTotal, feedShown, clearOne, clearKind, clearAll, unsent,
    presetId, selectPreset, everCleared, announcement, arrival,
  };
}
