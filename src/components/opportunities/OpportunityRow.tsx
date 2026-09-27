import { Box, CardActionArea, Chip, Paper, Skeleton, Stack, Typography } from '@mui/material';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { Link as RouterLink } from 'react-router-dom';
import { getOpportunitySignal, TONE_HEX, formatProspectType, type OpportunitySummary } from '../../api/opportunities';
import { OpportunityFlags, OpportunityMetadata, OpportunitySignalSummary } from './OpportunityPresentation';

export function OpportunityRow({ item, to, rank, compact = false }: { item: OpportunitySummary; to: string; rank?: number; compact?: boolean }) {
  const signal = getOpportunitySignal(item);
  const accent = signal ? TONE_HEX[signal.chipColor] : '#cbd5e1';
  return <Paper variant="outlined" sx={{
    borderRadius: 3, overflow: 'hidden', position: 'relative',
    ...(!compact && { '&::before': { content: '""', position: 'absolute', inset: '0 auto 0 0', width: 4, bgcolor: accent, zIndex: 1, pointerEvents: 'none' } }),
    '&:hover': { bgcolor: 'primary.light', borderColor: 'rgba(37,99,235,.28)' },
  }}>
    <CardActionArea component={RouterLink} to={to} sx={{ p: compact ? 2 : { xs: 2, sm: 2.5 }, alignItems: 'stretch', '&.Mui-focusVisible': { boxShadow: 'inset 0 0 0 3px rgba(37,99,235,.32)' } }}>
      <Stack spacing={1.5}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start' }}>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start' }}>
              {rank !== undefined && <Box sx={{ width: 26, height: 26, borderRadius: '50%', bgcolor: 'primary.light', color: 'primary.main', flexShrink: 0, display: 'grid', placeItems: 'center', fontFamily: '"Plus Jakarta Sans"', fontWeight: 800, fontSize: 12 }}>{rank}</Box>}
              <Typography variant="h6" sx={{ fontSize: compact ? 14 : 16, lineHeight: 1.5, overflowWrap: 'anywhere', minWidth: 0 }}>{item.title}</Typography>
            </Stack>
            <Box sx={{ mt: 0.5 }}><OpportunityMetadata item={item} /></Box>
            <OpportunityFlags item={item} />
          </Box>
          <ChevronRightIcon sx={{ color: 'text.secondary', opacity: 0.5, flexShrink: 0, fontSize: 20, mt: 0.25 }} />
        </Stack>
        <Box>
          <OpportunitySignalSummary item={item} />
          {!compact && item.prospectType && <Chip size="small" variant="outlined" label={formatProspectType(item.prospectType)} sx={{ mt: 1 }} />}
        </Box>
        {!compact && item.preview && <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.6, overflowWrap: 'anywhere', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.preview}</Typography>}
        <Typography variant="caption" sx={{ pt: 1.25, borderTop: 1, borderColor: 'divider', color: item.userDecision ? 'primary.main' : 'text.secondary', fontWeight: 700 }}>{item.userDecision ? `Decision: ${item.userDecision}` : 'Awaiting your decision'}</Typography>
      </Stack>
    </CardActionArea>
  </Paper>;
}

export function OpportunityRowSkeleton({ compact = false }: { compact?: boolean }) {
  return <Paper variant="outlined" sx={{ p: compact ? 2 : { xs: 2, sm: 2.5 }, borderRadius: 3 }}>
    <Skeleton width="70%" height={26} /><Skeleton width="90%" /><Skeleton width="55%" />
    <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}><Skeleton width={75} height={28} /><Skeleton width={55} height={28} /></Stack>
    <Skeleton width="85%" />{!compact && <Skeleton width="90%" sx={{ mt: 1.5 }} />}
    <Box sx={{ mt: 1.5, pt: 1.25, borderTop: 1, borderColor: 'divider' }}><Skeleton width={135} /></Box>
  </Paper>;
}
