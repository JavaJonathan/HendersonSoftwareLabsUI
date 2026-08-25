import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import { useAuth } from '../auth/AuthContext';
import { getMyProjects } from '../api/portal';
import { ProjectGrid } from '../components/portal/ProjectGrid';
import { Reveal } from '../components/motion/Reveal';
import { AuthedAppBar } from '../components/layout/AuthedAppBar';
import { SURFACE_SUBTLE } from '../theme';
import type { SoftwareProject } from '../types';

export function PortalPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<SoftwareProject[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    getMyProjects()
      .then((data) => {
        setProjects(data);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }, []);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: SURFACE_SUBTLE }}>
      <AuthedAppBar subtitle={user?.companyName ?? ''} />

      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Reveal>
          <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary' }}>
            Your Software
          </Typography>
          <Typography sx={{ mt: 0.5, color: 'text.secondary' }}>
            Everything we've built for {user?.companyName}.
          </Typography>
        </Reveal>

        <ProjectGrid
          status={status}
          projects={projects}
          loadingMessage="Loading your projects…"
          errorMessage="Something went wrong loading your projects. Please try again later."
          emptyMessage="No software has been assigned to your account yet."
        />
      </Container>
    </Box>
  );
}
