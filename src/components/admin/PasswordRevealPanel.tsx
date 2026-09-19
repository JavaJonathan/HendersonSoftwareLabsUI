import { useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import IconButton from '@mui/material/IconButton';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import { SURFACE_SUBTLE } from '../../theme';

const MONOSPACE = '"SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace';

interface PasswordRevealPanelProps {
  password: string;
}

export function PasswordRevealPanel({ password }: PasswordRevealPanelProps) {
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
    },
    [],
  );

  async function handleCopy() {
    // Clipboard access rejects on a non-secure origin or a denied permission. This is the one
    // screen where a silent failure costs the admin a password they can never see again.
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setCopyFailed(false);
    } catch {
      setCopied(false);
      setCopyFailed(true);
    }

    if (resetTimer.current) clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => {
      setCopied(false);
      setCopyFailed(false);
    }, 2000);
  }

  return (
    <Box sx={{ mt: 2 }}>
      <Typography
        variant="overline"
        sx={{ display: 'block', mb: 0.75, color: 'text.secondary', fontWeight: 700, letterSpacing: 1 }}
      >
        Generated Password
      </Typography>

      <Stack
        direction="row"
        spacing={1}
        sx={{
          alignItems: 'center',
          p: 2,
          borderRadius: 2,
          bgcolor: SURFACE_SUBTLE,
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box
          component="code"
          sx={{
            flexGrow: 1,
            minWidth: 0,
            fontFamily: MONOSPACE,
            fontSize: 15,
            letterSpacing: '0.04em',
            color: 'text.primary',
            wordBreak: 'break-all',
          }}
        >
          {password}
        </Box>

        <IconButton
          size="small"
          aria-label={copied ? 'Password copied' : 'Copy password'}
          onClick={handleCopy}
          sx={{
            flexShrink: 0,
            color: copied ? '#059669' : 'text.secondary',
            '&:hover': { color: copied ? '#059669' : 'primary.main', bgcolor: 'primary.light' },
            '&:focus-visible': { outline: 'none', boxShadow: '0 0 0 3px rgba(37, 99, 235, 0.35)' },
          }}
        >
          {copied ? <CheckIcon fontSize="small" /> : <ContentCopyIcon fontSize="small" />}
        </IconButton>
      </Stack>

      <Box aria-live="polite" sx={{ minHeight: 20, mt: 0.75 }}>
        {copied && (
          <Typography variant="caption" sx={{ color: '#059669', fontWeight: 600 }}>
            Copied to clipboard
          </Typography>
        )}
        {copyFailed && (
          <Typography variant="caption" sx={{ color: '#dc2626', fontWeight: 600 }}>
            Could not copy automatically. Select the password above and copy it manually.
          </Typography>
        )}
      </Box>

      <Alert severity="warning" sx={{ mt: 1, borderRadius: 2 }}>
        This password won't be shown again. Copy it now and relay it to the client directly.
      </Alert>
    </Box>
  );
}
