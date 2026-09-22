import { useEffect, useState } from 'react';
import { Alert, Box, Button, Container, Paper, Skeleton, Stack, Typography } from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { AuthedAppBar } from '../components/layout/AuthedAppBar';
import { OpportunityLaneTabs } from '../components/opportunities/OpportunityLaneTabs';
import { OpportunityRow } from '../components/opportunities/OpportunityRow';
import { RadarPageHeader } from '../components/opportunities/RadarPageHeader';
import { SURFACE_SUBTLE } from '../theme';
import { getOpportunityDigest, type OpportunityDigest } from '../api/opportunities';

export function OpportunityDigestPage() {
  const [digest, setDigest] = useState<OpportunityDigest | null>(null);
  const [error, setError] = useState('');
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    let active = true;
    getOpportunityDigest(false).then(data => { if (active) setDigest(data); }).catch(() => { if (active) setError('Unable to load the digest.'); });
    return () => { active = false; };
  }, [refresh]);

  return <Box sx={{ minHeight: '100vh', bgcolor: SURFACE_SUBTLE }}>
    <AuthedAppBar subtitle="Opportunity Radar" />
    <Container component="main" maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
      <RadarPageHeader eyebrow="Today's decision brief" description="The strongest unreviewed records from each lane, ranked for a focused review session. Quality thresholds are never lowered to fill a quota." />
      <OpportunityLaneTabs />
      {error && <Alert severity="error" action={<Button onClick={() => setRefresh(value => value + 1)}>Retry</Button>} sx={{ mb: 2 }}>{error}</Alert>}
      {!digest && !error && <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2.5 }}>
        {[0, 1].map(column => <Box key={column}><Skeleton width={180} height={34} sx={{ mb: 1 }} /><Stack spacing={1.5}>{[0, 1].map(row => <Paper key={row} variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}><Skeleton width={120} /><Skeleton height={28} width="70%" /><Skeleton /><Skeleton width="80%" /></Paper>)}</Stack></Box>)}
      </Box>}
      {digest && <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2.5 }}>
        <DigestColumn title="Active projects" description="Public demand worth a closer look." items={digest.activeProjects} requested={digest.activeProjectRequested} returned={digest.activeProjectReturned} />
        <DigestColumn title="Business prospects" description="Businesses with a promising entry point." items={digest.businessProspects} requested={digest.businessProspectRequested} returned={digest.businessProspectReturned} />
      </Box>}
    </Container>
  </Box>;
}

function DigestColumn({ title, description, items, requested, returned }: {
  title: string; description: string; items: OpportunityDigest['activeProjects']; requested: number; returned: number;
}) {
  return <Box>
    <Paper variant="outlined" sx={{ p: 2, mb: 1.5, borderRadius: 3, bgcolor: 'rgba(255,255,255,.7)' }}>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: 2 }}>
        <Box><Typography variant="h6">{title}</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>{description}</Typography></Box>
        <Box sx={{ px: 1.25, py: 0.5, borderRadius: 999, bgcolor: returned < requested ? '#fff7ed' : 'primary.light', flexShrink: 0 }}><Typography variant="caption" color={returned < requested ? 'warning.main' : 'primary.main'} sx={{ fontWeight: 800 }}>{returned} / {requested}</Typography></Box>
      </Stack>
    </Paper>
    {items.length ? <Stack spacing={1.5}>{items.map((item, index) => <OpportunityRow key={item.id} item={item} to={`/admin/opportunities/${item.id}`} rank={index + 1} compact />)}</Stack>
      : <Paper variant="outlined" sx={{ p: { xs: 3, md: 4 }, textAlign: 'center', borderRadius: 3, borderStyle: 'dashed' }}>
        <AutoAwesomeIcon color="disabled" /><Typography color="text.secondary" sx={{ mt: 0.75 }}>Nothing qualifies today.</Typography>
      </Paper>}
  </Box>;
}
