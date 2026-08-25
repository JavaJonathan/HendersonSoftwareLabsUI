import { useEffect, useState } from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Link from '@mui/material/Link';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import { useAuth } from '../auth/AuthContext';
import { getClientProjects, getClients } from '../api/admin';
import { ProjectCard } from '../components/portal/ProjectCard';
import { Reveal } from '../components/motion/Reveal';
import { CreateProjectDialog } from '../components/admin/CreateProjectDialog';
import hslIcon from '../assets/branding/icon-dark.png';
import type { AdminClient, SoftwareProject } from '../types';

export function AdminClientDetailPage() {
  const { clientId } = useParams<{ clientId: string }>();
  const { logout } = useAuth();
  const [client, setClient] = useState<AdminClient | null>(null);
  const [projects, setProjects] = useState<SoftwareProject[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [dialogOpen, setDialogOpen] = useState(false);

  function loadData() {
    if (!clientId) return;
    setStatus('loading');
    Promise.all([getClients(), getClientProjects(clientId)])
      .then(([clients, clientProjects]) => {
        setClient(clients.find((c) => c.id === clientId) ?? null);
        setProjects(clientProjects);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }

  useEffect(() => {
    loadData();
  }, [clientId]);

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
        <Link
          component={RouterLink}
          to="/admin"
          underline="none"
          color="text.secondary"
          sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, fontSize: 14, fontWeight: 500, mb: 3 }}
        >
          <ArrowBackIcon sx={{ fontSize: 16 }} />
          Clients
        </Link>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary' }}>
              {client?.companyName ?? 'Client'}
            </Typography>
            <Typography sx={{ mt: 0.5, color: 'text.secondary' }}>
              {client?.email}
              {client?.contactName ? ` · ${client.contactName}` : ''}
            </Typography>
          </Box>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)} disabled={!clientId}>
            Add Project
          </Button>
        </Box>

        <Box sx={{ mt: 4 }}>
          {status === 'loading' && <Typography color="text.secondary">Loading projects…</Typography>}

          {status === 'error' && (
            <Typography color="error">Something went wrong loading this client. Please try again later.</Typography>
          )}

          {status === 'ready' && projects.length === 0 && (
            <Paper variant="outlined" sx={{ p: 6, textAlign: 'center', color: 'text.secondary', borderStyle: 'dashed' }}>
              No software assigned to this client yet.
            </Paper>
          )}

          {status === 'ready' && projects.length > 0 && (
            <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' } }}>
              {projects.map((project, index) => (
                <Reveal key={project.id} delay={index * 0.08} y={16}>
                  <ProjectCard project={project} />
                </Reveal>
              ))}
            </Box>
          )}
        </Box>
      </Container>

      {clientId && (
        <CreateProjectDialog
          open={dialogOpen}
          clientId={clientId}
          onClose={() => setDialogOpen(false)}
          onCreated={loadData}
        />
      )}
    </Box>
  );
}
