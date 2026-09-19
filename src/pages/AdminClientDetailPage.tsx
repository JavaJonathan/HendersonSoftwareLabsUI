import { useCallback, useEffect, useState } from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
import Skeleton from '@mui/material/Skeleton';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import KeyOutlinedIcon from '@mui/icons-material/KeyOutlined';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import { getClient, getClientProjects } from '../api/admin';
import { ProjectGrid } from '../components/portal/ProjectGrid';
import { Reveal } from '../components/motion/Reveal';
import { GradientBackdrop } from '../components/motion/GradientBackdrop';
import { AuthedAppBar } from '../components/layout/AuthedAppBar';
import { SURFACE_SUBTLE } from '../theme';
import { ProjectDialog } from '../components/admin/ProjectDialog';
import { ResetPasswordDialog } from '../components/admin/ResetPasswordDialog';
import type { AdminClient, SoftwareProject } from '../types';

export function AdminClientDetailPage() {
  const { clientId } = useParams<{ clientId: string }>();
  const [client, setClient] = useState<AdminClient | null>(null);
  const [projects, setProjects] = useState<SoftwareProject[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<SoftwareProject | null>(null);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);

  const loadData = useCallback(() => {
    if (!clientId) return;
    setStatus('loading');
    Promise.all([getClient(clientId), getClientProjects(clientId)])
      .then(([clientData, clientProjects]) => {
        setClient(clientData);
        setProjects(clientProjects);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }, [clientId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const actionsDisabled = !clientId || status === 'error';

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: SURFACE_SUBTLE }}>
      <AuthedAppBar />

      {/* zIndex 0 makes this band its own stacking context. Without it GradientBackdrop's
          z-index:-1 layer paints before the page shell's opaque background and is invisible. */}
      <Box sx={{ position: 'relative', zIndex: 0, overflow: 'hidden', flexGrow: 1 }}>
        <GradientBackdrop variant="light" />

        <Container maxWidth="lg" sx={{ position: 'relative', pt: { xs: 4, md: 6 }, pb: { xs: 3, md: 4 } }}>
          <Link
            component={RouterLink}
            to="/admin"
            underline="none"
            color="text.secondary"
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.5,
              fontSize: 14,
              fontWeight: 500,
              mb: 3,
              transition: 'color 0.18s ease',
              '&:hover': { color: 'primary.main' },
              '&:hover svg': { transform: 'translateX(-3px)' },
              '& svg': { transition: 'transform 0.18s ease' },
            }}
          >
            <ArrowBackIcon sx={{ fontSize: 16 }} />
            Clients
          </Link>

          <Reveal>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1 }}>
              <PeopleAltOutlinedIcon sx={{ color: 'primary.main', fontSize: 20 }} />
              <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 700, letterSpacing: 1 }}>
                Admin
              </Typography>
            </Stack>
          </Reveal>

          <Reveal delay={0.08}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ minWidth: 0 }}>
                {status === 'loading' ? (
                  <>
                    <Skeleton variant="text" width={280} height={44} />
                    <Skeleton variant="text" width={220} height={24} sx={{ mt: 0.5 }} />
                  </>
                ) : (
                  <>
                    <Typography variant="h4" component="h1" sx={{ color: 'text.primary', fontSize: { xs: 26, md: 34 } }}>
                      {client?.companyName ?? 'Client'}
                    </Typography>
                    <Typography sx={{ mt: 0.5, color: 'text.secondary' }}>
                      {client?.email}
                      {client?.contactName ? ` · ${client.contactName}` : ''}
                    </Typography>
                  </>
                )}
              </Box>
              <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                <Button
                  variant="outlined"
                  color="warning"
                  startIcon={<KeyOutlinedIcon />}
                  onClick={() => setResetDialogOpen(true)}
                  disabled={actionsDisabled}
                >
                  Reset Password
                </Button>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => {
                    setEditingProject(null);
                    setDialogOpen(true);
                  }}
                  disabled={actionsDisabled}
                >
                  Add Project
                </Button>
              </Box>
            </Box>
          </Reveal>
        </Container>

        <Container component="main" maxWidth="lg" sx={{ position: 'relative', pt: { xs: 3, md: 4 }, pb: { xs: 6, md: 8 } }}>
          <ProjectGrid
            status={status}
            projects={projects}
            loadingMessage="Loading this client's projects…"
            errorMessage="Something went wrong loading this client. Please try again later."
            emptyTitle="No software assigned"
            emptyMessage="Add the first project to show it in this client's portal."
            onEditProject={(project) => {
              setEditingProject(project);
              setDialogOpen(true);
            }}
          />
        </Container>
      </Box>

      {clientId && (
        <ProjectDialog
          open={dialogOpen}
          clientId={clientId}
          project={editingProject}
          onClose={() => setDialogOpen(false)}
          onSaved={loadData}
        />
      )}

      {clientId && (
        <ResetPasswordDialog
          open={resetDialogOpen}
          clientId={clientId}
          clientLabel={client?.companyName ?? client?.email ?? 'this client'}
          onClose={() => setResetDialogOpen(false)}
        />
      )}
    </Box>
  );
}
