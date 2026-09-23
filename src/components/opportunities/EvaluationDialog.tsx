import { useEffect, useState } from 'react';
import { Alert, Box, Button, Paper, Stack, Typography } from '@mui/material';
import { RadarDialog } from './RadarDialog';
import { SURFACE_SUBTLE } from '../../theme';
import {
  previewOpportunityEvaluation, evaluateOpportunities,
  type EvaluationPreview, type EvaluationProvider,
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
  const [provider, setProvider] = useState<EvaluationProvider>('Simulated');
  const [preview, setPreview] = useState<EvaluationPreview | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const isSingle = opportunityIds?.length === 1;
  useEffect(() => { if (open) { setProvider(liveAvailable ? 'Jev' : 'Simulated'); setPreview(null); setError(''); } }, [open, liveAvailable]);
  async function createPreview() {
    setBusy(true); setError('');
    try { setPreview(await previewOpportunityEvaluation(provider, opportunityIds)); }
    catch (err) { setError(getApiErrorMessage(err, `Unable to preview ${isSingle ? 'this record' : 'this evaluation batch'}.`)); }
    finally { setBusy(false); }
  }
  async function run() {
    if (!preview) return; setBusy(true); setError('');
    try {
      const result = await evaluateOpportunities(provider, opportunityIds, preview.confirmationCode);
      onEvaluated(`${plural(result.evaluatedCount, 'record')} evaluated with ${provider === 'Jev' ? 'live Jev' : 'the demonstration evaluator'}.${result.failedCount ? ` ${plural(result.failedCount, 'provider failure')} ${result.failedCount === 1 ? 'was' : 'were'} preserved for review.` : ''}`);
    } catch (err) { setError(getApiErrorMessage(err, `Unable to evaluate ${isSingle ? 'this record' : 'opportunities'}.`)); }
    finally { setBusy(false); }
  }
  return <RadarDialog open={open} fullScreen={fullScreen} title={isSingle ? 'Evaluate this record' : 'Evaluate opportunities'} busy={busy} onClose={onClose} actions={<><Button onClick={onClose} disabled={busy}>Cancel</Button>{!preview ? <Button variant="contained" onClick={createPreview} disabled={busy}>{busy ? 'Previewing...' : 'Preview'}</Button> : <Button variant="contained" color={provider === 'Jev' ? 'warning' : 'primary'} onClick={run} disabled={busy || !preview.allowed}>{busy ? 'Evaluating...' : provider === 'Jev' ? 'Confirm and call Jev' : 'Run demonstration'}</Button>}</>}>
    <Stack spacing={2.5}>{error && <Alert severity="error">{error}</Alert>}<Box><Typography variant="overline" color="primary.main">Step {preview ? 2 : 1} of 2</Typography><Typography variant="h6">{preview ? 'Review the batch' : 'Choose an evaluator'}</Typography></Box>{!preview ? <><Typography variant="body2" color="text.secondary">{isSingle ? 'This evaluates just this record.' : 'The batch can include up to 100 records across both lanes.'}</Typography><Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>{([['Simulated', 'Demonstration evaluator', 'Deterministic illustrations with no provider usage.'], ['Jev', 'Live Jev', liveAvailable ? 'Live semantic evaluation with usage guardrails.' : 'Not configured on the server.']] as const).map(([value, title, copy]) => <Paper key={value} variant="outlined" component="button" disabled={value === 'Jev' && !liveAvailable} onClick={() => setProvider(value)} sx={{ p: 2, textAlign: 'left', borderRadius: 3, cursor: 'pointer', font: 'inherit', color: 'inherit', bgcolor: provider === value ? 'primary.light' : 'background.paper', borderColor: provider === value ? 'primary.main' : 'divider', '&:disabled': { opacity: 0.5, cursor: 'not-allowed' } }}><Typography sx={{ fontWeight: 800 }}>{title}</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{copy}</Typography></Paper>)}</Box><Alert severity="info">{provider === 'Jev' ? 'Previewing does not call Jev.' : 'Demonstration results are illustrations, not measured Jev performance.'}</Alert></> : <Paper variant="outlined" sx={{ p: 2.5, bgcolor: SURFACE_SUBTLE, borderRadius: 3 }}><Typography variant="h6">{plural(preview.recordCount, 'record')}</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>Using {provider === 'Jev' ? 'live Jev' : 'the demonstration evaluator'}</Typography>{provider === 'Jev' && <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5, mt: 2 }}><Metric label="Maximum input" value={`${preview.estimatedMaximumInputTokens.toLocaleString()} tokens`} /><Metric label="Estimated input cost" value={`$${preview.estimatedMaximumCostUsd.toFixed(6)}`} /><Metric label="Batch ceiling" value={`$${preview.maximumBatchCostUsd.toFixed(2)}`} /><Metric label="Rolling usage" value={`${preview.rollingDailyInputTokensUsed.toLocaleString()} / ${preview.rollingDailyInputTokenLimit.toLocaleString()}`} /></Box>}{!preview.allowed && <Alert severity="error" sx={{ mt: 2 }}>{preview.reason ?? 'This batch is blocked by a server guardrail.'}</Alert>}</Paper>}</Stack>
  </RadarDialog>;
}

function Metric({ label, value }: { label: string; value: string }) { return <Box><Typography variant="caption" color="text.secondary">{label}</Typography><Typography sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{value}</Typography></Box>; }
