import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import { motion, useReducedMotion } from 'framer-motion';
import { Reveal } from '../motion/Reveal';

const STEPS = [
  { title: 'Discover', description: 'We identify the bottlenecks slowing your business down.' },
  { title: 'Build', description: 'We create the right automation, integration, or tool for the job.' },
  { title: 'Support', description: 'We help you launch, refine, and maintain what we build.' },
];

export function HowItWorks() {
  const reduce = useReducedMotion();

  return (
    <Container maxWidth="lg" id="how-it-works" sx={{ py: { xs: 4, md: 5 } }}>
      <Reveal>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 700, letterSpacing: 1 }}>
            How It Works
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', mt: 1 }}>
            A simple process. Real results.
          </Typography>
        </Box>
      </Reveal>

      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
        {STEPS.map((step, index) => (
          <Box key={step.title} sx={{ display: 'contents' }}>
            <Reveal delay={index * 0.15}>
              <Box sx={{ textAlign: 'center', maxWidth: 220 }}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    border: '2px solid',
                    borderColor: 'primary.main',
                    color: 'primary.main',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    mx: 'auto',
                    mb: 2,
                  }}
                >
                  {index + 1}
                </Box>
                <Typography sx={{ fontWeight: 700, color: 'text.primary' }}>{step.title}</Typography>
                <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
                  {step.description}
                </Typography>
              </Box>
            </Reveal>

            {index < STEPS.length - 1 && (
              <Box sx={{ flex: 1, minWidth: 40, mx: 2, mt: '24px', position: 'relative', height: '2px' }}>
                <Box
                  component={motion.div}
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.6, delay: index * 0.15 + 0.25, ease: 'easeOut' }}
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    borderTop: '2px dashed',
                    borderColor: '#bfdbfe',
                    transformOrigin: 'left',
                  }}
                />
                {!reduce && (
                  <Box
                    component={motion.div}
                    aria-hidden
                    animate={{ left: ['0%', '100%'] }}
                    transition={{
                      duration: 2.4,
                      repeat: Infinity,
                      ease: 'easeInOut',
                      delay: index * 0.6 + 1,
                    }}
                    sx={{
                      position: 'absolute',
                      top: '1px',
                      width: 7,
                      height: 7,
                      borderRadius: '50%',
                      bgcolor: 'primary.main',
                      boxShadow: '0 0 0 4px rgba(37, 99, 235, 0.14)',
                      transform: 'translate(-50%, -50%)',
                    }}
                  />
                )}
              </Box>
            )}
          </Box>
        ))}
      </Box>
    </Container>
  );
}
