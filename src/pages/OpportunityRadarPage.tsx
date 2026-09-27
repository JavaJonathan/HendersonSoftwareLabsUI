import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Alert, Autocomplete, Box, Button, Checkbox, Container, FormControl, FormControlLabel, IconButton,
  InputLabel, Menu, MenuItem, Pagination, Paper, Select, Skeleton, Stack, Tab,
  Tabs, TextField, Typography, useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined';
import { AuthedAppBar } from '../components/layout/AuthedAppBar';
import { EvaluationDialog } from '../components/opportunities/EvaluationDialog';
import { OpportunityLaneTabs } from '../components/opportunities/OpportunityLaneTabs';
import { OpportunityTable, OpportunityTableSkeleton, SignalLegend } from '../components/opportunities/OpportunityTable';
import { RadarDialog as AppDialog } from '../components/opportunities/RadarDialog';
import { RadarFilters, type RadarFilterField } from '../components/opportunities/RadarFilters';
import { RadarPageHeader } from '../components/opportunities/RadarPageHeader';
import { copyToClipboard } from '../lib/clipboard';
import { SURFACE_SUBTLE } from '../theme';
import {
  downloadOpportunityExport, getOpportunities, getRadarPreferences, getRadarProvider,
  importActiveProject, importActiveProjectsBatch, importBusinessProspect, importBusinessProspectsBatch,
  loadOpportunitySamples, updateRadarPreferences, SOURCE_TYPE_LABELS, formatProspectType,
  type OpportunityEntityType, type OpportunityList, type ImportActiveProjectRequest, type ImportBusinessProspectRequest,
  type BusinessProspectType, type OpportunitySourceType, type RadarPreferences, type RadarProviderStatus, type ResearchConfidence,
} from '../api/opportunities';
import { getApiErrorMessage } from '../api/client';
import { getOpportunityJsonTemplate } from './opportunityJsonTemplates';

const RECOMMENDATION_VALUES: Record<OpportunityEntityType, string[]> = {
  ActiveProject: ['All', 'Pursue', 'Investigate', 'Pass'],
  BusinessProspect: ['All', 'Prioritize', 'Watch', 'Skip'],
};
const DECISION_VALUES: Record<OpportunityEntityType, string[]> = {
  ActiveProject: ['All', 'Unreviewed', 'Pursue', 'Investigate', 'Pass'],
  BusinessProspect: ['All', 'Unreviewed', 'Prioritize', 'Watch', 'Skip'],
};

