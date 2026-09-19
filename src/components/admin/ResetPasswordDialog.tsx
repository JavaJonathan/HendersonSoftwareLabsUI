import { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Alert from '@mui/material/Alert';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import { resetClientPassword } from '../../api/admin';
import { getApiErrorMessage } from '../../api/client';
import { Reveal } from '../motion/Reveal';
import { PasswordRevealPanel } from './PasswordRevealPanel';

const TITLE_SX = {
  fontFamily: '"Plus Jakarta Sans", "Segoe UI", system-ui, sans-serif',
  fontWeight: 800,
  fontSize: 20,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 2,
};

interface ResetPasswordDialogProps {
  open: boolean;
  clientId: string;
  clientLabel: string;
  onClose: () => void;
}

export function ResetPasswordDialog({ open, clientId, clientLabel, onClose }: ResetPasswordDialogProps) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);

  function resetAndClose() {
    setError(null);
    setGeneratedPassword(null);
    onClose();
  }

  async function handleConfirm() {
    setError(null);
    setSubmitting(true);

    try {
      const result = await resetClientPassword(clientId);
      setGeneratedPassword(result.generatedPassword);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Something went wrong. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={(_event, reason) => {
        // See CreateClientDialog: the generated password is shown exactly once.
        if (generatedPassword && (reason === 'backdropClick' || reason === 'escapeKeyDown')) return;
        resetAndClose();
      }}
      fullScreen={fullScreen}
      maxWidth="xs"
      fullWidth
      aria-labelledby="reset-password-title"
      aria-describedby={generatedPassword ? undefined : 'reset-password-description'}
      slotProps={{ paper: { sx: { borderRadius: fullScreen ? 0 : 4, overflow: 'hidden' } } }}
    >
      <Box sx={{ height: 5, background: 'linear-gradient(90deg, #2563eb, #60a5fa)' }} />

      {generatedPassword ? (
        <>
          <DialogTitle id="reset-password-title" sx={TITLE_SX}>
            <Box component="span">Password Reset</Box>
            <IconButton aria-label="Close" size="small" onClick={resetAndClose} sx={{ color: 'text.secondary', mr: -1 }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ pt: 1 }}>
            <Reveal y={12} fullWidth>
              <Typography variant="body2" color="text.secondary">
                {clientLabel}
              </Typography>

              <PasswordRevealPanel password={generatedPassword} />
            </Reveal>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5 }}>
            <Button variant="contained" onClick={resetAndClose}>
              Done
            </Button>
          </DialogActions>
        </>
      ) : (
        <>
          <DialogTitle id="reset-password-title" sx={TITLE_SX}>
            <Box component="span">Reset Password</Box>
            <IconButton aria-label="Close" size="small" onClick={resetAndClose} sx={{ color: 'text.secondary', mr: -1 }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ pt: 1 }}>
            <Typography id="reset-password-description" variant="body2" color="text.secondary">
              This will generate a new password for {clientLabel}. Their current password will stop working
              immediately, and any active lockout will be cleared.
            </Typography>
            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5 }}>
            <Button onClick={resetAndClose} disabled={submitting}>
              Cancel
            </Button>
            <Button variant="contained" color="warning" onClick={handleConfirm} loading={submitting}>
              Reset Password
            </Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  );
}
