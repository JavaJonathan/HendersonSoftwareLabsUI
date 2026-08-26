import { useState, type FormEvent } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Typography from '@mui/material/Typography';
import { createClient } from '../../api/admin';
import { getApiErrorMessage } from '../../api/client';
import { Reveal } from '../motion/Reveal';
import { PasswordRevealPanel } from './PasswordRevealPanel';
import type { CreateClientResult } from '../../types';

interface CreateClientDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function CreateClientDialog({ open, onClose, onCreated }: CreateClientDialogProps) {
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
        if (result && reason === 'backdropClick') return;
        resetAndClose();
      }}
      maxWidth="xs"
      fullWidth
    >
      {result ? (
        <>
          <DialogTitle>Client Created</DialogTitle>
          <DialogContent>
            <Reveal y={12}>
              <Typography variant="body2" color="text.secondary">
                {result.companyName} ({result.email})
              </Typography>

              <PasswordRevealPanel password={result.generatedPassword} />
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
          <DialogTitle>New Client</DialogTitle>
          <Stack component="form" onSubmit={handleSubmit}>
            <DialogContent>
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
            <DialogActions>
              <Button onClick={resetAndClose} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" variant="contained" disabled={submitting}>
                {submitting ? 'Creating…' : 'Create Client'}
              </Button>
            </DialogActions>
          </Stack>
        </>
      )}
    </Dialog>
  );
}
