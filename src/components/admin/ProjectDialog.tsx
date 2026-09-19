import { useEffect, useState, type FormEvent } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Alert from '@mui/material/Alert';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import { createProject, updateProject } from '../../api/admin';
import { getApiErrorMessage } from '../../api/client';
import { PROJECT_STATUSES, PROJECT_STATUS_LABELS, type SoftwareProject } from '../../types';

const TITLE_SX = {
  fontFamily: '"Plus Jakarta Sans", "Segoe UI", system-ui, sans-serif',
  fontWeight: 800,
  fontSize: 20,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 2,
};

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
    <Dialog
      open={open}
      onClose={(_event, reason) => {
        // Cancel and Esc stay as the deliberate ways to throw the form away. A click that
        // happens to land outside the dialog is not one of them.
        if (isDirty && reason === 'backdropClick') return;
        resetAndClose();
      }}
      fullScreen={fullScreen}
      maxWidth="sm"
      fullWidth
      aria-labelledby="project-dialog-title"
      slotProps={{ paper: { sx: { borderRadius: fullScreen ? 0 : 4, overflow: 'hidden' } } }}
    >
      <Box sx={{ height: 5, background: 'linear-gradient(90deg, #2563eb, #60a5fa)' }} />

      {/* Lets DialogContent take the slack so the actions sit at the bottom when the
          dialog is full screen on a phone. No effect at auto height on desktop. */}
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, minHeight: 0 }}
      >
        <DialogTitle id="project-dialog-title" sx={TITLE_SX}>
          <Box component="span">{isEditing ? 'Edit Project' : 'Add Project'}</Box>
          <IconButton aria-label="Close" size="small" onClick={resetAndClose} sx={{ color: 'text.secondary', mr: -1 }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
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
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={resetAndClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" loading={submitting}>
            {isEditing ? 'Save Changes' : 'Add Project'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
