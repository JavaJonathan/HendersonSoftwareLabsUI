import Box from '@mui/material/Box';
import { motion } from 'framer-motion';
import type { StationKind } from './lineModel';
import { KindLane } from './KindLane';
import { BELT_EDGE, BELT_TREAD, STAGE_BG, STAGE_DOT, STAGE_DOT_SIZE } from './stationTheme';

/**
 * The stage: six stations and the belt that connects them.
 *
 * Wide, the belt runs left to right and simply ends at the stage's inner edge. Narrow, it becomes
 * a vertical spine with the stations hanging off it. Work rests physically on the belt in both
 * layouts, because a belt with a gap under the work is not a belt, it is a rule drawn beneath
 * some floating cards.
 *
 * What happens to cleared work, and how the line is doing, is reported by the activity feed
 * below this stage rather than by anything drawn here.
 */

const BELT_H = 18;
const SPINE_W = 11;

export interface LaneView {
  kind: StationKind;
  waiting: number;
  automated: boolean;
  taskLabel: string;
}

interface ConveyorProps {
  lanes: LaneView[];
  active: boolean;
  reduce: boolean;
  layout: 'wide' | 'narrow';
  onClearOne: (kind: StationKind) => void;
}

export function Conveyor({ lanes, active, reduce, layout, onClearOne }: ConveyorProps) {
  const narrow = layout === 'narrow';
  const running = active && !reduce;

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
                <KindLane
                  kind={lane.kind}
                  waiting={lane.waiting}
                  automated={lane.automated}
                  layout="narrow"
                  reduce={reduce}
                  taskLabel={lane.taskLabel}
                  onClearOne={onClearOne}
                />
              </Box>
            ))}
          </Box>
        </Box>
      ) : (
        <Box sx={{ position: 'relative', pb: `${BELT_H}px` }}>
          <Belt running={running} />

          <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 1 }}>
            {lanes.map((lane) => (
              <KindLane
                key={lane.kind}
                kind={lane.kind}
                waiting={lane.waiting}
                automated={lane.automated}
                layout="wide"
                reduce={reduce}
                taskLabel={lane.taskLabel}
                onClearOne={onClearOne}
              />
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
}

/**
 * The belt. Shaded like a cylinder rather than drawn as a line, because a flat bar of even ticks
 * under the work reads as a ruler, which is precisely how the first attempt looked.
 */
function Belt({ vertical = false, running }: { vertical?: boolean; running: boolean }) {
  return (
    <Box
      aria-hidden
      sx={{
        position: 'absolute',
        ...(vertical
          ? { left: 0, top: 6, bottom: 6, width: SPINE_W }
          : { left: 0, right: 0, bottom: 0, height: BELT_H }),
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