function downloadJsonFile(content: string, filename: string) {
  const url = URL.createObjectURL(new Blob([content], { type: 'application/json;charset=utf-8' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function downloadJsonSchema(entityType: OpportunityEntityType) {
  const template = getOpportunityJsonTemplate(entityType);
  downloadJsonFile(template.schema, template.schemaFilename);
}

export function OpportunityRadarPage({ entityType }: { entityType: OpportunityEntityType }) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const compactActions = useMediaQuery(theme.breakpoints.down('lg'));
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
  const filterFields: RadarFilterField[] = [
    { key: 'recommendation', label: 'Recommendation', value: recommendation, values: RECOMMENDATION_VALUES[entityType] },
    entityType === 'ActiveProject'
      ? { key: 'source', label: 'Source', value: sourceType, values: ['All', 'ExplicitDemand', 'OperationalSignal'], labels: SOURCE_TYPE_LABELS }
      : { key: 'prospectType', label: 'Prospect type', value: prospectType, values: ['All', 'OperationalPain', 'DigitalPresence', 'Hybrid', 'Unknown'] },
    { key: 'verification', label: 'Verification', value: verification, values: ['All', 'Clear', 'NeedsVerification'], labels: { NeedsVerification: 'Needs verification' } },
    { key: 'decision', label: 'Decision', value: decision, values: DECISION_VALUES[entityType] },
  ];
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
    <Stack direction="row" spacing={1} sx={{
      width: { xs: '100%', sm: 'auto' },
      '& > .MuiButton-root': { height: 44, px: { xs: 1.5, sm: 2.5 }, minWidth: 0, flex: { xs: '1 1 0', sm: '0 0 auto' }, width: { sm: 'auto' } },
    }}>
      <Button fullWidth variant="contained" startIcon={<AddIcon />} onClick={() => setImportOpen(true)}>Import</Button>
      <Button fullWidth variant="outlined" startIcon={<AutoAwesomeIcon />} onClick={() => setEvaluationOpen(true)} disabled={busy || !list?.total}>Evaluate</Button>
      <IconButton aria-label="More Radar actions" onClick={event => setActionAnchor(event.currentTarget)} aria-haspopup="menu" aria-expanded={Boolean(actionAnchor)} aria-controls={actionAnchor ? 'radar-actions-menu' : undefined} sx={{ border: 1, borderColor: 'divider', width: 44, height: 44, flexShrink: 0 }}><MoreVertIcon /></IconButton>
      <Menu id="radar-actions-menu" anchorEl={actionAnchor} open={Boolean(actionAnchor)} onClose={() => setActionAnchor(null)}>
        <MenuItem onClick={() => { setActionAnchor(null); setSettingsOpen(true); }}><SettingsOutlinedIcon fontSize="small" sx={{ mr: 1.25 }} />Preferences</MenuItem>
        <MenuItem disabled={!list?.total} onClick={() => { setActionAnchor(null); setExportOpen(true); }}><DownloadOutlinedIcon fontSize="small" sx={{ mr: 1.25 }} />Export</MenuItem>
      </Menu>
    </Stack>
  ) : (
    <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'nowrap', justifyContent: 'flex-end', '& > .MuiButton-root': { height: 44, whiteSpace: 'nowrap' } }}>
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

      <RadarFilters search={searchDraft} query={query} placeholder={entityType === 'ActiveProject' ? 'Search projects' : 'Search businesses'} fields={filterFields} onSearch={setSearchDraft} onFilter={setParam} onClear={clearFilters} />

      {loading && <OpportunityTableSkeleton entityType={entityType} />}
      {!loading && !error && list?.total === 0 && <Paper variant="outlined" sx={{ p: { xs: 3.5, md: 6 }, textAlign: 'center', borderRadius: 3, borderStyle: 'dashed' }}>
        <Box sx={{ width: 48, height: 48, borderRadius: '50%', bgcolor: 'primary.light', color: 'primary.main', display: 'grid', placeItems: 'center', mx: 'auto', mb: 1.5 }}>{filterCount ? <SearchRoundedIcon /> : <AutoAwesomeIcon />}</Box>
        <Typography variant="h6">{filterCount ? 'No matches in this view' : 'Your pipeline is ready'}</Typography>
        <Typography sx={{ color: 'text.secondary', mt: 0.5, mb: 2.5, maxWidth: 520, mx: 'auto' }}>{filterCount ? 'Try broadening the search or clearing one of the active filters.' : entityType === 'ActiveProject' ? 'Import a public project description or load the synthetic examples to explore the workflow.' : 'Import a public business research note or load the synthetic examples to explore the workflow.'}</Typography>
        {filterCount ? <Button variant="outlined" onClick={clearFilters}>Clear filters</Button> : <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ justifyContent: 'center' }}><Button variant="contained" startIcon={<AddIcon />} onClick={() => setImportOpen(true)}>Import</Button><Button variant="outlined" onClick={loadSamples} disabled={busy}>Load synthetic examples</Button></Stack>}
      </Paper>}
      {!loading && !!list?.items.length && <>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 1, sm: 2 }} sx={{ mb: 1.5, alignItems: { sm: 'baseline' }, justifyContent: 'space-between' }}>
          <Typography ref={resultsHeadingRef} tabIndex={-1} variant="body2" sx={{ fontWeight: 700, outline: 'none' }}>{list.total.toLocaleString()} {list.total === 1 ? 'result' : 'results'}<Box component="span" sx={{ display: 'block', mt: 0.5, color: 'text.secondary', fontSize: 12, fontWeight: 400 }}>Ranked by score, strongest first</Box></Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>Showing {start}-{end}</Typography>
        </Stack>
        <Box sx={{ mb: 1.5 }}><SignalLegend /></Box>
        <OpportunityTable items={list.items} entityType={entityType} />
      </>}
      {!!list && list.total > list.pageSize && <Pagination sx={{ mt: 3.5, display: 'flex', justifyContent: 'center' }} count={Math.ceil(list.total / list.pageSize)} page={page} onChange={(_, value) => { setParam('page', value, false); window.setTimeout(() => resultsHeadingRef.current?.focus(), 0); }} />}
    </Container>
    <ImportDialog open={importOpen} fullScreen={fullScreen} entityType={entityType} onClose={() => setImportOpen(false)} onImported={message => { setImportOpen(false); setNotice(message); setRefresh(value => value + 1); }} />
    <PreferencesDialog open={settingsOpen} fullScreen={fullScreen} onClose={() => setSettingsOpen(false)} onSaved={() => { setSettingsOpen(false); setNotice('Preferences saved. Changes to Jev input context mark affected live results stale until Jev runs again.'); setRefresh(value => value + 1); }} />
    <EvaluationDialog open={evaluationOpen} fullScreen={fullScreen} liveAvailable={!!laneAvailable} onClose={() => setEvaluationOpen(false)} onEvaluated={message => { setEvaluationOpen(false); setNotice(message); setRefresh(value => value + 1); }} />
    <ExportDialog open={exportOpen} fullScreen={fullScreen} onClose={() => setExportOpen(false)} />
  </Box>;
}

