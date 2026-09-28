import { useEffect, useState } from 'react';
import {
  Alert, Button, FormControl, IconButton, InputLabel, MenuItem, Paper,
  Select, Stack, Tab, Tabs, TextField, Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined';
import { RadarDialog as AppDialog } from './RadarDialog';
import { copyToClipboard } from '../../lib/clipboard';
import { SURFACE_SUBTLE } from '../../theme';
import {
  importActiveProject, importActiveProjectsBatch, importBusinessProspect, importBusinessProspectsBatch,
  formatProspectType, SOURCE_TYPE_LABELS,
  type OpportunityEntityType, type ImportActiveProjectRequest, type ImportBusinessProspectRequest,
  type BusinessProspectType, type OpportunitySourceType, type PriorityBand, type ResearchConfidence,
} from '../../api/opportunities';
import { getOpportunityJsonTemplate } from '../../pages/opportunityJsonTemplates';

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

interface EvidenceRow { fact: string; source: string; date: string }
const EMPTY_EVIDENCE_ROW: EvidenceRow = { fact: '', source: '', date: '' };

export function ImportDialog({ open, fullScreen, entityType, onClose, onImported }: { open: boolean; fullScreen: boolean; entityType: OpportunityEntityType; onClose: () => void; onImported: (message: string) => void }) {
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
  const [opportunityRating, setOpportunityRating] = useState<PriorityBand | ''>('');
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
    setFit(''); setProposalAngle(''); setEntryOffer(''); setRisk(''); setOpportunityRating(''); setConfidenceLevel(''); setConfidenceReason('');
    setResearchAgent(''); setFile(null); setError(''); setCopyStatus('idle');
  }, [open]);

  async function copySchema() {
    const copied = await copyToClipboard(getOpportunityJsonTemplate(entityType).schema);
    setCopyStatus(copied ? 'copied' : 'failed');
  }

  function updateEvidenceRow(index: number, patch: Partial<EvidenceRow>) {
    setEvidence(rows => rows.map((row, i) => i === index ? { ...row, ...patch } : row));
  }

  function removeEvidenceRow(index: number) {
    setEvidence(rows => rows.length > 1 ? rows.filter((_, i) => i !== index) : rows);
  }

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
            fit: fit || undefined, proposalAngle: proposalAngle || undefined, risk: risk || undefined,
            opportunityRating: opportunityRating || undefined, confidence, researchAgent: researchAgent || undefined,
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
            risk: risk || undefined, opportunityRating: opportunityRating || undefined, confidence, researchAgent: researchAgent || undefined,
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

  return <AppDialog
    open={open}
    fullScreen={fullScreen}
    maxWidth="sm"
    title={entityType === 'ActiveProject' ? 'Import active projects' : 'Import business prospects'}
    busy={busy}
    onClose={onClose}
    actions={<>
      <Button onClick={onClose} disabled={busy}>Cancel</Button>
      <Button variant="contained" onClick={submit} disabled={busy}>
        {busy ? 'Importing...' : mode === 'batch' ? 'Import batch' : 'Import record'}
      </Button>
    </>}
  >
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
        <FormControl><InputLabel>Opportunity rating (optional)</InputLabel><Select label="Opportunity rating (optional)" value={opportunityRating} onChange={event => setOpportunityRating(event.target.value as PriorityBand | '')}><MenuItem value="">Not supplied</MenuItem>{(['Low', 'Medium', 'High'] as PriorityBand[]).map(value => <MenuItem key={value} value={value}>{value}</MenuItem>)}</Select></FormControl>
        <FormControl><InputLabel>Confidence (optional)</InputLabel><Select label="Confidence (optional)" value={confidenceLevel} onChange={event => setConfidenceLevel(event.target.value as ResearchConfidence | '')}><MenuItem value="">Not supplied</MenuItem>{(['Low', 'Medium', 'High'] as ResearchConfidence[]).map(value => <MenuItem key={value} value={value}>{value}</MenuItem>)}</Select></FormControl>
        <TextField label="Confidence reason (optional)" value={confidenceReason} onChange={event => setConfidenceReason(event.target.value)} slotProps={{ htmlInput: { maxLength: 500 } }} />
        <TextField label="Research agent (optional)" value={researchAgent} onChange={event => setResearchAgent(event.target.value)} slotProps={{ htmlInput: { maxLength: 100 } }} />
      </Stack> : <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, bgcolor: SURFACE_SUBTLE, borderRadius: 3 }}>
        <Stack spacing={1.5}>
          <Typography sx={{ fontWeight: 800 }}>JSON Schema</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Hand your AI agent this schema, its field descriptions carry the field rules and a worked
            example is embedded under its top-level "examples".
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <Button onClick={() => downloadJsonSchema(entityType)}>Download JSON Schema</Button>
            <Button variant="outlined" startIcon={<ContentCopyOutlinedIcon />} onClick={copySchema}>
              Copy JSON Schema
            </Button>
          </Stack>
          <Typography role="status" variant="caption" sx={{ minHeight: 18, color: copyStatus === 'failed' ? 'error.main' : 'success.dark' }}>
            {copyStatus === 'copied' && 'JSON Schema copied.'}
            {copyStatus === 'failed' && 'Unable to copy the JSON Schema.'}
          </Typography>
          <Button component="label" variant="outlined" startIcon={<UploadFileOutlinedIcon />} sx={{ alignSelf: 'flex-start' }}>
            Choose JSON
            <input hidden type="file" accept=".json,application/json" onChange={event => setFile(event.target.files?.[0] ?? null)} />
          </Button>
          <Typography variant="body2">{file?.name ?? 'No file selected'}</Typography>
        </Stack>
      </Paper>}
    </Stack>
  </AppDialog>;
}
