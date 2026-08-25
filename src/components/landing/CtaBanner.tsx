import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { motion } from 'framer-motion';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import RocketLaunchOutlinedIcon from '@mui/icons-material/RocketLaunchOutlined';
import { Reveal } from '../motion/Reveal';
import { GradientBackdrop } from '../motion/GradientBackdrop';
import { SURFACE_DARK } from '../../theme';

export function CtaBanner() {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Reveal>
        <Box
          sx={{
            position: 'relative',
            bgcolor: SURFACE_DARK,
            borderRadius: 4,
            px: { xs: 4, md: 6 },
            py: { xs: 5, md: 6 },
            overflow: 'hidden',
          }}
        >
          <GradientBackdrop variant="dark" />

          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={4}
            sx={{ alignItems: { xs: 'flex-start', md: 'center' }, position: 'relative' }}
          >
            <Box
              component={motion.div}
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              sx={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                bgcolor: 'rgba(255,255,255,0.08)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <RocketLaunchOutlinedIcon fontSize="large" />
            </Box>

            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h5" sx={{ fontWeight: 800, color: 'white' }}>
                Let's simplify how your business runs.
              </Typography>
              <Typography sx={{ mt: 1, color: 'rgba(255,255,255,0.7)' }}>
                Get custom software built around your workflow — without hiring a full-time
                engineering team.
              </Typography>
            </Box>

            <Button
              id="contact"
              variant="contained"
              size="large"
              endIcon={<ArrowForwardIcon />}
              sx={{ flexShrink: 0, bgcolor: 'primary.main', '&:hover': { bgcolor: 'primary.dark' } }}
            >
              Schedule a Consultation
            </Button>
          </Stack>
        </Box>
      </Reveal>
    </Container>
  );
}
