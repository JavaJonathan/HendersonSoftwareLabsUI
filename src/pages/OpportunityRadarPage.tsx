import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Alert, Box, Button, Container, IconButton, Menu, MenuItem, Pagination, Paper,
  Stack, Typography, useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import { AuthedAppBar } from '../components/layout/AuthedAppBar';
import { EvaluationDialog } from '../components/opportunities/EvaluationDialog';
import { ExportDialog } from '../components/opportunities/RadarExportDialog';
import { ImportDialog } from '../components/opportunities/RadarImportDialog';
import { PreferencesDialog } from '../components/opportunities/RadarPreferencesDialog';
import { OpportunityLaneTabs } from '../components/opportunities/OpportunityLaneTabs';
import { OpportunityTable, OpportunityTableSkeleton, SignalLegend } from '../components/opportunities/OpportunityTable';
import { RadarFilters, type RadarFilterField } from '../components/opportunities/RadarFilters';
import { RadarPageHeader } from '../components/opportunities/RadarPageHeader';
import { SURFACE_SUBTLE } from '../theme';
import {
  getOpportunities, getRadarProvider, loadOpportunitySamples, SOURCE_TYPE_LABELS,
  type OpportunityEntityType, type OpportunityList, type RadarProviderStatus,
} from '../api/opportunities';
import { getApiErrorMessage } from '../api/client';

const RECOMMENDATION_VALUES: Record<OpportunityEntityType, string[]> = {
  ActiveProject: ['All', 'Pursue', 'Investigate', 'Pass'],
  BusinessProspect: ['All', 'Prioritize', 'Watch', 'Skip'],
};
const DECISION_VALUES: Record<OpportunityEntityType, string[]> = {
  ActiveProject: ['All', 'Unreviewed', 'Pursue', 'Investigate', 'Pass'],
  BusinessProspect: ['All', 'Unreviewed', 'Prioritize', 'Watch', 'Skip'],
};

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
