import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Skeleton from '@mui/material/Skeleton';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useInView, useReducedMotion } from 'framer-motion';
import { Reveal } from '../motion/Reveal';
import { fetchLine } from '../../api/line';
import { PRESETS, PRESET_ORDER, type PresetId } from './line/presets';
import {
  STATION_KINDS,
  STATION_KIND_ORDER,
  advanceClearedThrough,
  backlogForKind,
  formatTaskCount,
  ghostDelta,
  isFresher,
  isUnlocked,
  moodFor,
  nextUnlockTarget,
  seedLocalProgress,
  seedSnapshot,
  stressLevel,
  totalBacklog,
  totalCap,
  type LineSnapshot,
  type LocalProgress,
  type Mood,
  type StationKind,
} from './line/lineModel';
import { Conveyor, type Ghost, type LaneView } from './line/Conveyor';
import { KindPanel } from './line/KindPanel';
import { TaskCounter } from './line/TaskCounter';
import { useLineClicks } from './line/useLineClicks';
import { useLinePoll } from './line/useLinePoll';

/**
 * "The Line" - the homepage's shared interaction, and the argument the whole site is making,
 * played rather than read.
 *
 * Six kinds of work arrive continuously. The automated ones clear themselves; the rest pile up in
 * front of their station until somebody clicks them away. Clicking works, and it keeps working for
 * about as long as you keep doing it: clear a column and it is full again in thirty seconds,
 * because clearing what is in front of you buys nothing against what has not arrived yet.
 *
 * What does change things is shared. Every visitor's clears accumulate toward a threshold, and when
 * one is crossed that kind becomes automated permanently, for everyone who ever visits afterwards.
 * So the lesson is delivered by the mechanics: manual effort is a treadmill, and the only thing
 * that changes the slope is the automation strangers built together.
 *
 * One kind is never automated. Some work is judgement.
 */

const CLEARED_KEY = 'hsl_line_cleared';
const UNLOCKS_KEY = 'hsl_line_unlocks';
const PRESET_KEY = 'hsl_line_preset';
/** Written by an earlier version of this section. Removed on sight so it cannot rot in browsers. */
const LEGACY_KEY = 'hsl_line_station';

const CONTACT_HREF = 'mailto:jonathan@HendersonSoftwareLabs.com?subject=Booking%20a%20Call';

/** The backlog is recomputed from the clock, so the view needs a heartbeat to show arrivals. */
const TICK_MS = 500;
const ANNOUNCE_THROTTLE_MS = 3000;
const GHOST_LIFETIME_MS = 2200;
/** A drop this large inside this window is what the machine visibly exhales at. */
const RELIEF_DROP = 0.25;
const RELIEF_WINDOW_MS = 2000;

function loadLocal(now: number): LocalProgress {
  try {
    const raw = localStorage.getItem(CLEARED_KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        const source = parsed as Record<string, unknown>;
        const seeded = seedLocalProgress(now);
        for (const kind of STATION_KIND_ORDER) {
          const value = source[kind];
          // A stored marker in the future would mean an empty pile forever, so it is capped at now.
          if (typeof value === 'number' && Number.isFinite(value)) {
            seeded.clearedThrough[kind] = Math.min(now, value);
          }
        }
        return seeded;
      }
    }
  } catch {
    /* private mode, disabled storage, or a hand-edited value - start with a full backlog */
  }
  return seedLocalProgress(now);
}

