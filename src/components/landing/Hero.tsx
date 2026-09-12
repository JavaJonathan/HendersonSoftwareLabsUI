import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Link from '@mui/material/Link';
import { Link as RouterLink } from 'react-router-dom';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { Reveal } from '../motion/Reveal';
import { GradientBackdrop } from '../motion/GradientBackdrop';
import { MagneticWrap } from '../motion/MagneticWrap';
import { ImpactPanel } from './hero/ImpactPanel';

export function Hero() {
  return (
    <Box sx={{ position: 'relative', overflow: 'hidden' }}>
      <GradientBackdrop interactive spotlight />

      <Container maxWidth="lg" sx={{ pt: { xs: 3, md: 6 }, pb: { xs: 5, md: 6 }, position: 'relative' }}>
        <Box
          sx={{
            display: 'grid',
            gap: { xs: 4, md: 6 },
            gridTemplateColumns: { xs: '1fr', md: '1.15fr 0.85fr' },
            alignItems: 'center',
          }}
        >
          <Box>
            <Reveal>
              <Chip
                label="On-Demand Software Engineering"
                icon={<Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'primary.main', ml: '10px' }} />}
                sx={{ bgcolor: 'primary.light', color: 'primary.main', fontSize: 13, mb: { xs: 2.5, md: 3 } }}
              />
            </Reveal>

            <Reveal delay={0.08}>
              <Typography
                variant="h1"
                sx={{ fontSize: { xs: 33, md: 50 }, color: 'text.primary', lineHeight: { xs: 1.18, md: 1.12 }, textWrap: 'balance' }}
              >
                Custom software for businesses that don't need{' '}
                <Box component="span" sx={{ color: 'primary.main' }}>
                  a full{'‑'}time software team
                </Box>
                .
              </Typography>
            </Reveal>

            <Reveal delay={0.16}>
              <Typography sx={{ mt: { xs: 2.5, md: 3 }, maxWidth: 500, color: 'text.secondary', fontSize: { xs: 16, md: 17 }, lineHeight: 1.6 }}>
                We build the internal tools, automations, and integrations that take the busywork off
                your team - without the overhead of hiring.
              </Typography>
            </Reveal>

            <Reveal delay={0.24}>
              <Stack
                direction="row"
                spacing={{ xs: 2, sm: 3 }}
                sx={{ mt: { xs: 3.5, md: 4 }, alignItems: 'center', flexWrap: 'wrap' }}
                useFlexGap
              >
                <MagneticWrap>
                  <Button
                    variant="contained"
                    size="large"
                    href="mailto:jonathan@HendersonSoftwareLabs.com?subject=Booking%20a%20Call"
                    endIcon={<ArrowForwardIcon />}
                  >
                    Book a Call
                  </Button>
                </MagneticWrap>

                <Link
                  href="#how-it-works"
                  underline="none"
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.5,
                    fontWeight: 600,
                    fontSize: 15,
                    color: 'text.secondary',
                    '& svg': { fontSize: 17, transition: 'transform 0.2s ease' },
                    '&:hover': { color: 'primary.main' },
                    '&:hover svg': { transform: 'translateX(3px)' },
                  }}
                >
                  See how it works
                  <ArrowForwardIcon />
                </Link>
              </Stack>
            </Reveal>

            <Reveal delay={0.32}>
              <Typography
                component="div"
                variant="body2"
                sx={{ mt: { xs: 2.5, md: 3 }, color: 'text.secondary', display: 'flex', alignItems: 'flex-start', gap: 1 }}
              >
                <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: 'primary.main', flexShrink: 0, mt: '7px' }} />
                <Box component="span">
                  Built by{' '}
                  <Link
                    component={RouterLink}
                    to="/portfolio"
                    underline="hover"
                    sx={{ color: 'primary.main', fontWeight: 700 }}
                  >
                    Jonathan Henderson
                  </Link>
                  , a senior engineer in Maryland - 7+ years shipping production software.
                </Box>
              </Typography>
            </Reveal>
          </Box>

          <Reveal delay={0.12} y={18} fullWidth>
            <ImpactPanel />
          </Reveal>
        </Box>
      </Container>
    </Box>
  );
}
