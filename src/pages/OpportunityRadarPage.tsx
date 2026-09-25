import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Alert, Autocomplete, Box, Button, Checkbox, Container, FormControl, FormControlLabel, IconButton,
  InputAdornment, InputLabel, Menu, MenuItem, Pagination, Paper, Select, Skeleton, Stack, Tab, Tabs, TextField,
  Typography, useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined';
import { AuthedAppBar } from '../components/layout/AuthedAppBar';
import { EvaluationDialog } from '../components/opportunities/EvaluationDialog';
import { OpportunityLaneTabs } from '../components/opportunities/OpportunityLaneTabs';
import { OpportunityRow } from '../components/opportunities/OpportunityRow';
import { RadarDialog } from '../components/opportunities/RadarDialog';
import { RadarPageHeader } from '../components/opportunities/RadarPageHeader';
import { SURFACE_SUBTLE } from '../theme';
import {
  downloadOpportunityExport, getOpportunities, getRadarPreferences, getRadarProvider,
  importActiveProject, importActiveProjectCsv, importBusinessProspect, importBusinessProspectCsv,
  loadOpportunitySamples, updateRadarPreferences, SOURCE_TYPE_LABELS, formatProspectType,
  type OpportunityEntityType, type OpportunityList,
  type BusinessProspectType, type OpportunitySourceType, type RadarPreferences, type RadarProviderStatus, type ResearchConfidence,
} from '../api/opportunities';
import { getApiErrorMessage } from '../api/client';
import { getOpportunityCsvTemplate } from './opportunityCsvTemplates';

const RECOMMENDATION_VALUES: Record<OpportunityEntityType, string[]> = {
  ActiveProject: ['All', 'Pursue', 'Investigate', 'Pass'],
  BusinessProspect: ['All', 'Prioritize', 'Watch', 'Skip'],
};
const DECISION_VALUES: Record<OpportunityEntityType, string[]> = {
  ActiveProject: ['All', 'Unreviewed', 'Pursue', 'Investigate', 'Pass'],
  BusinessProspect: ['All', 'Unreviewed', 'Prioritize', 'Watch', 'Skip'],
};

