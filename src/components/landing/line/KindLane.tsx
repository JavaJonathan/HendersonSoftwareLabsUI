import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { AnimatePresence, motion } from 'framer-motion';
import { STATION_KINDS, type StationKind } from './lineModel';
import { STATION_ICONS } from './stationIcons';
import { NEUTRAL_BORDER, STATION_THEME } from './stationTheme';
import {
  HIT_H,
  HIT_W,
  PILE_COLS_NARROW,
  PILE_COLS_WIDE,
  TOKEN_BORDER,
  TOKEN_H,
  TOKEN_W,
  pileHeight,
  pileWidth,
  slotFor,
} from './pileModel';

/**
 * One station on the line: what it does, whether it runs itself, and the work waiting in front
 * of it.
 *
 * The single most important thing this component does is show an automated station *eating*. A
 * lane that clears itself sitting right beside a lane that is visibly stacking up is the entire
 * argument the section exists to make, and it has to be watchable, not described. So an automated
 * station has a task dropping into it on a loop, forever, whether or not anyone is clicking.
 *
 * Tasks are drawn as little documents rather than plain rectangles, with a tab in their own
 * kind's colour. That is what makes a pile readable at a glance: six columns of identical grey
 * boxes tell you nothing, but a wall of amber tells you invoicing is what is drowning you.
 *
 * The tokens are pointer targets only. Thirty appearing and vanishing elements would be thirty
 * tab stops and a screen-reader firehose, so they are `aria-hidden` and the equivalent keyboard
 * path lives in KindPanel, where one press clears a whole column.
 */

interface KindLaneProps {
  kind: StationKind;
  waiting: number;
  automated: boolean;
  layout: 'wide' | 'narrow';
  reduce: boolean;
  /** The example work item riding this lane, from the industry preset. */
  taskLabel: string;
  onClearOne: (kind: StationKind) => void;
}

