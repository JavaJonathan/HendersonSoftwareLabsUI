import { Box, Chip, Paper, Stack, Typography } from '@mui/material';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { RECOMMENDATION_META, SOURCE_TYPE_LABELS, type OpportunitySummary } from '../../api/opportunities';

export function OpportunityRow({ item, onClick }: { item: OpportunitySummary; onClick: () => void }) {
  return (
    <Paper
      variant="outlined"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={event => {
        if (event.key === 'Enter') onClick();
        else if (event.key === ' ') { event.preventDefault(); onClick(); }
      }}
      sx={{
        p: { xs: 2, md: 2.5 }, borderRadius: 3, cursor: 'pointer', transition: 'transform .16s ease, box-shadow .16s ease',
        '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 12px 30px -22px rgba(15,23,42,.45)' },
        '&:focus-visible': { outline: 'none', boxShadow: '0 0 0 3px rgba(37, 99, 235, 0.35)' },
      }}
    >
      <Stack direction="row" spacing={2} sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box sx={{ minWidth: 0 }}>
          <Stack direction="row" spacing={0.75} useFlexGap sx={{ flexWrap: 'wrap', mb: 1 }}>
            {item.recommendation && <Chip size="small" color={RECOMMENDATION_META[item.recommendation].chipColor} label={item.recommendation} />}
            {item.priorityBand && <Chip size="small" variant="outlined" label={`${item.priorityBand} priority`} />}
            {item.entityType === 'ActiveProject' ? <>
              {item.sourceType && <Chip size="small" variant="outlined" label={SOURCE_TYPE_LABELS[item.sourceType]} />}
              {item.budgetStatus && <Chip size="small" variant="outlined" label={`Budget: ${item.budgetStatus.toLowerCase()}`} />}
            </> : <>
              {item.industry && <Chip size="small" variant="outlined" label={item.industry} />}
              {item.geography && <Chip size="small" variant="outlined" label={item.geography} />}
              {item.websiteDomain
                ? <Chip size="small" variant="outlined" label={item.websiteDomain} />
                : <Chip size="small" variant="outlined" label="No website found" />}
            </>}
            {item.isSynthetic && <Chip size="small" color="info" variant="outlined" label="Synthetic" />}
            {item.evaluationProvider === 'Jev' && item.evaluationStatus === 'Ready' && <Chip size="small" color="success" variant="outlined" label="Live Jev" />}
            {item.evaluationStatus === 'Failed' && <Chip size="small" color="error" label="Provider failure" />}
            {item.evaluationStatus === 'Stale' && <Chip size="small" color="warning" label="Reevaluation required" />}
            {item.duplicateOfId && <Chip size="small" color="warning" variant="outlined" label={`Possible duplicate of #${item.duplicateOfId}`} />}
          </Stack>
          <Typography variant="h6" sx={{ fontSize: 18, overflowWrap: 'anywhere' }}>{item.title}</Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>{item.summary ?? item.preview}</Typography>
          <Typography variant="body2" sx={{ mt: 1.25, color: item.userDecision ? 'primary.main' : 'text.secondary', fontWeight: 600 }}>
            Your decision: {item.userDecision ?? 'Unreviewed'}
          </Typography>
        </Box>
        <ChevronRightIcon sx={{ color: 'text.secondary', flexShrink: 0, mt: 0.5 }} />
      </Stack>
    </Paper>
  );
}
