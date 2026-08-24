import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import VerifiedOutlinedIcon from '@mui/icons-material/VerifiedOutlined';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined';
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlined';

const TRUST_ITEMS = [
  { label: 'Trusted by established small businesses', icon: ShieldOutlinedIcon },
  { label: 'Secure, reliable, and scalable', icon: VerifiedOutlinedIcon },
  { label: 'Fast turnaround, real results', icon: AccessTimeOutlinedIcon },
];

export function Hero() {
  return (
    <Container maxWidth="lg" sx={{ pt: { xs: 6, md: 7 }, pb: { xs: 3, md: 4 } }}>
      <Box sx={{ display: 'grid', gap: 5, gridTemplateColumns: { xs: '1fr', md: '1.1fr 0.9fr' }, alignItems: 'center' }}>
        <Box>
          <Chip
            label="On-Demand Software Engineering"
            icon={<Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'primary.main', ml: '10px' }} />}
            sx={{ bgcolor: 'primary.light', color: 'primary.main', fontSize: 13, mb: 3 }}
          />

          <Typography variant="h1" sx={{ fontSize: { xs: 36, md: 48 }, color: 'text.primary', lineHeight: 1.15 }}>
            Custom software for businesses that don't need a full-time software team.
          </Typography>

          <Typography sx={{ mt: 3, maxWidth: 480, color: 'text.secondary', fontSize: 17 }}>
            We build internal tools, automations, and system integrations that save time, reduce
            manual work, and improve operations.
          </Typography>

          <Stack direction="row" spacing={2} sx={{ mt: 4, flexWrap: 'wrap' }} useFlexGap>
            <Button variant="contained" size="large" href="#contact" endIcon={<ArrowForwardIcon />}>
              Book a Call
            </Button>
            <Button variant="outlined" size="large" color="inherit" href="#what-we-do" endIcon={<ArrowForwardIcon />}>
              See Services
            </Button>
          </Stack>

          <Stack direction="row" spacing={3} sx={{ mt: 4, flexWrap: 'wrap' }} useFlexGap>
            {TRUST_ITEMS.map(({ label, icon: Icon }) => (
              <Stack key={label} direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <Icon sx={{ fontSize: 18, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  {label}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </Box>

        <Box sx={{ display: 'grid', gap: 2 }}>
          <StatCard icon={AccessTimeOutlinedIcon} value="120+" label="Hours Saved" large />
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <StatCard icon={AccountTreeOutlinedIcon} value="8+" label="Workflows Automated" />
            <StatCard icon={CheckCircleOutlineIcon} value="15+" label="Manual Tasks Eliminated" />
          </Box>
        </Box>
      </Box>
    </Container>
  );
}

function StatCard({
  icon: Icon,
  value,
  label,
  large,
}: {
  icon: typeof AccessTimeOutlinedIcon;
  value: string;
  label: string;
  large?: boolean;
}) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: large ? 4 : 3,
        textAlign: 'center',
        borderRadius: 3,
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
      <Typography sx={{ fontSize: large ? 44 : 30, fontWeight: 800, color: 'primary.main', lineHeight: 1 }}>
        {value}
      </Typography>
      <Typography sx={{ mt: 1, color: 'text.primary', fontWeight: 500 }}>{label}</Typography>
    </Paper>
  );
}
