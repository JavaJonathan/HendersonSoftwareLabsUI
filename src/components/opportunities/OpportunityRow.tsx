import { Box, CardActionArea, Chip, Paper, Stack, Typography } from '@mui/material';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import LanguageOutlinedIcon from '@mui/icons-material/LanguageOutlined';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import WorkOutlineRoundedIcon from '@mui/icons-material/WorkOutlineRounded';
import { Link as RouterLink } from 'react-router-dom';
import { RECOMMENDATION_META, SOURCE_TYPE_LABELS, type OpportunitySummary } from '../../api/opportunities';

const accentByRecommendation: Record<string, string> = {
  Pursue: '#16a34a', Prioritize: '#16a34a', Investigate: '#d97706', Watch: '#d97706', Pass: '#94a3b8', Skip: '#94a3b8',
};

function MetaItem({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', color: 'text.secondary', minWidth: 0 }}>
    <Box sx={{ display: 'flex', fontSize: 16, '& svg': { fontSize: 16 } }}>{icon}</Box>
    <Typography variant="caption" noWrap>{children}</Typography>
  </Stack>;
}

export function OpportunityRow({ item, to, rank, compact = false }: {
  item: OpportunitySummary;
  to: string;
  rank?: number;
  compact?: boolean;
}) {
  const accent = item.recommendation ? accentByRecommendation[item.recommendation] : '#cbd5e1';
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
          p: compact ? { xs: 2, sm: 2.25 } : { xs: 2.25, md: 2.75 }, pl: compact ? { xs: 2.5, sm: 2.75 } : { xs: 2.75, md: 3.25 },
          alignItems: 'stretch',
          '&.Mui-focusVisible': { boxShadow: 'inset 0 0 0 3px rgba(37,99,235,.32)' },
        }}
      >
        <Stack direction="row" spacing={compact ? 1.5 : 2} sx={{ alignItems: 'flex-start' }}>
          {rank !== undefined && <Box sx={{
            width: 30, height: 30, borderRadius: '50%', bgcolor: 'primary.light', color: 'primary.main', flexShrink: 0,
            display: 'grid', placeItems: 'center', fontFamily: '"Plus Jakarta Sans"', fontWeight: 800, fontSize: 13,
          }}>{rank}</Box>}
          <Box sx={{ minWidth: 0, flexGrow: 1 }}>
            <Stack direction="row" spacing={0.75} useFlexGap sx={{ flexWrap: 'wrap', mb: 1 }}>
              {item.recommendation && <Chip size="small" color={RECOMMENDATION_META[item.recommendation].chipColor} label={item.recommendation} />}
              {item.priorityBand && <Chip size="small" variant="outlined" label={`${item.priorityBand} priority`} />}
              {item.evaluationStatus === 'Failed' && <Chip size="small" color="error" label="Provider failure" />}
              {item.evaluationStatus === 'Stale' && <Chip size="small" color="warning" label="Reevaluation required" />}
              {item.duplicateOfId && <Chip size="small" color="warning" variant="outlined" label="Possible duplicate" />}
              {item.isSynthetic && <Chip size="small" color="info" variant="outlined" label="Synthetic" />}
            </Stack>
            <Typography variant="h6" sx={{ fontSize: compact ? 16 : 18, overflowWrap: 'anywhere', lineHeight: 1.35 }}>{item.title}</Typography>
            <Typography
              color="text.secondary"
              variant={compact ? 'body2' : 'body1'}
              sx={{ mt: 0.5, lineHeight: 1.55, display: '-webkit-box', WebkitLineClamp: compact ? 1 : 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
            >
              {item.summary ?? item.preview}
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
