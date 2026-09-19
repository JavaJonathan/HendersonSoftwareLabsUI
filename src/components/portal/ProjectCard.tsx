import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import IconButton from '@mui/material/IconButton';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import PlaylistAddCheckOutlinedIcon from '@mui/icons-material/PlaylistAddCheckOutlined';
import AutorenewOutlinedIcon from '@mui/icons-material/AutorenewOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import ConstructionOutlinedIcon from '@mui/icons-material/ConstructionOutlined';
import PauseCircleOutlinedIcon from '@mui/icons-material/PauseCircleOutlined';
import DoneAllOutlinedIcon from '@mui/icons-material/DoneAllOutlined';
import { motion } from 'framer-motion';
import { PROJECT_STATUS_LABELS, type SoftwareProject } from '../../types';

interface StatusMeta {
  icon: typeof CheckCircleOutlinedIcon;
  /** Fill behind the status tile and the chip. */
  tint: string;
  /** Foreground for both. One ink per status, so the tile and the chip can never disagree. */
  ink: string;
}

/**
 * The tile and the chip are driven by the same pair on purpose. Using MUI's `color` prop for the
 * chip would pull from a palette this theme never defines, which is how `Live` ended up with a
 * #2e7d32 chip next to a #16a34a tile. The greens/ambers here are the same ones the calculator
 * already uses (`TaskCostResults.tsx`), and `Completed` is deliberately darker than `Planning`
 * so "not started" and "finished" no longer render identically.
 */
const STATUS_META: Record<SoftwareProject['status'], StatusMeta> = {
  Planning: { icon: PlaylistAddCheckOutlinedIcon, tint: '#f1f5f9', ink: '#64748b' },
  InProgress: { icon: AutorenewOutlinedIcon, tint: '#fef3c7', ink: '#b45309' },
  Live: { icon: CheckCircleOutlinedIcon, tint: '#dcfce7', ink: '#059669' },
  Maintenance: { icon: ConstructionOutlinedIcon, tint: '#dbeafe', ink: '#2563eb' },
  OnHold: { icon: PauseCircleOutlinedIcon, tint: '#fee2e2', ink: '#dc2626' },
  Completed: { icon: DoneAllOutlinedIcon, tint: '#e2e8f0', ink: '#334155' },
};

export function ProjectCard({ project, onEdit }: { project: SoftwareProject; onEdit?: () => void }) {
  const { icon: StatusIcon, tint, ink } = STATUS_META[project.status];

  return (
    <Paper
      component={motion.div}
      variant="outlined"
      whileTap={{ scale: 0.985 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      sx={{
        p: 3,
        borderRadius: 3,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 18px 34px -14px rgba(15, 23, 42, 0.18)',
          borderColor: '#bfdbfe',
        },
        '&:hover .portal-project-icon': { transform: 'scale(1.08) rotate(-4deg)' },
      }}
    >
      <Box
        className="portal-project-icon"
        sx={{
          width: 44,
          height: 44,
          borderRadius: 2,
          bgcolor: tint,
          color: ink,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 1.5,
          transition: 'transform 0.25s ease, background-color 0.25s ease, color 0.25s ease',
        }}
      >
        <StatusIcon />
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1.5 }}>
        <Typography sx={{ fontWeight: 700, color: 'text.primary' }}>{project.name}</Typography>
        <Stack direction="row" spacing={0.5} sx={{ flexShrink: 0, alignItems: 'center' }}>
          <Chip
            label={PROJECT_STATUS_LABELS[project.status]}
            size="small"
            sx={{ flexShrink: 0, bgcolor: tint, color: ink, fontWeight: 600 }}
          />
          {onEdit && (
            <IconButton
              size="small"
              aria-label={`Edit ${project.name}`}
              onClick={onEdit}
              sx={{
                color: 'text.secondary',
                '&:hover': { color: 'primary.main', bgcolor: 'primary.light' },
                '&:focus-visible': { outline: 'none', boxShadow: '0 0 0 3px rgba(37, 99, 235, 0.35)' },
              }}
            >
              <EditOutlinedIcon fontSize="small" />
            </IconButton>
          )}
        </Stack>
      </Box>

      <Typography
        variant="body2"
        sx={{
          mt: 1,
          color: 'text.secondary',
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {project.description}
      </Typography>

      {project.url && (
        <Box sx={{ mt: 'auto', pt: 2 }}>
          <Link
            href={project.url}
            target="_blank"
            rel="noreferrer"
            underline="none"
            aria-label={`Open ${project.name} in a new tab`}
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.5,
              fontWeight: 600,
              '& svg': { fontSize: 18, transition: 'transform 0.18s ease' },
              '&:hover svg': { transform: 'translateX(3px)' },
              '&:focus-visible': {
                outline: 'none',
                borderRadius: 1,
                boxShadow: '0 0 0 3px rgba(37, 99, 235, 0.35)',
              },
            }}
          >
            Open
            <ArrowForwardIcon />
          </Link>
        </Box>
      )}
    </Paper>
  );
}
