import type { ReactNode } from 'react';
import { Box, Dialog, DialogActions, DialogContent, DialogTitle, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

export function RadarDialog({
  open, fullScreen, title, busy = false, maxWidth = 'sm', onClose, children, actions,
}: {
  open: boolean;
  fullScreen: boolean;
  title: string;
  busy?: boolean;
  maxWidth?: 'xs' | 'sm' | 'md';
  onClose: () => void;
  children: ReactNode;
  actions: ReactNode;
}) {
  return (
    <Dialog
      open={open}
      onClose={busy ? undefined : onClose}
      fullScreen={fullScreen}
      fullWidth
      maxWidth={maxWidth}
      aria-labelledby="radar-dialog-title"
      slotProps={{ paper: { sx: { borderRadius: fullScreen ? 0 : 4, overflow: 'hidden' } } }}
    >
      <Box sx={{ height: 5, background: 'linear-gradient(90deg, #2563eb, #60a5fa)' }} />
      <DialogTitle
        id="radar-dialog-title"
        sx={{
          fontFamily: '"Plus Jakarta Sans", "Segoe UI", system-ui, sans-serif',
          fontWeight: 800,
          fontSize: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          pr: 2,
        }}
      >
        {title}
        <IconButton aria-label="Close" size="small" onClick={onClose} disabled={busy} sx={{ color: 'text.secondary' }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ pt: 1 }}>{children}</DialogContent>
      <DialogActions sx={{ px: 3, py: 2.5 }}>{actions}</DialogActions>
    </Dialog>
  );
}
