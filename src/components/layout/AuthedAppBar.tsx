import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { useAuth } from '../../auth/AuthContext';
import { useScrolled } from '../../hooks/useScrolled';
import hslIcon from '../../assets/branding/icon-dark.png';

/** Sticky, scroll-blurred AppBar shared by every authenticated page (Portal, Admin, AdminClientDetail). */
export function AuthedAppBar({ subtitle }: { subtitle: string }) {
  const { logout } = useAuth();
  const scrolled = useScrolled();

  return (
    <AppBar
      position="sticky"
      color="transparent"
      sx={{
        top: 0,
        bgcolor: scrolled ? 'rgba(255,255,255,0.82)' : 'background.paper',
        backdropFilter: scrolled ? 'saturate(180%) blur(10px)' : 'none',
        boxShadow: scrolled ? '0 1px 0 rgba(15,23,42,0.06)' : 'none',
      }}
    >
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ py: 1 }}>
          <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', flexGrow: 1 }}>
            <Box component="img" src={hslIcon} alt="Henderson Software Labs" sx={{ height: 30, width: 'auto' }} />
            <Box>
              <Typography sx={{ fontWeight: 700, color: 'text.primary' }}>Henderson Software Labs</Typography>
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            </Box>
          </Stack>
          <Button variant="outlined" color="inherit" onClick={logout}>
            Log Out
          </Button>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
