import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { AnimatePresence, motion } from 'framer-motion';
import { MOOD_LABELS, type Mood, type StationKind } from './lineModel';
import { KindLane } from './KindLane';
import { Machine } from './Machine';
import { STATION_THEME, BELT_EDGE, BELT_TREAD, STAGE_BG, STAGE_DOT, STAGE_DOT_SIZE } from './stationTheme';

/**
 * The stage: every station, the belt that connects them, and the machine they all feed.
 *
 * Two rules govern this layout, both learned by looking at it rather than measuring it. Work has
 * to rest physically on the belt, because a belt with a gap underneath the work is not a belt, it
 * is a rule drawn beneath some floating cards. And nothing may depend on a negative margin to
 * reach its position, because the stage clips its overflow: the machine and its status chip were
 * being sliced in half at the wide breakpoint, which is the one thing on screen a visitor most
 * needs to be able to read.
 *
 * So the machine sits inside the row, bottom-aligned like every lane, and its status reads on a
 * line of its own below the belt where nothing can crop it.
 */

const BELT_H = 18;
const SPINE_W = 11;
const MACHINE_WIDE = 140;
const MACHINE_NARROW = 128;

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
  layout: 'wide' | 'narrow';
  partyNonce: number;
  reliefNonce: number;
  gulpNonce: number;
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
  gulpNonce,
  onClearOne,
}: ConveyorProps) {
  const narrow = layout === 'narrow';
  const running = active && !reduce;
  const size = narrow ? MACHINE_NARROW : MACHINE_WIDE;

  const machine = (
    <Box sx={{ width: size, height: size, flexShrink: 0 }}>
      <Machine
        stress={stress}
        mood={mood}
        reduce={reduce}
        partyNonce={partyNonce}
        reliefNonce={reliefNonce}
        gulpNonce={gulpNonce}
      />
    </Box>
  );

  const stage = (
    <Box
      sx={{
        position: 'relative',
        ...(narrow ? { mx: 1.25, mb: 2 } : {}),
        borderRadius: 3,
        background: STAGE_BG,
        backgroundImage: `${STAGE_DOT}, ${STAGE_BG}`,
        backgroundSize: `${STAGE_DOT_SIZE}, auto`,
        border: '1px solid',
        borderColor: '#e2e8f0',
        boxShadow: 'inset 0 1px 3px rgba(15, 23, 42, 0.06)',
        overflow: 'hidden',
        px: narrow ? 1 : 2.5,
        py: narrow ? 1.5 : 2,
      }}
    >
      {narrow ? (
        <Box sx={{ position: 'relative', pl: `${SPINE_W + 6}px` }}>
          <Belt vertical running={running} />

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {lanes.map((lane) => (
              <Box key={lane.kind} sx={{ position: 'relative' }}>
                {/* the tie from the spine to this station */}
                <Box
                  aria-hidden
                  sx={{
                    position: 'absolute',
                    left: `-${SPINE_W / 2 + 6}px`,
                    top: 22,
                    width: SPINE_W / 2 + 6,
                    height: 2,
                    bgcolor: BELT_EDGE,
                  }}
                />
                <LaneWithGhosts
                  lane={lane}
                  ghosts={ghosts}
                  layout="narrow"
                  reduce={reduce}
                  onClearOne={onClearOne}
                />
              </Box>
            ))}
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 1, ml: `-${SPINE_W + 10}px` }}>
            {machine}
            <MoodChip mood={mood} />
          </Box>
        </Box>
      ) : (
        <Box sx={{ position: 'relative', pb: `${BELT_H}px` }}>
          {/* Runs the full width of the stage and straight out at the machine waiting on its edge. */}
          <Belt running={running} />

          <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 1 }}>
            {lanes.map((lane) => (
              <LaneWithGhosts
                key={lane.kind}
                lane={lane}
                ghosts={ghosts}
                layout="wide"
                reduce={reduce}
                onClearOne={onClearOne}
              />
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );

  if (narrow) return stage;

  // The machine is not part of the work area, it is what the work area feeds. Keeping it outside
  // lets the stage be exactly as big as the line, and stops a 140px character dictating the
  // height of six 120px lanes.
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 0, mx: 2, mb: 2 }}>
      <Box sx={{ flexGrow: 1, minWidth: 0 }}>{stage}</Box>
      {/*
        * Pulled left by the transparent margin inside the SVG, so the mouth lands on the end of
        * the belt rather than a finger's width away from it. Safe here in a way it was not
        * before: the machine now sits outside the stage, so nothing clips it.
        */}
      <Box
        sx={{
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          pb: 0.5,
          ml: '-16px',
        }}
      >
        {machine}
        <MoodChip mood={mood} />
      </Box>
    </Box>
  );
}

