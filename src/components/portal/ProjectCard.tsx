import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Link from '@mui/material/Link';
import type { ChipProps } from '@mui/material/Chip';
import type { SoftwareProject } from '../../types';

const STATUS_COLOR: Record<SoftwareProject['status'], ChipProps['color']> = {
  Planning: 'default',
  InProgress: 'warning',
  Live: 'success',
  Maintenance: 'info',
  OnHold: 'error',
  Completed: 'default',
};

const STATUS_LABELS: Record<SoftwareProject['status'], string> = {
  Planning: 'Planning',
  InProgress: 'In Progress',
  Live: 'Live',
  Maintenance: 'Maintenance',
  OnHold: 'On Hold',
  Completed: 'Completed',
};

export function ProjectCard({ project }: { project: SoftwareProject }) {
  return (
    <Card>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1.5 }}>
          <Typography sx={{ fontWeight: 700, color: 'text.primary' }}>{project.name}</Typography>
          <Chip
            label={STATUS_LABELS[project.status]}
            color={STATUS_COLOR[project.status]}
            size="small"
            sx={{ flexShrink: 0 }}
          />
        </Box>
        <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
          {project.description}
        </Typography>
        {project.url && (
          <Link href={project.url} target="_blank" rel="noreferrer" sx={{ mt: 2, display: 'inline-block', fontWeight: 600 }}>
            Open →
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
