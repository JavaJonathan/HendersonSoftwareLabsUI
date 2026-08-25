import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { ProjectCard } from './ProjectCard';
import { Reveal } from '../motion/Reveal';
import type { SoftwareProject } from '../../types';

interface ProjectGridProps {
  status: 'loading' | 'ready' | 'error';
  projects: SoftwareProject[];
  emptyMessage: string;
  loadingMessage?: string;
  errorMessage?: string;
}

/** Status-branching project grid shared by PortalPage and AdminClientDetailPage. */
export function ProjectGrid({
  status,
  projects,
  emptyMessage,
  loadingMessage = 'Loading projects…',
  errorMessage = 'Something went wrong loading projects. Please try again later.',
}: ProjectGridProps) {
  return (
    <Box sx={{ mt: 4 }}>
      {status === 'loading' && <Typography color="text.secondary">{loadingMessage}</Typography>}

      {status === 'error' && <Typography color="error">{errorMessage}</Typography>}

      {status === 'ready' && projects.length === 0 && (
        <Paper variant="outlined" sx={{ p: 6, textAlign: 'center', color: 'text.secondary', borderStyle: 'dashed' }}>
          {emptyMessage}
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
  );
}
