import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import { useAuth } from '../auth/AuthContext';
import { getMyProjects } from '../api/portal';
import { ProjectCard } from '../components/portal/ProjectCard';
import type { SoftwareProject } from '../types';

export function PortalPage() {
  const { user, logout } = useAuth();
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
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc' }}>
      <AppBar position="static" color="transparent" sx={{ bgcolor: 'background.paper' }}>
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ py: 1 }}>
            <Box sx={{ flexGrow: 1 }}>
              <Typography sx={{ fontWeight: 700, color: 'text.primary' }}>Henderson Software Labs</Typography>
              <Typography variant="body2" color="text.secondary">
                {user?.companyName}
              </Typography>
            </Box>
            <Button variant="outlined" color="inherit" onClick={logout}>
              Log Out
            </Button>
          </Toolbar>
        </Container>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary' }}>
          Your Software
        </Typography>
        <Typography sx={{ mt: 0.5, color: 'text.secondary' }}>
          Everything we've built for {user?.companyName}.
        </Typography>

        <Box sx={{ mt: 4 }}>
          {status === 'loading' && <Typography color="text.secondary">Loading your projects…</Typography>}

          {status === 'error' && (
            <Typography color="error">
              Something went wrong loading your projects. Please try again later.
            </Typography>
          )}

          {status === 'ready' && projects.length === 0 && (
            <Paper
              variant="outlined"
              sx={{ p: 6, textAlign: 'center', color: 'text.secondary', borderStyle: 'dashed' }}
            >
              No software has been assigned to your account yet.
            </Paper>
          )}

          {status === 'ready' && projects.length > 0 && (
            <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' } }}>
              {projects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </Box>
          )}
        </Box>
      </Container>
    </Box>
  );
}
