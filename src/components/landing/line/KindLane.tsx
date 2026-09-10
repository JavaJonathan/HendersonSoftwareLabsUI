import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { AnimatePresence, motion } from 'framer-motion';
import { STATION_KINDS, type StationKind } from './lineModel';
import { STATION_ICONS } from './stationIcons';
import {
  HIT_H,
  HIT_W,
  PILE_H,
  PILE_W,
  TOKEN_BORDER,
  TOKEN_H,
  TOKEN_W,
  slotFor,
} from './pileModel';

/**
 * One kind of work: what it is, whether it is automated, and whatever is waiting.
 *
 * The same component serves the desktop belt and the mobile grid, so there is no second surface
 * to keep in sync; only the arrangement differs. Work sits in front of its own station, so a
 * visitor can see at a glance which kinds are backing up and which are clearing themselves, which
 * is the whole point: the shape of the pile tells you what to automate next.
 *
 * The tokens are pointer targets only, deliberately. Thirty appearing and disappearing elements
 * would be thirty tab stops and a screen-reader firehose, so they are `aria-hidden` and the
 * equivalent keyboard path lives in KindPanel, which can clear a whole column in one press.
 */

interface KindLaneProps {
  kind: StationKind;
  waiting: number;
  automated: boolean;
  layout: 'belt' | 'grid';
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
  const grid = layout === 'grid';

  return (
    <Box
      data-kind={kind}
      data-waiting={waiting}
      data-automated={automated ? 'true' : 'false'}
      sx={{
        width: grid ? '100%' : 104,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: grid ? 0.75 : 0.5,
      }}
    >
      <Box
        sx={{
          width: '100%',
          height: grid ? 'auto' : 62,
          px: 1,
          py: grid ? 1 : 0.75,
          borderRadius: 2.5,
          bgcolor: automated ? '#eff6ff' : '#ffffff',
          border: '1px solid',
          borderColor: automated ? '#bfdbfe' : 'divider',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 0.25,
          textAlign: 'center',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Icon sx={{ fontSize: 17, color: automated ? 'primary.main' : '#94a3b8' }} />
          <Typography sx={{ fontSize: 12, fontWeight: 800, color: 'text.primary', lineHeight: 1 }}>
            {meta.label}
          </Typography>
        </Box>

        {automated ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {!reduce && (
              <Box
                component={motion.span}
                aria-hidden
                animate={{ opacity: [1, 0.25, 1] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: 'primary.main', display: 'block' }}
              />
            )}
            <Typography sx={{ fontSize: 10, fontWeight: 700, color: 'primary.main', lineHeight: 1 }}>
              automated
            </Typography>
          </Box>
        ) : (
          <Typography sx={{ fontSize: 10, color: 'text.disabled', lineHeight: 1.2 }}>
            {taskLabel}
          </Typography>
        )}
      </Box>

      <Box
        role="group"
        aria-label={
          automated
            ? `${meta.label} is automated and clears itself.`
            : `${meta.label}, ${waiting} ${waiting === 1 ? 'task' : 'tasks'} waiting.`
        }
        sx={{
          position: 'relative',
          width: PILE_W,
          height: PILE_H,
          borderRadius: 1.5,
          bgcolor: automated ? 'transparent' : '#fbfcfd',
          border: '1px solid',
          borderColor: automated ? 'transparent' : '#e7ecf2',
        }}
      >
        <AnimatePresence initial={false}>
          {!automated &&
            Array.from({ length: waiting }, (_, index) => {
              const slot = slotFor(index);
              return (
                <Box
                  key={`${kind}-${index}`}
                  component={motion.div}
                  data-line-token={kind}
                  aria-hidden
                  tabIndex={-1}
                  initial={reduce ? { opacity: 1 } : { opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={
                    reduce
                      ? { opacity: 0, transition: { duration: 0.08 } }
                      : { opacity: 0, x: 34, y: -8, scale: 0.5, transition: { duration: 0.24, ease: 'easeIn' } }
                  }
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                  onPointerDown={() => onClearOne(kind)}
                  sx={{
                    position: 'absolute',
                    left: slot.x,
                    top: slot.y,
                    width: TOKEN_W,
                    height: TOKEN_H,
                    rotate: `${slot.rotate}deg`,
                    borderRadius: 1,
                    bgcolor: '#ffffff',
                    border: '1px solid',
                    // Darker than the site's decorative hairlines on purpose: this one carries
                    // meaning and has to clear 3:1 against white.
                    borderColor: TOKEN_BORDER,
                    boxShadow: '0 1px 2px rgba(15, 23, 42, 0.10)',
                    cursor: 'pointer',
                    touchAction: 'manipulation',
                    userSelect: 'none',
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
                    '&:hover': { borderColor: 'primary.main' },
                  }}
                />
              );
            })}
        </AnimatePresence>

        {automated && (
          <Box
            aria-hidden
            sx={{
              position: 'absolute',
              inset: 0,
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <Box
              sx={{
                width: PILE_W - 12,
                height: 2,
                borderRadius: 9999,
                bgcolor: '#dbeafe',
              }}
            />
          </Box>
        )}
      </Box>

    </Box>
  );
}
