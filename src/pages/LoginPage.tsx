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
import InputAdornment from '@mui/material/InputAdornment';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { motion } from 'framer-motion';
import { useAuth } from '../auth/AuthContext';
import { ApiError, getApiErrorMessage } from '../api/client';
import { Reveal } from '../components/motion/Reveal';
import { GradientBackdrop } from '../components/motion/GradientBackdrop';
import { SURFACE_SUBTLE, SURFACE_DARK } from '../theme';
import wordmarkLight from '../assets/branding/wordmark-light.png';
import wordmarkDark from '../assets/branding/wordmark-dark.png';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const from = (location.state as { from?: string } | null)?.from;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const loggedInUser = await login(email, password);
      navigate(from ?? (loggedInUser.isAdmin ? '/admin' : '/portal'), { replace: true });
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError('Invalid email or password.');
      } else {
        setError(getApiErrorMessage(err, 'Something went wrong. Please try again.'));
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', position: 'relative' }}>
      <Link
        component={RouterLink}
        to="/"
        underline="none"
        sx={{
          position: 'fixed',
          top: { xs: 24, sm: 32 },
          left: { xs: 24, sm: 32 },
          zIndex: 10,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.5,
          fontSize: 14,
          fontWeight: 500,
          color: { xs: 'text.secondary', md: 'rgba(255,255,255,0.8)' },
          '&:hover': { color: { xs: 'primary.main', md: '#ffffff' } },
        }}
      >
        <ArrowBackIcon sx={{ fontSize: 16 }} />
        Back to home
      </Link>

      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          flex: '1 1 50%',
          position: 'relative',
          overflow: 'hidden',
          bgcolor: SURFACE_DARK,
          alignItems: 'center',
          justifyContent: 'center',
          p: 6,
        }}
      >
        <GradientBackdrop variant="dark" />
        <Reveal>
          <Box sx={{ position: 'relative', textAlign: 'center', maxWidth: 640 }}>
            <Box
              component={motion.div}
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Box
                component="img"
                src={wordmarkLight}
                alt="Henderson Software Labs"
                sx={{ width: { md: 480, lg: 640 }, height: 'auto', mx: 'auto' }}
              />
            </Box>
            <Typography sx={{ mt: 5, color: 'rgba(255,255,255,0.8)', fontSize: 22, fontWeight: 500 }}>
              All the software we've built for you, in one place.
            </Typography>
            <Typography sx={{ mt: 1.5, color: 'rgba(255,255,255,0.5)', fontSize: 16, maxWidth: 440, mx: 'auto' }}>
              Custom software for businesses that don't need a full-time software team.
            </Typography>
          </Box>
        </Reveal>
      </Box>

      <Box
        sx={{
          flex: '1 1 50%',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          px: 2,
          py: 6,
          bgcolor: SURFACE_SUBTLE,
        }}
      >
        <GradientBackdrop />

        <Reveal y={16} fullWidth>
          <Box sx={{ position: 'relative', width: '100%', maxWidth: 480 }}>
            <Stack sx={{ mb: 4, alignItems: 'center', display: { xs: 'flex', md: 'none' } }}>
              <Box component="img" src={wordmarkDark} alt="Henderson Software Labs" sx={{ width: 240, height: 'auto' }} />
            </Stack>

            <Box sx={{ position: 'relative' }}>
              <Paper
                elevation={0}
                sx={{
                  position: 'relative',
                  borderRadius: 4,
                  overflow: 'hidden',
                  border: '1px solid rgba(15,23,42,0.06)',
                  boxShadow: '0 24px 48px -24px rgba(15,23,42,0.22)',
                }}
              >
                <Box sx={{ height: 5, background: 'linear-gradient(90deg, #2563eb, #60a5fa)' }} />

                <Box sx={{ p: 4 }}>
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
                      slotProps={{
                        input: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <EmailOutlinedIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                            </InputAdornment>
                          ),
                        },
                      }}
                    />
                    <TextField
                      label="Password"
                      type="password"
                      required
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      fullWidth
                      slotProps={{
                        input: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <LockOutlinedIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                            </InputAdornment>
                          ),
                        },
                      }}
                    />

                    {error && <Alert severity="error">{error}</Alert>}

                    <Button
                      type="submit"
                      variant="contained"
                      size="large"
                      disabled={submitting}
                      endIcon={<ArrowForwardIcon />}
                      fullWidth
                    >
                      {submitting ? 'Signing in…' : 'Sign In'}
                    </Button>
                  </Stack>
                </Box>
              </Paper>
            </Box>
          </Box>
        </Reveal>
      </Box>
    </Box>
  );
}
