import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
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
      {status === 'loading' && (
        <Box role="status" aria-label={loadingMessage} sx={{ display: 'grid', gap: 3, gridTemplateColumns: GRID_COLUMNS }}>
          {[0, 1, 2].map((key) => (
            <Card key={key}>
              <CardContent sx={{ p: 3 }}>
                <Skeleton variant="rounded" width={44} height={44} sx={{ borderRadius: 2, mb: 1.5 }} />
                <Skeleton variant="text" width="60%" height={28} />
                <Skeleton variant="text" width="90%" />
                <Skeleton variant="text" width="75%" />
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {status === 'error' && <Alert severity="error">{errorMessage}</Alert>}

      {status === 'ready' && projects.length === 0 && (
        <Paper variant="outlined" sx={{ p: 6, textAlign: 'center', borderStyle: 'dashed' }}>
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
          <Typography sx={{ fontWeight: 700, color: 'text.primary' }}>Nothing here yet</Typography>
          <Typography variant="body2" sx={{ mt: 0.5, color: 'text.secondary' }}>
            {emptyMessage}
          </Typography>
        </Paper>
      )}

      {status === 'ready' && projects.length > 0 && (
        <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: GRID_COLUMNS }}>
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
