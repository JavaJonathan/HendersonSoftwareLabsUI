import { useEffect, useState, type FormEvent } from 'react';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { AppDialog } from '../common/AppDialog';
import { createProject, updateProject } from '../../api/admin';
import { getApiErrorMessage } from '../../api/client';
import { PROJECT_STATUSES, PROJECT_STATUS_LABELS, type SoftwareProject } from '../../types';

const EMPTY_FORM = {
  name: '',
  description: '',
  status: 'Planning' as SoftwareProject['status'],
  url: '',
};

interface ProjectDialogProps {
  open: boolean;
  clientId: string;
  project?: SoftwareProject | null;
  onClose: () => void;
  onSaved: () => void;
}

export function ProjectDialog({ open, clientId, project, onClose, onSaved }: ProjectDialogProps) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const isEditing = Boolean(project);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<SoftwareProject['status']>('Planning');
  const [url, setUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  /** What the form looked like when it opened, so a stray backdrop click cannot discard real edits. */
  const [initial, setInitial] = useState(EMPTY_FORM);

  useEffect(() => {
    if (!open) return;
    const snapshot = {
      name: project?.name ?? '',
      description: project?.description ?? '',
      status: project?.status ?? EMPTY_FORM.status,
      url: project?.url ?? '',
    };
    setInitial(snapshot);
    setName(snapshot.name);
    setDescription(snapshot.description);
    setStatus(snapshot.status);
    setUrl(snapshot.url);
    setError(null);
  }, [open, project]);

  const isDirty =
    name !== initial.name ||
    description !== initial.description ||
    status !== initial.status ||
    url !== initial.url;

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
    <AppDialog
      open={open}
      fullScreen={fullScreen}
      maxWidth="sm"
      title={isEditing ? 'Edit Project' : 'Add Project'}
      onClose={(_event, reason) => {
        // Cancel and Esc stay as the deliberate ways to throw the form away. A click that
        // happens to land outside the dialog is not one of them.
        if (isDirty && reason === 'backdropClick') return;
        resetAndClose();
      }}
      onSubmit={handleSubmit}
      actions={
        <>
          <Button onClick={resetAndClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" loading={submitting}>
            {isEditing ? 'Save Changes' : 'Add Project'}
          </Button>
        </>
      }
    >
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
          minRows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          fullWidth
          helperText="Shown on the project card in the client's portal."
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
    </AppDialog>
  );
}
