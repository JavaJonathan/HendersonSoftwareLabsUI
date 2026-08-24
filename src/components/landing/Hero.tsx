import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined';
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlined';
import { Reveal } from '../motion/Reveal';
import { GradientBackdrop } from '../motion/GradientBackdrop';
import { useCountUp } from '../../hooks/useCountUp';

export function Hero() {
  return (
    <Box sx={{ position: 'relative', overflow: 'hidden' }}>
      <GradientBackdrop />

      <Container maxWidth="lg" sx={{ pt: { xs: 4, md: 5 }, pb: { xs: 3, md: 4 }, position: 'relative' }}>
        <Box sx={{ display: 'grid', gap: 5, gridTemplateColumns: { xs: '1fr', md: '1.1fr 0.9fr' }, alignItems: 'flex-start' }}>
          <Box>
            <Reveal>
              <Chip
                label="On-Demand Software Engineering"
                icon={<Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'primary.main', ml: '10px' }} />}
                sx={{ bgcolor: 'primary.light', color: 'primary.main', fontSize: 13, mb: 3 }}
              />
            </Reveal>

            <Reveal delay={0.08}>
              <Typography variant="h1" sx={{ fontSize: { xs: 36, md: 48 }, color: 'text.primary', lineHeight: 1.15 }}>
                Custom software for businesses that don't need{' '}
                <Box component="span" sx={{ color: 'primary.main' }}>
                  a full-time software team
                </Box>
                .
              </Typography>
            </Reveal>

            <Reveal delay={0.16}>
              <Typography sx={{ mt: 3, maxWidth: 480, color: 'text.secondary', fontSize: 17 }}>
                We build internal tools, automations, and system integrations that save time, reduce
                manual work, and improve operations.
              </Typography>
            </Reveal>

            <Reveal delay={0.24}>
              <Stack direction="row" spacing={2} sx={{ mt: 4, flexWrap: 'wrap' }} useFlexGap>
                <Button variant="contained" size="large" href="#contact" endIcon={<ArrowForwardIcon />}>
                  Book a Call
                </Button>
                <Button variant="outlined" size="large" color="inherit" href="#what-we-do" endIcon={<ArrowForwardIcon />}>
                  See Services
                </Button>
              </Stack>
            </Reveal>
          </Box>

          <Box sx={{ display: 'grid', gap: 2 }}>
            <Reveal delay={0.1} y={16}>
              <StatCard icon={AccessTimeOutlinedIcon} value={120} label="Hours Saved" large />
            </Reveal>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <Reveal delay={0.18} y={16}>
                <StatCard icon={AccountTreeOutlinedIcon} value={8} label="Workflows Automated" />
              </Reveal>
              <Reveal delay={0.26} y={16}>
                <StatCard icon={CheckCircleOutlineIcon} value={15} label="Manual Tasks Eliminated" />
              </Reveal>
            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}

function StatCard({
  icon: Icon,
  value,
  label,
  large,
}: {
  icon: typeof AccessTimeOutlinedIcon;
  value: number;
  label: string;
  large?: boolean;
}) {
  const { ref, value: animatedValue } = useCountUp(value);

  return (
    <Paper
      variant="outlined"
      sx={{
        p: large ? 4 : 3,
        textAlign: 'center',
        borderRadius: 3,
        '&:hover': {
          transform: 'translateY(-3px)',
          boxShadow: '0 16px 32px -14px rgba(15, 23, 42, 0.18)',
          borderColor: '#bfdbfe',
        },
      }}
    >
      <Box
        sx={{
          width: 48,
          height: 48,
          borderRadius: '50%',
          bgcolor: 'primary.light',
          color: 'primary.main',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mx: 'auto',
          mb: 1.5,
        }}
      >
        <Icon />
      </Box>
      <Box ref={ref}>
        <Typography
          sx={{ fontSize: large ? 44 : 30, fontWeight: 800, color: 'primary.main', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}
        >
          {animatedValue}+
        </Typography>
      </Box>
      <Typography sx={{ mt: 1, color: 'text.primary', fontWeight: 500 }}>{label}</Typography>
    </Paper>
  );
}
