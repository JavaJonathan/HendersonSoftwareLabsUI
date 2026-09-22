import { useEffect, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Alert, Box, Button, Checkbox, Chip, CircularProgress, Container, Dialog, DialogActions, DialogContent,
  DialogTitle, Divider, FormControl, FormControlLabel, IconButton, InputLabel, Link, MenuItem, Pagination, Paper, Select,
  Stack, TextField, Typography, useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CloseIcon from '@mui/icons-material/Close';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import { AuthedAppBar } from '../components/layout/AuthedAppBar';
import { OpportunityLaneTabs } from '../components/opportunities/OpportunityLaneTabs';
import { OpportunityRow } from '../components/opportunities/OpportunityRow';
import { SURFACE_SUBTLE } from '../theme';
import {
  downloadOpportunityExport, evaluateOpportunities, getOpportunities, getRadarPreferences, getRadarProvider,
  importActiveProject, importActiveProjectCsv, importBusinessProspect, importBusinessProspectCsv,
  loadOpportunitySamples, previewOpportunityEvaluation, updateRadarPreferences, SOURCE_TYPE_LABELS,
  type EvaluationPreview, type EvaluationProvider, type OpportunityEntityType, type OpportunityList,
  type OpportunitySourceType, type RadarPreferences, type RadarProviderStatus,
} from '../api/opportunities';
import { getApiErrorMessage } from '../api/client';

const TITLE_SX = {
  fontFamily: '"Plus Jakarta Sans", "Segoe UI", system-ui, sans-serif', fontWeight: 800, fontSize: 20,
  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2,
};

const RECOMMENDATION_VALUES: Record<OpportunityEntityType, string[]> = {
  ActiveProject: ['All', 'Pursue', 'Investigate', 'Pass'],
  BusinessProspect: ['All', 'Prioritize', 'Watch', 'Skip'],
};
const DECISION_VALUES: Record<OpportunityEntityType, string[]> = {
  ActiveProject: ['All', 'Unreviewed', 'Pursue', 'Investigate', 'Pass'],
  BusinessProspect: ['All', 'Unreviewed', 'Prioritize', 'Watch', 'Skip'],
};

function csvTemplate(entityType: OpportunityEntityType) {
  const text = entityType === 'ActiveProject'
    ? 'title,description,source_type,source_name,source_url,source_date,external_id\n"Example project","Describe the public opportunity here.",ExplicitDemand,,,,\n'
    : 'business_name,evidence,website_url,geography,industry,source_name,source_url,source_date,external_id\n"Example Business","Describe the research evidence here.",,,,,,,\n';
  const url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = entityType === 'ActiveProject' ? 'opportunity-radar-active-projects-import.csv' : 'opportunity-radar-business-prospects-import.csv';
  anchor.click();
  URL.revokeObjectURL(url);
}

export function OpportunityRadarPage({ entityType }: { entityType: OpportunityEntityType }) {
  const navigate = useNavigate();
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const [list, setList] = useState<OpportunityList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [page, setPage] = useState(1);
  const [recommendation, setRecommendation] = useState('All');
  const [sourceType, setSourceType] = useState('All');
  const [decision, setDecision] = useState('All');
  const [query, setQuery] = useState('');
  const [importOpen, setImportOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [evaluationOpen, setEvaluationOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [providerStatus, setProviderStatus] = useState<RadarProviderStatus | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { setRecommendation('All'); setSourceType('All'); setDecision('All'); setQuery(''); setPage(1); }, [entityType]);

  useEffect(() => {
    let active = true; setLoading(true); setError('');
    getOpportunities({ entityType, recommendation, sourceType: entityType === 'ActiveProject' ? sourceType : undefined, decision, query, page })
      .then(data => { if (active) setList(data); })
      .catch(() => { if (active) setError('Unable to load the opportunity inbox.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [entityType, recommendation, sourceType, decision, query, page, refresh]);

  useEffect(() => { getRadarProvider().then(setProviderStatus).catch(() => setProviderStatus(null)); }, [refresh]);

  const laneAvailable = entityType === 'ActiveProject' ? providerStatus?.activeProject.liveAvailable : providerStatus?.businessProspect.liveAvailable;
  const laneModel = entityType === 'ActiveProject' ? providerStatus?.activeProject.model : providerStatus?.businessProspect.model;

  async function loadSamples() {
    setBusy(true); setError(''); setNotice('');
    try {
      const result = await loadOpportunitySamples();
      await evaluateOpportunities('Simulated', result.ids.length ? result.ids : undefined);
      setNotice(result.createdCount ? `Loaded and evaluated ${result.createdCount} synthetic examples across both lanes.` : 'Synthetic examples are already loaded. Existing records were reevaluated.');
      setRefresh(value => value + 1);
    } catch (err) { setError(getApiErrorMessage(err, 'Unable to load examples.')); }
    finally { setBusy(false); }
  }

  return <Box sx={{ minHeight: '100vh', bgcolor: SURFACE_SUBTLE }}>
    <AuthedAppBar subtitle="Opportunity Radar" />
    <Container component="main" maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
      <Link component={RouterLink} to="/admin">Back to admin</Link>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mt: 2, mb: 2, justifyContent: 'space-between', alignItems: { md: 'flex-start' } }}>
        <Box>
          <Typography component="h1" variant="h4" sx={{ fontSize: { xs: 28, md: 36 } }}>Opportunity Radar</Typography>
          <Typography color="text.secondary" sx={{ mt: 0.75, maxWidth: 680 }}>
            Decide what deserves attention, inspect the evidence, and record what to do next.
          </Typography>
          <Stack direction="row" spacing={1} sx={{ mt: 1.5, flexWrap: 'wrap' }}>
            <Chip size="small" icon={<AutoAwesomeIcon />} label={laneAvailable ? `Live Jev available (${laneModel})` : 'Demonstration evaluator active'} color={laneAvailable ? 'success' : 'warning'} variant="outlined" />
            <Chip size="small" label="Public, non-confidential inputs only" variant="outlined" />
          </Stack>
        </Box>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} useFlexGap sx={{ flexWrap: 'wrap', justifyContent: { md: 'flex-end' } }}>
          <Button variant="outlined" startIcon={<SettingsOutlinedIcon />} onClick={() => setSettingsOpen(true)}>Preferences</Button>
          <Button variant="outlined" startIcon={<DownloadOutlinedIcon />} onClick={() => setExportOpen(true)} disabled={!list?.total}>Export</Button>
          <Button variant="outlined" startIcon={<AutoAwesomeIcon />} onClick={() => setEvaluationOpen(true)} disabled={busy || !list?.total}>Evaluate all</Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setImportOpen(true)}>Import</Button>
        </Stack>
      </Stack>

      <OpportunityLaneTabs />

      {notice && <Alert severity="success" onClose={() => setNotice('')} sx={{ mb: 2 }}>{notice}</Alert>}
      {error && <Alert severity="error" action={<Button onClick={() => setRefresh(value => value + 1)}>Retry</Button>} sx={{ mb: 2 }}>{error}</Alert>}

      <Paper variant="outlined" sx={{ p: 2, mb: 2.5, borderRadius: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
          <TextField size="small" label="Search" value={query} onChange={event => { setQuery(event.target.value); setPage(1); }} sx={{ flexGrow: 1 }} />
          <Filter label="Recommendation" value={recommendation} values={RECOMMENDATION_VALUES[entityType]} onChange={value => { setRecommendation(value); setPage(1); }} />
          {entityType === 'ActiveProject' && <Filter label="Source" value={sourceType} values={['All', 'ExplicitDemand', 'OperationalSignal']} labels={SOURCE_TYPE_LABELS} onChange={value => { setSourceType(value); setPage(1); }} />}
          <Filter label="Decision" value={decision} values={DECISION_VALUES[entityType]} onChange={value => { setDecision(value); setPage(1); }} />
        </Stack>
      </Paper>

      {loading && <Paper variant="outlined" sx={{ p: 5, textAlign: 'center', borderRadius: 3 }}><CircularProgress size={24} /><Typography sx={{ mt: 1.5 }}>Loading opportunities...</Typography></Paper>}
      {!loading && !error && list?.total === 0 && <Paper variant="outlined" sx={{ p: { xs: 3, md: 6 }, textAlign: 'center', borderRadius: 3, borderStyle: 'dashed' }}>
        <Typography variant="h6">No opportunities in this view</Typography>
        <Typography color="text.secondary" sx={{ mt: 0.5, mb: 2.5 }}>
          {entityType === 'ActiveProject' ? 'Import a public project description or explore the synthetic example set.' : 'Import a business research note or explore the synthetic example set.'}
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ justifyContent: 'center' }}>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setImportOpen(true)}>Import</Button>
          <Button variant="outlined" onClick={loadSamples} disabled={busy}>Load synthetic examples</Button>
        </Stack>
      </Paper>}
      {!loading && !!list?.items.length && <Stack spacing={1.5}>
        {list.items.map(item => <OpportunityRow key={item.id} item={item} onClick={() => navigate(`/admin/opportunities/${item.id}`)} />)}
      </Stack>}
      {!!list && list.total > list.pageSize && <Pagination sx={{ mt: 3 }} count={Math.ceil(list.total / list.pageSize)} page={page} onChange={(_, value) => setPage(value)} />}
    </Container>

    <ImportDialog open={importOpen} fullScreen={fullScreen} entityType={entityType} onClose={() => setImportOpen(false)} onImported={message => { setImportOpen(false); setNotice(message); setRefresh(value => value + 1); }} />
    <PreferencesDialog open={settingsOpen} fullScreen={fullScreen} onClose={() => setSettingsOpen(false)} onSaved={() => { setSettingsOpen(false); setNotice('Preferences saved. Local rules were rescored; Active Project capability changes mark live results stale until Jev runs again.'); setRefresh(value => value + 1); }} />
    <EvaluationDialog open={evaluationOpen} fullScreen={fullScreen} providerStatus={providerStatus} onClose={() => setEvaluationOpen(false)} onEvaluated={message => { setEvaluationOpen(false); setNotice(message); setRefresh(value => value + 1); }} />
    <ExportDialog open={exportOpen} fullScreen={fullScreen} onClose={() => setExportOpen(false)} />
  </Box>;
}

function ExportDialog({ open, fullScreen, onClose }: { open: boolean; fullScreen: boolean; onClose: () => void }) {
  const [includeSynthetic, setIncludeSynthetic] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { if (open) { setIncludeSynthetic(false); setError(''); } }, [open]);
  async function download() {
    setBusy(true); setError('');
    try {
      const blob = await downloadOpportunityExport(includeSynthetic);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a'); anchor.href = url; anchor.download = `hsl-opportunity-radar-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}.csv`; anchor.click();
      URL.revokeObjectURL(url); onClose();
    } catch (err) { setError(getApiErrorMessage(err, 'Unable to export opportunities.')); }
    finally { setBusy(false); }
  }
  return <Dialog open={open} onClose={busy ? undefined : onClose} fullScreen={fullScreen} fullWidth maxWidth="sm" slotProps={{ paper: { sx: { borderRadius: fullScreen ? 0 : 4, overflow: 'hidden' } } }}>
    <Box sx={{ height: 5, background: 'linear-gradient(90deg, #2563eb, #60a5fa)' }} />
    <DialogTitle sx={TITLE_SX}>Export review data<IconButton onClick={onClose} disabled={busy}><CloseIcon /></IconButton></DialogTitle>
    <DialogContent><Stack spacing={2}>
      {error && <Alert severity="error">{error}</Alert>}
      <Typography color="text.secondary">The CSV includes both Active Projects and Business Prospects, with source metadata, semantic factors, the keyword baseline where it applies, decisions, notes, and model version details.</Typography>
      <Alert severity="info">Imported and user-written cells are sanitized for spreadsheet formula injection. Stored source data is not modified.</Alert>
      <FormControlLabel control={<Checkbox checked={includeSynthetic} onChange={event => setIncludeSynthetic(event.target.checked)} />} label="Include synthetic examples" />
      {!includeSynthetic && <Typography variant="caption" color="text.secondary">Synthetic examples are excluded by default so evaluation illustrations do not mix with real review data.</Typography>}
    </Stack></DialogContent>
    <DialogActions sx={{ p: 3 }}><Button onClick={onClose} disabled={busy}>Cancel</Button><Button variant="contained" startIcon={<DownloadOutlinedIcon />} onClick={download} disabled={busy}>{busy ? 'Preparing...' : 'Download CSV'}</Button></DialogActions>
  </Dialog>;
}

function EvaluationDialog({ open, fullScreen, providerStatus, onClose, onEvaluated }: { open: boolean; fullScreen: boolean; providerStatus: RadarProviderStatus | null; onClose: () => void; onEvaluated: (message: string) => void }) {
  const [provider, setProvider] = useState<EvaluationProvider>('Simulated');
  const [preview, setPreview] = useState<EvaluationPreview | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const liveAvailable = !!(providerStatus?.activeProject.liveAvailable || providerStatus?.businessProspect.liveAvailable);
  useEffect(() => { if (open) { setProvider(liveAvailable ? 'Jev' : 'Simulated'); setPreview(null); setError(''); } }, [open, liveAvailable]);
  async function createPreview() {
    setBusy(true); setError('');
    try { setPreview(await previewOpportunityEvaluation(provider)); }
    catch (err) { setError(getApiErrorMessage(err, 'Unable to preview this evaluation batch.')); }
    finally { setBusy(false); }
  }
  async function run() {
    if (!preview) return;
    setBusy(true); setError('');
    try {
      const result = await evaluateOpportunities(provider, undefined, preview.confirmationCode);
      onEvaluated(`${result.evaluatedCount} records evaluated with ${provider === 'Jev' ? 'live Jev' : 'the demonstration evaluator'}.${result.failedCount ? ` ${result.failedCount} provider failures were preserved for review.` : ''}`);
    } catch (err) { setError(getApiErrorMessage(err, 'Unable to evaluate opportunities.')); }
    finally { setBusy(false); }
  }
  return <Dialog open={open} onClose={busy ? undefined : onClose} fullScreen={fullScreen} fullWidth maxWidth="sm" slotProps={{ paper: { sx: { borderRadius: fullScreen ? 0 : 4, overflow: 'hidden' } } }}>
    <Box sx={{ height: 5, background: 'linear-gradient(90deg, #2563eb, #60a5fa)' }} />
    <DialogTitle sx={TITLE_SX}>Evaluate opportunities<IconButton onClick={onClose} disabled={busy}><CloseIcon /></IconButton></DialogTitle>
    <DialogContent><Stack spacing={2.5}>
      {error && <Alert severity="error">{error}</Alert>}
      <Typography variant="body2" color="text.secondary">This evaluates up to 100 opportunities, across both Active Projects and Business Prospects, not only the lane you're viewing.</Typography>
      <FormControl><InputLabel>Evaluation provider</InputLabel><Select label="Evaluation provider" value={provider} onChange={event => { setProvider(event.target.value as EvaluationProvider); setPreview(null); }}>
        <MenuItem value="Simulated">Demonstration evaluator</MenuItem>
        <MenuItem value="Jev" disabled={!liveAvailable}>Live Jev{liveAvailable ? '' : ' (not configured)'}</MenuItem>
      </Select></FormControl>
      <Alert severity={provider === 'Jev' ? 'warning' : 'info'}>{provider === 'Jev'
        ? 'Only public or non-confidential source descriptions may be sent to TypeSafe. Previewing does not call Jev.'
        : 'Demonstration results are deterministic simulations. They are illustrations, not measured Jev performance.'}</Alert>
      {!liveAvailable && <Typography variant="body2" color="text.secondary">Configure <code>TypeSafe:ApiKey</code> in server-side user secrets to enable live mode. The key is never sent to the browser.</Typography>}
      {preview && <Paper variant="outlined" sx={{ p: 2.5, bgcolor: SURFACE_SUBTLE }}><Stack spacing={1}>
        <Typography sx={{ fontWeight: 800 }}>{preview.recordCount} records in this batch</Typography>
        {provider === 'Jev' && <>
          <Typography variant="body2">Conservative maximum input estimate: {preview.estimatedMaximumInputTokens.toLocaleString()} tokens</Typography>
          <Typography variant="body2">Estimated maximum input cost: ${preview.estimatedMaximumCostUsd.toFixed(6)}</Typography>
          <Typography variant="body2" color="text.secondary">Server batch ceiling: ${preview.maximumBatchCostUsd.toFixed(2)}. Rolling usage: {preview.rollingDailyInputTokensUsed.toLocaleString()} of {preview.rollingDailyInputTokenLimit.toLocaleString()} input tokens.</Typography>
        </>}
        {!preview.allowed && <Alert severity="error">{preview.reason ?? 'This batch is blocked by a server guardrail.'}</Alert>}
      </Stack></Paper>}
    </Stack></DialogContent>
    <DialogActions sx={{ p: 3 }}><Button onClick={onClose} disabled={busy}>Cancel</Button>{!preview
      ? <Button variant="contained" onClick={createPreview} disabled={busy}>{busy ? 'Previewing...' : 'Preview batch'}</Button>
      : <Button variant="contained" color={provider === 'Jev' ? 'warning' : 'primary'} onClick={run} disabled={busy || !preview.allowed}>{busy ? 'Evaluating...' : provider === 'Jev' ? 'Confirm and call Jev' : 'Run demonstration'}</Button>}
    </DialogActions>
  </Dialog>;
}

function Filter({ label, value, values, labels, onChange }: { label: string; value: string; values: string[]; labels?: Record<string, string>; onChange: (value: string) => void }) {
  return <FormControl size="small" sx={{ minWidth: 155 }}><InputLabel>{label}</InputLabel><Select label={label} value={value} onChange={event => onChange(event.target.value)}>{values.map(item => <MenuItem key={item} value={item}>{labels?.[item] ?? item}</MenuItem>)}</Select></FormControl>;
}

function ImportDialog({ open, fullScreen, entityType, onClose, onImported }: { open: boolean; fullScreen: boolean; entityType: OpportunityEntityType; onClose: () => void; onImported: (message: string) => void }) {
  const [mode, setMode] = useState<'paste' | 'csv'>('paste');
  const [title, setTitle] = useState(''); const [description, setDescription] = useState('');
  const [sourceType, setSourceType] = useState<OpportunitySourceType>('ExplicitDemand');
  const [websiteUrl, setWebsiteUrl] = useState(''); const [geography, setGeography] = useState(''); const [industry, setIndustry] = useState('');
  const [sourceUrl, setSourceUrl] = useState(''); const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');

  useEffect(() => { if (open) { setMode('paste'); setTitle(''); setDescription(''); setSourceType('ExplicitDemand'); setWebsiteUrl(''); setGeography(''); setIndustry(''); setSourceUrl(''); setFile(null); setError(''); } }, [open]);

  async function submit() {
    setBusy(true); setError('');
    try {
      if (mode === 'paste') {
        if (entityType === 'ActiveProject') {
          if (!title.trim() || description.trim().length < 20) throw new Error('Add a title and at least 20 characters of source description.');
          const result = await importActiveProject({ title, description, sourceType, sourceUrl: sourceUrl || undefined });
          onImported(result.updated ? 'An existing Active Project with the same content was updated. Your review decision was not touched.' : 'Opportunity imported. Evaluate it when you are ready.');
        } else {
          if (!title.trim() || description.trim().length < 20) throw new Error('Add a business name and at least 20 characters of research evidence.');
          const result = await importBusinessProspect({ businessName: title, evidence: description, websiteUrl: websiteUrl || undefined, geography: geography || undefined, industry: industry || undefined, sourceUrl: sourceUrl || undefined });
          onImported(result.updated ? 'An existing Business Prospect at the same website was updated. Your review decision was not touched.' : 'Prospect imported. Evaluate it when you are ready.');
        }
      } else {
        if (!file) throw new Error('Choose a CSV file first.');
        if (entityType === 'ActiveProject') {
          const result = await importActiveProjectCsv(file);
          onImported(`Imported ${result.imported.length} new records. ${result.updated.length} existing records were updated in place, without touching their review decisions.`);
        } else {
          const result = await importBusinessProspectCsv(file);
          onImported(`Imported ${result.imported.length} new records. ${result.updated.length} existing records were updated in place, without touching their review decisions.`);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed.');
    } finally { setBusy(false); }
  }

  return <Dialog open={open} onClose={busy ? undefined : onClose} fullScreen={fullScreen} fullWidth maxWidth="sm" slotProps={{ paper: { sx: { borderRadius: fullScreen ? 0 : 4, overflow: 'hidden' } } }}>
    <Box sx={{ height: 5, background: 'linear-gradient(90deg, #2563eb, #60a5fa)' }} />
    <DialogTitle sx={TITLE_SX}>{entityType === 'ActiveProject' ? 'Import active projects' : 'Import business prospects'}<IconButton onClick={onClose} disabled={busy}><CloseIcon /></IconButton></DialogTitle>
    <DialogContent><Stack spacing={2.5}>
      <Alert severity="info">Only import public or otherwise non-confidential descriptions.</Alert>
      <Stack direction="row" spacing={1}><Button variant={mode === 'paste' ? 'contained' : 'outlined'} onClick={() => setMode('paste')}>Paste one</Button><Button variant={mode === 'csv' ? 'contained' : 'outlined'} onClick={() => setMode('csv')}>Import CSV</Button></Stack>
      {error && <Alert severity="error">{error}</Alert>}
      {mode === 'paste' ? (entityType === 'ActiveProject' ? <>
        <TextField label="Title" value={title} onChange={event => setTitle(event.target.value)} slotProps={{ htmlInput: { maxLength: 200 } }} required />
        <TextField label="Original description" value={description} onChange={event => setDescription(event.target.value)} multiline minRows={8} slotProps={{ htmlInput: { maxLength: 30000 } }} required helperText={`${description.length.toLocaleString()} / 30,000 characters`} />
        <FormControl><InputLabel>Source type</InputLabel><Select label="Source type" value={sourceType} onChange={event => setSourceType(event.target.value as OpportunitySourceType)}>{Object.entries(SOURCE_TYPE_LABELS).map(([key, label]) => <MenuItem key={key} value={key}>{label}</MenuItem>)}</Select></FormControl>
        <TextField label="Source URL (optional)" type="url" value={sourceUrl} onChange={event => setSourceUrl(event.target.value)} />
      </> : <>
        <TextField label="Business name" value={title} onChange={event => setTitle(event.target.value)} slotProps={{ htmlInput: { maxLength: 200 } }} required />
        <TextField label="Research evidence" value={description} onChange={event => setDescription(event.target.value)} multiline minRows={8} slotProps={{ htmlInput: { maxLength: 30000 } }} required helperText={`${description.length.toLocaleString()} / 30,000 characters`} />
        <TextField label="Website URL (optional)" type="url" value={websiteUrl} onChange={event => setWebsiteUrl(event.target.value)} />
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField label="Geography (optional)" value={geography} onChange={event => setGeography(event.target.value)} fullWidth />
          <TextField label="Industry (optional)" value={industry} onChange={event => setIndustry(event.target.value)} fullWidth />
        </Stack>
        <TextField label="Source URL (optional)" type="url" value={sourceUrl} onChange={event => setSourceUrl(event.target.value)} helperText="Where this research was found, if different from the business's own website." />
      </>) : <Paper variant="outlined" sx={{ p: 2.5, bgcolor: SURFACE_SUBTLE }}>
        <Stack spacing={1.5}>
          <Typography sx={{ fontWeight: 700 }}>CSV format</Typography>
          {entityType === 'ActiveProject'
            ? <Typography variant="body2">Required headers: <code>title</code>, <code>description</code>, <code>source_type</code>. Optional: <code>source_name</code>, <code>source_url</code>, <code>source_date</code>, <code>external_id</code>. Limit 100 rows and 2 MB.</Typography>
            : <Typography variant="body2">Required headers: <code>business_name</code>, <code>evidence</code>. Optional: <code>website_url</code>, <code>geography</code>, <code>industry</code>, <code>source_name</code>, <code>source_url</code>, <code>source_date</code>, <code>external_id</code>. Limit 100 rows and 2 MB.</Typography>}
          <Typography variant="body2" color="text.secondary">Re-importing a row that matches an existing record updates its source material in place. Your review decision and notes are never overwritten.</Typography>
          <Button onClick={() => csvTemplate(entityType)} sx={{ alignSelf: 'flex-start' }}>Download sample CSV</Button>
          <Button component="label" variant="outlined" startIcon={<UploadFileOutlinedIcon />} sx={{ alignSelf: 'flex-start' }}>Choose CSV<input hidden type="file" accept=".csv,text/csv" onChange={event => setFile(event.target.files?.[0] ?? null)} /></Button>
          <Typography variant="body2" color="text.secondary">{file?.name ?? 'No file selected'}</Typography>
        </Stack>
      </Paper>}
    </Stack></DialogContent>
    <DialogActions sx={{ p: 3 }}><Button onClick={onClose} disabled={busy}>Cancel</Button><Button variant="contained" onClick={submit} disabled={busy}>{busy ? 'Importing...' : 'Import'}</Button></DialogActions>
  </Dialog>;
}

function PreferencesDialog({ open, fullScreen, onClose, onSaved }: { open: boolean; fullScreen: boolean; onClose: () => void; onSaved: () => void }) {
  const [value, setValue] = useState<RadarPreferences | null>(null); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  const [capabilities, setCapabilities] = useState(''); const [preferred, setPreferred] = useState(''); const [excluded, setExcluded] = useState('');
  const [preferredIndustries, setPreferredIndustries] = useState(''); const [excludedIndustries, setExcludedIndustries] = useState('');
  const [preferredGeographies, setPreferredGeographies] = useState(''); const [excludedGeographies, setExcludedGeographies] = useState('');
  useEffect(() => {
    if (!open) return; setError('');
    getRadarPreferences().then(data => {
      setValue(data);
      setCapabilities(data.activeProject.capabilities.join(', ')); setPreferred(data.activeProject.preferredProjectTypes.join(', ')); setExcluded(data.activeProject.excludedProjectTypes.join(', '));
      setPreferredIndustries(data.businessProspect.preferredIndustries.join(', ')); setExcludedIndustries(data.businessProspect.excludedIndustries.join(', '));
      setPreferredGeographies(data.businessProspect.preferredGeographies.join(', ')); setExcludedGeographies(data.businessProspect.excludedGeographies.join(', '));
    }).catch(() => setError('Unable to load preferences.'));
  }, [open]);
  const split = (text: string) => text.split(',').map(item => item.trim()).filter(Boolean);
  async function save() {
    if (!value) return; setBusy(true); setError('');
    try {
      await updateRadarPreferences({
        activeProject: { ...value.activeProject, capabilities: split(capabilities), preferredProjectTypes: split(preferred), excludedProjectTypes: split(excluded) },
        businessProspect: {
          ...value.businessProspect, preferredIndustries: split(preferredIndustries), excludedIndustries: split(excludedIndustries),
          preferredGeographies: split(preferredGeographies), excludedGeographies: split(excludedGeographies),
        },
        digestActiveProjectCount: value.digestActiveProjectCount, digestBusinessProspectCount: value.digestBusinessProspectCount,
      });
      onSaved();
    } catch (err) { setError(getApiErrorMessage(err, 'Unable to save preferences.')); }
    finally { setBusy(false); }
  }
  return <Dialog open={open} onClose={busy ? undefined : onClose} fullScreen={fullScreen} fullWidth maxWidth="sm" slotProps={{ paper: { sx: { borderRadius: fullScreen ? 0 : 4, overflow: 'hidden' } } }}>
    <Box sx={{ height: 5, background: 'linear-gradient(90deg, #2563eb, #60a5fa)' }} />
    <DialogTitle sx={TITLE_SX}>Screening preferences<IconButton onClick={onClose} disabled={busy}><CloseIcon /></IconButton></DialogTitle>
    <DialogContent>{error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}{!value ? !error && <CircularProgress size={22} /> : <Stack spacing={2.5}>
      <Typography sx={{ fontWeight: 800 }}>Active project screening</Typography>
      <TextField label="Capabilities" value={capabilities} onChange={event => setCapabilities(event.target.value)} multiline helperText="Comma-separated technologies and capabilities. Changing this reruns simulations and marks live Jev results stale." />
      <TextField label="Preferred project types" value={preferred} onChange={event => setPreferred(event.target.value)} multiline helperText="Comma-separated categories." />
      <TextField label="Excluded project types" value={excluded} onChange={event => setExcluded(event.target.value)} multiline helperText="Comma-separated hard exclusions." />
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <TextField label="Minimum stated budget" type="number" value={value.activeProject.minimumBudget} onChange={event => setValue({ ...value, activeProject: { ...value.activeProject, minimumBudget: Number(event.target.value) } })} slotProps={{ htmlInput: { min: 0, step: 100 } }} fullWidth />
        <TextField label="Minimum weeks" type="number" value={value.activeProject.minimumWeeks} onChange={event => setValue({ ...value, activeProject: { ...value.activeProject, minimumWeeks: Number(event.target.value) } })} slotProps={{ htmlInput: { min: 1, max: 104 } }} fullWidth />
        <TextField label="Maximum weeks" type="number" value={value.activeProject.maximumWeeks} onChange={event => setValue({ ...value, activeProject: { ...value.activeProject, maximumWeeks: Number(event.target.value) } })} slotProps={{ htmlInput: { min: 1, max: 104 } }} fullWidth />
      </Stack>
      <FormControl><InputLabel>Incomplete information tolerance</InputLabel><Select label="Incomplete information tolerance" value={value.activeProject.incompleteInformationTolerance} onChange={event => setValue({ ...value, activeProject: { ...value.activeProject, incompleteInformationTolerance: event.target.value as RadarPreferences['activeProject']['incompleteInformationTolerance'] } })}>{['Low', 'Medium', 'High'].map(item => <MenuItem key={item} value={item}>{item}</MenuItem>)}</Select></FormControl>
      <Box><Typography sx={{ fontWeight: 700, mb: 1 }}>Active project priority weights</Typography><Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} useFlexGap sx={{ flexWrap: 'wrap' }}>
        {([['capabilityFit', 'Capability fit'], ['problemClarity', 'Problem clarity'], ['independentScope', 'Independent scope'], ['informationSufficiency', 'Information']] as const).map(([key, label]) =>
          <TextField key={key} label={label} type="number" value={value.activeProject.weights[key] ?? 0} onChange={event => setValue({ ...value, activeProject: { ...value.activeProject, weights: { ...value.activeProject.weights, [key]: Number(event.target.value) } } })} slotProps={{ htmlInput: { min: 0, max: 100 } }} sx={{ minWidth: 140 }} />)}
      </Stack></Box>
      <Alert severity="info">Missing budget remains unknown. It is never treated as an inadequate stated budget.</Alert>

      <Divider />
      <Typography sx={{ fontWeight: 800 }}>Business prospect screening</Typography>
      <TextField label="Preferred industries" value={preferredIndustries} onChange={event => setPreferredIndustries(event.target.value)} multiline helperText="Comma-separated. Optional." />
      <TextField label="Excluded industries" value={excludedIndustries} onChange={event => setExcludedIndustries(event.target.value)} multiline helperText="Comma-separated hard exclusions." />
      <TextField label="Preferred geographies" value={preferredGeographies} onChange={event => setPreferredGeographies(event.target.value)} multiline helperText="Comma-separated. Optional." />
      <TextField label="Excluded geographies" value={excludedGeographies} onChange={event => setExcludedGeographies(event.target.value)} multiline helperText="Comma-separated hard exclusions." />
      <Box><Typography sx={{ fontWeight: 700, mb: 1 }}>Business prospect priority weights</Typography><Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} useFlexGap sx={{ flexWrap: 'wrap' }}>
        {([['businessStrength', 'Business strength'], ['digitalPresenceWeakness', 'Digital weakness'], ['reputationMismatch', 'Reputation mismatch'], ['entryProjectStrength', 'Entry project'], ['geography', 'Geography'], ['contactability', 'Contactability'], ['evidenceCompleteness', 'Evidence']] as const).map(([key, label]) =>
          <TextField key={key} label={label} type="number" value={value.businessProspect.weights[key] ?? 0} onChange={event => setValue({ ...value, businessProspect: { ...value.businessProspect, weights: { ...value.businessProspect.weights, [key]: Number(event.target.value) } } })} slotProps={{ htmlInput: { min: 0, max: 100 } }} sx={{ minWidth: 140 }} />)}
      </Stack><Typography variant="caption" color="text.secondary">Business Prospect preferences never require a live Jev rerun: nothing here is fed into the Jev prompt, so every change here recomposes locally.</Typography></Box>

      <Divider />
      <Typography sx={{ fontWeight: 800 }}>Digest</Typography>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <TextField label="Active projects in digest" type="number" value={value.digestActiveProjectCount} onChange={event => setValue({ ...value, digestActiveProjectCount: Number(event.target.value) })} slotProps={{ htmlInput: { min: 0, max: 25 } }} fullWidth />
        <TextField label="Business prospects in digest" type="number" value={value.digestBusinessProspectCount} onChange={event => setValue({ ...value, digestBusinessProspectCount: Number(event.target.value) })} slotProps={{ htmlInput: { min: 0, max: 25 } }} fullWidth />
      </Stack>
    </Stack>}</DialogContent>
    <DialogActions sx={{ p: 3 }}><Button onClick={onClose} disabled={busy}>Cancel</Button><Button variant="contained" onClick={save} disabled={busy || !value}>{busy ? 'Saving...' : 'Save and rescore'}</Button></DialogActions>
  </Dialog>;
}
