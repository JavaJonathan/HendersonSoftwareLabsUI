import type { SxProps, Theme } from '@mui/material/styles';
import type { FormEvent, ReactNode } from 'react';
import { Box, Dialog, DialogActions, DialogContent, DialogTitle, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { ACCENT_GRADIENT } from '../../theme';

const TITLE_SX = {
  fontFamily: '"Plus Jakarta Sans", "Segoe UI", system-ui, sans-serif',
  fontWeight: 800,
  fontSize: 20,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 2,
  pr: 2,
};

/**
 * The shared dialog recipe used everywhere in the authenticated app: a gradient accent bar, a
 * Plus Jakarta Sans title with a close button, and `fullScreen` on phones. See the "Admin dialog
 * conventions" section of this repo's CLAUDE.md - a new dialog should match this rather than
 * falling back to MUI's bare defaults.
 */
export function AppDialog({
  open, fullScreen, title, busy = false, maxWidth = 'sm', onClose, onSubmit, children, actions, sx,
}: {
  sx?: SxProps<Theme>;
  open: boolean;
  fullScreen: boolean;
  title: ReactNode;
  busy?: boolean;
  maxWidth?: 'xs' | 'sm' | 'md';
  onClose: (event?: unknown, reason?: 'backdropClick' | 'escapeKeyDown') => void;
  /** When set, the title/content/actions render inside a <form> so a submit button can trigger it. */
  onSubmit?: (event: FormEvent) => void;
  children: ReactNode;
  actions: ReactNode;
}) {
  const body = (
    <>
      <DialogTitle id="app-dialog-title" sx={TITLE_SX}>
        <Box component="span" sx={{ overflowWrap: 'anywhere', minWidth: 0 }}>{title}</Box>
        <IconButton aria-label="Close" size="small" onClick={() => onClose()} disabled={busy} sx={{ color: 'text.secondary', flexShrink: 0 }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ pt: 1 }}>{children}</DialogContent>
      <DialogActions sx={{ px: 3, py: 2.5 }}>{actions}</DialogActions>
    </>
  );
  return (
    <Dialog
      sx={sx}
      open={open}
      onClose={busy ? undefined : onClose}
      fullScreen={fullScreen}
      fullWidth
      maxWidth={maxWidth}
      aria-labelledby="app-dialog-title"
      slotProps={{ paper: { sx: { borderRadius: fullScreen ? 0 : 4, overflow: 'hidden' } } }}
    >
      <Box sx={{ height: 5, background: ACCENT_GRADIENT }} />
      {onSubmit ? (
        // Lets DialogContent take the slack so the actions sit at the bottom when the dialog is
        // full screen on a phone. No effect at auto height on desktop.
        <Box component="form" onSubmit={onSubmit} sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, minHeight: 0 }}>
          {body}
        </Box>
      ) : body}
    </Dialog>
  );
}