export function KindLane({
  kind,
  waiting,
  automated,
  layout,
  reduce,
  taskLabel,
  onClearOne,
}: KindLaneProps) {
  const Icon = STATION_ICONS[kind];
  const meta = STATION_KINDS[kind];
  const theme = STATION_THEME[kind];
  const narrow = layout === 'narrow';
  const cols = narrow ? PILE_COLS_NARROW : PILE_COLS_WIDE;

  const station = (
    <Box
      sx={{
        position: 'relative',
        width: narrow ? 150 : '100%',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        gap: 0.75,
        px: 1,
        py: 0.75,
        borderRadius: 2,
        overflow: 'hidden',
        bgcolor: automated ? theme.wash : '#ffffff',
        border: '1px solid',
        borderColor: automated ? theme.edge : NEUTRAL_BORDER,
        boxShadow: automated
          ? `0 1px 0 ${theme.edge}`
          : '0 1px 2px rgba(15, 23, 42, 0.06)',
      }}
    >
      {/* the kind's colour, always present so the lane is identifiable even when empty */}
      <Box
        aria-hidden
        sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, bgcolor: theme.ink }}
      />

      <Icon sx={{ fontSize: 17, color: theme.ink, flexShrink: 0, ml: 0.25 }} />

      <Box sx={{ minWidth: 0, flexGrow: 1 }}>
        <Typography
          sx={{
            fontSize: 12,
            fontWeight: 800,
            color: 'text.primary',
            lineHeight: 1.15,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {meta.label}
        </Typography>
        <Typography
          sx={{
            fontSize: 9.5,
            lineHeight: 1.2,
            color: automated ? theme.ink : 'text.disabled',
            fontWeight: automated ? 700 : 500,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {automated ? 'runs itself' : taskLabel}
        </Typography>
      </Box>
    </Box>
  );

  const pile = (
    <Box
      role="group"
      aria-label={
        automated
          ? `${meta.label} is automated and clears itself.`
          : `${meta.label}, ${waiting} ${waiting === 1 ? 'task' : 'tasks'} waiting.`
      }
      sx={{
        position: 'relative',
        width: pileWidth(cols),
        height: pileHeight(cols),
        flexShrink: 0,
        borderRadius: 1.5,
        // The same footprint whether or not the lane is automated, so the row reads as six of
        // the same thing in different states rather than as a layout that has gone wrong.
        // A cleared lane reads as light and open; a backed-up one reads as a full, shadowed tray.
        bgcolor: automated ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.8)',
        border: '1px dashed',
        borderColor: automated ? theme.edge : 'transparent',
        outline: automated ? 'none' : '1px solid #dbe3ec',
        boxShadow: automated ? 'none' : 'inset 0 1px 3px rgba(15, 23, 42, 0.07)',
      }}
    >
      {/*
        * An automated lane's work area is the most important picture in the section: a lane
        * clearing itself, sitting immediately beside a lane stacking up. Left empty it reads as
        * dead space and the contrast is lost, so work keeps arriving here and keeps being eaten,
        * whether or not anybody is clicking.
        */}
      {automated &&
        (reduce ? (
          <Box
            aria-hidden
            sx={{
              position: 'absolute',
              left: pileWidth(cols) / 2 - TOKEN_W / 2,
              top: pileHeight(cols) / 2 - TOKEN_H / 2,
              width: TOKEN_W,
              height: TOKEN_H,
              borderRadius: '3px',
              border: '1px dashed',
              borderColor: theme.edge,
              opacity: 0.7,
            }}
          />
        ) : (
          <Box
            component={motion.div}
            aria-hidden
            animate={
              narrow
                ? {
                    x: [pileWidth(cols) - TOKEN_W, pileWidth(cols) * 0.6, TOKEN_W * 0.3, 0],
                    opacity: [0, 1, 1, 0],
                    scale: [0.9, 1, 1, 0.4],
                  }
                : {
                    y: [pileHeight(cols) - TOKEN_H, pileHeight(cols) * 0.5, TOKEN_H * 0.3, 0],
                    opacity: [0, 1, 1, 0],
                    scale: [0.9, 1, 1, 0.4],
                  }
            }
            transition={{
              duration: 1.25,
              times: [0, 0.12, 0.72, 1],
              repeat: Infinity,
              // The gap is the point: the tray sits empty most of the time, which is what
              // "clears itself" actually looks like.
              repeatDelay: 1.6,
              ease: 'linear',
            }}
            sx={{
              position: 'absolute',
              left: narrow ? 0 : pileWidth(cols) / 2 - TOKEN_W / 2,
              top: narrow ? pileHeight(cols) / 2 - TOKEN_H / 2 : 0,
              width: TOKEN_W,
              height: TOKEN_H,
              borderRadius: '3px',
              bgcolor: '#ffffff',
              border: '1px solid',
              borderColor: TOKEN_BORDER,
              boxShadow: '0 1px 2px rgba(15, 23, 42, 0.12)',
              overflow: 'hidden',
            }}
          >
            <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, bgcolor: theme.ink }} />
            <Box sx={{ position: 'absolute', left: 7, top: 5, width: 15, height: 2, borderRadius: 9999, bgcolor: '#b6c2d1' }} />
            <Box sx={{ position: 'absolute', left: 7, top: 10, width: 10, height: 2, borderRadius: 9999, bgcolor: '#ced8e4' }} />
          </Box>
        ))}

      <AnimatePresence initial={false}>
        {!automated &&
          Array.from({ length: waiting }, (_, index) => {
            const slot = slotFor(index, cols);
            return (
              <Box
                key={`${kind}-${index}`}
                component={motion.div}
                data-line-token={kind}
                aria-hidden
                tabIndex={-1}
                initial={reduce ? { opacity: 1 } : { opacity: 0, scale: 0.5, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={
                  reduce
                    ? { opacity: 0, transition: { duration: 0.08 } }
                    : {
                        // The press-in lives at the head of the exit, because the token unmounts on
                        // the same tick the pointer goes down and a `whileTap` at rest would never
                        // get a frame. Then it slides onto the belt and away along it.
                        opacity: 0,
                        scale: [1, 0.84, 0.38],
                        x: narrow ? [0, -4, -24] : [0, 8, 52],
                        y: narrow ? [0, 6, 34] : [0, 10, 22],
                        transition: {
                          duration: 0.32,
                          ease: 'easeIn',
                          scale: { times: [0, 0.19, 1], ease: 'easeOut' },
                        },
                      }
                }
                transition={{ duration: 0.2, ease: 'easeOut' }}
                onPointerDown={() => onClearOne(kind)}
                sx={{
                  position: 'absolute',
                  left: slot.x,
                  top: slot.y,
                  width: TOKEN_W,
                  height: TOKEN_H,
                  rotate: `${slot.rotate}deg`,
                  borderRadius: '3px',
                  bgcolor: '#ffffff',
                  border: '1px solid',
                  // Neutral edge on purpose. Colouring the whole outline turned these into
                  // coloured capsules; letting the tab carry the hue makes them read as paper.
                  borderColor: TOKEN_BORDER,
                  boxShadow: '0 1px 2px rgba(15, 23, 42, 0.16)',
                  cursor: 'pointer',
                  touchAction: 'manipulation',
                  userSelect: 'none',
                  overflow: 'hidden',
                  transition: 'border-color 0.15s ease',
                  // The drawn token is smaller than a comfortable target, so the target is grown
                  // around it rather than the token being drawn oversized.
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    left: (TOKEN_W - HIT_W) / 2,
                    top: (TOKEN_H - HIT_H) / 2,
                    width: HIT_W,
                    height: HIT_H,
                  },
                  '&:hover': { borderColor: STATION_THEME[kind].ink },
                }}
              >
                {/* a document: a coloured tab and a couple of lines of nothing in particular */}
                <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, bgcolor: STATION_THEME[kind].ink }} />
                <Box sx={{ position: 'absolute', left: 7, top: 5, width: 15, height: 2, borderRadius: 9999, bgcolor: '#b6c2d1' }} />
                <Box sx={{ position: 'absolute', left: 7, top: 10, width: 10, height: 2, borderRadius: 9999, bgcolor: '#ced8e4' }} />
              </Box>
            );
          })}
      </AnimatePresence>
    </Box>
  );

  return (
    <Box
      data-kind={kind}
      data-waiting={waiting}
      data-automated={automated ? 'true' : 'false'}
      sx={
        narrow
          ? { display: 'flex', alignItems: 'center', gap: 1, width: '100%' }
          : { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.75, width: 116 }
      }
    >
      {station}
      {!narrow && (
        <Box
          aria-hidden
          sx={{ width: 2, height: 10, bgcolor: theme.edge, borderRadius: 9999, flexShrink: 0 }}
        />
      )}
      {pile}
    </Box>
  );
}
