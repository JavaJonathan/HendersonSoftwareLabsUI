import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import { motion, useReducedMotion } from 'framer-motion';
import { Reveal } from '../motion/Reveal';

const STEPS = [
  {
    title: 'Discover',
    description: 'We identify the bottlenecks slowing your business down.',
    outcome: 'A clear plan and a fixed quote',
  },
  {
    title: 'Build',
    description: 'We create the right automation, integration, or tool for the job.',
    outcome: 'Working software, tested and yours',
  },
  {
    title: 'Support',
    description: 'We help you launch, refine, and maintain what we build.',
    outcome: 'It keeps running — and improving',
  },
];

const CYCLE_MS = 3400;
/** Distance from each edge to the first / last circle centre in a 3-column grid (1/6). */
const TRACK_INSET = 16.667;

/**
 * The three-step process. A single marker travels 1 → 2 → 3 on a slow loop, filling the
 * track behind it and lighting up each step as it arrives; hovering or focusing a step
 * pins the marker there so you can read it. Collapses to a still, stacked layout under
 * reduced motion.
 */
export function HowItWorks() {
  const reduce = useReducedMotion() ?? false;
  const [active, setActive] = useState(0);
  const [pinned, setPinned] = useState<number | null>(null);

  const shown = pinned ?? active;

  useEffect(() => {
    if (reduce || pinned !== null) return;
    const id = window.setInterval(() => setActive((a) => (a + 1) % STEPS.length), CYCLE_MS);
    return () => window.clearInterval(id);
  }, [reduce, pinned]);

  const fill = reduce ? 1 : shown / (STEPS.length - 1);

  return (
    <Container maxWidth="lg" id="how-it-works" sx={{ py: { xs: 4, md: 6 } }}>
      <Reveal>
        <Box sx={{ textAlign: 'center', mb: { xs: 4, md: 5 } }}>
          <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 700, letterSpacing: 1 }}>
            How It Works
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', mt: 1 }}>
            A simple process. Real results.
          </Typography>
        </Box>
      </Reveal>

      <Reveal delay={0.08} fullWidth>
        <Box sx={{ position: 'relative', maxWidth: 880, mx: 'auto' }}>
          {/* the track the marker runs along (desktop) */}
          <Box
            aria-hidden
            sx={{
              display: { xs: 'none', sm: 'block' },
              position: 'absolute',
              top: 24,
              left: `${TRACK_INSET}%`,
              right: `${TRACK_INSET}%`,
              height: 0,
            }}
          >
            <Box sx={{ position: 'absolute', inset: 0, borderTop: '2px dashed', borderColor: '#bfdbfe' }} />
            <Box
              component={motion.div}
              initial={false}
              animate={{ scaleX: fill }}
              transition={reduce ? { duration: 0 } : { duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              sx={{ position: 'absolute', inset: 0, borderTop: '2px solid', borderColor: 'primary.main', transformOrigin: 'left' }}
            />
            {!reduce && (
              <Box
                component={motion.div}
                initial={false}
                animate={{ left: `${fill * 100}%` }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                sx={{
                  position: 'absolute',
                  top: 0,
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  bgcolor: 'primary.main',
                  boxShadow: '0 0 0 5px rgba(37, 99, 235, 0.16)',
                  transform: 'translate(-50%, -50%)',
                }}
              />
            )}
          </Box>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
              gap: { xs: 4, sm: 2 },
            }}
          >
            {STEPS.map((step, i) => {
              const on = shown === i;
              return (
                <Box
                  key={step.title}
                  component="button"
                  type="button"
                  onMouseEnter={() => setPinned(i)}
                  onMouseLeave={() => setPinned(null)}
                  onFocus={() => setPinned(i)}
                  onBlur={() => setPinned(null)}
                  onClick={() => setActive(i)}
                  aria-label={`Step ${i + 1}: ${step.title}. ${step.description}`}
                  sx={{
                    appearance: 'none',
                    border: 'none',
                    background: 'transparent',
                    font: 'inherit',
                    cursor: 'pointer',
                    textAlign: 'center',
                    px: 1,
                    borderRadius: 3,
                    outline: 'none',
                    '&:focus-visible': { boxShadow: '0 0 0 3px rgba(37, 99, 235, 0.35)' },
                  }}
                >
                  <Box
                    component={motion.div}
                    initial={false}
                    animate={{ scale: on && !reduce ? 1.08 : 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    sx={{
                      position: 'relative',
                      width: 48,
                      height: 48,
                      mx: 'auto',
                      mb: 2,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: 17,
                      border: '2px solid',
                      borderColor: 'primary.main',
                      bgcolor: on ? 'primary.main' : '#ffffff',
                      color: on ? 'primary.contrastText' : 'primary.main',
                      boxShadow: on ? '0 8px 20px -6px rgba(37, 99, 235, 0.5)' : '0 0 0 5px #ffffff',
                      transition: 'background-color 0.3s ease, color 0.3s ease, box-shadow 0.3s ease',
                    }}
                  >
                    {i + 1}
                    {on && !reduce && (
                      <Box
                        component={motion.div}
                        key={`ping-${i}-${active}-${pinned}`}
                        aria-hidden
                        initial={{ scale: 1, opacity: 0.5 }}
                        animate={{ scale: 2, opacity: 0 }}
                        transition={{ duration: 0.9, ease: 'easeOut' }}
                        sx={{ position: 'absolute', inset: -2, borderRadius: '50%', border: '2px solid', borderColor: 'primary.main' }}
                      />
                    )}
                  </Box>

                  <Typography
                    sx={{
                      fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
                      fontWeight: 800,
                      fontSize: 18,
                      color: 'text.primary',
                    }}
                  >
                    {step.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      mt: 1,
                      color: on ? 'text.primary' : 'text.secondary',
                      maxWidth: 250,
                      mx: 'auto',
                      transition: 'color 0.3s ease',
                    }}
                  >
                    {step.description}
                  </Typography>
                  <Typography
                    sx={{
                      mt: 1.25,
                      fontSize: 12.5,
                      fontWeight: 700,
                      letterSpacing: 0.2,
                      color: on ? 'primary.main' : 'text.disabled',
                      transition: 'color 0.3s ease',
                    }}
                  >
                    {step.outcome}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        </Box>
      </Reveal>
    </Container>
  );
}