function ExportDialog({ open, fullScreen, onClose }: { open: boolean; fullScreen: boolean; onClose: () => void }) {
  const [includeSynthetic, setIncludeSynthetic] = useState(false); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  useEffect(() => { if (open) { setIncludeSynthetic(false); setError(''); } }, [open]);
  async function download() { setBusy(true); setError(''); try { const blob = await downloadOpportunityExport(includeSynthetic); const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = `hsl-opportunity-radar-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}.csv`; anchor.click(); URL.revokeObjectURL(url); onClose(); } catch (err) { setError(getApiErrorMessage(err, 'Unable to export opportunities.')); } finally { setBusy(false); } }
  return <AppDialog open={open} fullScreen={fullScreen} title="Export review data" busy={busy} onClose={onClose} actions={<><Button onClick={onClose} disabled={busy}>Cancel</Button><Button variant="contained" startIcon={<DownloadOutlinedIcon />} onClick={download} disabled={busy}>{busy ? 'Preparing...' : 'Download CSV'}</Button></>}><Stack spacing={2}>{error && <Alert severity="error">{error}</Alert>}<Typography sx={{ color: 'text.secondary' }}>Download both lanes with source metadata, model details, semantic factors, decisions, and notes.</Typography><Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, bgcolor: SURFACE_SUBTLE }}><Stack direction="row" spacing={1.25} sx={{ alignItems: 'flex-start' }}><CheckCircleOutlineRoundedIcon color="primary" /><Typography variant="body2">Imported and user-written cells are sanitized against spreadsheet formula injection. Stored source data is unchanged.</Typography></Stack></Paper><FormControlLabel control={<Checkbox checked={includeSynthetic} onChange={event => setIncludeSynthetic(event.target.checked)} />} label="Include synthetic examples" />{!includeSynthetic && <Typography variant="caption" sx={{ color: 'text.secondary' }}>Synthetic illustrations are excluded by default so they do not mix with real review data.</Typography>}</Stack></AppDialog>;
}

interface EvidenceRow { fact: string; source: string; date: string }
const EMPTY_EVIDENCE_ROW: EvidenceRow = { fact: '', source: '', date: '' };

