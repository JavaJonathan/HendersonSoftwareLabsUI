import { useEffect, useState } from 'react';
import { Alert, Button, Checkbox, FormControlLabel, Paper, Stack, Typography } from '@mui/material';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import { RadarDialog as AppDialog } from './RadarDialog';
import { SURFACE_SUBTLE } from '../../theme';
import { downloadOpportunityExport } from '../../api/opportunities';
import { getApiErrorMessage } from '../../api/client';

export function ExportDialog({ open, fullScreen, onClose }: { open: boolean; fullScreen: boolean; onClose: () => void }) {
  const [includeSynthetic, setIncludeSynthetic] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setIncludeSynthetic(false);
      setError('');
    }
  }, [open]);

  async function download() {
    setBusy(true);
    setError('');
    try {
      const blob = await downloadOpportunityExport(includeSynthetic);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `hsl-opportunity-radar-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}.csv`;
      anchor.click();
      URL.revokeObjectURL(url);
      onClose();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to export opportunities.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppDialog
      open={open}
      fullScreen={fullScreen}
      title="Export review data"
      busy={busy}
      onClose={onClose}
      actions={<>
        <Button onClick={onClose} disabled={busy}>Cancel</Button>
        <Button variant="contained" startIcon={<DownloadOutlinedIcon />} onClick={download} disabled={busy}>
          {busy ? 'Preparing...' : 'Download CSV'}
        </Button>
      </>}
    >
      <Stack spacing={2}>
        {error && <Alert severity="error">{error}</Alert>}
        <Typography sx={{ color: 'text.secondary' }}>
          Download both lanes with source metadata, model details, semantic factors, decisions, and notes.
        </Typography>
        <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, bgcolor: SURFACE_SUBTLE }}>
          <Stack direction="row" spacing={1.25} sx={{ alignItems: 'flex-start' }}>
            <CheckCircleOutlineRoundedIcon color="primary" />
            <Typography variant="body2">
              Imported and user-written cells are sanitized against spreadsheet formula injection.
              Stored source data is unchanged.
            </Typography>
          </Stack>
        </Paper>
        <FormControlLabel
          control={<Checkbox checked={includeSynthetic} onChange={event => setIncludeSynthetic(event.target.checked)} />}
          label="Include synthetic examples"
        />
        {!includeSynthetic && <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          Synthetic illustrations are excluded by default so they do not mix with real review data.
        </Typography>}
      </Stack>
    </AppDialog>
  );
}
