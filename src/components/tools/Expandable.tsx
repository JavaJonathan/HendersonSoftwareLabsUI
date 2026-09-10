import { useId, type ReactNode } from 'react';
import Box from '@mui/material/Box';
import Collapse from '@mui/material/Collapse';
import Typography from '@mui/material/Typography';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import { useReducedMotion } from 'framer-motion';

/**
 * A single self-contained disclosure: a labelled toggle button over a `Collapse` region.
 * Used for the calculator's "Working schedule" and "How this is calculated" sections so
 * the initial interface stays simple. Honors reduced-motion by collapsing instantly.
 */

interface ExpandableProps {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}

export function Expandable({ title, open, onToggle, children }: ExpandableProps) {
  const contentId = useId();
  const reduce = useReducedMotion() ?? false;

  return (
    <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
      <Box
        component="button"
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={contentId}
        sx={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1,
          px: 2,
          py: 1.25,
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          font: 'inherit',
          textAlign: 'left',
          color: 'text.primary',
          '&:hover': { bgcolor: 'action.hover' },
          '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: -2 },
        }}
      >
        <Typography component="span" sx={{ fontSize: 14, fontWeight: 700 }}>
          {title}
        </Typography>
        <ExpandMoreRoundedIcon
          sx={{
            fontSize: 20,
            color: 'text.secondary',
            transition: reduce ? 'none' : 'transform 0.2s ease',
            transform: open ? 'rotate(180deg)' : 'none',
          }}
        />
      </Box>
      <Collapse in={open} timeout={reduce ? 0 : 'auto'}>
        <Box id={contentId} sx={{ px: 2, pb: 2, pt: 0.5 }}>
          {children}
        </Box>
      </Collapse>
    </Box>
  );
}
