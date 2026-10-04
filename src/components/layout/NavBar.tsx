import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
import Container from '@mui/material/Container';
import IconButton from '@mui/material/IconButton';
import Drawer from '@mui/material/Drawer';
import Divider from '@mui/material/Divider';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import hslIcon from '../../assets/branding/icon-dark.webp';
import { useScrolled } from '../../hooks/useScrolled';
import { BUSINESS_PHONE, BUSINESS_PHONE_HREF } from '../../lib/contact';

const NAV_LINKS = [
  { label: 'Services', href: '/#what-we-do' },
  { label: 'How It Works', href: '/#how-it-works' },
];

// One look for every text link in the desktop bar (page links, Client Login, phone number):
// no underline at rest, a blue underline that draws in from the left on hover.
const NAV_LINK_SX = {
  fontSize: 15,
  fontWeight: 500,
  whiteSpace: 'nowrap',
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
} as const;

export function NavBar() {
  const scrolled = useScrolled();
  const [mobileOpen, setMobileOpen] = useState(false);

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
            <Typography
              variant="h6"
              sx={{ fontWeight: 700, color: 'text.primary', display: { xs: 'none', sm: 'block' } }}
            >
              Henderson Software Labs
            </Typography>
          </Stack>

          <Stack direction="row" spacing={3} sx={{ display: { xs: 'none', md: 'flex' }, mr: 3, alignItems: 'center' }}>
            {NAV_LINKS.map((link) => (
              <Link key={link.label} href={link.href} underline="none" color="text.primary" sx={NAV_LINK_SX}>
                {link.label}
              </Link>
            ))}
            <Link component={RouterLink} to="/login" underline="none" color="text.primary" sx={NAV_LINK_SX}>
              Client Login
            </Link>
          </Stack>

          <Link
            href={BUSINESS_PHONE_HREF}
            underline="none"
            color="text.primary"
            sx={[NAV_LINK_SX, { display: { xs: 'none', lg: 'inline-flex' }, mr: 3 }]}
          >
            {BUSINESS_PHONE}
          </Link>

          <IconButton
            aria-label="Open menu"
            onClick={() => setMobileOpen(true)}
            sx={{ display: { xs: 'flex', md: 'none' }, mr: 1, color: 'text.primary' }}
          >
            <MenuIcon />
          </IconButton>

          <Button
            component={RouterLink}
            to="/contact"
            variant="contained"
            color="primary"
            sx={{ display: { xs: 'none', md: 'inline-flex' } }}
          >
            Contact
          </Button>
        </Toolbar>
      </Container>

      <Drawer
        anchor="right"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        slotProps={{ paper: { sx: { width: 280 } } }}
      >
        <Stack sx={{ px: 2, py: 1.5, alignItems: 'flex-end' }}>
          <IconButton aria-label="Close menu" onClick={() => setMobileOpen(false)}>
            <CloseIcon />
          </IconButton>
        </Stack>
        <Stack spacing={0.5} sx={{ px: 2.5, pb: 3 }}>
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              underline="none"
              color="text.primary"
              onClick={() => setMobileOpen(false)}
              sx={{ py: 1.5, fontSize: 16, fontWeight: 600 }}
            >
              {link.label}
            </Link>
          ))}
          <Divider sx={{ my: 1.5 }} />
          <Stack spacing={1.5}>
            <Button
              component={RouterLink}
              to="/contact"
              variant="contained"
              color="primary"
              fullWidth
              onClick={() => setMobileOpen(false)}
            >
              Contact
            </Button>
            <Button
              href={BUSINESS_PHONE_HREF}
              variant="outlined"
              color="primary"
              fullWidth
              onClick={() => setMobileOpen(false)}
            >
              Call {BUSINESS_PHONE}
            </Button>
          </Stack>
          <Link
            component={RouterLink}
            to="/login"
            underline="none"
            color="text.primary"
            onClick={() => setMobileOpen(false)}
            sx={{ py: 1.5, fontSize: 16, fontWeight: 600, alignSelf: 'flex-start' }}
          >
            Client Login
          </Link>
        </Stack>
      </Drawer>
    </AppBar>
  );
}
