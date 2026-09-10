import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { AnimatePresence, motion } from 'framer-motion';
import { MOOD_LABELS, type Mood, type StationKind } from './lineModel';
import { KindLane } from './KindLane';
import { Machine } from './Machine';
import { STATION_THEME, BELT_BODY, BELT_EDGE, BELT_TREAD, STAGE_BG, STAGE_DOT, STAGE_DOT_SIZE } from './stationTheme';

/**
 * The stage: every station, the belt that connects them, and the machine they all feed.
 *
 * The thing this is fixing is that six outlined cards floating on white read as a form, not a
 * machine. So there is a tinted ground with a little texture, the belt physically runs through
 * every station and into the machine's mouth, and work sits *on* the belt rather than near it.
 * The point is that a visitor should see one apparatus, not six widgets.
 *
 * On a wide screen the belt runs left to right with the machine at the end. On a narrow one it
 * becomes a vertical spine with stations hanging off it, which is a real layout rather than a
 * reflowed compromise: six cards in a grid with a stray belt underneath communicated nothing.
 *
 * The belt treads are one transform-animated strip rather than a pool of moving nodes. The old
 * version put a handful of white tokens on a grey bar, which at this width read unmistakably as a
 * slider handle.
 */

const BELT_H = 14;
const SPINE_W = 11;

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

  const machine = (
    <MachineWithChip
      stress={stress}
      mood={mood}
      reduce={reduce}
      partyNonce={partyNonce}
      reliefNonce={reliefNonce}
      gulpNonce={gulpNonce}
      size={narrow ? 128 : 118}
    />
  );

  return (
    <Box
      sx={{
        position: 'relative',
        mx: { xs: 1.25, sm: 2 },
        mb: 2,
        borderRadius: 3,
        background: STAGE_BG,
        backgroundImage: `${STAGE_DOT}, ${STAGE_BG}`,
        backgroundSize: `${STAGE_DOT_SIZE}, auto`,
        border: '1px solid',
        borderColor: '#e2e8f0',
        boxShadow: 'inset 0 1px 3px rgba(15, 23, 42, 0.06)',
        overflow: 'hidden',
        px: narrow ? 1 : 2,
        py: narrow ? 1.5 : 2,
      }}
    >
      {narrow ? (
        <Box sx={{ position: 'relative', pl: `${SPINE_W + 6}px` }}>
          {/* the spine: one belt running down, with every station hanging off it */}
          <Box
            aria-hidden
            sx={{
              position: 'absolute',
              left: 0,
              top: 6,
              bottom: 6,
              width: SPINE_W,
              borderRadius: 9999,
              bgcolor: BELT_BODY,
              border: '1px solid',
              borderColor: BELT_EDGE,
              overflow: 'hidden',
            }}
          >
            {running && (
              <Box
                component={motion.div}
                animate={{ y: [0, 24] }}
                transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
                sx={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: -24,
                  height: 'calc(100% + 48px)',
                  backgroundImage: `repeating-linear-gradient(180deg, transparent 0 14px, ${BELT_TREAD} 14px 18px)`,
                }}
              />
            )}
          </Box>

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

          <Box sx={{ display: 'flex', justifyContent: 'flex-start', mt: 1, ml: `-${SPINE_W + 10}px` }}>
            {machine}
          </Box>
        </Box>
      ) : (
        <Box sx={{ position: 'relative', pb: `${BELT_H + 4}px` }}>
          {/* the belt every station sits on, running out into the machine */}
          <Box
            aria-hidden
            sx={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              height: BELT_H,
              borderRadius: 9999,
              bgcolor: BELT_BODY,
              border: '1px solid',
              borderColor: BELT_EDGE,
              overflow: 'hidden',
            }}
          >
            {running && (
              <Box
                component={motion.div}
                animate={{ x: [0, 24] }}
                transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
                sx={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  left: -24,
                  width: 'calc(100% + 48px)',
                  backgroundImage: `repeating-linear-gradient(90deg, transparent 0 8px, ${BELT_TREAD} 8px 12px)`,
                }}
              />
            )}
          </Box>

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

            <Box sx={{ flexShrink: 0, alignSelf: 'flex-end', mb: `-${BELT_H + 4}px` }}>{machine}</Box>
          </Box>
        </Box>
      )}
    </Box>
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
              top: -4,
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
            }}
          >
            {`someone cleared ${ghost.count}`}
          </Box>
        ))}
      </AnimatePresence>
    </Box>
  );
}

/**
 * The machine plus the plain-words version of how it is doing.
 *
 * The chip is not a fallback for the face, it ships alongside it always. A lamp changing from
 * green to amber is meaningless to anyone who cannot distinguish them, easy to miss at a glance
 * for everyone else, and invisible to a screen reader. Words solve all three.
 */
function MachineWithChip({
  stress,
  mood,
  reduce,
  partyNonce,
  reliefNonce,
  gulpNonce,
  size,
}: {
  stress: number;
  mood: Mood;
  reduce: boolean;
  partyNonce: number;
  reliefNonce: number;
  gulpNonce: number;
  size: number;
}) {
  const tone =
    mood === 'calm'
      ? { bg: '#ecfdf5', fg: '#047857', edge: '#a7f3d0' }
      : mood === 'busy'
        ? { bg: '#fffbeb', fg: '#b45309', edge: '#fde68a' }
        : { bg: '#fff7ed', fg: '#c2410c', edge: '#fed7aa' };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.25, width: size }}>
      <Box sx={{ width: size, height: size }}>
        <Machine
          stress={stress}
          mood={mood}
          reduce={reduce}
          partyNonce={partyNonce}
          reliefNonce={reliefNonce}
          gulpNonce={gulpNonce}
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
          border: '1px solid',
          borderColor: tone.edge,
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
