import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import { Link as RouterLink } from 'react-router-dom';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import CalculateOutlinedIcon from '@mui/icons-material/CalculateOutlined';
import { Reveal } from '../motion/Reveal';

const OUTCOMES = [
  'Hours and dollars a repetitive task costs you a year',
  'How long a fix takes to pay for itself',
  'Which assumption the estimate depends on most',
];

export function CalculatorPromo() {
  return (
    <Container maxWidth="lg" id="roi-calculator" sx={{ pt: { xs: 3, md: 4 }, pb: { xs: 4, md: 5 } }}>
      <Reveal>
        <Paper variant="outlined" sx={{ borderRadius: 4, p: { xs: 3, md: 5 }, overflow: 'hidden' }}>
          <Box
            sx={{
              display: 'grid',
              gap: { xs: 4, md: 6 },
              gridTemplateColumns: { xs: '1fr', md: '1.05fr 0.95fr' },
              alignItems: 'center',
            }}
          >
            <Box>
              <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 700, letterSpacing: 1 }}>
                Free Tool
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', mt: 1 }}>
                Not sure a task is worth fixing? Run the numbers first.
              </Typography>
              <Typography sx={{ mt: 2, color: 'text.secondary', fontSize: 16, lineHeight: 1.6, maxWidth: 480 }}>
                Before we build anything, we work out what a repetitive task is actually
                costing you and how long fixing it would take to pay for itself. We built a
                free calculator that does that same math, no account or email needed.
              </Typography>

              <Stack spacing={1.25} sx={{ mt: 3 }}>
                {OUTCOMES.map((line) => (
                  <Stack key={line} direction="row" spacing={1} sx={{ alignItems: 'flex-start' }}>
                    <CheckCircleOutlinedIcon sx={{ fontSize: 18, color: 'primary.main', mt: '2px' }} />
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {line}
                    </Typography>
                  </Stack>
                ))}
              </Stack>

              <Button
                component={RouterLink}
                to="/tools/task-cost-calculator"
                variant="contained"
                size="large"
                endIcon={<ArrowForwardIcon />}
                sx={{ mt: 3.5 }}
              >
                Try the Calculator
              </Button>
              <Typography variant="caption" sx={{ display: 'block', mt: 1.25, color: 'text.secondary' }}>
                Free, runs in your browser, nothing you enter is saved.
              </Typography>
            </Box>

            <Reveal delay={0.1} fullWidth>
              <ExamplePreviewCard />
            </Reveal>
          </Box>
        </Paper>
      </Reveal>
    </Container>
  );
}

function ExamplePreviewCard() {
  return (
    <Box
      sx={{
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: '#ffffff',
        p: { xs: 3, md: 3.5 },
        boxShadow: '0 20px 40px -24px rgba(15, 23, 42, 0.25)',
      }}
    >
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 2 }}>
        <CalculateOutlinedIcon sx={{ color: 'primary.main' }} />
        <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 700 }}>
          Example
        </Typography>
      </Stack>

      <Box aria-hidden sx={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 96, px: 1 }}>
        <BarColumn label="Before" heightPct={100} color="#94a3b8" />
        <BarColumn label="After" heightPct={12} color="primary.main" />
      </Box>

      <Typography variant="body2" sx={{ mt: 2.5, color: 'text.secondary' }}>
        A 5-minute task cut to 30 seconds, run 10 times a workday, works out to real hours
        back every year. This is the same starting example the calculator loads with.
      </Typography>
    </Box>
  );
}

function BarColumn({ label, heightPct, color }: { label: string; heightPct: number; color: string }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.75, flex: 1 }}>
      <Box sx={{ width: '100%', maxWidth: 56, height: `${heightPct}%`, bgcolor: color, borderRadius: 1 }} />
      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
        {label}
      </Typography>
    </Box>
  );
}
