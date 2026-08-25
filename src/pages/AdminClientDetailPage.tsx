import { useEffect, useState } from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import { getClient, getClientProjects } from '../api/admin';
import { ProjectGrid } from '../components/portal/ProjectGrid';
import { Reveal } from '../components/motion/Reveal';
import { AuthedAppBar } from '../components/layout/AuthedAppBar';
import { SURFACE_SUBTLE } from '../theme';
import { CreateProjectDialog } from '../components/admin/CreateProjectDialog';
import type { AdminClient, SoftwareProject } from '../types';

export function AdminClientDetailPage() {
  const { clientId } = useParams<{ clientId: string }>();
  const [client, setClient] = useState<AdminClient | null>(null);
  const [projects, setProjects] = useState<SoftwareProject[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [dialogOpen, setDialogOpen] = useState(false);

  function loadData() {
    if (!clientId) return;
    setStatus('loading');
    Promise.all([getClient(clientId), getClientProjects(clientId)])
      .then(([clientData, clientProjects]) => {
        setClient(clientData);
        setProjects(clientProjects);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }

  useEffect(() => {
    loadData();
  }, [clientId]);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: SURFACE_SUBTLE }}>
      <AuthedAppBar subtitle="Admin" />

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

        <Reveal>
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
        </Reveal>

        <ProjectGrid
          status={status}
          projects={projects}
          errorMessage="Something went wrong loading this client. Please try again later."
          emptyMessage="No software assigned to this client yet."
        />
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
