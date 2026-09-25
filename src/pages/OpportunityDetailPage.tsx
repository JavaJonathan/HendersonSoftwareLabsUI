import { Fragment, useEffect, useState } from 'react';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import {
  Accordion, AccordionDetails, AccordionSummary, Alert, Box, Button, Chip, Container,
  Link, MenuItem, Paper, Select, Stack, TextField, ToggleButton, ToggleButtonGroup, Typography, useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import ReportProblemOutlinedIcon from '@mui/icons-material/ReportProblemOutlined';
import SearchOffOutlinedIcon from '@mui/icons-material/SearchOffOutlined';
import { AuthedAppBar } from '../components/layout/AuthedAppBar';
import { EvaluationDialog } from '../components/opportunities/EvaluationDialog';
import { RadarDialog } from '../components/opportunities/RadarDialog';
import { SURFACE_SUBTLE } from '../theme';
import {
  getOpportunity, getRadarProvider, updateOpportunityReview, updateProspectTypeOverride, deleteOpportunity, clearOpportunityDuplicate,
  RECOMMENDATION_META, SOURCE_TYPE_LABELS, formatProspectType,
  type ActiveProjectDecision, type BusinessProspectDecision, type BusinessProspectType, type OpportunityDetail,
  type RadarProviderStatus,
} from '../api/opportunities';
import { getApiErrorMessage } from '../api/client';

const ACTIVE_PROJECT_DECISIONS: ActiveProjectDecision[] = ['Pursue', 'Investigate', 'Pass'];
const BUSINESS_PROSPECT_DECISIONS: BusinessProspectDecision[] = ['Prioritize', 'Watch', 'Skip'];

export function OpportunityDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const desktopReview = useMediaQuery(theme.breakpoints.up('lg'));
  const [item, setItem] = useState<OpportunityDetail | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [decision, setDecision] = useState<ActiveProjectDecision | BusinessProspectDecision | ''>('');
  const [notes, setNotes] = useState('');
  const [savedDecision, setSavedDecision] = useState<ActiveProjectDecision | BusinessProspectDecision | ''>('');
  const [savedNotes, setSavedNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [clearingDuplicate, setClearingDuplicate] = useState(false);
  const [evaluationOpen, setEvaluationOpen] = useState(false);
  const [providerStatus, setProviderStatus] = useState<RadarProviderStatus | null>(null);

  useEffect(() => {
    if (!id) return; let active = true; setError('');
    getOpportunity(Number(id)).then(data => {
      if (!active) return;
      setItem(data);
      const nextDecision = data.activeProject?.userDecision ?? data.businessProspect?.userDecision ?? '';
      setDecision(nextDecision); setNotes(data.notes);
      setSavedDecision(nextDecision); setSavedNotes(data.notes);
    }).catch(() => { if (active) setError('Unable to load this opportunity.'); });
    return () => { active = false; };
  }, [id]);

  useEffect(() => { getRadarProvider().then(setProviderStatus).catch(() => setProviderStatus(null)); }, []);

  async function reloadAfterEvaluation() {
    if (!item) return;
    try {
      const data = await getOpportunity(item.id);
      setItem(data);
      const nextDecision = data.activeProject?.userDecision ?? data.businessProspect?.userDecision ?? '';
      // Don't clobber an in-progress, unsaved review edit just because an evaluation finished in the background.
      if (decision === savedDecision && notes === savedNotes) { setDecision(nextDecision); setNotes(data.notes); }
      setSavedDecision(nextDecision); setSavedNotes(data.notes);
    } catch { /* the success notice already fired; a failed refresh just leaves the page showing pre-eval data until next visit */ }
  }

  async function save() {
    if (!item) return; setBusy(true); setError(''); setNotice('');
    try { await updateOpportunityReview(item.id, decision || null, notes); setSavedDecision(decision); setSavedNotes(notes); setNotice('Decision and notes saved.'); }
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

  async function setTypeOverride(value: BusinessProspectType | '') {
    if (!item) return; setBusy(true); setError(''); setNotice('');
    try {
      await updateProspectTypeOverride(item.id, value || null);
      setItem(await getOpportunity(item.id)); setNotice('Prospect type override saved and the latest Jev result was recomposed locally.');
    } catch (err) { setError(getApiErrorMessage(err, 'Unable to update the prospect type override.')); }
    finally { setBusy(false); }
  }

  if (error && !item) return <Box sx={{ minHeight: '100vh', bgcolor: SURFACE_SUBTLE }}><AuthedAppBar subtitle="Opportunity Radar" /><Container sx={{ py: 5 }}><Alert severity="error">{error}</Alert></Container></Box>;
  if (!item) return <Box sx={{ minHeight: '100vh', bgcolor: SURFACE_SUBTLE }}><AuthedAppBar subtitle="Opportunity Radar" /><Container sx={{ py: 5 }}><Typography>Loading opportunity...</Typography></Container></Box>;

  const isActiveProject = item.entityType === 'ActiveProject';
  const decisionOptions = isActiveProject ? ACTIVE_PROJECT_DECISIONS : BUSINESS_PROSPECT_DECISIONS;
  const backTo = isActiveProject ? '/admin/opportunities' : '/admin/opportunities/prospects';
  const evaluation = item.evaluation;
  const result = evaluation?.result;
  const evidenceIds = new Set(result?.factors.map(factor => factor.evidencePassageId) ?? []);
  const liveAvailable = !!(isActiveProject ? providerStatus?.activeProject.liveAvailable : providerStatus?.businessProspect.liveAvailable);
  const reviewPanel = <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, borderColor: 'rgba(37,99,235,.24)', boxShadow: '0 20px 45px -38px rgba(37,99,235,.75)' }}>
    <Typography variant="overline" color="primary.main">Your call</Typography><Typography variant="h6">Record the decision</Typography>
    <Stack spacing={2} sx={{ mt: 2 }}>
      <ToggleButtonGroup exclusive fullWidth value={decision} onChange={(_, value) => { if (value !== null) setDecision(value); }} size="small" aria-label="Review decision" sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', '& .MuiToggleButtonGroup-grouped': { borderRadius: '8px !important', border: '1px solid !important', borderColor: 'divider !important', m: 0.25 } }}><ToggleButton value="">Unreviewed</ToggleButton>{decisionOptions.map(value => <ToggleButton key={value} value={value}>{value}</ToggleButton>)}</ToggleButtonGroup>
      <TextField label="Review notes" value={notes} onChange={event => setNotes(event.target.value)} multiline minRows={5} slotProps={{ htmlInput: { maxLength: 5000 } }} helperText={`${notes.length.toLocaleString()} / 5,000`} />
      <Button variant="contained" onClick={save} disabled={busy || (decision === savedDecision && notes === savedNotes)}>{busy ? 'Saving...' : decision === savedDecision && notes === savedNotes ? 'Review saved' : 'Save review'}</Button>
      {(decision !== savedDecision || notes !== savedNotes) && <Typography variant="caption" color="warning.main" sx={{ textAlign: 'center', fontWeight: 700 }}>Unsaved changes</Typography>}
    </Stack>
  </Paper>;

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
            {evaluation?.needsVerification && <Chip label="Needs verification" color="warning" />}
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

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1.65fr) minmax(310px, .85fr)' }, gap: 2.5, alignItems: 'start' }}>
        <Stack spacing={2.5} sx={{ minWidth: 0 }}>
          {evaluation?.status === 'Failed' ? <Alert severity="error" action={<Button color="inherit" size="small" onClick={() => setEvaluationOpen(true)}>Retry evaluation</Button>}>Evaluation failed without changing the opportunity score. {evaluation.errorMessage ?? 'Retry when the provider is available.'}</Alert> : evaluation ? <Paper variant="outlined" sx={{ p: { xs: 2.5, md: 3.5 }, borderRadius: 3, background: 'linear-gradient(145deg, #ffffff 25%, #eff6ff 100%)', borderColor: 'rgba(37,99,235,.22)' }}>
            <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap', alignItems: 'center' }}><Typography variant="overline" color="primary.main">Radar recommendation</Typography>{evaluation.recommendation && <Chip size="small" label={evaluation.recommendation} color={RECOMMENDATION_META[evaluation.recommendation].chipColor} />}{evaluation.priorityBand && <Chip size="small" variant="outlined" label={`${evaluation.priorityBand} priority`} />}<Button size="small" onClick={() => setEvaluationOpen(true)} sx={{ ml: 'auto' }}>Re-evaluate</Button></Stack>
            <Typography variant="h5" sx={{ mt: 1.25, maxWidth: 760, lineHeight: 1.35 }}>{evaluation.summary}</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(4, 1fr)' }, gap: 2, mt: 2.5 }}>
              <DetailMetric label="Opportunity score" value={evaluation.opportunityScore == null ? 'Unavailable' : `${evaluation.opportunityScore.toFixed(1)} / 100`} />
              <DetailMetric label="Jev confidence" value={evaluation.jevConfidence == null ? 'Unavailable' : `${Math.round(evaluation.jevConfidence * 100)}%`} />
              <DetailMetric label="Verification" value={evaluation.needsVerification ? 'Required' : 'Clear'} />
              <DetailMetric label="Evaluation" value={evaluation.origin === 'LocalRecompose' ? 'Locally recomposed' : 'Provider run'} />
            </Box>
            <Box sx={{ mt: 2.5, pl: 2, borderLeft: '3px solid', borderColor: 'primary.main' }}><Typography variant="overline" color="text.secondary">Recommended next step</Typography><Typography sx={{ mt: 0.25, fontWeight: 650 }}>{evaluation.nextStep}</Typography></Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2.5 }}>{evaluation.provider === 'Jev' ? `Assembled deterministically from stored Jev judgments and source evidence. Usage: ${evaluation.inputTokens?.toLocaleString() ?? 'unknown'} input tokens.` : 'Generated deterministically from a simulated evaluation. It is not a Jev result.'}</Typography>
          </Paper> : <Alert severity="info" action={<Button color="inherit" size="small" onClick={() => setEvaluationOpen(true)}>Evaluate now</Button>}>This record has not been evaluated yet.</Alert>}

          {!desktopReview && reviewPanel}

          {!isActiveProject && item.businessProspect && <Section title="Business details"><Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2 }}><DetailMetric label="Website" value={item.businessProspect.websiteUrl ? <Link href={item.businessProspect.websiteUrl} target="_blank" rel="noopener noreferrer">Visit website</Link> : 'No website found'} /><DetailMetric label="Geography" value={item.businessProspect.geography ?? 'Unknown'} /><DetailMetric label="Industry" value={item.businessProspect.industry ?? 'Unknown'} /></Box></Section>}

          {!isActiveProject && item.businessProspect && <Section title="Evaluation agreement"><Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 2 }}>
            <DetailMetric label="Imported type" value={item.businessProspect.importedProspectType ?? 'Not supplied'} />
            <DetailMetric label="Imported research confidence" value={item.researchConfidence ?? 'Not supplied'} />
            <DetailMetric label="Research confidence reason" value={item.researchConfidenceReason ?? 'Not supplied'} />
            <DetailMetric label="Research agent" value={item.researchAgent ?? 'Not supplied'} />
            <DetailMetric label="Jev type" value={evaluation?.evaluatedProspectType ?? 'Not evaluated'} />
            <DetailMetric label="Jev confidence" value={evaluation?.jevConfidence == null ? 'Not evaluated' : `${Math.round(evaluation.jevConfidence * 100)}%`} />
            <Box><Typography variant="overline" color="text.secondary">Human override</Typography><Select size="small" fullWidth value={item.businessProspect.prospectTypeOverride ?? ''} disabled={busy || !evaluation} onChange={event => setTypeOverride(event.target.value as BusinessProspectType | '')} sx={{ mt: 0.5 }}><MenuItem value="">No override</MenuItem>{(['OperationalPain', 'DigitalPresence', 'Hybrid', 'Unknown'] as BusinessProspectType[]).map(value => <MenuItem key={value} value={value}>{formatProspectType(value)}</MenuItem>)}</Select></Box>
            <DetailMetric label="Agreement" value={agreementLabel(item)} />
          </Box></Section>}

          {!!result?.checks?.length && <Section title="Evaluation checks"><Stack spacing={1.25}>{result.checks.map(check => <Alert key={check.key} severity={check.severity === 'Block' ? 'error' : check.severity === 'Review' ? 'warning' : 'info'}><Typography sx={{ fontWeight: 800 }}>{formatCamelKey(check.key)}</Typography><Typography variant="body2">{check.explanation}</Typography>{check.evidencePassageId !== 'none' && <Link href={`#passage-${check.evidencePassageId}`} variant="caption" sx={{ display: 'inline-block', mt: 0.75 }}>View {check.evidencePassageId}</Link>}</Alert>)}</Stack></Section>}

          {evaluation && <Section title="Scoring profile"><Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 2 }}><DetailMetric label="Rubric version" value={evaluation.rubricVersion} /><DetailMetric label="Origin" value={evaluation.origin === 'LocalRecompose' ? 'Locally recomposed from stored Jev judgments' : 'Jev provider run'} /></Box><Stack spacing={1}>{Object.entries(evaluation.effectiveWeights ?? {}).map(([key, value]) => <Stack key={key} direction="row" sx={{ justifyContent: 'space-between', gap: 2 }}><Typography variant="body2">{formatCamelKey(key)}</Typography><Typography variant="body2" sx={{ fontWeight: 800 }}>{Number(value).toFixed(2)}%</Typography></Stack>)}</Stack></Section>}

          {!!result?.factors.length && <Section title="Fit factors"><Stack divider={<Box sx={{ borderTop: 1, borderColor: 'divider' }} />}>{result.factors.map(factor => <FactorScore key={factor.key} label={factor.label} score={factor.score} explanation={factor.explanation} evidencePassageId={factor.evidencePassageId} />)}</Stack></Section>}

          {result && <Box><Typography variant="h6" sx={{ mb: 1.5 }}>Decision signals</Typography><Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 1.5 }}><SignalCard title="Model hypotheses" values={result.hypotheses} empty="No hypotheses." tone="info" icon={<LightbulbOutlinedIcon />} /><SignalCard title="Missing information" values={result.missingInformation} empty="No major missing fields detected." tone="warning" icon={<SearchOffOutlinedIcon />} /><SignalCard title="Concerns" values={result.concerns} empty="No hard concerns detected." tone="error" icon={<ReportProblemOutlinedIcon />} /></Box></Box>}

          <SupportingSection key="source" title="Original source" subtitle="The complete imported description and source metadata."><Paper variant="outlined" sx={{ p: 2.5, bgcolor: SURFACE_SUBTLE, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{item.description}</Paper>{(item.sourceDate || item.externalId) && <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>{item.sourceDate && `Source date: ${new Date(item.sourceDate).toLocaleDateString()}`}{item.sourceDate && item.externalId && ' | '}{item.externalId && `External ID: ${item.externalId}`}</Typography>}</SupportingSection>

          <SupportingSection key="evidence" title="Stored evidence" subtitle="Quoted passages come directly from the stored source text."><Stack spacing={1.25}>{item.passages.map(passage => <Paper id={`passage-${passage.id}`} key={passage.id} variant="outlined" sx={{ p: 2, scrollMarginTop: 96, borderColor: evidenceIds.has(passage.id) ? 'primary.main' : 'divider', bgcolor: evidenceIds.has(passage.id) ? 'primary.light' : 'background.paper', transition: 'box-shadow .2s ease', '&:target': { boxShadow: '0 0 0 3px rgba(37,99,235,.25)' } }}><Typography variant="overline" color="text.secondary">{passage.id}</Typography><Typography sx={{ whiteSpace: 'pre-wrap' }}>{passage.text}</Typography></Paper>)}</Stack></SupportingSection>
        </Stack>

        {desktopReview && <Stack spacing={2.5} sx={{ position: 'sticky', top: 88 }}>{reviewPanel}</Stack>}
      </Box>

      <Paper variant="outlined" sx={{ mt: 4, p: { xs: 2.5, md: 3 }, borderRadius: 3, borderColor: '#fecaca', bgcolor: '#fffafa' }}><Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' } }}><Box><Typography variant="h6" color="error.main">Danger zone</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: 0.35 }}>Delete a bad import or synthetic example and its evaluation history. This cannot be undone.</Typography></Box><Button color="error" variant="outlined" onClick={() => setDeleteOpen(true)} sx={{ flexShrink: 0 }}>Delete opportunity</Button></Stack></Paper>
    </Container>

    <RadarDialog open={deleteOpen} fullScreen={fullScreen} maxWidth="xs" title="Delete opportunity" busy={deleting} onClose={() => { setDeleteOpen(false); setDeleteError(''); }} actions={<><Button onClick={() => { setDeleteOpen(false); setDeleteError(''); }} disabled={deleting}>Cancel</Button><Button variant="contained" color="error" onClick={confirmDelete} loading={deleting}>Delete</Button></>}>
      <Typography variant="body2" color="text.secondary">This permanently deletes &quot;{item.title}&quot; and its evaluation history. This cannot be undone.</Typography>
      {deleteError && <Alert severity="error" sx={{ mt: 2 }}>{deleteError}</Alert>}
    </RadarDialog>

    <EvaluationDialog open={evaluationOpen} fullScreen={fullScreen} opportunityIds={[item.id]} liveAvailable={liveAvailable} onClose={() => setEvaluationOpen(false)} onEvaluated={async message => { setEvaluationOpen(false); setNotice(message); await reloadAfterEvaluation(); }} />
  </Box>;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <Paper variant="outlined" sx={{ p: { xs: 2.5, md: 3 }, borderRadius: 3 }}><Typography variant="h6" sx={{ mb: 2 }}>{title}</Typography>{children}</Paper>;
}

function DetailMetric({ label, value }: { label: string; value: React.ReactNode }) {
  return <Box><Typography variant="overline" color="text.secondary">{label}</Typography><Typography variant="body2" sx={{ mt: 0.25, fontWeight: 650, overflowWrap: 'anywhere' }}>{value}</Typography></Box>;
}

function formatCamelKey(key: string) {
  return key
    .split(':')
    .map(part => part.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/^./, char => char.toUpperCase()).replace(/\bHsl\b/g, 'HSL'))
    .join(': ');
}

