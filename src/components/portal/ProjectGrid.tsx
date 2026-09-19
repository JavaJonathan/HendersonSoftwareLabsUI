import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';
import Alert from '@mui/material/Alert';
import Typography from '@mui/material/Typography';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import { ProjectCard } from './ProjectCard';
import { Reveal } from '../motion/Reveal';
import type { SoftwareProject } from '../../types';

const GRID_COLUMNS = { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' };

interface ProjectGridProps {
  status: 'loading' | 'ready' | 'error';
  projects: SoftwareProject[];
  emptyTitle: string;
  emptyMessage: string;
  loadingMessage?: string;
  errorMessage?: string;
  onEditProject?: (project: SoftwareProject) => void;
}

/** Status-branching project grid shared by PortalPage and AdminClientDetailPage. */
export function ProjectGrid({
  status,
  projects,
  emptyTitle,
  emptyMessage,
  loadingMessage = 'Loading projects…',
  errorMessage = 'Something went wrong loading projects. Please try again later.',
  onEditProject,
}: ProjectGridProps) {
  return (
    <>
      {status === 'loading' && (
        <Reveal y={12} fullWidth>
          <Box
            role="status"
            aria-label={loadingMessage}
            sx={{ display: 'grid', gap: 3, gridTemplateColumns: GRID_COLUMNS }}
          >
            {[0, 1, 2].map((key) => (
              <Paper key={key} variant="outlined" sx={{ p: 3, borderRadius: 3, height: '100%' }}>
                <Skeleton variant="rounded" width={44} height={44} sx={{ borderRadius: 2, mb: 1.5 }} />
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1.5 }}>
                  <Skeleton variant="text" width="55%" height={28} />
                  <Skeleton variant="rounded" width={72} height={24} sx={{ borderRadius: 9999, flexShrink: 0 }} />
                </Box>
                <Skeleton variant="text" width="90%" />
                <Skeleton variant="text" width="75%" />
              </Paper>
            ))}
          </Box>
        </Reveal>
      )}

      {status === 'error' && (
        <Reveal y={12} fullWidth>
          <Alert severity="error" sx={{ borderRadius: 3 }}>
            {errorMessage}
          </Alert>
        </Reveal>
      )}

      {status === 'ready' && projects.length === 0 && (
        <Reveal y={12} fullWidth>
          <Paper variant="outlined" sx={{ p: 6, borderRadius: 3, textAlign: 'center', borderStyle: 'dashed' }}>
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: 2,
                bgcolor: 'primary.light',
                color: 'primary.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 2,
              }}
            >
              <Inventory2OutlinedIcon fontSize="large" />
            </Box>
            <Typography sx={{ fontWeight: 700, color: 'text.primary' }}>{emptyTitle}</Typography>
            <Typography variant="body2" sx={{ mt: 0.5, color: 'text.secondary' }}>
              {emptyMessage}
            </Typography>
          </Paper>
        </Reveal>
      )}

      {status === 'ready' && projects.length > 0 && (
        <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: GRID_COLUMNS }}>
          {projects.map((project, index) => (
            <Reveal key={project.id} delay={index * 0.08} y={16} fullWidth>
              <ProjectCard project={project} onEdit={onEditProject ? () => onEditProject(project) : undefined} />
            </Reveal>
          ))}
        </Box>
      )}
    </>
  );
}