function ImportDialog({ open, fullScreen, entityType, onClose, onImported }: { open: boolean; fullScreen: boolean; entityType: OpportunityEntityType; onClose: () => void; onImported: (message: string) => void }) {
  const [mode, setMode] = useState<'paste' | 'batch'>('paste');
  const [title, setTitle] = useState('');
  const [request, setRequest] = useState('');
  const [sourceType, setSourceType] = useState<OpportunitySourceType>('ExplicitDemand');
  const [sourceUrl, setSourceUrl] = useState('');
  const [budget, setBudget] = useState('');
  const [competitionProposals, setCompetitionProposals] = useState('');
  const [competitionInterviewing, setCompetitionInterviewing] = useState('');
  const [competitionHires, setCompetitionHires] = useState('');
  const [evidence, setEvidence] = useState<EvidenceRow[]>([EMPTY_EVIDENCE_ROW]);
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [geography, setGeography] = useState('');
  const [industry, setIndustry] = useState('');
  const [prospectType, setProspectType] = useState<BusinessProspectType | ''>('');
  const [fit, setFit] = useState('');
  const [proposalAngle, setProposalAngle] = useState('');
  const [entryOffer, setEntryOffer] = useState('');
  const [risk, setRisk] = useState('');
  const [confidenceLevel, setConfidenceLevel] = useState<ResearchConfidence | ''>('');
  const [confidenceReason, setConfidenceReason] = useState('');
  const [researchAgent, setResearchAgent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'failed'>('idle');

  useEffect(() => {
    if (!open) return;
    setMode('paste'); setTitle(''); setRequest(''); setSourceType('ExplicitDemand'); setSourceUrl('');
    setBudget(''); setCompetitionProposals(''); setCompetitionInterviewing(''); setCompetitionHires('');
    setEvidence([EMPTY_EVIDENCE_ROW]); setWebsiteUrl(''); setGeography(''); setIndustry(''); setProspectType('');
    setFit(''); setProposalAngle(''); setEntryOffer(''); setRisk(''); setConfidenceLevel(''); setConfidenceReason('');
    setResearchAgent(''); setFile(null); setError(''); setCopyStatus('idle');
  }, [open]);

  async function copySchema() { setCopyStatus(await copyToClipboard(getOpportunityJsonTemplate(entityType).schema) ? 'copied' : 'failed'); }
  function updateEvidenceRow(index: number, patch: Partial<EvidenceRow>) { setEvidence(rows => rows.map((row, i) => i === index ? { ...row, ...patch } : row)); }
  function removeEvidenceRow(index: number) { setEvidence(rows => rows.length > 1 ? rows.filter((_, i) => i !== index) : rows); }

  async function submit() {
    setBusy(true); setError('');
    try {
      const confidence = confidenceLevel ? { level: confidenceLevel, reason: confidenceReason || undefined } : undefined;
      if (mode === 'paste') {
        if (entityType === 'ActiveProject') {
          if (!title.trim() || request.trim().length < 20) throw new Error('Add a title and at least 20 characters describing the request.');
          const competition = competitionProposals || competitionInterviewing || competitionHires
            ? { proposals: competitionProposals || undefined, interviewing: competitionInterviewing ? Number(competitionInterviewing) : undefined, hires: competitionHires ? Number(competitionHires) : undefined }
            : undefined;
          const result = await importActiveProject({
            title, request, sourceType, sourceUrl: sourceUrl || undefined, budget: budget || undefined, competition,
            fit: fit || undefined, proposalAngle: proposalAngle || undefined, risk: risk || undefined, confidence, researchAgent: researchAgent || undefined,
          });
          onImported(result.updated ? 'An existing Active Project was updated. Its review decision was preserved.' : 'Active Project imported. Evaluate it when you are ready.');
        } else {
          const cleanedEvidence = evidence.filter(row => row.fact.trim().length > 0)
            .map(row => ({ fact: row.fact.trim(), source: row.source.trim() || undefined, date: row.date || undefined }));
          const combinedLength = cleanedEvidence.reduce((sum, row) => sum + row.fact.length, 0);
          if (!title.trim() || combinedLength < 20) throw new Error('Add a business name and at least 20 combined characters of evidence.');
          const result = await importBusinessProspect({
            businessName: title, evidence: cleanedEvidence, websiteUrl: websiteUrl || undefined, geography: geography || undefined,
            industry: industry || undefined, prospectType: prospectType || undefined, fit: fit || undefined, entryOffer: entryOffer || undefined,
            risk: risk || undefined, confidence, researchAgent: researchAgent || undefined,
          });
          onImported(result.updated ? 'An existing Business Prospect was updated. Its review decision was preserved.' : 'Business Prospect imported. Evaluate it when you are ready.');
        }
      } else {
        if (!file) throw new Error('Choose a JSON file first.');
        let parsed: { researchAgent?: string; items?: unknown[] } | unknown[];
        try { parsed = JSON.parse(await file.text()); } catch { throw new Error('That file is not valid JSON.'); }
        const items = Array.isArray(parsed) ? parsed : parsed.items;
        const batchResearchAgent = Array.isArray(parsed) ? undefined : parsed.researchAgent;
        if (!Array.isArray(items) || items.length === 0) throw new Error('The JSON file must contain a non-empty "items" array.');
        const result = entityType === 'ActiveProject'
          ? await importActiveProjectsBatch(items as ImportActiveProjectRequest[], batchResearchAgent)
          : await importBusinessProspectsBatch(items as ImportBusinessProspectRequest[], batchResearchAgent);
        onImported(`Imported ${result.imported.length} new records. ${result.updated.length} existing records were updated without changing their decisions.`);
      }
    } catch (err) { setError(err instanceof Error ? err.message : 'Import failed.'); }
    finally { setBusy(false); }
  }

  return <AppDialog open={open} fullScreen={fullScreen} maxWidth="sm" title={entityType === 'ActiveProject' ? 'Import active projects' : 'Import business prospects'} busy={busy} onClose={onClose} actions={<><Button onClick={onClose} disabled={busy}>Cancel</Button><Button variant="contained" onClick={submit} disabled={busy}>{busy ? 'Importing...' : mode === 'batch' ? 'Import batch' : 'Import record'}</Button></>}>
    <Stack spacing={2.5}>
      <Tabs value={mode} onChange={(_, value: 'paste' | 'batch') => setMode(value)}><Tab value="paste" label="Paste one" /><Tab value="batch" label="Upload JSON" /></Tabs>
      {error && <Alert severity="error">{error}</Alert>}
      {mode === 'paste' ? <Stack spacing={2}>
        <Typography variant="h6">{entityType === 'ActiveProject' ? 'Source details' : 'Business details'}</Typography>
        <TextField label={entityType === 'ActiveProject' ? 'Project title' : 'Business name'} value={title} onChange={event => setTitle(event.target.value)} slotProps={{ htmlInput: { maxLength: 200 } }} required />
        {entityType === 'ActiveProject' ? <>
          <FormControl><InputLabel>Source type</InputLabel><Select label="Source type" value={sourceType} onChange={event => setSourceType(event.target.value as OpportunitySourceType)}>{Object.entries(SOURCE_TYPE_LABELS).map(([key, label]) => <MenuItem key={key} value={key}>{label}</MenuItem>)}</Select></FormControl>
          <TextField label="Source URL (optional)" type="url" value={sourceUrl} onChange={event => setSourceUrl(event.target.value)} slotProps={{ htmlInput: { maxLength: 2048 } }} />
          <TextField label="Budget (optional)" value={budget} onChange={event => setBudget(event.target.value)} placeholder="e.g. $8,000 fixed" slotProps={{ htmlInput: { maxLength: 100 } }} />
          <Typography variant="h6" sx={{ pt: 1 }}>Evidence</Typography>
          <TextField label="Request" value={request} onChange={event => setRequest(event.target.value)} multiline minRows={4} slotProps={{ htmlInput: { maxLength: 4000 } }} required helperText={`What the buyer explicitly requested. ${request.length.toLocaleString()} / 4,000 characters`} />
          <Typography variant="h6" sx={{ pt: 1 }}>Optional research context</Typography>
          <Stack direction="column" spacing={2}>
            <TextField label="Proposals (optional)" value={competitionProposals} onChange={event => setCompetitionProposals(event.target.value)} placeholder="e.g. 5-10" fullWidth />
            <TextField label="Interviewing (optional)" type="number" value={competitionInterviewing} onChange={event => setCompetitionInterviewing(event.target.value)} fullWidth slotProps={{ htmlInput: { min: 0 } }} />
            <TextField label="Hires (optional)" type="number" value={competitionHires} onChange={event => setCompetitionHires(event.target.value)} fullWidth slotProps={{ htmlInput: { min: 0 } }} />
          </Stack>
          <TextField label="Fit (optional)" value={fit} onChange={event => setFit(event.target.value)} multiline minRows={2} helperText="Your own assessment of alignment with HSL's capabilities. Not evidence." slotProps={{ htmlInput: { maxLength: 1000 } }} />
          <TextField label="Proposal angle (optional)" value={proposalAngle} onChange={event => setProposalAngle(event.target.value)} multiline minRows={2} slotProps={{ htmlInput: { maxLength: 1000 } }} />
        </> : <>
          <TextField label="Website URL (optional)" type="url" value={websiteUrl} onChange={event => setWebsiteUrl(event.target.value)} slotProps={{ htmlInput: { maxLength: 2048 } }} />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}><TextField label="Geography (optional)" value={geography} onChange={event => setGeography(event.target.value)} fullWidth /><TextField label="Industry (optional)" value={industry} onChange={event => setIndustry(event.target.value)} fullWidth /></Stack>
          <FormControl><InputLabel>Prospect type (optional)</InputLabel><Select label="Prospect type (optional)" value={prospectType} onChange={event => setProspectType(event.target.value as BusinessProspectType | '')}><MenuItem value="">Not supplied</MenuItem>{(['OperationalPain', 'DigitalPresence', 'Hybrid', 'Unknown'] as BusinessProspectType[]).map(value => <MenuItem key={value} value={value}>{formatProspectType(value)}</MenuItem>)}</Select></FormControl>
          <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, bgcolor: SURFACE_SUBTLE }}><Stack spacing={1.5}>
            <Typography sx={{ fontWeight: 700 }}>Evidence</Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>Verified, source-backed facts only. Combined length must be at least 20 characters.</Typography>
            {evidence.map((row, index) => <Stack key={index} spacing={1} sx={{ pb: 1.5, borderBottom: index < evidence.length - 1 ? 1 : 0, borderColor: 'divider' }}>
              <TextField label={`Fact ${index + 1}`} value={row.fact} onChange={event => updateEvidenceRow(index, { fact: event.target.value })} multiline minRows={2} slotProps={{ htmlInput: { maxLength: 2000 } }} />
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                <TextField label="Source (optional)" value={row.source} onChange={event => updateEvidenceRow(index, { source: event.target.value })} fullWidth slotProps={{ htmlInput: { maxLength: 1000 } }} />
                <TextField label="Date (optional)" type="date" value={row.date} onChange={event => updateEvidenceRow(index, { date: event.target.value })} slotProps={{ inputLabel: { shrink: true } }} sx={{ width: { xs: '100%', sm: 160 }, flexShrink: 0 }} />
                <IconButton sx={{ width: 44, height: 44, alignSelf: 'flex-end', flexShrink: 0 }} aria-label="Remove evidence fact" onClick={() => removeEvidenceRow(index)} disabled={evidence.length === 1}><DeleteOutlineRoundedIcon fontSize="small" /></IconButton>
              </Stack>
            </Stack>)}
            <Button size="small" startIcon={<AddIcon />} onClick={() => setEvidence(rows => [...rows, EMPTY_EVIDENCE_ROW])} sx={{ alignSelf: 'flex-start' }}>Add evidence fact</Button>
          </Stack></Paper>
          <Typography variant="h6" sx={{ pt: 1 }}>Optional research context</Typography>
          <TextField label="Fit (optional)" value={fit} onChange={event => setFit(event.target.value)} multiline minRows={2} helperText="Your own inference of the workflow opportunity. Not evidence." slotProps={{ htmlInput: { maxLength: 1000 } }} />
          <TextField label="Entry offer (optional)" value={entryOffer} onChange={event => setEntryOffer(event.target.value)} multiline minRows={2} slotProps={{ htmlInput: { maxLength: 1000 } }} />
        </>}
        <TextField label="Risk (optional)" value={risk} onChange={event => setRisk(event.target.value)} multiline minRows={2} slotProps={{ htmlInput: { maxLength: 1000 } }} />
        <FormControl><InputLabel>Confidence (optional)</InputLabel><Select label="Confidence (optional)" value={confidenceLevel} onChange={event => setConfidenceLevel(event.target.value as ResearchConfidence | '')}><MenuItem value="">Not supplied</MenuItem>{(['Low', 'Medium', 'High'] as ResearchConfidence[]).map(value => <MenuItem key={value} value={value}>{value}</MenuItem>)}</Select></FormControl>
        <TextField label="Confidence reason (optional)" value={confidenceReason} onChange={event => setConfidenceReason(event.target.value)} slotProps={{ htmlInput: { maxLength: 500 } }} />
        <TextField label="Research agent (optional)" value={researchAgent} onChange={event => setResearchAgent(event.target.value)} slotProps={{ htmlInput: { maxLength: 100 } }} />
      </Stack> : <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, bgcolor: SURFACE_SUBTLE, borderRadius: 3 }}><Stack spacing={1.5}><Typography sx={{ fontWeight: 800 }}>JSON Schema</Typography><Typography variant="body2" sx={{ color: 'text.secondary' }}>Hand your AI agent this schema, its field descriptions carry the field rules and a worked example is embedded under its top-level "examples".</Typography><Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}><Button onClick={() => downloadJsonSchema(entityType)}>Download JSON Schema</Button><Button variant="outlined" startIcon={<ContentCopyOutlinedIcon />} onClick={copySchema}>Copy JSON Schema</Button></Stack><Typography role="status" variant="caption" sx={{ minHeight: 18, color: copyStatus === 'failed' ? 'error.main' : 'success.dark' }}>{copyStatus === 'copied' && 'JSON Schema copied.'}{copyStatus === 'failed' && 'Unable to copy the JSON Schema.'}</Typography><Button component="label" variant="outlined" startIcon={<UploadFileOutlinedIcon />} sx={{ alignSelf: 'flex-start' }}>Choose JSON<input hidden type="file" accept=".json,application/json" onChange={event => setFile(event.target.files?.[0] ?? null)} /></Button><Typography variant="body2">{file?.name ?? 'No file selected'}</Typography></Stack></Paper>}
    </Stack>
  </AppDialog>;
}

