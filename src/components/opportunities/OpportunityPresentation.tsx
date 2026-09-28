import { Box, Chip, Stack, Tooltip, Typography } from '@mui/material';
import BlockOutlinedIcon from '@mui/icons-material/BlockOutlined';
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined';
import HistoryToggleOffRoundedIcon from '@mui/icons-material/HistoryToggleOffRounded';
import ScienceOutlinedIcon from '@mui/icons-material/ScienceOutlined';
import { confidenceCaption, getOpportunitySignal, RATING_TONE, SOURCE_TYPE_LABELS, type OpportunitySummary } from '../../api/opportunities';
import { Flag } from './OpportunitySignals';

export function OpportunityMetadata({ item }: { item: OpportunitySummary }) {
  const parts = item.entityType === 'ActiveProject'
    ? [item.sourceType && SOURCE_TYPE_LABELS[item.sourceType], item.budgetStatus && `Budget ${item.budgetStatus.toLowerCase()}`]
    : [item.industry, item.geography];
  const metadata = parts.filter(Boolean).join(' · ');
  return <Box sx={{ color: 'text.secondary', overflowWrap: 'anywhere' }}>
    {metadata && <Typography variant="body2" sx={{ fontSize: 12.5, lineHeight: 1.6 }}>{metadata}</Typography>}
    {item.entityType === 'BusinessProspect' && <Typography variant="caption" sx={{ display: 'block', lineHeight: 1.6, mt: metadata ? 0.25 : 0 }}>{item.websiteDomain ?? 'No website found'}</Typography>}
  </Box>;
}

export function OpportunityFlags({ item }: { item: OpportunitySummary }) {
  const live = item.evaluationProvider === 'Jev' && item.evaluationStatus === 'Ready';
  if (!live && item.evaluationStatus !== 'Failed' && item.evaluationStatus !== 'Stale' && !item.duplicateOfId && !item.isSynthetic) return null;
  return <Stack direction="row" spacing={0.75} useFlexGap sx={{ flexWrap: 'wrap', alignItems: 'center', mt: 0.75 }}>
    {live && <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 700 }}>Live Jev</Typography>}
    <Flag show={item.evaluationStatus === 'Failed'} label="Provider failure" icon={<ErrorOutlineRoundedIcon />} color="error.main" />
    <Flag show={item.evaluationStatus === 'Stale'} label="Reevaluation required" icon={<HistoryToggleOffRoundedIcon />} color="warning.main" />
    <Flag show={!!item.duplicateOfId} label="Possible duplicate" icon={<ContentCopyOutlinedIcon />} color="warning.main" />
    <Flag show={item.isSynthetic} label="Synthetic example" icon={<ScienceOutlinedIcon />} color="info.main" />
  </Stack>;
}

/** The sourcing agent's own rating + confidence, shown as a pair parallel to Jev's OpportunitySignalSummary below. */
export function OpportunitySourcingRating({ item }: { item: Pick<OpportunitySummary, 'opportunityRating' | 'researchConfidence'> }) {
  return <Box sx={{ minWidth: 0 }}>
    <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap', alignItems: 'center', minHeight: 24 }}>
      <Typography variant="caption" sx={{ color: 'text.secondary' }}>Sourcing agent</Typography>
      <Chip size="small" variant="outlined" color={item.opportunityRating ? RATING_TONE[item.opportunityRating] : 'default'} label={item.opportunityRating ?? 'Not rated'} />
    </Stack>
    {item.researchConfidence && <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.75, lineHeight: 1.6 }}>{item.researchConfidence} confidence</Typography>}
  </Box>;
}

export function OpportunitySignalSummary({ item }: { item: OpportunitySummary }) {
  const signal = getOpportunitySignal(item);
  const caption = confidenceCaption(item);
  return <Box sx={{ minWidth: 0 }}>
    <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap', alignItems: 'center', minHeight: 24 }}>
      {signal ? <Chip size="small" color={signal.chipColor} variant={signal.chipVariant} label={item.recommendation} /> : <Typography variant="caption" sx={{ color: 'text.secondary' }}>Not evaluated</Typography>}
      {signal?.icon === 'verify' && <Flag show label={signal.iconTooltip ?? ''} icon={<FactCheckOutlinedIcon />} color="success.main" />}
      {signal?.icon === 'blocked' && <Flag show label={signal.iconTooltip ?? ''} icon={<BlockOutlinedIcon />} color="text.secondary" />}
      {item.opportunityScore != null && <Tooltip title="Score is Jev's weighted composite of factor ratings (0-100), not a probability or dollar figure. Preferences determine the weights. Confidence is separate: how sure Jev is about those ratings, not how good the opportunity is.">
        <Typography component="span" tabIndex={0} aria-label={`Opportunity score: ${item.opportunityScore.toFixed(1)} out of 100`} sx={{ '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 3 }, fontWeight: 800, fontSize: 16, lineHeight: 1.5, color: signal?.scoreColor ?? 'text.secondary', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', cursor: 'help' }}>
          {item.opportunityScore.toFixed(1)}<Box component="span" sx={{ fontWeight: 400, fontSize: 11, color: 'text.secondary', ml: 0.25 }}>/100</Box>
        </Typography>
      </Tooltip>}
    </Stack>
    {caption && <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.75, lineHeight: 1.6, overflowWrap: 'anywhere' }}>{caption}</Typography>}
  </Box>;
}

