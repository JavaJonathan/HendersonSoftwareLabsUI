import { useState, type MouseEvent } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import Divider from '@mui/material/Divider';
import Chip from '@mui/material/Chip';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import { useAuth } from '../../auth/useAuth';
import { useScrolled } from '../../hooks/useScrolled';
import hslIcon from '../../assets/branding/icon-dark.webp';

/** Two letters for the avatar: first and last word of the company name, or the email as a fallback. */
function initialsFrom(label: string) {
  const words = label.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

/** Sticky, scroll-blurred AppBar shared by every authenticated page (Portal, Admin, AdminClientDetail). */
export function AuthedAppBar({ subtitle }: { subtitle?: string }) {
  const { user, logout } = useAuth();
  const scrolled = useScrolled();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const menuOpen = Boolean(anchorEl);

  const accountLabel = user?.companyName || user?.email || '';
  const home = user?.isAdmin ? '/admin' : '/portal';

  function openMenu(event: MouseEvent<HTMLElement>) {
    setAnchorEl(event.currentTarget);
  }

  function closeMenu() {
    setAnchorEl(null);
  }

  return (
    <AppBar
      position="sticky"
      color="transparent"
      sx={{
        top: 0,
        bgcolor: scrolled ? 'rgba(255,255,255,0.82)' : 'background.paper',
        backdropFilter: scrolled ? 'saturate(180%) blur(10px)' : 'none',
        boxShadow: scrolled ? '0 1px 0 rgba(15,23,42,0.06)' : 'none',
        // The theme's #f1f5f9 border is tuned for the white marketing pages. Against the
        // authenticated app's #f8fafc body it is lighter than the page, so there is no edge at all.
        borderBottom: '1px solid',
        borderBottomColor: 'divider',
      }}
    >
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ py: 1, gap: 2 }}>
          <Stack
            component={RouterLink}
            to={home}
            direction="row"
            spacing={1.25}
            sx={{ textDecoration: 'none', color: 'inherit', flexGrow: 1, alignItems: 'center', minWidth: 0 }}
          >
            <Box
              component="img"
              src={hslIcon}
              alt="Henderson Software Labs"
              sx={{
                height: 34,
                width: 'auto',
                flexShrink: 0,
                transition: 'transform 0.3s ease',
                '.MuiStack-root:hover &': { transform: 'rotate(-6deg) scale(1.06)' },
              }}
            />
            <Box sx={{ minWidth: 0 }}>
              <Typography
                variant="h6"
                sx={{ fontWeight: 700, color: 'text.primary', display: { xs: 'none', sm: 'block' } }}
              >
                Henderson Software Labs
              </Typography>
              {subtitle && (
                <Typography variant="body2" color="text.secondary" noWrap>
                  {subtitle}
                </Typography>
              )}
            </Box>
          </Stack>

          <IconButton
            onClick={openMenu}
            aria-label="Account"
            aria-haspopup="true"
            aria-controls={menuOpen ? 'account-menu' : undefined}
            aria-expanded={menuOpen ? 'true' : undefined}
            sx={{
              p: 0.5,
              flexShrink: 0,
              '&:focus-visible': { outline: 'none', boxShadow: '0 0 0 3px rgba(37, 99, 235, 0.35)' },
            }}
          >
            <Avatar
              sx={{
                width: 38,
                height: 38,
                bgcolor: 'primary.light',
                color: 'primary.main',
                fontFamily: '"Plus Jakarta Sans", "Segoe UI", system-ui, sans-serif',
                fontWeight: 800,
                fontSize: 14,
              }}
            >
              {initialsFrom(accountLabel)}
            </Avatar>
          </IconButton>

          <Menu
            id="account-menu"
            anchorEl={anchorEl}
            open={menuOpen}
            onClose={closeMenu}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            slotProps={{
              paper: {
                sx: {
                  mt: 1,
                  minWidth: 248,
                  borderRadius: 2.5,
                  border: '1px solid',
                  borderColor: 'divider',
                  boxShadow: '0 24px 48px -24px rgba(15,23,42,0.22)',
                },
              },
            }}
          >
            <Box sx={{ px: 2, pt: 0.5, pb: 1.5 }}>
              <Typography sx={{ fontWeight: 700, color: 'text.primary' }} noWrap>
                {user?.companyName}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }} noWrap>
                {user?.email}
              </Typography>
              <Chip
                label={user?.isAdmin ? 'Admin' : 'Client'}
                size="small"
                sx={{ mt: 1.25, bgcolor: 'primary.light', color: 'primary.main', fontWeight: 600 }}
              />
            </Box>

            <Divider />

            <MenuItem
              onClick={() => {
                closeMenu();
                logout();
              }}
              sx={{ py: 1.25, mt: 0.5 }}
            >
              <ListItemIcon>
                <LogoutOutlinedIcon fontSize="small" />
              </ListItemIcon>
              Log Out
            </MenuItem>
          </Menu>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
