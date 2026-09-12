import { useId, type ReactNode } from 'react';
import Box from '@mui/material/Box';
import Collapse from '@mui/material/Collapse';
import Typography from '@mui/material/Typography';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import { useReducedMotion } from 'framer-motion';

/**
 * A single self-contained disclosure: a labelled toggle button over a `Collapse` region.
 * Used for the calculator's optional panels so the initial interface stays simple. Honors
 * reduced-motion by collapsing instantly.
 *
 * `badge` is how a collapsed panel admits it is hiding something. Without it, a visitor who
 * loads a shared link has no way to tell that the sender moved three assumptions inside a
 * panel that looks shut and empty.
 */

interface ExpandableProps {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
  /** Short marker shown beside the title, e.g. "3 changed". */
  badge?: string | null;
  /** Optional one-liner under the title, visible while collapsed. */
  hint?: string;
}

export function Expandable({ title, open, onToggle, children, badge, hint }: ExpandableProps) {
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
        <Box sx={{ minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Typography component="span" sx={{ fontSize: 14, fontWeight: 700 }}>
              {title}
            </Typography>
            {badge && (
              <Box
                component="span"
                sx={{
                  px: 0.9,
                  py: 0.15,
                  borderRadius: 9999,
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  fontSize: 11,
                  fontWeight: 700,
                  lineHeight: 1.6,
                }}
              >
                {badge}
              </Box>
            )}
          </Box>
          {hint && !open && (
            <Typography
              component="span"
              sx={{ display: 'block', fontSize: 12, color: 'text.secondary', mt: 0.25 }}
            >
              {hint}
            </Typography>
          )}
        </Box>
        <ExpandMoreRoundedIcon
          sx={{
            fontSize: 20,
            flexShrink: 0,
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