function downloadCsvTemplate(entityType: OpportunityEntityType) {
  const template = getOpportunityCsvTemplate(entityType);
  const url = URL.createObjectURL(new Blob([template.csv], { type: 'text/csv;charset=utf-8' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = template.filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fall through to the selection-based fallback.
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  try {
    document.body.appendChild(textarea);
    textarea.select();
    return document.execCommand('copy');
  } catch {
    return false;
  } finally {
    textarea.remove();
  }
}

export function OpportunityRadarPage({ entityType }: { entityType: OpportunityEntityType }) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const compactActions = useMediaQuery(theme.breakpoints.down('md'));
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') ?? '';
  const recommendation = searchParams.get('recommendation') ?? 'All';
  const sourceType = searchParams.get('source') ?? 'All';
  const decision = searchParams.get('decision') ?? 'All';
  const prospectType = searchParams.get('prospectType') ?? 'All';
  const verification = searchParams.get('verification') ?? 'All';
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const [searchDraft, setSearchDraft] = useState(query);
  const [list, setList] = useState<OpportunityList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [importOpen, setImportOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [evaluationOpen, setEvaluationOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [providerStatus, setProviderStatus] = useState<RadarProviderStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionAnchor, setActionAnchor] = useState<HTMLElement | null>(null);
  const resultsHeadingRef = useRef<HTMLDivElement>(null);

  function setParam(key: string, value: string | number, resetPage = true) {
    setSearchParams(previous => {
      const next = new URLSearchParams(previous);
      if (value === '' || value === 'All' || value === 1) next.delete(key);
      else next.set(key, String(value));
      if (resetPage) next.delete('page');
      return next;
    });
  }

  function clearFilters() {
    setSearchDraft('');
    setSearchParams(new URLSearchParams());
  }

  useEffect(() => { setSearchDraft(query); }, [query]);
  useEffect(() => {
    const timeout = window.setTimeout(() => {
      if (searchDraft !== query) {
        setSearchParams(previous => {
          const next = new URLSearchParams(previous);
          if (searchDraft.trim()) next.set('q', searchDraft.trim());
          else next.delete('q');
          next.delete('page');
          return next;
        });
      }
    }, 350);
    return () => window.clearTimeout(timeout);
  }, [searchDraft, query, setSearchParams]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    getOpportunities({ entityType, recommendation, sourceType: entityType === 'ActiveProject' ? sourceType : undefined, decision, prospectType: entityType === 'BusinessProspect' ? prospectType : undefined, verification, query, page })
      .then(data => { if (active) setList(data); })
      .catch(() => { if (active) setError('Unable to load this Radar view.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [entityType, recommendation, sourceType, decision, prospectType, verification, query, page, refresh]);

  useEffect(() => { getRadarProvider().then(setProviderStatus).catch(() => setProviderStatus(null)); }, [refresh]);

  const laneAvailable = entityType === 'ActiveProject' ? providerStatus?.activeProject.liveAvailable : providerStatus?.businessProspect.liveAvailable;
  const laneModel = entityType === 'ActiveProject' ? providerStatus?.activeProject.model : providerStatus?.businessProspect.model;
  const filterCount = [query, recommendation !== 'All', sourceType !== 'All' && entityType === 'ActiveProject', decision !== 'All', prospectType !== 'All' && entityType === 'BusinessProspect', verification !== 'All'].filter(Boolean).length;
  const start = list?.total ? (page - 1) * list.pageSize + 1 : 0;
  const end = list?.total ? Math.min(page * list.pageSize, list.total) : 0;

  async function loadSamples() {
    setBusy(true); setError(''); setNotice('');
    try {
      const result = await loadOpportunitySamples();
      setNotice(result.createdCount ? `Loaded ${result.createdCount} synthetic examples across both lanes. Evaluate them with Jev when you are ready.` : 'Synthetic examples are already loaded.');
      setRefresh(value => value + 1);
    } catch (err) { setError(getApiErrorMessage(err, 'Unable to load examples.')); }
    finally { setBusy(false); }
  }

  const headerActions = compactActions ? (
    <Stack direction="row" spacing={1} sx={{ width: '100%' }}>
      <Button fullWidth variant="contained" startIcon={<AddIcon />} onClick={() => setImportOpen(true)}>Import</Button>
      <Button fullWidth variant="outlined" startIcon={<AutoAwesomeIcon />} onClick={() => setEvaluationOpen(true)} disabled={busy || !list?.total}>Evaluate</Button>
      <IconButton aria-label="More Radar actions" onClick={event => setActionAnchor(event.currentTarget)} sx={{ border: 1, borderColor: 'divider' }}><MoreVertIcon /></IconButton>
      <Menu anchorEl={actionAnchor} open={Boolean(actionAnchor)} onClose={() => setActionAnchor(null)}>
        <MenuItem onClick={() => { setActionAnchor(null); setSettingsOpen(true); }}><SettingsOutlinedIcon fontSize="small" sx={{ mr: 1.25 }} />Preferences</MenuItem>
        <MenuItem disabled={!list?.total} onClick={() => { setActionAnchor(null); setExportOpen(true); }}><DownloadOutlinedIcon fontSize="small" sx={{ mr: 1.25 }} />Export</MenuItem>
      </Menu>
    </Stack>
  ) : (
    <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap', justifyContent: 'flex-end', flexShrink: { lg: 0 } }}>
      <Button variant="outlined" startIcon={<SettingsOutlinedIcon />} onClick={() => setSettingsOpen(true)}>Preferences</Button>
      <Button variant="outlined" startIcon={<DownloadOutlinedIcon />} onClick={() => setExportOpen(true)} disabled={!list?.total}>Export</Button>
      <Button variant="outlined" startIcon={<AutoAwesomeIcon />} onClick={() => setEvaluationOpen(true)} disabled={busy || !list?.total}>Evaluate all</Button>
      <Button variant="contained" startIcon={<AddIcon />} onClick={() => setImportOpen(true)}>Import</Button>
    </Stack>
  );

  return <Box sx={{ minHeight: '100vh', bgcolor: SURFACE_SUBTLE }}>
    <AuthedAppBar subtitle="Opportunity Radar" />
    <Container component="main" maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
      <RadarPageHeader
        eyebrow={entityType === 'ActiveProject' ? 'Active project pipeline' : 'Business development pipeline'}
        description={entityType === 'ActiveProject'
          ? 'Triage public project demand, inspect the evidence, and decide what deserves pursuit.'
          : 'Find established businesses where a focused digital improvement could create a strong first engagement.'}
        providerLabel={laneAvailable ? `Live Jev available (${laneModel})` : 'Jev is not configured'}
        liveAvailable={laneAvailable}
        actions={headerActions}
      />
      <OpportunityLaneTabs />
      {notice && <Alert severity="success" onClose={() => setNotice('')} sx={{ mb: 2 }}>{notice}</Alert>}
      {error && <Alert severity="error" action={<Button onClick={() => setRefresh(value => value + 1)}>Retry</Button>} sx={{ mb: 2 }}>{error}</Alert>}

      <Paper variant="outlined" sx={{ p: { xs: 1.75, md: 2 }, mb: 2.5, borderRadius: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.25}>
          <TextField size="small" placeholder={entityType === 'ActiveProject' ? 'Search projects' : 'Search businesses'} value={searchDraft} onChange={event => setSearchDraft(event.target.value)} sx={{ flexGrow: 1 }} slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchRoundedIcon fontSize="small" /></InputAdornment> }, htmlInput: { 'aria-label': 'Search opportunities' } }} />
          <Filter label="Recommendation" value={recommendation} values={RECOMMENDATION_VALUES[entityType]} onChange={value => setParam('recommendation', value)} />
          {entityType === 'ActiveProject' && <Filter label="Source" value={sourceType} values={['All', 'ExplicitDemand', 'OperationalSignal']} labels={SOURCE_TYPE_LABELS} onChange={value => setParam('source', value)} />}
          {entityType === 'BusinessProspect' && <Filter label="Prospect type" value={prospectType} values={['All', 'OperationalPain', 'DigitalPresence', 'Hybrid', 'Unknown']} onChange={value => setParam('prospectType', value)} />}
          <Filter label="Verification" value={verification} values={['All', 'Clear', 'NeedsVerification']} labels={{ Clear: 'Clear', NeedsVerification: 'Needs verification' }} onChange={value => setParam('verification', value)} />
          <Filter label="Decision" value={decision} values={DECISION_VALUES[entityType]} onChange={value => setParam('decision', value)} />
        </Stack>
        {filterCount > 0 && <Stack direction="row" spacing={1} sx={{ mt: 1.5, alignItems: 'center' }}><TuneRoundedIcon sx={{ fontSize: 17, color: 'text.secondary' }} /><Typography variant="caption" color="text.secondary">{filterCount} active {filterCount === 1 ? 'filter' : 'filters'}</Typography><Button size="small" onClick={clearFilters} sx={{ py: 0.25, px: 1.25 }}>Clear filters</Button></Stack>}
      </Paper>

      {loading && <Stack spacing={1.5} aria-label="Loading opportunities">{[0, 1, 2].map(item => <Paper key={item} variant="outlined" sx={{ p: { xs: 2.25, md: 2.75 }, borderRadius: 3 }}><Skeleton width={160} height={28} /><Skeleton width="54%" height={32} /><Skeleton width="88%" /><Skeleton width="70%" /></Paper>)}</Stack>}
      {!loading && !error && list?.total === 0 && <Paper variant="outlined" sx={{ p: { xs: 3.5, md: 6 }, textAlign: 'center', borderRadius: 3, borderStyle: 'dashed' }}>
        <Box sx={{ width: 48, height: 48, borderRadius: '50%', bgcolor: 'primary.light', color: 'primary.main', display: 'grid', placeItems: 'center', mx: 'auto', mb: 1.5 }}>{filterCount ? <SearchRoundedIcon /> : <AutoAwesomeIcon />}</Box>
        <Typography variant="h6">{filterCount ? 'No matches in this view' : 'Your pipeline is ready'}</Typography>
        <Typography color="text.secondary" sx={{ mt: 0.5, mb: 2.5, maxWidth: 520, mx: 'auto' }}>{filterCount ? 'Try broadening the search or clearing one of the active filters.' : entityType === 'ActiveProject' ? 'Import a public project description or load the synthetic examples to explore the workflow.' : 'Import a public business research note or load the synthetic examples to explore the workflow.'}</Typography>
        {filterCount ? <Button variant="outlined" onClick={clearFilters}>Clear filters</Button> : <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ justifyContent: 'center' }}><Button variant="contained" startIcon={<AddIcon />} onClick={() => setImportOpen(true)}>Import</Button><Button variant="outlined" onClick={loadSamples} disabled={busy}>Load synthetic examples</Button></Stack>}
      </Paper>}
      {!loading && !!list?.items.length && <><Stack direction="row" sx={{ mb: 1.5, alignItems: 'baseline', justifyContent: 'space-between' }}><Typography ref={resultsHeadingRef} tabIndex={-1} variant="body2" sx={{ fontWeight: 700, outline: 'none' }}>{list.total.toLocaleString()} {list.total === 1 ? 'result' : 'results'}</Typography><Typography variant="caption" color="text.secondary">Showing {start}-{end}</Typography></Stack><Stack spacing={1.5}>{list.items.map(item => <OpportunityRow key={item.id} item={item} to={`/admin/opportunities/${item.id}`} />)}</Stack></>}
      {!!list && list.total > list.pageSize && <Pagination sx={{ mt: 3.5, display: 'flex', justifyContent: 'center' }} count={Math.ceil(list.total / list.pageSize)} page={page} onChange={(_, value) => { setParam('page', value, false); window.setTimeout(() => resultsHeadingRef.current?.focus(), 0); }} />}
    </Container>
    <ImportDialog open={importOpen} fullScreen={fullScreen} entityType={entityType} onClose={() => setImportOpen(false)} onImported={message => { setImportOpen(false); setNotice(message); setRefresh(value => value + 1); }} />
    <PreferencesDialog open={settingsOpen} fullScreen={fullScreen} onClose={() => setSettingsOpen(false)} onSaved={() => { setSettingsOpen(false); setNotice('Preferences saved. Local rules were rescored; Active Project capability changes mark live results stale until Jev runs again.'); setRefresh(value => value + 1); }} />
    <EvaluationDialog open={evaluationOpen} fullScreen={fullScreen} liveAvailable={!!laneAvailable} onClose={() => setEvaluationOpen(false)} onEvaluated={message => { setEvaluationOpen(false); setNotice(message); setRefresh(value => value + 1); }} />
    <ExportDialog open={exportOpen} fullScreen={fullScreen} onClose={() => setExportOpen(false)} />
  </Box>;
}

function Filter({ label, value, values, labels, onChange }: { label: string; value: string; values: string[]; labels?: Record<string, string>; onChange: (value: string) => void }) { return <FormControl size="small" sx={{ minWidth: { xs: '100%', md: 155 } }}><InputLabel>{label}</InputLabel><Select label={label} value={value} onChange={event => onChange(event.target.value)}>{values.map(item => <MenuItem key={item} value={item}>{labels?.[item] ?? item}</MenuItem>)}</Select></FormControl>; }

function ExportDialog({ open, fullScreen, onClose }: { open: boolean; fullScreen: boolean; onClose: () => void }) {
  const [includeSynthetic, setIncludeSynthetic] = useState(false); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  useEffect(() => { if (open) { setIncludeSynthetic(false); setError(''); } }, [open]);
  async function download() { setBusy(true); setError(''); try { const blob = await downloadOpportunityExport(includeSynthetic); const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = `hsl-opportunity-radar-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}.csv`; anchor.click(); URL.revokeObjectURL(url); onClose(); } catch (err) { setError(getApiErrorMessage(err, 'Unable to export opportunities.')); } finally { setBusy(false); } }
  return <RadarDialog open={open} fullScreen={fullScreen} title="Export review data" busy={busy} onClose={onClose} actions={<><Button onClick={onClose} disabled={busy}>Cancel</Button><Button variant="contained" startIcon={<DownloadOutlinedIcon />} onClick={download} disabled={busy}>{busy ? 'Preparing...' : 'Download CSV'}</Button></>}><Stack spacing={2}>{error && <Alert severity="error">{error}</Alert>}<Typography color="text.secondary">Download both lanes with source metadata, model details, semantic factors, decisions, and notes.</Typography><Paper variant="outlined" sx={{ p: 2, bgcolor: SURFACE_SUBTLE }}><Stack direction="row" spacing={1.25} sx={{ alignItems: 'flex-start' }}><CheckCircleOutlineRoundedIcon color="primary" /><Typography variant="body2">Imported and user-written cells are sanitized against spreadsheet formula injection. Stored source data is unchanged.</Typography></Stack></Paper><FormControlLabel control={<Checkbox checked={includeSynthetic} onChange={event => setIncludeSynthetic(event.target.checked)} />} label="Include synthetic examples" />{!includeSynthetic && <Typography variant="caption" color="text.secondary">Synthetic illustrations are excluded by default so they do not mix with real review data.</Typography>}</Stack></RadarDialog>;
}

function ImportDialog({ open, fullScreen, entityType, onClose, onImported }: { open: boolean; fullScreen: boolean; entityType: OpportunityEntityType; onClose: () => void; onImported: (message: string) => void }) {
  const [mode, setMode] = useState<'paste' | 'csv'>('paste'); const [title, setTitle] = useState(''); const [description, setDescription] = useState(''); const [sourceType, setSourceType] = useState<OpportunitySourceType>('ExplicitDemand'); const [websiteUrl, setWebsiteUrl] = useState(''); const [geography, setGeography] = useState(''); const [industry, setIndustry] = useState(''); const [sourceUrl, setSourceUrl] = useState(''); const [prospectType, setProspectType] = useState<BusinessProspectType | ''>(''); const [researchConfidence, setResearchConfidence] = useState<ResearchConfidence | ''>(''); const [researchConfidenceReason, setResearchConfidenceReason] = useState(''); const [researchAgent, setResearchAgent] = useState(''); const [file, setFile] = useState<File | null>(null); const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'failed'>('idle');
  useEffect(() => { if (open) { setMode('paste'); setTitle(''); setDescription(''); setSourceType('ExplicitDemand'); setWebsiteUrl(''); setGeography(''); setIndustry(''); setSourceUrl(''); setProspectType(''); setResearchConfidence(''); setResearchConfidenceReason(''); setResearchAgent(''); setFile(null); setError(''); setCopyStatus('idle'); } }, [open]);
  async function copyAgentPrompt() { setCopyStatus(await copyText(getOpportunityCsvTemplate(entityType).agentPrompt) ? 'copied' : 'failed'); }
  async function submit() { setBusy(true); setError(''); try { if (mode === 'paste') { if (!title.trim() || description.trim().length < 20) throw new Error(entityType === 'ActiveProject' ? 'Add a title and at least 20 characters of source description.' : 'Add a business name and at least 20 characters of research evidence.'); const agentFields = { researchConfidence: researchConfidence || undefined, researchConfidenceReason: researchConfidenceReason || undefined, researchAgent: researchAgent || undefined }; if (entityType === 'ActiveProject') { const result = await importActiveProject({ title, description, sourceType, sourceUrl: sourceUrl || undefined, ...agentFields }); onImported(result.updated ? 'An existing Active Project was updated. Its review decision was preserved.' : 'Active Project imported. Evaluate it when you are ready.'); } else { const result = await importBusinessProspect({ businessName: title, evidence: description, websiteUrl: websiteUrl || undefined, geography: geography || undefined, industry: industry || undefined, sourceUrl: sourceUrl || undefined, prospectType: prospectType || undefined, ...agentFields }); onImported(result.updated ? 'An existing Business Prospect was updated. Its review decision was preserved.' : 'Business Prospect imported. Evaluate it when you are ready.'); } } else { if (!file) throw new Error('Choose a CSV file first.'); const result = entityType === 'ActiveProject' ? await importActiveProjectCsv(file) : await importBusinessProspectCsv(file); onImported(`Imported ${result.imported.length} new records. ${result.updated.length} existing records were updated without changing their decisions.`); } } catch (err) { setError(err instanceof Error ? err.message : 'Import failed.'); } finally { setBusy(false); } }
  return <RadarDialog open={open} fullScreen={fullScreen} title={entityType === 'ActiveProject' ? 'Import active projects' : 'Import business prospects'} busy={busy} onClose={onClose} actions={<><Button onClick={onClose} disabled={busy}>Cancel</Button><Button variant="contained" onClick={submit} disabled={busy}>{busy ? 'Importing...' : mode === 'csv' ? 'Import CSV' : 'Import record'}</Button></>}>
    <Stack spacing={2.5}>
      <Tabs value={mode} onChange={(_, value: 'paste' | 'csv') => setMode(value)}><Tab value="paste" label="Paste one" /><Tab value="csv" label="Upload CSV" /></Tabs>
      {error && <Alert severity="error">{error}</Alert>}
      {mode === 'paste' ? <Stack spacing={2}>
        <TextField label={entityType === 'ActiveProject' ? 'Project title' : 'Business name'} value={title} onChange={event => setTitle(event.target.value)} slotProps={{ htmlInput: { maxLength: 200 } }} required />
        <TextField label={entityType === 'ActiveProject' ? 'Original description' : 'Research evidence'} value={description} onChange={event => setDescription(event.target.value)} multiline minRows={7} slotProps={{ htmlInput: { maxLength: 30000 } }} required helperText={`${description.length.toLocaleString()} / 30,000 characters`} />
        {entityType === 'ActiveProject' ? <FormControl><InputLabel>Source type</InputLabel><Select label="Source type" value={sourceType} onChange={event => setSourceType(event.target.value as OpportunitySourceType)}>{Object.entries(SOURCE_TYPE_LABELS).map(([key, label]) => <MenuItem key={key} value={key}>{label}</MenuItem>)}</Select></FormControl> : <><TextField label="Website URL (optional)" type="url" value={websiteUrl} onChange={event => setWebsiteUrl(event.target.value)} slotProps={{ htmlInput: { maxLength: 2048 } }} /><Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}><TextField label="Geography (optional)" value={geography} onChange={event => setGeography(event.target.value)} fullWidth /><TextField label="Industry (optional)" value={industry} onChange={event => setIndustry(event.target.value)} fullWidth /></Stack><FormControl><InputLabel>Imported prospect type (optional)</InputLabel><Select label="Imported prospect type (optional)" value={prospectType} onChange={event => setProspectType(event.target.value as BusinessProspectType | '')}><MenuItem value="">Not supplied</MenuItem>{(['OperationalPain', 'DigitalPresence', 'Hybrid', 'Unknown'] as BusinessProspectType[]).map(value => <MenuItem key={value} value={value}>{formatProspectType(value)}</MenuItem>)}</Select></FormControl></>}
        <FormControl><InputLabel>Research confidence (optional)</InputLabel><Select label="Research confidence (optional)" value={researchConfidence} onChange={event => setResearchConfidence(event.target.value as ResearchConfidence | '')}><MenuItem value="">Not supplied</MenuItem>{(['Low', 'Medium', 'High'] as ResearchConfidence[]).map(value => <MenuItem key={value} value={value}>{value}</MenuItem>)}</Select></FormControl>
        <TextField label="Research confidence reason (optional)" value={researchConfidenceReason} onChange={event => setResearchConfidenceReason(event.target.value)} slotProps={{ htmlInput: { maxLength: 500 } }} />
        <TextField label="Research agent (optional)" value={researchAgent} onChange={event => setResearchAgent(event.target.value)} slotProps={{ htmlInput: { maxLength: 100 } }} />
        <TextField label="Source URL (optional)" type="url" value={sourceUrl} onChange={event => setSourceUrl(event.target.value)} slotProps={{ htmlInput: { maxLength: 2048 } }} />
      </Stack> : <Paper variant="outlined" sx={{ p: 2.5, bgcolor: SURFACE_SUBTLE, borderRadius: 3 }}><Stack spacing={1.5}><Typography sx={{ fontWeight: 800 }}>CSV format</Typography><Typography variant="body2" color="text.secondary">Download the import-ready sample, then copy the field rules into your AI agent.</Typography><Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ alignItems: { xs: 'stretch', sm: 'center' } }}><Button onClick={() => downloadCsvTemplate(entityType)}>Download sample CSV</Button><Button variant="outlined" startIcon={<ContentCopyOutlinedIcon />} onClick={copyAgentPrompt}>Copy AI agent instructions</Button></Stack><Typography role="status" variant="caption" sx={{ minHeight: 18, color: copyStatus === 'failed' ? 'error.main' : 'success.dark' }}>{copyStatus === 'copied' && 'AI agent instructions copied.'}{copyStatus === 'failed' && 'Unable to copy the AI agent instructions.'}</Typography><Button component="label" variant="outlined" startIcon={<UploadFileOutlinedIcon />} sx={{ alignSelf: 'flex-start' }}>Choose CSV<input hidden type="file" accept=".csv,text/csv" onChange={event => setFile(event.target.files?.[0] ?? null)} /></Button><Typography variant="body2">{file?.name ?? 'No file selected'}</Typography></Stack></Paper>}
    </Stack>
  </RadarDialog>;
}

