import { useState, type FormEvent } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Alert from '@mui/material/Alert';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import { createClient } from '../../api/admin';
import { getApiErrorMessage } from '../../api/client';
import { Reveal } from '../motion/Reveal';
import { PasswordRevealPanel } from './PasswordRevealPanel';
import type { CreateClientResult } from '../../types';

const TITLE_SX = {
  fontFamily: '"Plus Jakarta Sans", "Segoe UI", system-ui, sans-serif',
  fontWeight: 800,
  fontSize: 20,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 2,
};

interface CreateClientDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function CreateClientDialog({ open, onClose, onCreated }: CreateClientDialogProps) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const [email, setEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<CreateClientResult | null>(null);

  function resetAndClose() {
    setEmail('');
    setCompanyName('');
    setContactName('');
    setError(null);
    setResult(null);
    onClose();
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const created = await createClient({
        email,
        companyName,
        contactName: contactName || undefined,
      });
      setResult(created);
      onCreated();
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
        // Once the one-time password is on screen, Done is the only way out. Losing it to a
        // stray backdrop click or an Esc keypress is unrecoverable: the API never shows it again.
        if (result && (reason === 'backdropClick' || reason === 'escapeKeyDown')) return;
        resetAndClose();
      }}
      fullScreen={fullScreen}
      maxWidth="xs"
      fullWidth
      aria-labelledby="create-client-title"
      slotProps={{ paper: { sx: { borderRadius: fullScreen ? 0 : 4, overflow: 'hidden' } } }}
    >
      <Box sx={{ height: 5, background: 'linear-gradient(90deg, #2563eb, #60a5fa)' }} />

      {result ? (
        <>
          <DialogTitle id="create-client-title" sx={TITLE_SX}>
            <Box component="span">Client Created</Box>
            <IconButton aria-label="Close" size="small" onClick={resetAndClose} sx={{ color: 'text.secondary', mr: -1 }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ pt: 1 }}>
            <Reveal y={12} fullWidth>
              <Typography variant="body2" color="text.secondary">
                {result.companyName} ({result.email})
              </Typography>

              <PasswordRevealPanel password={result.generatedPassword} />
            </Reveal>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5 }}>
            <Button variant="contained" onClick={resetAndClose}>
              Done
            </Button>
          </DialogActions>
        </>
      ) : (
        // Lets DialogContent take the slack so the actions sit at the bottom when the
        // dialog is full screen on a phone. No effect at auto height on desktop.
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, minHeight: 0 }}
        >
          <DialogTitle id="create-client-title" sx={TITLE_SX}>
            <Box component="span">New Client</Box>
            <IconButton aria-label="Close" size="small" onClick={resetAndClose} sx={{ color: 'text.secondary', mr: -1 }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ pt: 1 }}>
            <Stack spacing={2.5}>
              <TextField
                label="Email"
                type="email"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                fullWidth
              />
              <TextField
                label="Company Name"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                fullWidth
              />
              <TextField
                label="Contact Name (optional)"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                fullWidth
              />
              {error && <Alert severity="error">{error}</Alert>}
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5 }}>
            <Button onClick={resetAndClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" loading={submitting}>
              Create Client
            </Button>
          </DialogActions>
        </Box>
      )}
    </Dialog>
  );
}
