import { useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { AnimatePresence, motion } from 'framer-motion';
import { MOOD_LABELS, type Mood, type StationKind } from './lineModel';
import { KindLane } from './KindLane';
import { Machine } from './Machine';

/**
 * The belt: six fixed lanes with the machine at the end of them.
 *
 * The lanes never change in number or order, so unlike the version this replaces there is no
 * horizontal scroller, no measuring, and nothing to scroll into view. Work sits in front of its
 * own station and the machine sits where all of it ends up.
 *
 * One rAF loop drives the tokens travelling along the belt. It writes `transform` straight to the
 * nodes it captured by ref, so React never re-renders on a frame, and it is fully stopped when the
 * section is off screen, when the tab is hidden, or under reduced motion. The travelling tokens
 * live in an overlay that does not belong to any lane, because the belt looks the same everywhere
 * and a fixed pool of a dozen reads correctly at any width.
 */

const TOKEN_SPEED = 62;
const TOKEN_GAP = 148;
const BELT_INSET = 14;

export interface LaneView {
  kind: StationKind;
  waiting: number;
  automated: boolean;
  taskLabel: string;
}

export interface Ghost {
  id: number;
  kind: StationKind;
  count: number;
}

interface ConveyorProps {
  lanes: LaneView[];
  ghosts: Ghost[];
  stress: number;
  mood: Mood;
  active: boolean;
  reduce: boolean;
  layout: 'belt' | 'grid';
  partyNonce: number;
  reliefNonce: number;
  onClearOne: (kind: StationKind) => void;
}

export function Conveyor({
  lanes,
  ghosts,
  stress,
  mood,
  active,
  reduce,
  layout,
  partyNonce,
  reliefNonce,
  onClearOne,
}: ConveyorProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const tokenRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [trackW, setTrackW] = useState(0);

  const grid = layout === 'grid';
  const tokenCount = trackW > 0 ? Math.ceil(trackW / TOKEN_GAP) + 2 : 0;

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    const measure = () => setTrackW(el.clientWidth);
    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!active || reduce || tokenCount === 0) return;

    let raf = 0;
    let alive = true;
    let last = performance.now();
    let offset = 0;
    const span = tokenCount * TOKEN_GAP;

    const step = (nowMs: number) => {
      if (!alive) return;

      // The clamp keeps a restored tab from teleporting every token across the belt at once.
      const dt = Math.min(0.05, (nowMs - last) / 1000);
      last = nowMs;
      offset = (offset + TOKEN_SPEED * dt) % span;

      for (let k = 0; k < tokenCount; k += 1) {
        const node = tokenRefs.current[k];
        if (!node) continue;
        const x = ((offset + k * TOKEN_GAP) % span) - TOKEN_GAP;
        node.style.transform = `translateX(${x.toFixed(1)}px)`;
      }

      raf = requestAnimationFrame(step);
    };

    const onVisibility = () => {
      if (document.hidden) {
        alive = false;
        cancelAnimationFrame(raf);
      } else if (!alive) {
        alive = true;
        last = performance.now();
        raf = requestAnimationFrame(step);
      }
    };

    document.addEventListener('visibilitychange', onVisibility);
    raf = requestAnimationFrame(step);

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [active, reduce, tokenCount]);

  const laneNodes = lanes.map((lane) => (
    <Box key={lane.kind} sx={{ position: 'relative', flex: grid ? '1 1 40%' : '0 0 auto' }}>
      <KindLane
        kind={lane.kind}
        waiting={lane.waiting}
        automated={lane.automated}
        layout={layout}
        reduce={reduce}
        taskLabel={lane.taskLabel}
        onClearOne={onClearOne}
      />

      <AnimatePresence>
        {ghosts
          .filter((ghost) => ghost.kind === lane.kind)
          .map((ghost) => (
            <Box
              key={ghost.id}
              component={motion.div}
              aria-hidden
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: -8 }}
              exit={{ opacity: 0, y: -18 }}
              transition={{ duration: reduce ? 0 : 0.5, ease: 'easeOut' }}
              sx={{
                position: 'absolute',
                top: -6,
                left: '50%',
                transform: 'translateX(-50%)',
                px: 0.75,
                py: 0.2,
                borderRadius: 9999,
                bgcolor: '#eef2f7',
                color: '#64748b',
                fontSize: 10,
                fontWeight: 800,
                whiteSpace: 'nowrap',
                pointerEvents: 'none',
              }}
            >
              {`-${ghost.count} by someone else`}
            </Box>
          ))}
      </AnimatePresence>
    </Box>
  ));

  return (
    <Box sx={{ position: 'relative', px: { xs: 1.5, sm: 2 }, pb: 1 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: grid ? 'stretch' : 'flex-end',
          justifyContent: grid ? 'space-between' : 'space-between',
          flexWrap: grid ? 'wrap' : 'nowrap',
          gap: grid ? 1.25 : 1,
        }}
      >
        {laneNodes}

        {!grid && (
          <Box sx={{ flex: '0 0 auto', width: 116, alignSelf: 'flex-end', mb: -1 }}>
            <MachineWithChip
              stress={stress}
              mood={mood}
              reduce={reduce}
              partyNonce={partyNonce}
              reliefNonce={reliefNonce}
            />
          </Box>
        )}
      </Box>

      {/* the belt the work travels along */}
      <Box ref={trackRef} sx={{ position: 'relative', height: grid ? 74 : 34, mt: grid ? 1 : 0.5 }}>
        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            left: BELT_INSET,
            right: BELT_INSET,
            top: grid ? 30 : 10,
            height: 6,
            borderRadius: 9999,
            bgcolor: '#e7ecf2',
          }}
        />

        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            left: BELT_INSET,
            right: BELT_INSET,
            top: grid ? 24 : 4,
            height: 18,
            overflow: 'hidden',
            pointerEvents: 'none',
          }}
        >
          {Array.from({ length: tokenCount }, (_, k) => (
            <Box
              key={k}
              ref={(el: HTMLDivElement | null) => {
                tokenRefs.current[k] = el;
              }}
              sx={{
                position: 'absolute',
                left: 0,
                top: 2,
                width: 22,
                height: 14,
                borderRadius: 1,
                bgcolor: '#ffffff',
                border: '1px solid',
                borderColor: '#cbd5e1',
              }}
              style={{ transform: `translateX(${k * TOKEN_GAP - TOKEN_GAP}px)` }}
            />
          ))}
        </Box>

        {grid && (
          <Box sx={{ position: 'absolute', right: 0, top: -12, width: 92 }}>
            <MachineWithChip
              stress={stress}
              mood={mood}
              reduce={reduce}
              partyNonce={partyNonce}
              reliefNonce={reliefNonce}
            />
          </Box>
        )}
      </Box>
    </Box>
  );
}