const ACTIVE_WEIGHTS = [['problemClarity', 'Problem clarity'], ['hslDeliveryFit', 'HSL delivery fit'], ['independentScope', 'Independent scope'], ['economicViability', 'Economic viability'], ['urgency', 'Urgency'], ['buyerReadiness', 'Buyer readiness'], ['informationMarketFit', 'Information and market fit']] as const;
const OPERATIONAL_WEIGHTS = [['painEvidence', 'Pain evidence'], ['automationFeasibility', 'Automation feasibility'], ['economicLeverage', 'Economic leverage'], ['containedEngagement', 'Contained engagement'], ['urgency', 'Urgency'], ['hslDeliveryFit', 'HSL delivery fit'], ['buyerAccess', 'Buyer access'], ['marketAccessFit', 'Market and local access']] as const;
const DIGITAL_WEIGHTS = [['businessStrength', 'Business strength'], ['digitalWeakness', 'Digital weakness'], ['reputationMismatch', 'Reputation mismatch'], ['entryProjectStrength', 'Entry project'], ['urgency', 'Urgency'], ['hslDeliveryFit', 'HSL delivery fit'], ['buyerAccess', 'Buyer access'], ['marketAccessFit', 'Market and local access']] as const;

function ChipField({ label, value, onChange, helperText }: { label: string; value: string[]; onChange: (value: string[]) => void; helperText?: string }) { return <Autocomplete multiple freeSolo options={[]} value={value} onChange={(_, next) => onChange(next)} renderInput={params => <TextField {...params} label={label} helperText={helperText} placeholder={value.length ? '' : 'Type and press Enter'} />} />; }

