import { Box, CardActionArea, Chip, Paper, Stack, Tooltip, Typography } from '@mui/material';
import BlockOutlinedIcon from '@mui/icons-material/BlockOutlined';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined';
import HistoryToggleOffRoundedIcon from '@mui/icons-material/HistoryToggleOffRounded';
import LanguageOutlinedIcon from '@mui/icons-material/LanguageOutlined';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import ScienceOutlinedIcon from '@mui/icons-material/ScienceOutlined';
import WorkOutlineRoundedIcon from '@mui/icons-material/WorkOutlineRounded';
import { Link as RouterLink } from 'react-router-dom';
import { confidenceCaption, getOpportunitySignal, SOURCE_TYPE_LABELS, TONE_HEX, formatProspectType, type OpportunitySummary } from '../../api/opportunities';
import { Flag } from './OpportunitySignals';

function MetaItem({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', color: 'text.secondary', minWidth: 0 }}>
    <Box sx={{ display: 'flex', fontSize: 16, '& svg': { fontSize: 16 } }}>{icon}</Box>
    <Typography variant="caption" noWrap>{children}</Typography>
  </Stack>;
}

export function OpportunityRow({ item, to, rank }: { item: OpportunitySummary; to: string; rank?: number }) {
  const signal = getOpportunitySignal(item);
  const accent = signal ? TONE_HEX[signal.chipColor] : '#cbd5e1';
  const caption = confidenceCaption(item);
  return (
    <Paper variant="outlined"
      sx={{
        borderRadius: 3, overflow: 'hidden', position: 'relative',
        '&::before': { content: '""', position: 'absolute', inset: '0 auto 0 0', width: 4, bgcolor: accent, zIndex: 1 },
        '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 16px 36px -26px rgba(15,23,42,.5)', borderColor: 'rgba(37,99,235,.28)' },
      }}
    >
      <CardActionArea
        component={RouterLink}
        to={to}
        sx={{
          p: { xs: 2, sm: 2.25 }, pl: { xs: 2.5, sm: 2.75 },
          alignItems: 'stretch',
          '&.Mui-focusVisible': { boxShadow: 'inset 0 0 0 3px rgba(37,99,235,.32)' },
        }}
      >
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start' }}>
          {rank !== undefined && <Box sx={{
            width: 30, height: 30, borderRadius: '50%', bgcolor: 'primary.light', color: 'primary.main', flexShrink: 0,
            display: 'grid', placeItems: 'center', fontFamily: '"Plus Jakarta Sans"', fontWeight: 800, fontSize: 13,
          }}>{rank}</Box>}
          <Box sx={{ minWidth: 0, flexGrow: 1 }}>
            <Stack direction="row" spacing={0.75} useFlexGap sx={{ flexWrap: 'wrap', alignItems: 'center', mb: 0.75 }}>
              {signal
                ? <Chip size="small" color={signal.chipColor} variant={signal.chipVariant} label={item.recommendation} />
                : <Typography variant="caption" color="text.secondary">Not evaluated</Typography>}
              {signal?.icon === 'verify' && <Flag show label={signal.iconTooltip ?? ''} icon={<FactCheckOutlinedIcon />} color="success.main" />}
              {signal?.icon === 'blocked' && <Flag show label={signal.iconTooltip ?? ''} icon={<BlockOutlinedIcon />} color="text.secondary" />}
              {item.prospectType && <Chip size="small" variant="outlined" label={formatProspectType(item.prospectType)} />}
              <Flag show={item.evaluationStatus === 'Failed'} label="Provider failure" icon={<ErrorOutlineRoundedIcon />} color="error.main" />
              <Flag show={item.evaluationStatus === 'Stale'} label="Reevaluation required" icon={<HistoryToggleOffRoundedIcon />} color="warning.main" />
              <Flag show={!!item.duplicateOfId} label="Possible duplicate" icon={<ContentCopyOutlinedIcon />} color="warning.main" />
              <Flag show={item.isSynthetic} label="Synthetic example" icon={<ScienceOutlinedIcon />} color="info.main" />
            </Stack>
            <Typography variant="h6" sx={{ fontSize: 16, overflowWrap: 'anywhere', lineHeight: 1.35 }}>{item.title}</Typography>
            {item.opportunityScore != null && <Tooltip title="Score is Jev's weighted composite of factor ratings (0-100), not a probability. Confidence is separate: how sure Jev is about those ratings, not how good the opportunity is.">
              <Stack direction="row" spacing={0.75} sx={{ alignItems: 'baseline', mt: 0.5, cursor: 'help' }}>
                <Typography sx={{ fontWeight: 800, fontSize: 15, lineHeight: 1.2, color: signal?.scoreColor ?? 'text.secondary' }}>
                  {item.opportunityScore.toFixed(1)}<Box component="span" sx={{ fontWeight: 400, fontSize: '0.7em', color: 'text.secondary', ml: 0.25 }}>/100</Box>
                </Typography>
                {caption && <Typography variant="caption" color="text.secondary" noWrap>{caption}</Typography>}
              </Stack>
            </Tooltip>}
            <Typography
              color="text.secondary"
              variant="body2"
              sx={{ mt: 0.75, lineHeight: 1.55, display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
            >
              {item.preview}
            </Typography>
            <Stack direction="row" spacing={1.5} useFlexGap sx={{ mt: 1.25, flexWrap: 'wrap' }}>
              {item.entityType === 'ActiveProject' ? <>
                {item.sourceType && <MetaItem icon={<WorkOutlineRoundedIcon />}>{SOURCE_TYPE_LABELS[item.sourceType]}</MetaItem>}
                {item.budgetStatus && <MetaItem icon={<Box component="span" sx={{ fontWeight: 800 }}>$</Box>}>Budget {item.budgetStatus.toLowerCase()}</MetaItem>}
              </> : <>
                {item.industry && <MetaItem icon={<WorkOutlineRoundedIcon />}>{item.industry}</MetaItem>}
                {item.geography && <MetaItem icon={<LocationOnOutlinedIcon />}>{item.geography}</MetaItem>}
                <MetaItem icon={<LanguageOutlinedIcon />}>{item.websiteDomain ?? 'No website found'}</MetaItem>
              </>}
              {item.evaluationProvider === 'Jev' && item.evaluationStatus === 'Ready' && <Typography variant="caption" color="success.main" sx={{ fontWeight: 700 }}>Live Jev</Typography>}
            </Stack>
            <Typography variant="caption" sx={{ display: 'block', mt: 1.25, color: item.userDecision ? 'primary.main' : 'text.secondary', fontWeight: 700 }}>
              {item.userDecision ? `Decision: ${item.userDecision}` : 'Awaiting your decision'}
            </Typography>
          </Box>
          <ChevronRightIcon sx={{ color: 'text.secondary', opacity: 0.55, flexShrink: 0, mt: 0.5 }} />
        </Stack>
      </CardActionArea>
    </Paper>
  );
}
