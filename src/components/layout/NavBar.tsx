import { Link as RouterLink } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
import Container from '@mui/material/Container';

const NAV_LINKS = [
  { label: 'Services', href: '#what-we-do' },
  { label: 'How It Works', href: '#how-it-works' },
];

export function NavBar() {
  return (
    <AppBar position="static" color="transparent" sx={{ bgcolor: 'background.paper' }}>
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
              sx={{
                width: 34,
                height: 34,
                borderRadius: '10px',
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: 18,
              }}
            >
              H
            </Box>
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
                sx={{ fontSize: 15, fontWeight: 500 }}
              >
                {link.label}
              </Link>
            ))}
            <Link
              component={RouterLink}
              to="/login"
              underline="none"
              color="text.primary"
              sx={{ fontSize: 15, fontWeight: 500 }}
            >
              Client Portal
            </Link>
          </Stack>

          <Button variant="contained" color="primary" href="#contact">
            Book a Call
          </Button>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
