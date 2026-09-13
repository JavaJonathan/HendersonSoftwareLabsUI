import { useEffect, useState, type FormEvent } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import { createProject, updateProject } from '../../api/admin';
import { getApiErrorMessage } from '../../api/client';
import { PROJECT_STATUSES, PROJECT_STATUS_LABELS, type SoftwareProject } from '../../types';

interface ProjectDialogProps {
  open: boolean;
  clientId: string;
  project?: SoftwareProject | null;
  onClose: () => void;
  onSaved: () => void;
}

export function ProjectDialog({ open, clientId, project, onClose, onSaved }: ProjectDialogProps) {
  const isEditing = Boolean(project);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<SoftwareProject['status']>('Planning');
  const [url, setUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(project?.name ?? '');
    setDescription(project?.description ?? '');
    setStatus(project?.status ?? 'Planning');
    setUrl(project?.url ?? '');
    setError(null);
  }, [open, project]);

  function resetAndClose() {
    setError(null);
    onClose();
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const payload = { name, description, status, url: url || undefined };
      if (project) {
        await updateProject(clientId, project.id, payload);
      } else {
        await createProject(clientId, payload);
      }
      onSaved();
      resetAndClose();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Something went wrong. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onClose={resetAndClose} maxWidth="xs" fullWidth>
      <DialogTitle>{isEditing ? 'Edit Project' : 'Add Project'}</DialogTitle>
      <Stack component="form" onSubmit={handleSubmit}>
        <DialogContent>
          <Stack spacing={2.5}>
            <TextField
              label="Name"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              fullWidth
            />
            <TextField
              label="Description"
              required
              multiline
              minRows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              fullWidth
            />
            <TextField
              label="Status"
              select
              value={status}
              onChange={(e) => setStatus(e.target.value as SoftwareProject['status'])}
              fullWidth
            >
              {PROJECT_STATUSES.map((s) => (
                <MenuItem key={s} value={s}>
                  {PROJECT_STATUS_LABELS[s]}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="URL (optional)"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
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
            {submitting ? 'Saving…' : isEditing ? 'Save Changes' : 'Add Project'}
          </Button>
        </DialogActions>
      </Stack>
    </Dialog>
  );
}
