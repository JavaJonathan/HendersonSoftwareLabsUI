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
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import { createClient } from '../../api/admin';
import { ApiError } from '../../api/client';
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
  const [copied, setCopied] = useState(false);

  function resetAndClose() {
    setEmail('');
    setCompanyName('');
    setContactName('');
    setError(null);
    setResult(null);
    setCopied(false);
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
      if (err instanceof ApiError) {
        setError(err.message || 'Failed to create client.');
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCopy() {
    if (!result) return;
    await navigator.clipboard.writeText(result.generatedPassword);
    setCopied(true);
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
            <Typography variant="body2" color="text.secondary">
              {result.companyName} ({result.email})
            </Typography>

            <TextField
              label="Generated Password"
              value={result.generatedPassword}
              fullWidth
              margin="normal"
              slotProps={{
                input: {
                  readOnly: true,
                  sx: { fontFamily: 'monospace' },
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={handleCopy} edge="end">
                        {copied ? <CheckIcon color="success" /> : <ContentCopyIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />

            <Alert severity="warning" sx={{ mt: 1 }}>
              This password won't be shown again. Copy it now and relay it to the client directly.
            </Alert>
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