function PreferencesDialog({ open, fullScreen, onClose, onSaved }: { open: boolean; fullScreen: boolean; onClose: () => void; onSaved: () => void }) {
  const [value, setValue] = useState<RadarPreferences | null>(null); const [section, setSection] = useState<'projects' | 'prospects' | 'digest'>('projects'); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  useEffect(() => { if (!open) return; setError(''); setSection('projects'); getRadarPreferences().then(setValue).catch(() => setError('Unable to load preferences.')); }, [open]);
  const validation = !value ? '' : value.activeProject.minimumBudget < 0 ? 'Minimum budget cannot be negative.' : [...Object.values(value.activeProject.weightsV2), ...Object.values(value.businessProspect.operationalPainWeights), ...Object.values(value.businessProspect.digitalPresenceWeights)].some(weight => weight < 0 || weight > 100) ? 'Each relative weight must be between 0 and 100.' : value.digestActiveProjectCount < 0 || value.digestActiveProjectCount > 25 || value.digestBusinessProspectCount < 0 || value.digestBusinessProspectCount > 25 ? 'Digest counts must stay between 0 and 25.' : '';
  async function save() { if (!value || validation) return; setBusy(true); setError(''); try { await updateRadarPreferences({ activeProject: value.activeProject, businessProspect: value.businessProspect, digestActiveProjectCount: value.digestActiveProjectCount, digestBusinessProspectCount: value.digestBusinessProspectCount }); onSaved(); } catch (err) { setError(getApiErrorMessage(err, 'Unable to save preferences.')); } finally { setBusy(false); } }
  return <RadarDialog open={open} fullScreen={fullScreen} title="Screening preferences" busy={busy} maxWidth="md" onClose={onClose} actions={<><Button onClick={onClose} disabled={busy}>Cancel</Button><Button variant="contained" onClick={save} disabled={busy || !value || Boolean(validation)}>{busy ? 'Saving...' : 'Save and recompose'}</Button></>}>
    <Stack spacing={2.5}>{error && <Alert severity="error">{error}</Alert>}{validation && <Alert severity="warning">{validation}</Alert>}{!value ? !error && <Stack spacing={1}><Skeleton height={48} /><Skeleton height={72} /><Skeleton height={72} /></Stack> : <>
      <Tabs value={section} onChange={(_, next) => setSection(next)} variant="scrollable" scrollButtons="auto"><Tab value="projects" label="Active Projects" /><Tab value="prospects" label="Business Prospects" /><Tab value="digest" label="Digest" /></Tabs>
      {section === 'projects' && <Stack spacing={2.25}>
        <ChipField label="Capabilities" value={value.activeProject.capabilities} onChange={capabilities => setValue({ ...value, activeProject: { ...value.activeProject, capabilities } })} helperText="Capability changes affect the Jev request and mark evaluations stale." />
        <ChipField label="Preferred project types" value={value.activeProject.preferredProjectTypes} onChange={preferredProjectTypes => setValue({ ...value, activeProject: { ...value.activeProject, preferredProjectTypes } })} />
        <ChipField label="Excluded project types" value={value.activeProject.excludedProjectTypes} onChange={excludedProjectTypes => setValue({ ...value, activeProject: { ...value.activeProject, excludedProjectTypes } })} helperText="Hard exclusions." />
        <TextField label="Minimum stated budget" type="number" value={value.activeProject.minimumBudget} onChange={event => setValue({ ...value, activeProject: { ...value.activeProject, minimumBudget: Number(event.target.value) } })} fullWidth />
        <FormControl><InputLabel>Incomplete information tolerance</InputLabel><Select label="Incomplete information tolerance" value={value.activeProject.incompleteInformationTolerance} onChange={event => setValue({ ...value, activeProject: { ...value.activeProject, incompleteInformationTolerance: event.target.value as RadarPreferences['activeProject']['incompleteInformationTolerance'] } })}>{['Low', 'Medium', 'High'].map(item => <MenuItem key={item} value={item}>{item}</MenuItem>)}</Select></FormControl>
        <WeightGrid title="Active Project weights" note="Values are relative and normalized to 100. Saving recomposes stored Jev judgments without provider usage." items={ACTIVE_WEIGHTS} values={value.activeProject.weightsV2} onChange={(key, weight) => setValue({ ...value, activeProject: { ...value.activeProject, weightsV2: { ...value.activeProject.weightsV2, [key]: weight } } })} />
      </Stack>}
      {section === 'prospects' && <Stack spacing={2.25}>
        <ChipField label="Preferred industries" value={value.businessProspect.preferredIndustries} onChange={preferredIndustries => setValue({ ...value, businessProspect: { ...value.businessProspect, preferredIndustries } })} />
        <ChipField label="Excluded industries" value={value.businessProspect.excludedIndustries} onChange={excludedIndustries => setValue({ ...value, businessProspect: { ...value.businessProspect, excludedIndustries } })} helperText="Hard exclusions." />
        <ChipField label="Preferred geographies" value={value.businessProspect.preferredGeographies} onChange={preferredGeographies => setValue({ ...value, businessProspect: { ...value.businessProspect, preferredGeographies } })} />
        <ChipField label="Excluded geographies" value={value.businessProspect.excludedGeographies} onChange={excludedGeographies => setValue({ ...value, businessProspect: { ...value.businessProspect, excludedGeographies } })} helperText="Hard exclusions." />
        <WeightGrid title="Operational Pain weights" note="Hybrid prospects use this profile." items={OPERATIONAL_WEIGHTS} values={value.businessProspect.operationalPainWeights} onChange={(key, weight) => setValue({ ...value, businessProspect: { ...value.businessProspect, operationalPainWeights: { ...value.businessProspect.operationalPainWeights, [key]: weight } } })} />
        <WeightGrid title="Digital Presence weights" note="Digital weakness informs entry work but does not add an automatic bonus." items={DIGITAL_WEIGHTS} values={value.businessProspect.digitalPresenceWeights} onChange={(key, weight) => setValue({ ...value, businessProspect: { ...value.businessProspect, digitalPresenceWeights: { ...value.businessProspect.digitalPresenceWeights, [key]: weight } } })} />
        <Alert severity="info">Saving weights recomposes existing Jev results locally and does not spend provider usage.</Alert>
      </Stack>}
      {section === 'digest' && <Stack spacing={2}><Typography color="text.secondary">Choose the maximum number of clear, unreviewed records shown in each daily view.</Typography><Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}><TextField label="Active projects" type="number" value={value.digestActiveProjectCount} onChange={event => setValue({ ...value, digestActiveProjectCount: Number(event.target.value) })} fullWidth /><TextField label="Business prospects" type="number" value={value.digestBusinessProspectCount} onChange={event => setValue({ ...value, digestBusinessProspectCount: Number(event.target.value) })} fullWidth /></Stack></Stack>}
    </>}</Stack>
  </RadarDialog>;
}

function WeightGrid<K extends string>({ title, note, items, values, onChange }: { title: string; note: string; items: readonly (readonly [K, string])[]; values: Record<K, number>; onChange: (key: K, value: number) => void }) { return <Box><Typography sx={{ fontWeight: 800 }}>{title}</Typography><Typography variant="caption" color="text.secondary">{note}</Typography><Box sx={{ display: 'grid', gridTemplateColumns: { xs: items.length > 4 ? '1fr' : '1fr 1fr', sm: 'repeat(4, 1fr)' }, gap: 1.5, mt: 1.5 }}>{items.map(([key, label]) => <TextField key={key} label={label} type="number" size="small" value={values[key] ?? 0} onChange={event => onChange(key, Number(event.target.value))} slotProps={{ htmlInput: { min: 0, max: 100 } }} />)}</Box></Box>; }