const ACTIVE_WEIGHTS = [['problemClarity', 'Problem clarity'], ['hslDeliveryFit', 'HSL delivery fit'], ['independentScope', 'Independent scope'], ['economicViability', 'Economic viability'], ['urgency', 'Urgency'], ['buyerReadiness', 'Buyer readiness'], ['informationMarketFit', 'Information and market fit']] as const;
const OPERATIONAL_WEIGHTS = [['painEvidence', 'Pain evidence'], ['automationFeasibility', 'Automation feasibility'], ['economicLeverage', 'Economic leverage'], ['containedEngagement', 'Contained engagement'], ['urgency', 'Urgency'], ['hslDeliveryFit', 'HSL delivery fit'], ['buyerAccess', 'Buyer access'], ['marketAccessFit', 'Market and local access']] as const;
const DIGITAL_WEIGHTS = [['businessStrength', 'Business strength'], ['digitalWeakness', 'Digital weakness'], ['reputationMismatch', 'Reputation mismatch'], ['entryProjectStrength', 'Entry project'], ['urgency', 'Urgency'], ['hslDeliveryFit', 'HSL delivery fit'], ['buyerAccess', 'Buyer access'], ['marketAccessFit', 'Market and local access']] as const;

function ChipField({ label, value, onChange, helperText }: { label: string; value: string[]; onChange: (value: string[]) => void; helperText?: string }) { return <Autocomplete multiple freeSolo options={[]} value={value} onChange={(_, next) => onChange(next)} renderInput={params => <TextField {...params} label={label} helperText={helperText} placeholder={value.length ? '' : 'Type and press Enter'} />} />; }

