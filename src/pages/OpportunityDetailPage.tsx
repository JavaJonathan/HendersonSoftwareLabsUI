import { Fragment, useEffect, useState } from 'react';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import {
  Alert, Box, Button, Chip, Container, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, IconButton,
  InputLabel, Link, MenuItem, Paper, Select, Stack, TextField, Typography, useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import CloseIcon from '@mui/icons-material/Close';
import { AuthedAppBar } from '../components/layout/AuthedAppBar';
import { SURFACE_SUBTLE } from '../theme';
import {
  getOpportunity, getOpportunityComparison, updateOpportunityReview, deleteOpportunity, clearOpportunityDuplicate,
  RECOMMENDATION_META, SOURCE_TYPE_LABELS,
  type ActiveProjectDecision, type BusinessProspectDecision, type OpportunityComparison, type OpportunityDetail,
} from '../api/opportunities';
import { getApiErrorMessage } from '../api/client';

const DIALOG_TITLE_SX = {
  fontFamily: '"Plus Jakarta Sans", "Segoe UI", system-ui, sans-serif', fontWeight: 800, fontSize: 20,
  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2,
};

const ACTIVE_PROJECT_DECISIONS: ActiveProjectDecision[] = ['Pursue', 'Investigate', 'Pass'];
const BUSINESS_PROSPECT_DECISIONS: BusinessProspectDecision[] = ['Prioritize', 'Watch', 'Skip'];

export function OpportunityDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const [item, setItem] = useState<OpportunityDetail | null>(null);
  const [comparison, setComparison] = useState<OpportunityComparison | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [decision, setDecision] = useState<ActiveProjectDecision | BusinessProspectDecision | ''>('');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [clearingDuplicate, setClearingDuplicate] = useState(false);

  useEffect(() => {
    if (!id) return; let active = true; setError('');
    Promise.all([getOpportunity(Number(id)), getOpportunityComparison(Number(id))]).then(([data, comparisonData]) => {
      if (!active) return;
      setItem(data); setComparison(comparisonData);
      setDecision(data.activeProject?.userDecision ?? data.businessProspect?.userDecision ?? '');
      setNotes(data.notes);
    }).catch(() => { if (active) setError('Unable to load this opportunity.'); });
    return () => { active = false; };
  }, [id]);

  async function save() {
    if (!item) return; setBusy(true); setError(''); setNotice('');
    try { await updateOpportunityReview(item.id, decision || null, notes); setNotice('Decision and notes saved.'); }
    catch (err) { setError(getApiErrorMessage(err, 'Unable to save your review.')); }
    finally { setBusy(false); }
  }

  async function confirmDelete() {
    if (!item) return; setDeleting(true); setDeleteError('');
    try { await deleteOpportunity(item.id); navigate(item.entityType === 'ActiveProject' ? '/admin/opportunities' : '/admin/opportunities/prospects'); }
    catch (err) { setDeleteError(getApiErrorMessage(err, 'Unable to delete this opportunity.')); }
    finally { setDeleting(false); }
  }

  async function clearDuplicate() {
    if (!item) return; setClearingDuplicate(true); setError(''); setNotice('');
    try { await clearOpportunityDuplicate(item.id); setItem({ ...item, duplicateOfId: null }); setNotice('Cleared the possible-duplicate flag.'); }
    catch (err) { setError(getApiErrorMessage(err, 'Unable to clear the duplicate flag.')); }
    finally { setClearingDuplicate(false); }
  }

  if (error && !item) return <Box sx={{ minHeight: '100vh', bgcolor: SURFACE_SUBTLE }}><AuthedAppBar subtitle="Opportunity Radar" /><Container sx={{ py: 5 }}><Alert severity="error">{error}</Alert></Container></Box>;
  if (!item) return <Box sx={{ minHeight: '100vh', bgcolor: SURFACE_SUBTLE }}><AuthedAppBar subtitle="Opportunity Radar" /><Container sx={{ py: 5 }}><Typography>Loading opportunity...</Typography></Container></Box>;

  const isActiveProject = item.entityType === 'ActiveProject';
  const decisionOptions = isActiveProject ? ACTIVE_PROJECT_DECISIONS : BUSINESS_PROSPECT_DECISIONS;
  const backTo = isActiveProject ? '/admin/opportunities' : '/admin/opportunities/prospects';
  const evaluation = item.evaluation;
  const result = evaluation?.result;
  const evidenceIds = new Set(result?.factors.map(factor => factor.evidencePassageId) ?? []);

  return <Box sx={{ minHeight: '100vh', bgcolor: SURFACE_SUBTLE }}>
    <AuthedAppBar subtitle="Opportunity Radar" />
    <Container component="main" maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
      <Link component={RouterLink} to={backTo}>Back to {isActiveProject ? 'active projects' : 'business prospects'}</Link>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mt: 2, mb: 3, justifyContent: 'space-between', alignItems: { md: 'flex-start' } }}>
        <Box sx={{ minWidth: 0 }}>
          <Stack direction="row" spacing={0.75} useFlexGap sx={{ flexWrap: 'wrap', mb: 1 }}>
            {evaluation?.recommendation && <Chip label={evaluation.recommendation} color={RECOMMENDATION_META[evaluation.recommendation].chipColor} />}
            {evaluation?.priorityBand && <Chip label={`${evaluation.priorityBand} priority`} variant="outlined" />}
            {isActiveProject
              ? item.activeProject && <Chip label={SOURCE_TYPE_LABELS[item.activeProject.sourceType]} variant="outlined" />
              : <Fragment key="prospect-header-chips">
                <Chip label="Business prospect" variant="outlined" />
                {item.businessProspect?.industry && <Chip label={item.businessProspect.industry} variant="outlined" />}
              </Fragment>}
            {item.isSynthetic && <Chip label="Synthetic example" color="info" variant="outlined" />}
            {evaluation?.provider === 'Simulated' && <Chip label="Simulated evaluation" color="warning" variant="outlined" />}
            {evaluation?.provider === 'Jev' && <Chip label={`Live Jev: ${evaluation.model}`} color="success" variant="outlined" />}
            {evaluation?.status === 'Stale' && <Chip label="Reevaluation required" color="warning" />}
            {evaluation?.status === 'Failed' && <Chip label="Provider failure" color="error" />}
          </Stack>
          <Typography component="h1" variant="h4" sx={{ fontSize: { xs: 27, md: 36 }, overflowWrap: 'anywhere' }}>{item.title}</Typography>
          {item.sourceName && <Typography color="text.secondary" sx={{ mt: 0.75 }}>{item.sourceName}</Typography>}
          {item.duplicateOfId && <Alert severity="warning" sx={{ mt: 2 }} action={
            <Button color="inherit" size="small" onClick={clearDuplicate} disabled={clearingDuplicate}>{clearingDuplicate ? 'Clearing...' : 'Not a duplicate'}</Button>
          }>This may duplicate opportunity #{item.duplicateOfId}. Review both before acting.</Alert>}
        </Box>
        {item.sourceUrl && <Button component="a" href={item.sourceUrl} target="_blank" rel="noopener noreferrer" variant="outlined" endIcon={<OpenInNewIcon />}>Open source</Button>}
      </Stack>
      {notice && <Alert severity="success" onClose={() => setNotice('')} sx={{ mb: 2 }}>{notice}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1.65fr) minmax(300px, .85fr)' }, gap: 2.5, alignItems: 'start' }}>
        <Stack spacing={2.5}>
          {evaluation?.status === 'Failed' ? <Alert severity="error">Evaluation failed without changing the opportunity score. {evaluation.errorMessage ?? 'Retry when the provider is available.'}</Alert> : evaluation ? <Paper variant="outlined" sx={{ p: { xs: 2.5, md: 3 }, borderRadius: 3 }}>
            <Typography variant="overline" color="primary.main">Recommendation</Typography>
            <Typography variant="h5" sx={{ mt: 0.5 }}>{evaluation.summary}</Typography>
            <Typography sx={{ mt: 2, fontWeight: 700 }}>Next step</Typography>
            <Typography color="text.secondary" sx={{ mt: 0.5 }}>{evaluation.nextStep}</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>{evaluation.provider === 'Jev'
              ? `Recommendation assembled deterministically from stored Jev judgments and source evidence. Usage: ${evaluation.inputTokens?.toLocaleString() ?? 'unknown'} input tokens.`
              : 'Generated deterministically from a simulated evaluation. It is not a Jev result.'}</Typography>
          </Paper> : <Alert severity="info">This record has not been evaluated yet. Return to the inbox and choose an evaluation provider.</Alert>}

          {!isActiveProject && item.businessProspect && <Section title="Business details">
            <Stack spacing={1}>
              <Typography variant="body2"><strong>Website:</strong> {item.businessProspect.websiteUrl
                ? <Link href={item.businessProspect.websiteUrl} target="_blank" rel="noopener noreferrer">{item.businessProspect.websiteUrl}</Link>
                : 'No website found'}</Typography>
              <Typography variant="body2"><strong>Geography:</strong> {item.businessProspect.geography ?? 'Unknown'}</Typography>
              <Typography variant="body2"><strong>Industry:</strong> {item.businessProspect.industry ?? 'Unknown'}</Typography>
            </Stack>
          </Section>}

          {!!result?.factors.length && <Section title="Fit factors">
            <Stack spacing={1.5}>{result.factors.map(factor => <Paper key={factor.key} variant="outlined" sx={{ p: 2, bgcolor: SURFACE_SUBTLE }}>
              <Stack direction="row" sx={{ justifyContent: 'space-between', gap: 2 }}><Typography sx={{ fontWeight: 700 }}>{factor.label}</Typography><Chip size="small" label={`${factor.score} / 3`} /></Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>{factor.explanation}</Typography>
              {factor.evidencePassageId !== 'none' && <Typography variant="caption" color="primary.main">Evidence: {factor.evidencePassageId}</Typography>}
            </Paper>)}</Stack>
          </Section>}

          {comparison && (comparison.baseline || comparison.semantic) && <Section title={isActiveProject ? 'Semantic evaluation vs keyword baseline' : 'Semantic evaluation'}>
            {comparison.isIllustration && <Alert severity="info" sx={{ mb: 2 }}>Illustration only. This synthetic comparison is not an accuracy benchmark.</Alert>}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: comparison.baseline ? '1fr 1fr' : '1fr' }, gap: 2 }}>
              <Paper variant="outlined" sx={{ p: 2.25, bgcolor: SURFACE_SUBTLE }}>
                <Typography variant="overline" color="primary.main">Semantic evaluation</Typography>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center', my: 1 }}>
                  {comparison.semantic?.recommendation ? <Chip size="small" label={comparison.semantic.recommendation} color={RECOMMENDATION_META[comparison.semantic.recommendation].chipColor} /> : <Chip size="small" label={comparison.semantic?.status ?? 'Not evaluated'} />}
                  {comparison.semantic?.priorityBand && <Chip size="small" variant="outlined" label={`${comparison.semantic.priorityBand} priority`} />}
                </Stack>
                <Typography variant="body2" color="text.secondary">{comparison.semantic?.summary ?? 'No semantic result is available.'}</Typography>
                {comparison.semantic && <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>{comparison.semantic.provider === 'Jev' ? `Jev model: ${comparison.semantic.model}` : 'Deterministic demonstration evaluator'}</Typography>}
              </Paper>
              {comparison.baseline ? <Paper variant="outlined" sx={{ p: 2.25, bgcolor: SURFACE_SUBTLE }}>
                <Typography variant="overline" color="text.secondary">Literal keyword baseline</Typography>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center', my: 1 }}><Chip size="small" label={comparison.baseline.recommendation} color={RECOMMENDATION_META[comparison.baseline.recommendation].chipColor} /><Chip size="small" variant="outlined" label={`${comparison.baseline.keywordScore} / 3 keyword score`} /></Stack>
                <Typography variant="body2" color="text.secondary">{comparison.baseline.summary}</Typography>
                <Typography variant="body2" sx={{ mt: 1.5, fontWeight: 700 }}>Matched terms</Typography>
                <Stack direction="row" spacing={0.75} useFlexGap sx={{ mt: 0.75, flexWrap: 'wrap' }}>{comparison.baseline.matchedTerms.length
                  ? comparison.baseline.matchedTerms.map(term => <Chip key={term} size="small" variant="outlined" label={term} />)
                  : <Typography variant="body2" color="text.secondary">None</Typography>}</Stack>
                <Typography variant="body2" sx={{ mt: 1.5, fontWeight: 700 }}>Hard rules</Typography>
                <Stack spacing={0.5} sx={{ mt: 0.75 }}>{comparison.baseline.hardRules.map(rule => <Typography key={rule.key} variant="caption" color={rule.triggered ? 'error.main' : 'text.secondary'}>{rule.triggered ? 'Triggered: ' : 'Clear: '}{rule.explanation}</Typography>)}</Stack>
              </Paper> : comparison.baselineUnavailableReason && <Alert severity="info" sx={{ alignSelf: 'start' }}>{comparison.baselineUnavailableReason}</Alert>}
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>{comparison.note}</Typography>
          </Section>}

          <Section title="Original description">
            <Paper variant="outlined" sx={{ p: 2.5, bgcolor: SURFACE_SUBTLE, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{item.description}</Paper>
            {(item.sourceDate || item.externalId) && <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>{item.sourceDate && `Source date: ${new Date(item.sourceDate).toLocaleDateString()}`}{item.sourceDate && item.externalId && ' | '}{item.externalId && `External ID: ${item.externalId}`}</Typography>}
          </Section>

          <Section title="Stored evidence passages">
            <Typography color="text.secondary" sx={{ mb: 1.5 }}>Quotations below come directly from the stored source text.</Typography>
            <Stack spacing={1.25}>{item.passages.map(passage => <Paper key={passage.id} variant="outlined" sx={{ p: 2, borderColor: evidenceIds.has(passage.id) ? 'primary.main' : 'divider', bgcolor: evidenceIds.has(passage.id) ? 'primary.light' : 'background.paper' }}>
              <Typography variant="overline" color="text.secondary">{passage.id}</Typography><Typography sx={{ whiteSpace: 'pre-wrap' }}>{passage.text}</Typography>
            </Paper>)}</Stack>
          </Section>
        </Stack>

        <Stack spacing={2.5} sx={{ position: { lg: 'sticky' }, top: { lg: 88 } }}>
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
            <Typography variant="h6">Your review</Typography>
            <Stack spacing={2} sx={{ mt: 2 }}>
              <FormControl fullWidth><InputLabel>Decision</InputLabel><Select label="Decision" value={decision} onChange={event => setDecision(event.target.value as ActiveProjectDecision | BusinessProspectDecision | '')}><MenuItem value="">Unreviewed</MenuItem>{decisionOptions.map(value => <MenuItem key={value} value={value}>{value}</MenuItem>)}</Select></FormControl>
              <TextField label="Notes" value={notes} onChange={event => setNotes(event.target.value)} multiline minRows={5} slotProps={{ htmlInput: { maxLength: 5000 } }} helperText={`${notes.length} / 5,000`} />
              <Button variant="contained" onClick={save} disabled={busy}>{busy ? 'Saving...' : 'Save review'}</Button>
            </Stack>
          </Paper>
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
            <Typography variant="h6">Danger zone</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
              Permanently delete this record, for example a bad import or a synthetic example. This cannot be undone.
            </Typography>
            <Button color="error" variant="outlined" onClick={() => setDeleteOpen(true)}>Delete opportunity</Button>
          </Paper>
          {result && [
            <EvidenceList key="known" title="Known facts" values={result.knownFacts} empty="No additional facts were extracted." />,
            <EvidenceList key="hypotheses" title="Model hypotheses" values={result.hypotheses} empty="No hypotheses." tone="info" />,
            <EvidenceList key="missing" title="Missing information" values={result.missingInformation} empty="No major missing fields detected." tone="warning" />,
            <EvidenceList key="concerns" title="Concerns" values={result.concerns} empty="No hard concerns detected." tone="error" />,
          ]}
        </Stack>
      </Box>
    </Container>

    <Dialog open={deleteOpen} onClose={() => { if (!deleting) { setDeleteOpen(false); setDeleteError(''); } }}
      fullScreen={fullScreen} maxWidth="xs" fullWidth aria-labelledby="delete-opportunity-title"
      slotProps={{ paper: { sx: { borderRadius: fullScreen ? 0 : 4, overflow: 'hidden' } } }}>
      <Box sx={{ height: 5, background: 'linear-gradient(90deg, #2563eb, #60a5fa)' }} />
      <DialogTitle id="delete-opportunity-title" sx={DIALOG_TITLE_SX}>
        <Box component="span">Delete opportunity</Box>
        <IconButton aria-label="Close" size="small" onClick={() => { setDeleteOpen(false); setDeleteError(''); }} disabled={deleting} sx={{ color: 'text.secondary', mr: -1 }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <Typography variant="body2" color="text.secondary">
          This permanently deletes &quot;{item.title}&quot; and its evaluation history. This cannot be undone.
        </Typography>
        {deleteError && <Alert severity="error" sx={{ mt: 2 }}>{deleteError}</Alert>}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={() => { setDeleteOpen(false); setDeleteError(''); }} disabled={deleting}>Cancel</Button>
        <Button variant="contained" color="error" onClick={confirmDelete} loading={deleting}>Delete</Button>
      </DialogActions>
    </Dialog>
  </Box>;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <Paper variant="outlined" sx={{ p: { xs: 2.5, md: 3 }, borderRadius: 3 }}><Typography variant="h6" sx={{ mb: 2 }}>{title}</Typography>{children}</Paper>;
}

function EvidenceList({ title, values, empty, tone = 'default' }: { title: string; values: string[]; empty: string; tone?: 'default' | 'info' | 'warning' | 'error' }) {
  const background = tone === 'info' ? 'primary.light' : tone === 'warning' ? '#fff7ed' : tone === 'error' ? '#fef2f2' : 'background.paper';
  return <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, bgcolor: background }}><Typography sx={{ fontWeight: 800 }}>{title}</Typography>{values.length ? <Box component="ul" sx={{ pl: 2.5, mb: 0 }}>{values.map(value => <Typography component="li" key={value} variant="body2" sx={{ mt: 1 }}>{value}</Typography>)}</Box> : <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>{empty}</Typography>}</Paper>;
}
