import { useState, type FormEvent } from 'react';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Link from '@mui/material/Link';
import { useAuth } from '../auth/AuthContext';
import { ApiError } from '../api/client';
import { Reveal } from '../components/motion/Reveal';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const from = (location.state as { from?: string } | null)?.from ?? '/portal';

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError('Invalid email or password.');
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', px: 2 }}>
      <Reveal y={16}>
      <Box sx={{ width: '100%', maxWidth: 400 }}>
        <Stack sx={{ mb: 4, alignItems: 'center' }}>
          <Link component={RouterLink} to="/" underline="none" sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
            <Box
              sx={{
                width: 34,
                height: 34,
                borderRadius: '10px',
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: 18,
              }}
            >
              H
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>
              Henderson Software Labs
            </Typography>
          </Link>
        </Stack>

        <Paper variant="outlined" sx={{ p: 4, borderRadius: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary' }}>
            Client Login
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5, color: 'text.secondary' }}>
            Sign in to view the software we've built for you.
          </Typography>

          <Stack component="form" spacing={2.5} sx={{ mt: 3 }} onSubmit={handleSubmit}>
            <TextField
              label="Email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
            />
            <TextField
              label="Password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
            />

            {error && <Alert severity="error">{error}</Alert>}

            <Button type="submit" variant="contained" size="large" disabled={submitting} fullWidth>
              {submitting ? 'Signing in…' : 'Sign In'}
            </Button>
          </Stack>
        </Paper>
      </Box>
      </Reveal>
    </Box>
  );
}
