import { useEffect, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { Alert, Box, Container, Link, Paper, Stack, Typography } from '@mui/material';
import { AuthedAppBar } from '../components/layout/AuthedAppBar';
import { OpportunityLaneTabs } from '../components/opportunities/OpportunityLaneTabs';
import { OpportunityRow } from '../components/opportunities/OpportunityRow';
import { SURFACE_SUBTLE } from '../theme';
import { getOpportunityDigest, type OpportunityDigest } from '../api/opportunities';

export function OpportunityDigestPage() {
  const navigate = useNavigate();
  const [digest, setDigest] = useState<OpportunityDigest | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    getOpportunityDigest(false).then(data => { if (active) setDigest(data); }).catch(() => { if (active) setError('Unable to load the digest.'); });
    return () => { active = false; };
  }, []);

  return <Box sx={{ minHeight: '100vh', bgcolor: SURFACE_SUBTLE }}>
    <AuthedAppBar subtitle="Opportunity Radar" />
    <Container component="main" maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
      <Link component={RouterLink} to="/admin">Back to admin</Link>
      <Box sx={{ mt: 2, mb: 2 }}>
        <Typography component="h1" variant="h4" sx={{ fontSize: { xs: 28, md: 36 } }}>Opportunity Radar</Typography>
        <Typography color="text.secondary" sx={{ mt: 0.75, maxWidth: 680 }}>Today's best-ranked records from each lane. Quality thresholds are never lowered to fill a quota.</Typography>
      </Box>
      <OpportunityLaneTabs />
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {digest && <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2.5 }}>
        <DigestColumn title="Active projects" items={digest.activeProjects} requested={digest.activeProjectRequested} returned={digest.activeProjectReturned} onOpen={id => navigate(`/admin/opportunities/${id}`)} />
        <DigestColumn title="Business prospects" items={digest.businessProspects} requested={digest.businessProspectRequested} returned={digest.businessProspectReturned} onOpen={id => navigate(`/admin/opportunities/${id}`)} />
      </Box>}
    </Container>
  </Box>;
}

function DigestColumn({ title, items, requested, returned, onOpen }: {
  title: string; items: OpportunityDigest['activeProjects']; requested: number; returned: number; onOpen: (id: number) => void;
}) {
  return <Box>
    <Stack direction="row" spacing={1} sx={{ alignItems: 'baseline', mb: 1.5 }}>
      <Typography variant="h6">{title}</Typography>
      <Typography variant="body2" color={returned < requested ? 'warning.main' : 'text.secondary'}>{returned} of {requested} requested</Typography>
    </Stack>
    {items.length ? <Stack spacing={1.5}>{items.map(item => <OpportunityRow key={item.id} item={item} onClick={() => onOpen(item.id)} />)}</Stack>
      : <Paper variant="outlined" sx={{ p: { xs: 3, md: 4 }, textAlign: 'center', borderRadius: 3, borderStyle: 'dashed' }}>
        <Typography color="text.secondary">Nothing qualifies today.</Typography>
      </Paper>}
  </Box>;
}
