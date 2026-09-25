import { useEffect, useState } from 'react';
import { Alert, Box, Button, Paper, Stack, Typography } from '@mui/material';
import { RadarDialog } from './RadarDialog';
import { SURFACE_SUBTLE } from '../../theme';
import {
  previewOpportunityEvaluation, evaluateOpportunities,
  type EvaluationPreview,
} from '../../api/opportunities';
import { getApiErrorMessage } from '../../api/client';

function plural(count: number, noun: string) { return `${count} ${noun}${count === 1 ? '' : 's'}`; }

export function EvaluationDialog({ open, fullScreen, opportunityIds, liveAvailable, onClose, onEvaluated }: {
  open: boolean;
  fullScreen: boolean;
  opportunityIds?: number[];
  liveAvailable: boolean;
  onClose: () => void;
  onEvaluated: (message: string) => void;
}) {
  const [preview, setPreview] = useState<EvaluationPreview | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const isSingle = opportunityIds?.length === 1;
  useEffect(() => { if (open) { setPreview(null); setError(''); } }, [open]);
  async function createPreview() {
    setBusy(true); setError('');
    try { setPreview(await previewOpportunityEvaluation(opportunityIds)); }
    catch (err) { setError(getApiErrorMessage(err, `Unable to preview ${isSingle ? 'this record' : 'this evaluation batch'}.`)); }
    finally { setBusy(false); }
  }
  async function run() {
    if (!preview) return; setBusy(true); setError('');
    try {
      const result = await evaluateOpportunities(opportunityIds, preview.confirmationCode);
      onEvaluated(`${plural(result.evaluatedCount, 'record')} evaluated with Jev.${result.failedCount ? ` ${plural(result.failedCount, 'provider failure')} ${result.failedCount === 1 ? 'was' : 'were'} preserved for review.` : ''}`);
    } catch (err) { setError(getApiErrorMessage(err, `Unable to evaluate ${isSingle ? 'this record' : 'opportunities'}.`)); }
    finally { setBusy(false); }
  }
  return <RadarDialog open={open} fullScreen={fullScreen} title={isSingle ? 'Evaluate this record with Jev' : 'Evaluate opportunities with Jev'} busy={busy} onClose={onClose} actions={<><Button onClick={onClose} disabled={busy}>Cancel</Button>{!preview ? <Button variant="contained" onClick={createPreview} disabled={busy || !liveAvailable}>{busy ? 'Previewing...' : 'Preview'}</Button> : <Button variant="contained" color="warning" onClick={run} disabled={busy || !preview.allowed}>{busy ? 'Evaluating...' : 'Confirm and call Jev'}</Button>}</>}>
    <Stack spacing={2.5}>{error && <Alert severity="error">{error}</Alert>}<Box><Typography variant="overline" color="primary.main">Step {preview ? 2 : 1} of 2</Typography><Typography variant="h6">{preview ? 'Review the batch' : 'Preview provider usage'}</Typography></Box>{!preview ? <><Typography variant="body2" color="text.secondary">{isSingle ? 'This evaluates just this record.' : 'The batch can include up to 100 records across both lanes.'} Imported agent judgments are kept out of the Jev request.</Typography>{!liveAvailable && <Alert severity="warning">Jev is not configured on the server.</Alert>}<Alert severity="info">Previewing does not call Jev or spend provider usage.</Alert></> : <Paper variant="outlined" sx={{ p: 2.5, bgcolor: SURFACE_SUBTLE, borderRadius: 3 }}><Typography variant="h6">{plural(preview.recordCount, 'record')}</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>Using live Jev</Typography><Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5, mt: 2 }}><Metric label="Maximum input" value={`${preview.estimatedMaximumInputTokens.toLocaleString()} tokens`} /><Metric label="Estimated input cost" value={`$${preview.estimatedMaximumCostUsd.toFixed(6)}`} /><Metric label="Batch ceiling" value={`$${preview.maximumBatchCostUsd.toFixed(2)}`} /><Metric label="Rolling usage" value={`${preview.rollingDailyInputTokensUsed.toLocaleString()} / ${preview.rollingDailyInputTokenLimit.toLocaleString()}`} /></Box>{!preview.allowed && <Alert severity="error" sx={{ mt: 2 }}>{preview.reason ?? 'This batch is blocked by a server guardrail.'}</Alert>}</Paper>}</Stack>
  </RadarDialog>;
}

function Metric({ label, value }: { label: string; value: string }) { return <Box><Typography variant="caption" color="text.secondary">{label}</Typography><Typography sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{value}</Typography></Box>; }
