import { Box, Link, Paper, Skeleton, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { TONE_HEX, type OpportunityEntityType, type OpportunitySummary } from '../../api/opportunities';
import { OpportunityFlags, OpportunityMetadata, OpportunitySignalSummary } from './OpportunityPresentation';
import { OpportunityRow, OpportunityRowSkeleton } from './OpportunityRow';
import { SURFACE_SUBTLE } from '../../theme';

const LEGEND_ITEMS = [
  { label: 'Prioritize now', color: TONE_HEX.success, outlined: false },
  { label: 'Strong, verify first', color: TONE_HEX.success, outlined: true },
  { label: 'Worth a look', color: TONE_HEX.warning, outlined: false },
  { label: 'Excluded or weak', color: TONE_HEX.default, outlined: false },
];

export function SignalLegend() {
  return <Stack direction="row" spacing={1.75} useFlexGap sx={{ flexWrap: 'wrap', alignItems: 'center' }}>
    {LEGEND_ITEMS.map(item => <Stack key={item.label} direction="row" spacing={0.6} sx={{ alignItems: 'center' }}>
      <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: item.outlined ? 'transparent' : item.color, border: item.outlined ? `2px solid ${item.color}` : 'none' }} />
      <Typography variant="caption" color="text.secondary">{item.label}</Typography>
    </Stack>)}
  </Stack>;
}

const TABLE_SURFACE_SX = {
  borderRadius: 3, overflow: 'hidden', containerType: 'inline-size',
  '& tbody tr:last-of-type td': { borderBottom: 0 },
  '& td, & th': { px: { sm: 2, md: 2.5 }, py: 2.25, verticalAlign: 'top', borderColor: 'divider' },
  '& td:last-child, & th:last-child': { px: 1 },
};

/** Shared widths keep the loading table and results aligned. */
function OpportunityColumns() {
  return <colgroup><col style={{ width: 'calc(55cqw - 99px)' }} /><col style={{ width: 'calc(45cqw - 81px)' }} /><col style={{ width: 140 }} /><col style={{ width: 40 }} /></colgroup>;
}

export function OpportunityTableHead({ entityType }: { entityType: OpportunityEntityType }) {
  return <TableHead sx={{ bgcolor: SURFACE_SUBTLE, '& th': { fontFamily: '"Plus Jakarta Sans", "Segoe UI", system-ui, sans-serif', fontWeight: 700, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: 'text.secondary' } }}>
    <TableRow><TableCell>{entityType === 'ActiveProject' ? 'Project' : 'Business'}</TableCell><TableCell>Signal</TableCell><TableCell align="right">Status</TableCell><TableCell aria-hidden /></TableRow>
  </TableHead>;
}

export function OpportunityTable({ items, entityType }: { items: OpportunitySummary[]; entityType: OpportunityEntityType }) {
  const navigate = useNavigate();
  return <>
    <Stack spacing={1.5} sx={{ display: { xs: 'flex', sm: 'none' } }}>{items.map(item => <OpportunityRow key={item.id} item={item} to={`/admin/opportunities/${item.id}`} compact />)}</Stack>
    <TableContainer component={Paper} variant="outlined" sx={{ ...TABLE_SURFACE_SX, display: { xs: 'none', sm: 'block' } }}>
      <Table sx={{ tableLayout: 'fixed' }} aria-label={entityType === 'ActiveProject' ? 'Active projects' : 'Business prospects'}>
        <OpportunityColumns /><OpportunityTableHead entityType={entityType} />
        <TableBody>{items.map(item => {
          const to = `/admin/opportunities/${item.id}`;
          return <TableRow key={item.id} onClick={event => { if (!event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) navigate(to); }} sx={{ cursor: 'pointer', transition: 'background-color 0.18s ease', '&:hover, &:focus-within': { bgcolor: 'primary.light' }, '&:hover .opportunity-row-chevron': { opacity: 1, transform: 'translateX(2px)' } }}>
            <TableCell>
              <Link component={RouterLink} to={to} underline="none" onClick={event => event.stopPropagation()} sx={{ display: 'inline-block', fontWeight: 700, fontSize: 14, lineHeight: 1.7, color: 'text.primary', overflowWrap: 'anywhere', '&:hover': { color: 'primary.main' }, '&:focus-visible': { outline: 'none', borderRadius: 1, boxShadow: '0 0 0 3px rgba(37,99,235,.35)' } }}>{item.title}</Link>
              <Box sx={{ mt: 0.5 }}><OpportunityMetadata item={item} /></Box><OpportunityFlags item={item} />
            </TableCell>
            <TableCell><OpportunitySignalSummary item={item} /></TableCell>
            <TableCell align="right"><Typography variant="body2" sx={{ lineHeight: '24px', fontWeight: 600, color: item.userDecision ? 'primary.main' : 'text.secondary' }}>{item.userDecision ?? 'Awaiting'}</Typography></TableCell>
            <TableCell><ChevronRightIcon className="opportunity-row-chevron" sx={{ display: 'block', fontSize: 20, mt: 0.25, color: 'text.secondary', opacity: 0.4, transition: 'opacity 0.18s ease, transform 0.18s ease' }} /></TableCell>
          </TableRow>;
        })}</TableBody>
      </Table>
    </TableContainer>
  </>;
}

export function OpportunityTableSkeleton({ entityType }: { entityType: OpportunityEntityType }) {
  return <Box role="status" aria-label="Loading opportunities">
    <Stack spacing={1.5} sx={{ display: { xs: 'flex', sm: 'none' } }}>{[0, 1, 2].map(row => <OpportunityRowSkeleton key={row} compact />)}</Stack>
    <TableContainer component={Paper} variant="outlined" sx={{ ...TABLE_SURFACE_SX, display: { xs: 'none', sm: 'block' } }}>
      <Table sx={{ tableLayout: 'fixed' }}><OpportunityColumns /><OpportunityTableHead entityType={entityType} /><TableBody>{[0, 1, 2].map(row => <TableRow key={row}>
        <TableCell><Skeleton width="70%" height={24} /><Skeleton width="90%" sx={{ mt: 0.5 }} /><Skeleton width="55%" /></TableCell>
        <TableCell><Stack direction="row" spacing={1}><Skeleton width={60} height={24} /><Skeleton width={45} height={24} /></Stack><Skeleton width="85%" sx={{ mt: 0.75 }} /></TableCell>
        <TableCell><Skeleton width={70} height={24} sx={{ ml: 'auto' }} /></TableCell><TableCell />
      </TableRow>)}</TableBody></Table>
    </TableContainer>
  </Box>;
}