function agreementLabel(item: OpportunityDetail) {
  if (item.businessProspect?.prospectTypeOverride) return 'Resolved by human override';
  const imported = item.businessProspect?.importedProspectType;
  const evaluated = item.evaluation?.evaluatedProspectType;
  if (!imported || !evaluated || imported === 'Unknown' || evaluated === 'Unknown') return 'Not enough information';
  return imported === evaluated ? 'Agent and Jev agree' : 'Agent and Jev disagree';
}

function FactorScore({ label, score, explanation, evidencePassageId }: { label: string; score: number; explanation: string; evidencePassageId: string }) {
  return <Box sx={{ py: 2, '&:first-of-type': { pt: 0 }, '&:last-of-type': { pb: 0 } }}><Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ justifyContent: 'space-between', alignItems: { sm: 'flex-start' } }}><Box sx={{ minWidth: 0 }}><Typography sx={{ fontWeight: 800 }}>{label}</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.55 }}>{explanation}</Typography>{evidencePassageId !== 'none' && <Link href={`#passage-${evidencePassageId}`} underline="hover" variant="caption" sx={{ display: 'inline-block', mt: 0.75, fontWeight: 700 }}>View {evidencePassageId}</Link>}</Box><Box sx={{ width: 110, flexShrink: 0, pt: 0.25 }}><Typography variant="caption" sx={{ display: 'block', textAlign: 'right', fontWeight: 800 }}>{score.toFixed(1)} / 100</Typography><Box sx={{ height: 8, mt: 0.5, borderRadius: 99, bgcolor: 'divider', overflow: 'hidden' }}><Box sx={{ width: `${Math.max(0, Math.min(100, score))}%`, height: '100%', bgcolor: 'primary.main' }} /></Box></Box></Stack></Box>;
}

