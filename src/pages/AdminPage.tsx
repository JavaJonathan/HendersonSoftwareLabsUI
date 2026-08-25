import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Chip from '@mui/material/Chip';
import AddIcon from '@mui/icons-material/Add';
import { useAuth } from '../auth/AuthContext';
import { getClients } from '../api/admin';
import { Reveal } from '../components/motion/Reveal';
import { CreateClientDialog } from '../components/admin/CreateClientDialog';
import hslIcon from '../assets/branding/icon-dark.png';
import { useScrolled } from '../hooks/useScrolled';
import type { AdminClient } from '../types';

export function AdminPage() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [clients, setClients] = useState<AdminClient[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [dialogOpen, setDialogOpen] = useState(false);
  const scrolled = useScrolled();

  function loadClients() {
    setStatus('loading');
    getClients()
      .then((data) => {
        setClients(data);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }

  useEffect(() => {
    loadClients();
  }, []);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc' }}>
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
                  Admin
                </Typography>
              </Box>
            </Stack>
            <Button variant="outlined" color="inherit" onClick={logout}>
              Log Out
            </Button>
          </Toolbar>
        </Container>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Reveal>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary' }}>
                Clients
              </Typography>
              <Typography sx={{ mt: 0.5, color: 'text.secondary' }}>
                Create client accounts and assign them software.
              </Typography>
            </Box>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
              New Client
            </Button>
          </Box>
        </Reveal>

        <Box sx={{ mt: 4 }}>
          {status === 'loading' && <Typography color="text.secondary">Loading clients…</Typography>}

          {status === 'error' && (
            <Typography color="error">Something went wrong loading clients. Please try again later.</Typography>
          )}

          {status === 'ready' && clients.length === 0 && (
            <Paper variant="outlined" sx={{ p: 6, textAlign: 'center', color: 'text.secondary', borderStyle: 'dashed' }}>
              No clients yet. Create one to get started.
            </Paper>
          )}

          {status === 'ready' && clients.length > 0 && (
            <Reveal>
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      {['Company', 'Email', 'Contact', 'Projects'].map((label) => (
                        <TableCell
                          key={label}
                          sx={{
                            fontWeight: 700,
                            fontSize: 12,
                            letterSpacing: 0.6,
                            textTransform: 'uppercase',
                            color: 'text.secondary',
                          }}
                        >
                          {label}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {clients.map((client) => (
                      <TableRow
                        key={client.id}
                        hover
                        onClick={() => navigate(`/admin/clients/${client.id}`)}
                        sx={{ cursor: 'pointer' }}
                      >
                        <TableCell sx={{ fontWeight: 600 }}>{client.companyName}</TableCell>
                        <TableCell>{client.email}</TableCell>
                        <TableCell>{client.contactName ?? '—'}</TableCell>
                        <TableCell>
                          <Chip label={client.projectCount} size="small" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Reveal>
          )}
        </Box>
      </Container>

      <CreateClientDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onCreated={loadClients}
      />
    </Box>
  );
}
