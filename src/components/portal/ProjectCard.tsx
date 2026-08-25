import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Link from '@mui/material/Link';
import type { ChipProps } from '@mui/material/Chip';
import PlaylistAddCheckOutlinedIcon from '@mui/icons-material/PlaylistAddCheckOutlined';
import AutorenewOutlinedIcon from '@mui/icons-material/AutorenewOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import ConstructionOutlinedIcon from '@mui/icons-material/ConstructionOutlined';
import PauseCircleOutlinedIcon from '@mui/icons-material/PauseCircleOutlined';
import DoneAllOutlinedIcon from '@mui/icons-material/DoneAllOutlined';
import { PROJECT_STATUS_LABELS, type SoftwareProject } from '../../types';

const STATUS_COLOR: Record<SoftwareProject['status'], ChipProps['color']> = {
  Planning: 'default',
  InProgress: 'warning',
  Live: 'success',
  Maintenance: 'info',
  OnHold: 'error',
  Completed: 'default',
};

const STATUS_ICON: Record<SoftwareProject['status'], { icon: typeof CheckCircleOutlinedIcon; bg: string; fg: string }> = {
  Planning: { icon: PlaylistAddCheckOutlinedIcon, bg: '#f1f5f9', fg: '#64748b' },
  InProgress: { icon: AutorenewOutlinedIcon, bg: '#fef3c7', fg: '#d97706' },
  Live: { icon: CheckCircleOutlinedIcon, bg: '#dcfce7', fg: '#16a34a' },
  Maintenance: { icon: ConstructionOutlinedIcon, bg: '#dbeafe', fg: '#2563eb' },
  OnHold: { icon: PauseCircleOutlinedIcon, bg: '#fee2e2', fg: '#dc2626' },
  Completed: { icon: DoneAllOutlinedIcon, bg: '#f1f5f9', fg: '#64748b' },
};

export function ProjectCard({ project }: { project: SoftwareProject }) {
  const { icon: StatusIcon, bg, fg } = STATUS_ICON[project.status];

  return (
    <Card>
      <CardContent sx={{ p: 3 }}>
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: 2,
            bgcolor: bg,
            color: fg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 1.5,
          }}
        >
          <StatusIcon />
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1.5 }}>
          <Typography sx={{ fontWeight: 700, color: 'text.primary' }}>{project.name}</Typography>
          <Chip
            label={PROJECT_STATUS_LABELS[project.status]}
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
