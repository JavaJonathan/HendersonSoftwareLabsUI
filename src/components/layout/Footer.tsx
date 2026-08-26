import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import wordmark from '../../assets/branding/wordmark-light.png';
import { SURFACE_DARK } from '../../theme';

export function Footer() {
  return (
    <Box component="footer" sx={{ bgcolor: SURFACE_DARK, color: 'rgba(255,255,255,0.7)' }}>
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Box
          sx={{
            display: 'grid',
            gap: 6,
            gridTemplateColumns: { xs: '1fr', sm: '1.4fr 1fr' },
          }}
        >
          <Box>
            <Box component="img" src={wordmark} alt="Henderson Software Labs" sx={{ height: 32, width: 'auto' }} />
            <Typography variant="body2" sx={{ mt: 2, maxWidth: 320, color: 'rgba(255,255,255,0.55)' }}>
              Custom software and automation for small businesses.
            </Typography>
            <Stack direction="row" spacing={1.5} sx={{ mt: 3, alignItems: 'center', flexWrap: 'wrap' }} useFlexGap>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>
                © {new Date().getFullYear()} Henderson Software Labs. All rights reserved.
              </Typography>
              <Box sx={{ width: 3, height: 3, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.3)' }} />
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.55)' }}>
                About Us
              </Typography>
            </Stack>
          </Box>

          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'white' }}>
              Get in Touch
            </Typography>
            <Stack spacing={1} sx={{ mt: 2 }}>
              <Typography
                component="a"
                href="mailto:jonathan@HendersonSoftwareLabs.com"
                variant="body2"
                sx={{ color: 'rgba(255,255,255,0.55)', textDecoration: 'none', '&:hover': { color: 'white' } }}
              >
                jonathan@HendersonSoftwareLabs.com
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.55)' }}>
                Maryland, USA
              </Typography>
            </Stack>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
