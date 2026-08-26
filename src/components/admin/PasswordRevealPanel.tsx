import { useState } from 'react';
import TextField from '@mui/material/TextField';
import Alert from '@mui/material/Alert';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';

interface PasswordRevealPanelProps {
  password: string;
}

export function PasswordRevealPanel({ password }: PasswordRevealPanelProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(password);
    setCopied(true);
  }

  return (
    <>
      <TextField
        label="Generated Password"
        value={password}
        fullWidth
        margin="normal"
        slotProps={{
          input: {
            readOnly: true,
            sx: { fontFamily: 'monospace' },
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={handleCopy} edge="end">
                  {copied ? <CheckIcon color="success" /> : <ContentCopyIcon />}
                </IconButton>
              </InputAdornment>
            ),
          },
        }}
      />

      <Alert severity="warning" sx={{ mt: 1 }}>
        This password won't be shown again. Copy it now and relay it to the client directly.
      </Alert>
    </>
  );
}