function SignalCard({ title, values, empty, icon, tone = 'default' }: { title: string; values: string[]; empty: string; icon: React.ReactNode; tone?: 'default' | 'info' | 'warning' | 'error' }) {
  const colors = tone === 'info' ? { bg: '#eff6ff', fg: '#2563eb', border: '#bfdbfe' } : tone === 'warning' ? { bg: '#fff7ed', fg: '#c2410c', border: '#fed7aa' } : tone === 'error' ? { bg: '#fef2f2', fg: '#b91c1c', border: '#fecaca' } : { bg: '#ffffff', fg: '#475569', border: '#e2e8f0' };
  return <Paper variant="outlined" sx={{ p: 2.25, borderRadius: 3, bgcolor: colors.bg, borderColor: colors.border }}><Stack direction="row" spacing={1} sx={{ alignItems: 'center', color: colors.fg }}><Box sx={{ display: 'flex', '& svg': { fontSize: 20 } }}>{icon}</Box><Typography sx={{ fontWeight: 800 }}>{title}</Typography><Chip size="small" label={values.length} sx={{ ml: 'auto !important', height: 22, bgcolor: 'rgba(255,255,255,.7)' }} /></Stack>{values.length ? <Box component="ul" sx={{ pl: 2.5, mb: 0 }}>{values.map(value => <Typography component="li" key={value} variant="body2" sx={{ mt: 1 }}>{value}</Typography>)}</Box> : <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>{empty}</Typography>}</Paper>;
}

function SupportingSection({ title, subtitle, defaultExpanded = false, children }: { title: string; subtitle?: string; defaultExpanded?: boolean; children: React.ReactNode }) {
  return <Accordion defaultExpanded={defaultExpanded} disableGutters variant="outlined" sx={{ borderRadius: '14px !important', overflow: 'hidden', '&::before': { display: 'none' } }}><AccordionSummary expandIcon={<ExpandMoreRoundedIcon />} sx={{ px: { xs: 2.5, md: 3 }, py: 0.75, '& .MuiAccordionSummary-content': { my: 1.25 } }}><Box><Typography variant="h6">{title}</Typography>{subtitle && <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>{subtitle}</Typography>}</Box></AccordionSummary><AccordionDetails sx={{ px: { xs: 2.5, md: 3 }, pb: 3, pt: 0 }}>{children}</AccordionDetails></Accordion>;
}
