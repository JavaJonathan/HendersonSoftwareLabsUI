import { useEffect, useRef, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Alert, Box, Button, Chip, CircularProgress, Container, Dialog, DialogActions, DialogContent, DialogTitle, Divider, FormControl, FormHelperText, IconButton, InputLabel, Link, MenuItem, Pagination, Paper, Select, Stack, Typography, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import EmailIcon from '@mui/icons-material/Email';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { AuthedAppBar } from '../components/layout/AuthedAppBar';
import { SURFACE_SUBTLE } from '../theme';
import { getInquiries, getInquiry, updateInquiryStatus, type Inquiry, type InquiryList, type InquiryStatus } from '../api/inquiries';

const TITLE_SX = {
  fontFamily: '"Plus Jakarta Sans", "Segoe UI", system-ui, sans-serif',
  fontWeight: 800,
  fontSize: 20,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 2,
};

/** Chip color and menu-dot color share one source so the list, the dialog chip and the status
 * picker all agree on what New/Contacted/Archived look like. */
const STATUS_META: Record<InquiryStatus, { chipColor: 'primary' | 'success' | 'default'; dot: string }> = {
  New: { chipColor: 'primary', dot: '#2563eb' },
  Contacted: { chipColor: 'success', dot: '#16a34a' },
  Archived: { chipColor: 'default', dot: '#94a3b8' },
};

const formatDateTime = (iso: string) => new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });

