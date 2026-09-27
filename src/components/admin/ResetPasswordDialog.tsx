import { useState } from 'react';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { AppDialog } from '../common/AppDialog';
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
    <AppDialog
      open={open}
      fullScreen={fullScreen}
      maxWidth="xs"
      title={generatedPassword ? 'Password Reset' : 'Reset Password'}
      onClose={(_event, reason) => {
        // The generated password is shown exactly once.
        if (generatedPassword && (reason === 'backdropClick' || reason === 'escapeKeyDown')) return;
        resetAndClose();
      }}
      actions={
        generatedPassword ? (
          <Button variant="contained" onClick={resetAndClose}>
            Done
          </Button>
        ) : (
          <>
            <Button onClick={resetAndClose} disabled={submitting}>
              Cancel
            </Button>
            <Button variant="contained" color="warning" onClick={handleConfirm} loading={submitting}>
              Reset Password
            </Button>
          </>
        )
      }
    >
      {generatedPassword ? (
        <Reveal y={12} fullWidth>
          <Typography variant="body2" color="text.secondary">
            {clientLabel}
          </Typography>

          <PasswordRevealPanel password={generatedPassword} />
        </Reveal>
      ) : (
        <>
          <Typography variant="body2" color="text.secondary">
            This will generate a new password for {clientLabel}. Their current password will stop working
            immediately, and any active lockout will be cleared.
          </Typography>
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </>
      )}
    </AppDialog>
  );
}
