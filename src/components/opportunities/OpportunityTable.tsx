import {
  Box, Chip, Link, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tooltip, Typography,
} from '@mui/material';
import BlockOutlinedIcon from '@mui/icons-material/BlockOutlined';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined';
import HistoryToggleOffRoundedIcon from '@mui/icons-material/HistoryToggleOffRounded';
import ScienceOutlinedIcon from '@mui/icons-material/ScienceOutlined';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  confidenceCaption, getOpportunitySignal, SOURCE_TYPE_LABELS, TONE_HEX, type OpportunityEntityType, type OpportunitySummary,
} from '../../api/opportunities';
import { Flag } from './OpportunitySignals';
import { SURFACE_SUBTLE } from '../../theme';

const HIDE_BELOW_SM = { display: { xs: 'none', sm: 'table-cell' } };

const LEGEND_ITEMS: { label: string; color: string; outlined: boolean }[] = [
  { label: 'Prioritize now', color: TONE_HEX.success, outlined: false },
  { label: 'Strong, verify first', color: TONE_HEX.success, outlined: true },
  { label: 'Worth a look', color: TONE_HEX.warning, outlined: false },
  { label: 'Excluded or weak', color: TONE_HEX.default, outlined: false },
];

/** Explains the Signal column's color grammar once, near the results heading, rather than only on hover. */
export function SignalLegend() {
  return (
    <Stack direction="row" spacing={1.75} useFlexGap sx={{ flexWrap: 'wrap', alignItems: 'center' }}>
      {LEGEND_ITEMS.map(item => (
        <Stack key={item.label} direction="row" spacing={0.6} sx={{ alignItems: 'center' }}>
          <Box sx={{
            width: 10, height: 10, borderRadius: '50%',
            bgcolor: item.outlined ? 'transparent' : item.color,
            border: item.outlined ? `2px solid ${item.color}` : 'none',
          }} />
          <Typography variant="caption" color="text.secondary">{item.label}</Typography>
        </Stack>
      ))}
    </Stack>
  );
}

function metaLine(item: OpportunitySummary) {
  const parts = item.entityType === 'ActiveProject'
    ? [item.sourceType && SOURCE_TYPE_LABELS[item.sourceType], item.budgetStatus && `Budget ${item.budgetStatus.toLowerCase()}`]
    : [item.industry, item.geography, item.websiteDomain ?? 'No website found'];
  return parts.filter(Boolean).join(' · ');
}

/** Rendered by both the skeleton and the loaded table so the two have identical geometry. */
export function OpportunityTableHead({ entityType }: { entityType: OpportunityEntityType }) {
  return (
    <TableHead sx={{
      bgcolor: SURFACE_SUBTLE,
      '& th': { fontFamily: '"Plus Jakarta Sans", "Segoe UI", system-ui, sans-serif', fontWeight: 700, fontSize: 12, letterSpacing: 1, textTransform: 'uppercase', color: 'text.secondary' },
    }}>
      <TableRow>
        <TableCell>{entityType === 'ActiveProject' ? 'Project' : 'Business'}</TableCell>
        <TableCell>Signal</TableCell>
        <TableCell align="right" sx={HIDE_BELOW_SM}>Status</TableCell>
        <TableCell aria-hidden sx={{ width: { xs: 36, sm: 56 } }} />
      </TableRow>
    </TableHead>
  );
}

