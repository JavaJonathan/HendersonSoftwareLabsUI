import { Link as RouterLink } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Skeleton from '@mui/material/Skeleton';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { Reveal } from '../motion/Reveal';
import { PRESETS, PRESET_ORDER } from './line/presets';
import { FILL_MS, STATION_KINDS, formatTaskCount } from './line/lineModel';
import { Conveyor } from './line/Conveyor';
import { ActivityFeed } from './line/ActivityFeed';
import { KindPanel } from './line/KindPanel';
import { TaskCounter } from './line/TaskCounter';
import { useLineExperience } from './line/useLineExperience';

/**
 * "The Line" - the homepage's shared interaction, and the argument the whole site is making,
 * played rather than read.
 *
 * Six kinds of work arrive continuously. The automated ones clear themselves; the rest pile up in
 * front of their station until somebody clicks them away. Clicking works, and it keeps working for
 * about as long as you keep doing it: clear a column and it is full again in thirty seconds
 * (`FILL_MS` in `lineModel.ts`), because clearing what is in front of you buys nothing against
 * what has not arrived yet.
 *
 * What does change things is shared. Every visitor's clears accumulate toward a threshold, and when
 * one is crossed that kind becomes automated permanently, for everyone who ever visits afterwards.
 * So the lesson is delivered by the mechanics: manual effort is a treadmill, and the only thing
 * that changes the slope is the automation strangers built together.
 *
 * One kind is never automated. Some work is judgement.
 */

export function TheLine() {
  const {
    reduce, compact, sectionRef, inView, snapshot, myClears, target, lanes, mood,
    waitingTotal, capTotal, feedShown, clearOne, clearKind, clearAll, unsent,
    presetId, selectPreset, everCleared, announcement, arrival,
  } = useLineExperience();
  return (
    <Container ref={sectionRef} maxWidth="lg" id="the-line" sx={{ py: { xs: 4, md: 5 } }}>
      <Reveal>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 700, letterSpacing: 1 }}>
            Interactive automation illustration
          </Typography>
          <Typography component="h2" variant="h4" sx={{ fontWeight: 800, color: 'text.primary', mt: 1 }}>
            Work piles up. Clear some.
          </Typography>
          <Typography sx={{ mt: 1.5, color: 'text.secondary', maxWidth: 620, mx: 'auto' }}>
            Live and shared with everyone here right now, not just you. Click to clear a lane by
            hand, or let the automated ones handle themselves - a small, playful demo of what
            automation can do. This game illustrates the idea; it is not a forecast of project results.
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
              <>
                <Conveyor
                  lanes={lanes}
                  active={inView}
                  reduce={reduce}
                  layout={compact ? 'narrow' : 'wide'}
                  onClearOne={clearOne}
                />
                <ActivityFeed mood={mood} waiting={waitingTotal} rows={feedShown} reduce={reduce} />
              </>
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
                  Cleared. It will be full again in {FILL_MS / 1000} seconds.
                </Typography>
                <Typography sx={{ mt: 0.5, fontSize: 13.5, color: 'text.secondary' }}>
                  The automated kinds did not need you at all. That is the entire difference, and it
                  is the one we build for real.
                </Typography>
              </Box>
              <Button component={RouterLink} to="/contact" variant="contained" endIcon={<ArrowForwardIcon />} sx={{ flexShrink: 0 }}>
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
