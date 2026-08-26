import { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Typography from '@mui/material/Typography';
import { resetClientPassword } from '../../api/admin';
import { getApiErrorMessage } from '../../api/client';
import { Reveal } from '../motion/Reveal';
import { PasswordRevealPanel } from './PasswordRevealPanel';

interface ResetPasswordDialogProps {
  open: boolean;
  clientId: string;
  clientLabel: string;
  onClose: () => void;
}

export function ResetPasswordDialog({ open, clientId, clientLabel, onClose }: ResetPasswordDialogProps) {
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
        if (generatedPassword && reason === 'backdropClick') return;
        resetAndClose();
      }}
      maxWidth="xs"
      fullWidth
    >
      {generatedPassword ? (
        <>
          <DialogTitle>Password Reset</DialogTitle>
          <DialogContent>
            <Reveal y={12}>
              <Typography variant="body2" color="text.secondary">
                {clientLabel}
              </Typography>

              <PasswordRevealPanel password={generatedPassword} />
            </Reveal>
          </DialogContent>
          <DialogActions>
            <Button variant="contained" onClick={resetAndClose}>
              Done
            </Button>
          </DialogActions>
        </>
      ) : (
        <>
          <DialogTitle>Reset Password</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary">
              This will generate a new password for {clientLabel}. Their current password will stop working
              immediately, and any active lockout will be cleared.
            </Typography>
            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={resetAndClose} disabled={submitting}>
              Cancel
            </Button>
            <Button variant="contained" color="warning" onClick={handleConfirm} disabled={submitting}>
              {submitting ? 'Resetting…' : 'Reset Password'}
            </Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  );
}