export function AdminInquiriesPage() {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
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
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');
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
    setOpen(true); setSelected(null); setDetailError(''); setCopyState('idle');
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
  async function copyEmail() {
    if (!selected) return;
    try { await navigator.clipboard.writeText(selected.email); setCopyState('copied'); }
    catch { setCopyState('failed'); }
  }

  return <Box sx={{ minHeight: '100vh', bgcolor: SURFACE_SUBTLE }}><AuthedAppBar /><Container component="main" maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
    <Link component={RouterLink} to="/admin">Back to clients</Link>
    <Stack direction="row" spacing={1.5} useFlexGap sx={{ mt: 2, mb: 3, alignItems: 'center', flexWrap: 'wrap' }}>
      <Typography component="h1" variant="h4" sx={{ fontSize: { xs: 26, md: 34 } }}>Inquiries</Typography>
      {list && <Chip label={`${list.newCount} new`} size="small" sx={{ bgcolor: 'primary.light', color: 'primary.main' }} />}
    </Stack>
    <Stack direction="row" spacing={2} sx={{ mb: 3 }}><FormControl size="small" sx={{ minWidth: 160 }}><InputLabel id="inquiry-filter">Status</InputLabel><Select labelId="inquiry-filter" label="Status" value={filter} onChange={e => { setFilter(e.target.value); setPage(1); }}>{['New', 'Contacted', 'Archived', 'All'].map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}</Select></FormControl><Button onClick={() => setRefresh(x => x + 1)} disabled={loading}>Refresh</Button></Stack>
    {error && <Alert severity="error" action={<Button onClick={() => setRefresh(x => x + 1)}>Retry</Button>}>{error}</Alert>}
    {loading ? <Typography role="status">Loading inquiries…</Typography> : !error && <>
      {!list?.items.length && <Paper variant="outlined" sx={{ p: 3 }}><Typography color="text.secondary">No inquiries in this view.</Typography></Paper>}
      <Stack spacing={2}>{list?.items.map(item => <Paper variant="outlined" key={item.id} onClick={() => view(item.id)} sx={{ p: 2.5, cursor: 'pointer', transition: 'background-color 0.18s ease', '&:hover': { bgcolor: 'primary.light' }, '&:hover .inquiry-row-chevron': { opacity: 1, transform: 'translateX(2px)' } }}>
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: 1.5 }}>
          <Link component="button" type="button" onClick={e => { e.stopPropagation(); view(item.id); }} underline="hover" sx={{ font: 'inherit', fontWeight: 700, textAlign: 'left', minWidth: 0, overflowWrap: 'anywhere', '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 3 } }}>{item.name}</Link>
          <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', flexShrink: 0 }}>
            <Chip size="small" label={item.status} color={STATUS_META[item.status].chipColor} />
            <ChevronRightIcon className="inquiry-row-chevron" fontSize="small" sx={{ color: 'text.secondary', opacity: 0.4, transition: 'opacity 0.18s ease, transform 0.18s ease' }} />
          </Stack>
        </Stack>
        <Typography sx={{ overflowWrap: 'anywhere' }}>{item.email}</Typography><Typography variant="body2" color="text.secondary">{formatDateTime(item.createdAt)}</Typography>
        <Typography sx={{ mt: 1, overflowWrap: 'anywhere' }}>{item.preview}</Typography>
      </Paper>)}</Stack>
      {!!list && list.total > 25 && <Pagination sx={{ mt: 3 }} count={Math.ceil(list.total / 25)} page={page} onChange={(_, value) => setPage(value)} />}
    </>}
    <Dialog open={open} onClose={close} fullScreen={fullScreen} fullWidth maxWidth="sm" aria-labelledby="inquiry-title" slotProps={{ paper: { sx: { borderRadius: fullScreen ? 0 : 4, overflow: 'hidden' } } }}>
      <Box sx={{ height: 5, background: 'linear-gradient(90deg, #2563eb, #60a5fa)' }} />
      <DialogTitle id="inquiry-title" sx={TITLE_SX}>
        <Box component="span" sx={{ overflowWrap: 'anywhere', minWidth: 0 }}>{selected?.name ?? 'Inquiry'}</Box>
        <IconButton aria-label="Close" size="small" onClick={close} disabled={busy} sx={{ color: 'text.secondary', mr: -1, flexShrink: 0 }}><CloseIcon fontSize="small" /></IconButton>
      </DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        {detailError && <Alert severity="error" sx={{ mb: 2 }}>{detailError}</Alert>}
        {!selected && !detailError && <Typography role="status">Loading inquiry…</Typography>}
        {selected && <Stack spacing={2.5}>
          <Stack spacing={0.75}>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
              <Chip size="small" label={selected.status} color={STATUS_META[selected.status].chipColor} />
              <Typography variant="body2" color="text.secondary">Received {formatDateTime(selected.createdAt)}</Typography>
            </Stack>
            <Typography sx={{ fontWeight: 600, overflowWrap: 'anywhere' }}>{selected.email}</Typography>
          </Stack>

          <Box>
            <Stack direction="row" spacing={1.5} useFlexGap sx={{ flexWrap: 'wrap' }}>
              <Button variant="contained" startIcon={<EmailIcon />} href={`mailto:${encodeURIComponent(selected.email)}?subject=Your%20Henderson%20Software%20Labs%20inquiry`}>Reply by email</Button>
              <Button variant="outlined" startIcon={<ContentCopyIcon fontSize="small" />} onClick={copyEmail}>Copy email</Button>
            </Stack>
            <Typography role="status" variant="body2" sx={{ mt: 1, minHeight: 20, color: copyState === 'failed' ? 'error.main' : 'success.dark' }}>
              {copyState === 'copied' && 'Email copied.'}
              {copyState === 'failed' && 'Unable to copy. Select and copy the address above.'}
            </Typography>
          </Box>

          <Divider />

          <Stack spacing={1}>
            <Typography variant="overline" color="text.secondary" sx={{ lineHeight: 1 }}>Message</Typography>
            <Paper variant="outlined" sx={{ p: 2, bgcolor: SURFACE_SUBTLE, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{selected.message}</Paper>
          </Stack>

          <Divider />

          <FormControl fullWidth disabled={busy}>
            <InputLabel id="inquiry-status-label">Update status</InputLabel>
            <Select labelId="inquiry-status-label" label="Update status" value={selected.status} onChange={e => void changeStatus(e.target.value as InquiryStatus)}>
              {(['New', 'Contacted', 'Archived'] as const).map(s => <MenuItem key={s} value={s}>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                  <FiberManualRecordIcon sx={{ fontSize: 10, color: STATUS_META[s].dot }} />
                  <Box component="span">{s}</Box>
                </Stack>
              </MenuItem>)}
            </Select>
            <FormHelperText>
              {busy ? <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}><CircularProgress size={12} /><Box component="span">Saving…</Box></Stack> : 'Mark Contacted after you have replied. Opening an email draft does not change the status.'}
            </FormHelperText>
          </FormControl>
        </Stack>}
      </DialogContent><DialogActions sx={{ px: 3, pb: 2.5 }}><Button onClick={close} disabled={busy}>Close</Button></DialogActions>
    </Dialog>
  </Container></Box>;
}
