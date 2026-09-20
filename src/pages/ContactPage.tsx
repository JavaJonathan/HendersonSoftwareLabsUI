import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Alert, Box, Button, Container, Link, Paper, Stack, TextField, Typography } from '@mui/material';
import { NavBar } from '../components/layout/NavBar';
import { Footer } from '../components/layout/Footer';
import { usePageMeta } from '../hooks/usePageMeta';
import { submitInquiry } from '../api/inquiries';

export function ContactPage() {
  usePageMeta({ title: 'Contact | Henderson Software Labs', description: 'Tell Jonathan about the business task that is slowing you down.', canonical: 'https://hendersonsoftwarelabs.com/contact' });
  const [values, setValues] = useState({ name: '', email: '', message: '', website: '' });
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const submissionId = useRef(crypto.randomUUID());
  const lastPayload = useRef('');
  const submitting = useRef(false);
  const notice = useRef<HTMLDivElement>(null);
  useEffect(() => { if (success || error) notice.current?.focus(); }, [success, error]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    const form = event.currentTarget;
    const trimmed = { name: values.name.trim(), email: values.email.trim(), message: values.message.trim(), website: values.website };
    const next: Record<string, string> = {};
    if (!trimmed.name || trimmed.name.length > 100) next.name = 'Enter your name (up to 100 characters).';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed.email) || trimmed.email.length > 254) next.email = 'Enter a valid email address.';
    if (!trimmed.message || trimmed.message.length > 5000) next.message = 'Describe the task (up to 5,000 characters).';
    setErrors(next);
    if (Object.keys(next).length) { form.querySelector<HTMLInputElement>(`[name="${Object.keys(next)[0]}"]`)?.focus(); return; }
    // Preserve the ID on a retry, but a changed message is a new submission.
    const fingerprint = JSON.stringify(trimmed);
    if (lastPayload.current && lastPayload.current !== fingerprint) submissionId.current = crypto.randomUUID();
    lastPayload.current = fingerprint;
    submitting.current = true;
    setBusy(true); setError('');
    try { await submitInquiry({ ...trimmed, submissionId: submissionId.current }); setSuccess(true); }
    catch (e) { setError(e instanceof Error && e.name !== 'TimeoutError' && e.name !== 'TypeError' ? e.message : 'We couldn’t confirm your inquiry was received. Please retry or email Jonathan directly.'); }
    finally { submitting.current = false; setBusy(false); }
  }

  return <><NavBar /><Container component="main" maxWidth="sm" sx={{ py: { xs: 5, md: 8 } }}>
    <Typography variant="h3" component="h1" sx={{ fontSize: { xs: 32, md: 42 }, mb: 2 }}>Tell me what’s slowing you down.</Typography>
    <Typography color="text.secondary" sx={{ mb: 4 }}>Describe the task and the tools you use. You don’t need a technical specification.</Typography>
    <Paper variant="outlined" sx={{ p: { xs: 2.5, sm: 4 } }}>
      {success ? <Alert severity="success" tabIndex={-1} ref={notice}>Thanks for getting in touch. Your inquiry has been received. Jonathan will reply by email.</Alert>
        : <Box component="form" noValidate onSubmit={submit} aria-busy={busy}>
          <Stack spacing={3}>
            {error && <Alert severity="error" ref={notice} tabIndex={-1}>{error}</Alert>}
            <TextField label="Name" name="name" required fullWidth autoComplete="name" value={values.name} disabled={busy} error={!!errors.name} helperText={errors.name} slotProps={{ htmlInput: { maxLength: 100 } }} onChange={e => setValues({ ...values, name: e.target.value })} />
            <TextField label="Email" name="email" type="email" required fullWidth autoComplete="email" value={values.email} disabled={busy} error={!!errors.email} helperText={errors.email} slotProps={{ htmlInput: { maxLength: 254 } }} onChange={e => setValues({ ...values, email: e.target.value })} />
            <TextField label="What’s slowing you down?" name="message" required multiline minRows={5} fullWidth value={values.message} disabled={busy} error={!!errors.message} helperText={errors.message || 'Please leave out passwords and sensitive customer information.'} slotProps={{ inputLabel: { shrink: true }, htmlInput: { maxLength: 5000 } }} onChange={e => setValues({ ...values, message: e.target.value })} />
            <Box aria-hidden="true" sx={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clipPath: 'inset(50%)' }}><label>Website<input name="website" tabIndex={-1} autoComplete="off" value={values.website} onChange={e => setValues({ ...values, website: e.target.value })} /></label></Box>
            <Typography variant="body2" color="text.secondary">Your details will be stored so Jonathan can review and respond to your inquiry.</Typography>
            <Button type="submit" variant="contained" size="large" disabled={busy}>{busy ? 'Submitting…' : 'Send inquiry'}</Button>
          </Stack>
        </Box>}
      <Box sx={{ mt: 3 }}><Typography>Prefer email? <Link href="mailto:jonathan@HendersonSoftwareLabs.com?subject=Help%20with%20a%20business%20workflow">Email Jonathan</Link></Typography><Typography variant="body2" color="text.secondary" sx={{ overflowWrap: 'anywhere', mt: 0.5 }}>jonathan@HendersonSoftwareLabs.com</Typography></Box>
    </Paper>
  </Container><Footer /></>;
}
