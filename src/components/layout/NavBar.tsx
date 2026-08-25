import { Link as RouterLink } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
import Container from '@mui/material/Container';
import hslIcon from '../../assets/branding/icon-dark.png';
import { useScrolled } from '../../hooks/useScrolled';

const NAV_LINKS = [
  { label: 'Services', href: '#what-we-do' },
  { label: 'How It Works', href: '#how-it-works' },
];

export function NavBar() {
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
          <Stack
            component={RouterLink}
            to="/"
            direction="row"
            spacing={1.25}
            sx={{ textDecoration: 'none', color: 'inherit', flexGrow: 1, alignItems: 'center' }}
          >
            <Box
              component="img"
              src={hslIcon}
              alt="Henderson Software Labs"
              sx={{
                height: 34,
                width: 'auto',
                transition: 'transform 0.3s ease',
                '.MuiStack-root:hover &': { transform: 'rotate(-6deg) scale(1.06)' },
              }}
            />
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>
              Henderson Software Labs
            </Typography>
          </Stack>

          <Stack direction="row" spacing={4} sx={{ display: { xs: 'none', md: 'flex' }, mr: 4, alignItems: 'center' }}>
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                underline="none"
                color="text.primary"
                sx={{
                  fontSize: 15,
                  fontWeight: 500,
                  position: 'relative',
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    left: 0,
                    bottom: -4,
                    height: 2,
                    width: 0,
                    bgcolor: 'primary.main',
                    borderRadius: 1,
                    transition: 'width 0.25s ease',
                  },
                  '&:hover::after': { width: '100%' },
                }}
              >
                {link.label}
              </Link>
            ))}
          </Stack>

          <Button component={RouterLink} to="/login" variant="contained" color="primary">
            Client Login
          </Button>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