function loadSeenUnlocks(): Set<StationKind> {
  try {
    const raw = localStorage.getItem(UNLOCKS_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    if (Array.isArray(parsed)) {
      return new Set(parsed.filter((k): k is StationKind => STATION_KIND_ORDER.includes(k as StationKind)));
    }
  } catch {
    /* ignore */
  }
  return new Set();
}

function loadPreset(): PresetId {
  try {
    const value = localStorage.getItem(PRESET_KEY);
    if (value && value in PRESETS) return value as PresetId;
  } catch {
    /* ignore */
  }
  return 'ecommerce';
}

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

export function TheLine() {
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
  const [partyNonce, setPartyNonce] = useState(0);
  const [reliefNonce, setReliefNonce] = useState(0);
  const [gulpNonce, setGulpNonce] = useState(0);
  const [ghosts, setGhosts] = useState<Ghost[]>([]);
  const [announcement, setAnnouncement] = useState('');
  const [arrival, setArrival] = useState('');
  const [unsent, setUnsent] = useState(false);
  const [everCleared, setEverCleared] = useState(false);
  const [interactionNonce, setInteractionNonce] = useState(0);

  const seenUnlocks = useRef<Set<StationKind>>(loadSeenUnlocks());
  const ghostId = useRef(0);
  const stressHistory = useRef<Array<{ at: number; value: number }>>([]);
  const announceAt = useRef(0);
  const announceBuffer = useRef<{ tasks: number; kinds: Set<StationKind> }>({ tasks: 0, kinds: new Set() });
  const announceTimer = useRef<number | null>(null);

  useEffect(() => {
    try {
      localStorage.removeItem(LEGACY_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const persistLocal = useCallback((next: LocalProgress) => {
    try {
      localStorage.setItem(CLEARED_KEY, JSON.stringify(next.clearedThrough));
    } catch {
      /* private mode - the backlog simply starts full again next time, which is no great loss */
    }
  }, []);

  /**
   * Applies a snapshot, refusing anything stale.
   *
   * The API caches its read for a couple of seconds, so a poll can easily land after a write that
   * already included our contribution. Without this guard that reads as the shared counter
   * stuttering backwards, which is exactly the kind of small wrongness that makes a page feel
   * broken.
   */
  const applySnapshot = useCallback((next: LineSnapshot) => {
    setSnapshot((current) => {
      if (!isFresher(next, current)) return current;

      const deltas = ghostDelta(current, next);
      if (deltas.length > 0) {
        const stamped = deltas.map((d) => ({ id: (ghostId.current += 1), kind: d.kind, count: d.count }));
        setGhosts((existing) => [...existing, ...stamped]);
        const ids = new Set(stamped.map((g) => g.id));
        window.setTimeout(() => setGhosts((existing) => existing.filter((g) => !ids.has(g.id))), GHOST_LIFETIME_MS);
      }

      return next;
    });
  }, []);

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

  const { registerClears, myClears } = useLineClicks({
    snapshot,
    active: inView,
    onSnapshot: applySnapshot,
    onUnsent: setUnsent,
  });

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

  // A sharp drop is the machine's cue to exhale. Comparing against a short history rather than the
  // previous frame means a steady grind does not trigger it, only actually getting on top of things.
  useEffect(() => {
    const history = stressHistory.current;
    history.push({ at: now, value: stress });
    while (history.length > 0 && now - history[0].at > RELIEF_WINDOW_MS) history.shift();

    if (history.length > 1 && history[0].value - stress > RELIEF_DROP) {
      stressHistory.current = [{ at: now, value: stress }];
      setReliefNonce((n) => n + 1);
    }
  }, [stress, now]);

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
      setGulpNonce((n) => n + 1);
      setInteractionNonce((n) => n + 1);
      setEverCleared(true);
      if (options?.announce !== false) announceCleared(kind, count);
    },
    [announceCleared, persistLocal, registerClears],
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

  // An unlock is the one moment worth interrupting for. It is celebrated once per browser, so a
  // reload does not replay someone else's confetti.
  useEffect(() => {
    if (!snapshot) return;

    for (const kind of STATION_KIND_ORDER) {
      if (!isUnlocked(snapshot, kind) || seenUnlocks.current.has(kind)) continue;

      seenUnlocks.current.add(kind);
      try {
        localStorage.setItem(UNLOCKS_KEY, JSON.stringify([...seenUnlocks.current]));
      } catch {
        /* ignore */
      }

      setPartyNonce((n) => n + 1);
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
  }, [snapshot, persistLocal]);

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

  function selectPreset(id: PresetId) {
    setPresetId(id);
    try {
      localStorage.setItem(PRESET_KEY, id);
    } catch {
      /* ignore */
    }
  }

  return (
    <Container ref={sectionRef} maxWidth="lg" id="the-line" sx={{ py: { xs: 4, md: 5 } }}>
      <Reveal>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 700, letterSpacing: 1 }}>
            See it work
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', mt: 1 }}>
            Work piles up. Clear some.
          </Typography>
          <Typography sx={{ mt: 1.5, color: 'text.secondary', maxWidth: 620, mx: 'auto' }}>
            The automated kinds clear themselves. The rest wait for a person. Every task visitors
            clear by hand counts toward automating another kind for good, for everyone.
          </Typography>
        </Box>
      </Reveal>

      <Reveal delay={0.08} fullWidth>
        <Box
          sx={{ maxWidth: 980, mx: 'auto' }}
          data-backlog={waitingTotal}
          data-cap={capTotal}
          data-unlocked={snapshot ? snapshot.unlockedCount : 0}
        >
          <Box
            sx={{
              borderRadius: { xs: 3, sm: 4 },
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: '0 24px 48px -24px rgba(15, 23, 42, 0.28)',
              bgcolor: '#ffffff',
              overflow: 'hidden',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: { xs: 'flex-start', sm: 'flex-end' },
                justifyContent: 'space-between',
                flexDirection: { xs: 'column', sm: 'row' },
                gap: 1,
                px: { xs: 2, sm: 3 },
                pt: { xs: 2, sm: 2.5 },
                pb: 1,
              }}
            >
              <Box>
                {snapshot ? (
                  <Typography
                    sx={{
                      fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
                      fontWeight: 800,
                      fontSize: { xs: 26, md: 32 },
                      lineHeight: 1,
                      letterSpacing: '-0.02em',
                      color: 'primary.main',
                    }}
                  >
                    <TaskCounter snapshot={snapshot} active={inView} reduce={reduce} />
                    <Box
                      component="span"
                      sx={{ ml: 1, fontSize: { xs: 13, md: 15 }, fontWeight: 700, color: 'text.secondary' }}
                    >
                      handled by the automated kinds
                    </Box>
                  </Typography>
                ) : (
                  <Skeleton variant="text" width={260} height={38} />
                )}

                <Typography sx={{ mt: 0.5, fontSize: 12.5, color: 'text.secondary' }}>
                  {snapshot?.offline
                    ? 'Playable here, but we could not reach the shared count.'
                    : `${formatTaskCount(snapshot?.totalHandCleared ?? 0)} cleared by hand by visitors` +
                      (myClears > 0 ? `, ${formatTaskCount(myClears)} of them by you` : '')}
                </Typography>
              </Box>

              {target && !snapshot?.offline && (
                <Box sx={{ minWidth: { xs: '100%', sm: 210 } }}>
                  <Typography sx={{ fontSize: 11.5, color: 'text.secondary', mb: 0.5 }}>
                    Next to be automated: <strong>{STATION_KINDS[target.kind].label}</strong>
                  </Typography>
                  <Box sx={{ height: 6, borderRadius: 9999, bgcolor: '#eef2f7', overflow: 'hidden' }}>
                    <Box
                      sx={{
                        width: `${Math.round(target.progress * 100)}%`,
                        height: '100%',
                        borderRadius: 9999,
                        bgcolor: 'primary.main',
                        transition: 'width 0.6s ease',
                      }}
                    />
                  </Box>
                  <Typography sx={{ mt: 0.5, fontSize: 11, color: 'text.disabled', fontVariantNumeric: 'tabular-nums' }}>
                    {formatTaskCount(snapshot?.kinds[target.kind].handCleared ?? 0)} of{' '}
                    {formatTaskCount(target.threshold)}
                  </Typography>
                </Box>
              )}
            </Box>

            {snapshot ? (
              <Conveyor
                lanes={lanes}
                ghosts={ghosts}
                stress={stress}
                mood={mood}
                active={inView}
                reduce={reduce}
                layout={compact ? 'narrow' : 'wide'}
                partyNonce={partyNonce}
                reliefNonce={reliefNonce}
                gulpNonce={gulpNonce}
                onClearOne={clearOne}
              />
            ) : (
              <Skeleton variant="rectangular" height={190} />
            )}

            <Box sx={{ px: { xs: 2, sm: 3 }, pb: 2 }}>
              <KindPanel
                lanes={lanes.map(({ kind, waiting, automated }) => ({ kind, waiting, automated }))}
                totalWaiting={waitingTotal}
                onClearKind={clearKind}
                onClearAll={clearAll}
              />
            </Box>

            <Box
              sx={{
                px: { xs: 2, sm: 3 },
                py: 1.25,
                borderTop: '1px solid',
                borderColor: 'divider',
                bgcolor: '#fbfcfd',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 1,
              }}
            >
              <Typography sx={{ fontSize: 11.5, color: 'text.disabled' }}>
                A simulation, for fun. These are this site's own pretend tasks, not client work.
                {unsent ? ' Your clears will join the shared count when you are back online.' : ''}
              </Typography>

              <Box role="group" aria-label="Example work" sx={{ display: 'flex', gap: 0.5 }}>
                {PRESET_ORDER.map((id) => (
                  <Box
                    key={id}
                    component="button"
                    type="button"
                    aria-pressed={presetId === id}
                    onClick={() => selectPreset(id)}
                    sx={{
                      px: 1.25,
                      py: 0.35,
                      borderRadius: 9999,
                      fontFamily: 'inherit',
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: 'pointer',
                      border: '1px solid',
                      borderColor: presetId === id ? 'primary.main' : 'divider',
                      bgcolor: presetId === id ? 'primary.main' : '#ffffff',
                      color: presetId === id ? 'primary.contrastText' : 'text.secondary',
                      outline: 'none',
                      '&:focus-visible': { boxShadow: '0 0 0 3px rgba(37, 99, 235, 0.35)' },
                    }}
                  >
                    {PRESETS[id].label}
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>

          {everCleared && waitingTotal === 0 && capTotal > 0 && (
            <Box
              sx={{
                mt: 2,
                p: { xs: 2, sm: 2.5 },
                borderRadius: 3,
                border: '1px solid',
                borderColor: '#bfdbfe',
                bgcolor: 'primary.light',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 2,
              }}
            >
              <Box>
                <Typography sx={{ fontWeight: 800, color: 'text.primary', fontSize: 15 }}>
                  Cleared. It will be full again in thirty seconds.
                </Typography>
                <Typography sx={{ mt: 0.5, fontSize: 13.5, color: 'text.secondary' }}>
                  The automated kinds did not need you at all. That is the entire difference, and it
                  is the one we build for real.
                </Typography>
              </Box>
              <Button variant="contained" href={CONTACT_HREF} endIcon={<ArrowForwardIcon />} sx={{ flexShrink: 0 }}>
                Tell me what backs up in your week
              </Button>
            </Box>
          )}

          <Box aria-live="polite" sx={srOnly}>
            {announcement}
          </Box>
          <Box role="status" sx={srOnly}>
            {arrival}
          </Box>
        </Box>
      </Reveal>
    </Container>
  );
}

/**
 * Visually hidden, but still read aloud.
 *
 * The units here are spelled out on purpose. MUI's `sx` treats a bare `width: 1` as `100%` rather
 * than one pixel, which turned both of these live regions into full-viewport absolutely
 * positioned boxes. They stayed invisible thanks to the clip, so the only symptom was the whole
 * page gaining a horizontal scrollbar at narrower desktop widths.
 */
const srOnly = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: 0,
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
  border: 0,
} as const;