/**
 * The belt. Shaded like a cylinder rather than drawn as a line, because a flat bar of even ticks
 * under the work reads as a ruler, which is precisely how the first attempt looked.
 */
function Belt({
  vertical = false,
  running,
  endInset = 0,
}: {
  vertical?: boolean;
  running: boolean;
  /** Pulls the belt's far end back so it terminates inside the machine rather than past it. */
  endInset?: number;
}) {
  return (
    <Box
      aria-hidden
      sx={{
        position: 'absolute',
        ...(vertical
          ? { left: 0, top: 6, bottom: 6, width: SPINE_W }
          : { left: 0, right: endInset, bottom: 0, height: BELT_H }),
        borderRadius: 9999,
        background: vertical
          ? 'linear-gradient(90deg, #cbd5e1 0%, #e6ebf1 45%, #b3c0cf 100%)'
          : 'linear-gradient(180deg, #e6ebf1 0%, #cbd5e1 45%, #a9b7c6 100%)',
        border: '1px solid',
        borderColor: BELT_EDGE,
        boxShadow: 'inset 0 1px 2px rgba(15, 23, 42, 0.18)',
        overflow: 'hidden',
      }}
    >
      {running && (
        <Box
          component={motion.div}
          animate={vertical ? { y: [0, 26] } : { x: [0, 26] }}
          transition={{ duration: 1.1, repeat: Infinity, ease: 'linear' }}
          sx={{
            position: 'absolute',
            ...(vertical
              ? { left: 0, right: 0, top: -26, height: 'calc(100% + 52px)' }
              : { top: 0, bottom: 0, left: -26, width: 'calc(100% + 52px)' }),
            backgroundImage: `repeating-linear-gradient(${vertical ? '180deg' : '90deg'}, transparent 0 18px, ${BELT_TREAD} 18px 26px)`,
          }}
        />
      )}
    </Box>
  );
}

/**
 * How the machine is doing, in words.
 *
 * This ships alongside the face rather than instead of it. A lamp changing colour is invisible to
 * a screen reader, easy to miss at a glance, and meaningless to anyone who cannot separate the
 * two hues, so the state is never carried by colour alone.
 */
function MoodChip({ mood }: { mood: Mood }) {
  const tone =
    mood === 'calm'
      ? { bg: '#ecfdf5', fg: '#047857', edge: '#a7f3d0' }
      : mood === 'busy'
        ? { bg: '#fffbeb', fg: '#b45309', edge: '#fde68a' }
        : { bg: '#fff7ed', fg: '#c2410c', edge: '#fed7aa' };

  return (
    <Typography
      data-mood={mood}
      sx={{
        px: 1.25,
        py: 0.35,
        borderRadius: 9999,
        bgcolor: tone.bg,
        color: tone.fg,
        border: '1px solid',
        borderColor: tone.edge,
        fontSize: 11,
        fontWeight: 800,
        whiteSpace: 'nowrap',
      }}
    >
      {MOOD_LABELS[mood]}
    </Typography>
  );
}

function LaneWithGhosts({
  lane,
  ghosts,
  layout,
  reduce,
  onClearOne,
}: {
  lane: LaneView;
  ghosts: Ghost[];
  layout: 'wide' | 'narrow';
  reduce: boolean;
  onClearOne: (kind: StationKind) => void;
}) {
  const mine = ghosts.filter((ghost) => ghost.kind === lane.kind);

  return (
    <Box sx={{ position: 'relative', flexShrink: 0 }}>
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
        {mine.map((ghost) => (
          <Box
            key={ghost.id}
            component={motion.div}
            aria-hidden
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: -10 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: reduce ? 0 : 0.5, ease: 'easeOut' }}
            sx={{
              position: 'absolute',
              top: -6,
              right: 0,
              px: 0.75,
              py: 0.2,
              borderRadius: 9999,
              bgcolor: '#ffffff',
              border: '1px solid',
              borderColor: STATION_THEME[lane.kind].edge,
              color: STATION_THEME[lane.kind].ink,
              fontSize: 9.5,
              fontWeight: 800,
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
              boxShadow: '0 2px 6px rgba(15, 23, 42, 0.12)',
              zIndex: 2,
            }}
          >
            {`someone cleared ${ghost.count}`}
          </Box>
        ))}
      </AnimatePresence>
    </Box>
  );
}