/**
 * The machine plus the plain-words version of how it is doing.
 *
 * The chip is not a fallback for the face, it ships alongside it always. The lamp changing from
 * green to amber is meaningless to anyone who cannot distinguish them, unreadable at a glance for
 * plenty of people who can, and invisible to a screen reader. Words solve all three.
 */
function MachineWithChip({
  stress,
  mood,
  reduce,
  partyNonce,
  reliefNonce,
}: {
  stress: number;
  mood: Mood;
  reduce: boolean;
  partyNonce: number;
  reliefNonce: number;
}) {
  const tone =
    mood === 'calm'
      ? { bg: '#ecfdf5', fg: '#047857' }
      : mood === 'busy'
        ? { bg: '#fffbeb', fg: '#b45309' }
        : { bg: '#fef2f2', fg: '#b91c1c' };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
      <Box sx={{ width: '100%', aspectRatio: '1 / 1' }}>
        <Machine
          stress={stress}
          mood={mood}
          reduce={reduce}
          partyNonce={partyNonce}
          reliefNonce={reliefNonce}
        />
      </Box>
      <Typography
        data-mood={mood}
        sx={{
          px: 1,
          py: 0.25,
          borderRadius: 9999,
          bgcolor: tone.bg,
          color: tone.fg,
          fontSize: 10.5,
          fontWeight: 800,
          whiteSpace: 'nowrap',
        }}
      >
        {MOOD_LABELS[mood]}
      </Typography>
    </Box>
  );
}
