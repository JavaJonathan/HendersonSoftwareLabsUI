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
import type { AdminClient } from '../types';

export function AdminPage() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [clients, setClients] = useState<AdminClient[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [dialogOpen, setDialogOpen] = useState(false);

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
      <AppBar position="static" color="transparent" sx={{ bgcolor: 'background.paper' }}>
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
                      <TableCell sx={{ fontWeight: 700 }}>Company</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Contact</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Projects</TableCell>
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