function ProfileListField({ label, value, onChange, helperText }: { label: string; value: string[]; onChange: (value: string[]) => void; helperText?: string }) {
  return <TextField label={label} value={value.join('\n')} onChange={event => onChange(event.target.value.split('\n'))} helperText={helperText ?? 'One item per line.'} multiline minRows={3} fullWidth />;
}

function PreferencesDialog({ open, fullScreen, onClose, onSaved }: { open: boolean; fullScreen: boolean; onClose: () => void; onSaved: () => void }) {
  const [value, setValue] = useState<RadarPreferences | null>(null); const [section, setSection] = useState<'projects' | 'prospects' | 'profile' | 'digest'>('projects'); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  useEffect(() => { if (!open) return; setError(''); setSection('projects'); getRadarPreferences().then(setValue).catch(() => setError('Unable to load preferences.')); }, [open]);
  const profileLists = value ? [value.businessProfile.idealCustomerTraits, value.businessProfile.coreOffers, value.businessProfile.capabilities, value.businessProfile.engagementModel, value.businessProfile.capacityConstraints, value.businessProfile.geographicFocus, value.businessProfile.priceBands] : [];
  const validation = !value ? '' : value.activeProject.minimumBudget < 0 ? 'Minimum budget cannot be negative.' : [...Object.values(value.activeProject.weightsV2), ...Object.values(value.businessProspect.operationalPainWeights), ...Object.values(value.businessProspect.digitalPresenceWeights)].some(weight => weight < 0 || weight > 100) ? 'Each relative weight must be between 0 and 100.' : value.digestActiveProjectCount < 0 || value.digestActiveProjectCount > 25 || value.digestBusinessProspectCount < 0 || value.digestBusinessProspectCount > 25 ? 'Digest counts must stay between 0 and 25.' : !value.businessProfile.positioning.trim() || !value.businessProfile.businessModel.trim() || profileLists.some(items => !items.some(item => item.trim())) ? 'Complete every required business profile section before saving.' : '';
  async function save() { if (!value || validation) return; const clean = (items: string[]) => items.map(item => item.trim()).filter(Boolean); setBusy(true); setError(''); try { await updateRadarPreferences({ activeProject: value.activeProject, businessProspect: value.businessProspect, businessProfile: { ...value.businessProfile, idealCustomerTraits: clean(value.businessProfile.idealCustomerTraits), coreOffers: clean(value.businessProfile.coreOffers), secondaryOffers: clean(value.businessProfile.secondaryOffers), capabilities: clean(value.businessProfile.capabilities), engagementModel: clean(value.businessProfile.engagementModel), capacityConstraints: clean(value.businessProfile.capacityConstraints), geographicFocus: clean(value.businessProfile.geographicFocus), priceBands: clean(value.businessProfile.priceBands) }, digestActiveProjectCount: value.digestActiveProjectCount, digestBusinessProspectCount: value.digestBusinessProspectCount }); onSaved(); } catch (err) { setError(getApiErrorMessage(err, 'Unable to save preferences.')); } finally { setBusy(false); } }
  return <AppDialog open={open} fullScreen={fullScreen} title="Opportunity Radar settings" busy={busy} maxWidth="md" onClose={onClose} actions={<><Button onClick={onClose} disabled={busy}>Cancel</Button><Button variant="contained" onClick={save} disabled={busy || !value || Boolean(validation)}>{busy ? 'Saving...' : 'Save preferences'}</Button></>}>
    <Stack spacing={2.5}>{error && <Alert severity="error">{error}</Alert>}{validation && <Alert severity="warning">{validation}</Alert>}{!value ? !error && <Stack spacing={1}><Skeleton height={48} /><Skeleton height={72} /><Skeleton height={72} /></Stack> : <>
      <Tabs value={section} onChange={(_, next) => setSection(next)} variant="scrollable" scrollButtons="auto" allowScrollButtonsMobile sx={{ '& .MuiTab-root': { px: { xs: 1, sm: 2 }, minWidth: 0, fontSize: { xs: 12, sm: 14 } } }}><Tab value="projects" label="Active Projects" /><Tab value="prospects" label="Business Prospects" /><Tab value="profile" label="Business Profile" /><Tab value="digest" label="Digest" /></Tabs>
      {section === 'projects' && <Stack spacing={2.25}>
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
      {section === 'profile' && <Stack spacing={2.25}>
        <Alert severity="info">This profile is always part of Jev's request for both lanes. Review it before saving changes, edits mark existing Jev evaluations stale.</Alert>
        <TextField label="Positioning" value={value.businessProfile.positioning} onChange={event => setValue({ ...value, businessProfile: { ...value.businessProfile, positioning: event.target.value } })} multiline minRows={3} fullWidth />
        <TextField label="Business model" value={value.businessProfile.businessModel} onChange={event => setValue({ ...value, businessProfile: { ...value.businessProfile, businessModel: event.target.value } })} multiline minRows={3} fullWidth />
        <ChipField label="Capabilities" value={value.businessProfile.capabilities} onChange={capabilities => setValue({ ...value, businessProfile: { ...value.businessProfile, capabilities } })} helperText="Shared by both Active Projects and Business Prospects." />
        <ProfileListField label="Ideal customer traits" value={value.businessProfile.idealCustomerTraits} onChange={idealCustomerTraits => setValue({ ...value, businessProfile: { ...value.businessProfile, idealCustomerTraits } })} />
        <ProfileListField label="Core offers" value={value.businessProfile.coreOffers} onChange={coreOffers => setValue({ ...value, businessProfile: { ...value.businessProfile, coreOffers } })} />
        <ProfileListField label="Secondary offers" value={value.businessProfile.secondaryOffers} onChange={secondaryOffers => setValue({ ...value, businessProfile: { ...value.businessProfile, secondaryOffers } })} />
        <ProfileListField label="Engagement model" value={value.businessProfile.engagementModel} onChange={engagementModel => setValue({ ...value, businessProfile: { ...value.businessProfile, engagementModel } })} />
        <ProfileListField label="Capacity and scope constraints" value={value.businessProfile.capacityConstraints} onChange={capacityConstraints => setValue({ ...value, businessProfile: { ...value.businessProfile, capacityConstraints } })} />
        <ProfileListField label="Geographic focus" value={value.businessProfile.geographicFocus} onChange={geographicFocus => setValue({ ...value, businessProfile: { ...value.businessProfile, geographicFocus } })} />
        <ProfileListField label="Approved price bands" value={value.businessProfile.priceBands} onChange={priceBands => setValue({ ...value, businessProfile: { ...value.businessProfile, priceBands } })} />
        <TextField label="Last reviewed" type="date" value={value.businessProfile.lastReviewedAt?.slice(0, 10) ?? ''} onChange={event => setValue({ ...value, businessProfile: { ...value.businessProfile, lastReviewedAt: event.target.value ? new Date(`${event.target.value}T12:00:00Z`).toISOString() : null } })} slotProps={{ inputLabel: { shrink: true } }} fullWidth />
        <Alert severity="warning">The profile helps Jev understand HSL. It does not count as evidence that a buyer has urgency, budget, workflow pain, or economic value.</Alert>
      </Stack>}
      {section === 'digest' && <Stack spacing={2}><Typography sx={{ color: 'text.secondary' }}>Choose the maximum number of clear, unreviewed records shown in each daily view.</Typography><Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}><TextField label="Active projects" type="number" value={value.digestActiveProjectCount} onChange={event => setValue({ ...value, digestActiveProjectCount: Number(event.target.value) })} fullWidth /><TextField label="Business prospects" type="number" value={value.digestBusinessProspectCount} onChange={event => setValue({ ...value, digestBusinessProspectCount: Number(event.target.value) })} fullWidth /></Stack></Stack>}
    </>}</Stack>
  </AppDialog>;
}

function WeightGrid<K extends string>({ title, note, items, values, onChange }: { title: string; note: string; items: readonly (readonly [K, string])[]; values: Record<K, number>; onChange: (key: K, value: number) => void }) { return <Box><Typography sx={{ fontWeight: 800 }}>{title}</Typography><Typography variant="caption" sx={{ color: 'text.secondary' }}>{note}</Typography><Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', sm: 'repeat(2, minmax(0, 1fr))', md: 'repeat(3, minmax(0, 1fr))' }, gap: 1.5, mt: 1.5 }}>{items.map(([key, label]) => <TextField key={key} label={label} fullWidth type="number" size="small" value={values[key] ?? 0} onChange={event => onChange(key, Number(event.target.value))} slotProps={{ htmlInput: { min: 0, max: 100 } }} />)}</Box></Box>; }
