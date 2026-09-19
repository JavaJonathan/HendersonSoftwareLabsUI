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
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: SURFACE_SUBTLE }}>
      <AuthedAppBar subtitle={user?.companyName ?? ''} />

      {/* zIndex 0 makes this band its own stacking context. Without it GradientBackdrop's
          z-index:-1 layer paints before the page shell's opaque background and is invisible. */}
      <Box sx={{ position: 'relative', zIndex: 0, overflow: 'hidden', flexGrow: 1 }}>
        <GradientBackdrop variant="light" />

        <Container maxWidth="lg" sx={{ position: 'relative', pt: { xs: 4, md: 6 }, pb: { xs: 3, md: 4 } }}>
          <Reveal>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1 }}>
              <GridViewOutlinedIcon sx={{ color: 'primary.main', fontSize: 20 }} />
              <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 700, letterSpacing: 1 }}>
                Client Portal
              </Typography>
            </Stack>
          </Reveal>

          <Reveal delay={0.08}>
            <Typography variant="h4" component="h1" sx={{ color: 'text.primary', fontSize: { xs: 26, md: 34 } }}>
              Your Software
            </Typography>
            <Typography sx={{ mt: 0.5, color: 'text.secondary' }}>
              Everything we've built for {user?.companyName}.
            </Typography>
          </Reveal>
        </Container>

        <Container component="main" maxWidth="lg" sx={{ position: 'relative', pt: { xs: 3, md: 4 }, pb: { xs: 6, md: 8 } }}>
          <ProjectGrid
            status={status}
            projects={projects}
            loadingMessage="Loading your projects…"
            errorMessage="Something went wrong loading your projects. Please try again later."
            emptyTitle="No software yet"
            emptyMessage="No software has been assigned to your account yet."
          />
        </Container>
      </Box>
    </Box>
  );
}
