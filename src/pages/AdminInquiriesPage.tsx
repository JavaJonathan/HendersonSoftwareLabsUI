import { useEffect, useRef, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Alert, Box, Button, Chip, Container, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, InputLabel, Link, MenuItem, Pagination, Paper, Select, Stack, Typography } from '@mui/material';
import { AuthedAppBar } from '../components/layout/AuthedAppBar';
import { getInquiries, getInquiry, updateInquiryStatus, type Inquiry, type InquiryList, type InquiryStatus } from '../api/inquiries';

export function AdminInquiriesPage() {
  const [filter, setFilter] = useState('New');
  const [page, setPage] = useState(1);
  const [refresh, setRefresh] = useState(0);
  const [list, setList] = useState<InquiryList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<Inquiry | null>(null);
  const [open, setOpen] = useState(false);
  const [detailError, setDetailError] = useState('');
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState('');
  const detailRequest = useRef(0);
  useEffect(() => {
    let current = true;
    setLoading(true); setError('');
    getInquiries(filter, page).then(data => {
      if (!current) return;
      if (page > 1 && data.items.length === 0) { setPage(Math.max(1, Math.ceil(data.total / 25))); return; }
      setList(data);
    }).catch(() => { if (current) setError('Unable to load inquiries. Please retry.'); })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [filter, page, refresh]);

  async function view(id: number) {
    const request = ++detailRequest.current;
    setOpen(true); setSelected(null); setDetailError(''); setCopied('');
    try { const item = await getInquiry(id); if (request === detailRequest.current) setSelected(item); }
    catch { if (request === detailRequest.current) setDetailError('Unable to load this inquiry. Close and try again.'); }
  }
  function close() { if (!busy) { detailRequest.current++; setOpen(false); } }
  async function changeStatus(status: InquiryStatus) {
    if (!selected || busy) return;
    setBusy(true); setDetailError('');
    try { await updateInquiryStatus(selected.id, status); setSelected({ ...selected, status }); setRefresh(x => x + 1); }
    catch { setDetailError('Unable to update status. Please try again.'); }
    finally { setBusy(false); }
  }

  return <><AuthedAppBar /><Container component="main" maxWidth="md" sx={{ py: 5 }}>
    <Link component={RouterLink} to="/admin">Back to clients</Link>
    <Typography component="h1" variant="h4" sx={{ mt: 2, mb: 3 }}>Inquiries{list ? ` (${list.newCount} new)` : ''}</Typography>
    <Stack direction="row" spacing={2} sx={{ mb: 3 }}><FormControl size="small" sx={{ minWidth: 160 }}><InputLabel id="inquiry-filter">Status</InputLabel><Select labelId="inquiry-filter" label="Status" value={filter} onChange={e => { setFilter(e.target.value); setPage(1); }}>{['New', 'Contacted', 'Archived', 'All'].map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}</Select></FormControl><Button onClick={() => setRefresh(x => x + 1)} disabled={loading}>Refresh</Button></Stack>
    {error && <Alert severity="error" action={<Button onClick={() => setRefresh(x => x + 1)}>Retry</Button>}>{error}</Alert>}
    {loading ? <Typography role="status">Loading inquiries…</Typography> : !error && <>
      {!list?.items.length && <Typography color="text.secondary">No inquiries in this view.</Typography>}
      <Stack spacing={2}>{list?.items.map(item => <Paper variant="outlined" key={item.id} sx={{ p: 2.5 }}>
        <Stack direction="row" sx={{ justifyContent: 'space-between', gap: 1, flexWrap: 'wrap' }}><Button onClick={() => view(item.id)} sx={{ fontWeight: 700, textAlign: 'left', overflowWrap: 'anywhere' }}>{item.name}</Button><Chip size="small" label={item.status} /></Stack>
        <Typography sx={{ overflowWrap: 'anywhere' }}>{item.email}</Typography><Typography variant="body2" color="text.secondary">{new Date(item.createdAt).toLocaleString()}</Typography>
        <Typography sx={{ mt: 1, overflowWrap: 'anywhere' }}>{item.preview}</Typography>
      </Paper>)}</Stack>
      {!!list && list.total > 25 && <Pagination sx={{ mt: 3 }} count={Math.ceil(list.total / 25)} page={page} onChange={(_, value) => setPage(value)} />}
    </>}
    <Dialog open={open} onClose={close} fullWidth maxWidth="sm" aria-labelledby="inquiry-title">
      <DialogTitle id="inquiry-title" sx={{ overflowWrap: 'anywhere' }}>{selected?.name ?? 'Inquiry'}</DialogTitle><DialogContent>
        {detailError && <Alert severity="error" sx={{ mb: 2 }}>{detailError}</Alert>}
        {!selected && !detailError && <Typography role="status">Loading inquiry…</Typography>}
        {selected && <Stack spacing={2}>
          <Typography sx={{ overflowWrap: 'anywhere' }}>{selected.email}</Typography><Typography variant="body2" color="text.secondary">Received {new Date(selected.createdAt).toLocaleString()}</Typography>
          <Box sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{selected.message}</Box>
          <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}><Button href={`mailto:${encodeURIComponent(selected.email)}?subject=Your%20Henderson%20Software%20Labs%20inquiry`}>Reply by email</Button><Button onClick={async () => { try { await navigator.clipboard.writeText(selected.email); setCopied('Email copied.'); } catch { setCopied('Unable to copy. Select and copy the address above.'); } }}>Copy email</Button></Stack>
          <Typography role="status" variant="body2">{copied}</Typography>
          <Typography variant="body2">Mark Contacted after you have replied. Opening an email draft does not change the status.</Typography>
          <FormControl fullWidth><InputLabel id="inquiry-status-label">Status</InputLabel><Select labelId="inquiry-status-label" label="Status" value={selected.status} disabled={busy} onChange={e => void changeStatus(e.target.value as InquiryStatus)}>{(['New', 'Contacted', 'Archived'] as const).map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}</Select></FormControl>
          {busy && <Typography role="status">Saving status…</Typography>}
        </Stack>}
      </DialogContent><DialogActions><Button onClick={close} disabled={busy}>Close</Button></DialogActions>
    </Dialog>
  </Container></>;
}
