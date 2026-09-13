import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import GridViewOutlinedIcon from '@mui/icons-material/GridViewOutlined';
import { useAuth } from '../auth/useAuth';
import { getMyProjects } from '../api/portal';
import { ProjectGrid } from '../components/portal/ProjectGrid';
import { Reveal } from '../components/motion/Reveal';
import { GradientBackdrop } from '../components/motion/GradientBackdrop';
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
        <Box sx={{ position: 'relative', overflow: 'hidden' }}>
          <GradientBackdrop variant="light" />

          <Reveal>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1 }}>
              <GridViewOutlinedIcon sx={{ color: 'primary.main', fontSize: 20 }} />
              <Typography variant="overline" sx={{ color: 'primary.main' }}>
                Client Portal
              </Typography>
            </Stack>
          </Reveal>

          <Reveal delay={0.08}>
            <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary' }}>
              Your Software
            </Typography>
          </Reveal>

          <Reveal delay={0.16}>
            <Typography sx={{ mt: 0.5, color: 'text.secondary' }}>
              Everything we've built for {user?.companyName}.
            </Typography>
          </Reveal>
        </Box>

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