export function OpportunityTable({ items, entityType }: { items: OpportunitySummary[]; entityType: OpportunityEntityType }) {
  const navigate = useNavigate();
  return (
    <TableContainer component={Paper} variant="outlined" sx={{
      borderRadius: 3,
      '& tbody tr:last-of-type td': { borderBottom: 0 },
      '& td, & th': { px: { xs: 1.5, sm: 2 } },
    }}>
      <Table aria-label={entityType === 'ActiveProject' ? 'Active projects' : 'Business prospects'}>
        <OpportunityTableHead entityType={entityType} />
        <TableBody>
          {items.map(item => {
            const to = `/admin/opportunities/${item.id}`;
            const meta = metaLine(item);
            const signal = getOpportunitySignal(item);
            const liveJev = item.evaluationProvider === 'Jev' && item.evaluationStatus === 'Ready';
            const caption = confidenceCaption(item);
            return (
              <TableRow
                key={item.id}
                onClick={() => navigate(to)}
                sx={{
                  cursor: 'pointer',
                  transition: 'background-color 0.18s ease',
                  '&:hover': { bgcolor: 'primary.light' },
                  '&:hover .opportunity-row-chevron': { opacity: 1, transform: 'translateX(2px)' },
                }}
              >
                <TableCell sx={{ maxWidth: 0 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
                    <Link
                      component={RouterLink}
                      to={to}
                      underline="none"
                      onClick={event => event.stopPropagation()}
                      sx={{
                        fontWeight: 600, color: 'text.primary', overflowWrap: 'anywhere',
                        '&:hover': { color: 'primary.main' },
                        '&:focus-visible': { outline: 'none', borderRadius: 1, boxShadow: '0 0 0 3px rgba(37,99,235,.35)' },
                      }}
                    >
                      {item.title}
                    </Link>
                    <Flag show={item.evaluationStatus === 'Failed'} label="Provider failure" icon={<ErrorOutlineRoundedIcon />} color="error.main" />
                    <Flag show={item.evaluationStatus === 'Stale'} label="Reevaluation required" icon={<HistoryToggleOffRoundedIcon />} color="warning.main" />
                    <Flag show={!!item.duplicateOfId} label="Possible duplicate" icon={<ContentCopyOutlinedIcon />} color="warning.main" />
                    <Flag show={item.isSynthetic} label="Synthetic example" icon={<ScienceOutlinedIcon />} color="info.main" />
                    {liveJev && <Typography variant="caption" color="success.main" sx={{ fontWeight: 700 }}>Live Jev</Typography>}
                  </Box>
                  {meta && <Typography variant="body2" sx={{ mt: 0.25, color: 'text.secondary', fontSize: 12.5 }}>{meta}</Typography>}
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {signal
                      ? <Chip size="small" color={signal.chipColor} variant={signal.chipVariant} label={item.recommendation} />
                      : <Typography variant="caption" color="text.secondary">Not evaluated</Typography>}
                    {signal?.icon === 'verify' && <Flag show label={signal.iconTooltip ?? ''} icon={<FactCheckOutlinedIcon />} color="success.main" />}
                    {signal?.icon === 'blocked' && <Flag show label={signal.iconTooltip ?? ''} icon={<BlockOutlinedIcon />} color="text.secondary" />}
                    {item.opportunityScore != null && <Tooltip title="Score is Jev's weighted composite of the factor ratings below (0-100), not a probability or a dollar figure - the weights are whatever you've set in Preferences. Confidence is a separate axis: how sure Jev is about those ratings, not how good the opportunity is.">
                      <Box sx={{ fontVariantNumeric: 'tabular-nums', cursor: 'help' }}>
                        <Typography component="div" sx={{ fontWeight: 700, lineHeight: 1.2, color: signal?.scoreColor ?? 'text.secondary' }}>
                          {item.opportunityScore.toFixed(1)}
                          <Box component="span" sx={{ fontWeight: 400, fontSize: '0.7em', color: 'text.secondary', ml: 0.25 }}>/100</Box>
                        </Typography>
                        {caption && <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.3 }}>{caption}</Typography>}
                      </Box>
                    </Tooltip>}
                  </Box>
                </TableCell>
                <TableCell align="right" sx={{ ...HIDE_BELOW_SM, fontWeight: 700, color: item.userDecision ? 'primary.main' : 'text.secondary' }}>
                  {item.userDecision ?? 'Awaiting'}
                </TableCell>
                <TableCell align="right" sx={{ width: { xs: 36, sm: 56 }, pl: 0 }}>
                  <ChevronRightIcon className="opportunity-row-chevron" sx={{ display: 'block', color: 'text.secondary', opacity: 0.4, transition: 'opacity 0.18s ease, transform 0.18s ease' }} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
