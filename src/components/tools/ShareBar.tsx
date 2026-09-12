import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Snackbar from '@mui/material/Snackbar';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import LinkRoundedIcon from '@mui/icons-material/LinkRounded';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import PrintRoundedIcon from '@mui/icons-material/PrintRounded';

/**
 * Getting the result out of the browser and in front of whoever signs off on it.
 *
 * Every input lives in the URL, so "copy link" is the whole save-and-share story: no
 * account, nothing stored, and the person on the other end lands on a live calculator with
 * the numbers already in it rather than a screenshot they cannot argue with.
 *
 * The task name lives here rather than at the top of the form: it's the one field that
 * only matters at the moment of sending something to someone else, not while you're still
 * looking at your own numbers.
 */

interface ShareBarProps {
  shareUrl: string;
  summaryText: string;
  csvText: string;
  /** Base filename for the CSV, without extension. */
  filename: string;
  taskName: string;
  onTaskNameChange: (value: string) => void;
}

/** `navigator.clipboard` needs a secure context; fall back to the old selection trick. */
async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fall through to the textarea approach below.
  }

  try {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(area);
    return ok;
  } catch {
    return false;
  }
}

function downloadCsv(csvText: string, filename: string) {
  // The BOM keeps Excel from mangling any non-ASCII characters in the task name.
  const blob = new Blob([`﻿${csvText}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${filename}.csv`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export function ShareBar({
  shareUrl,
  summaryText,
  csvText,
  filename,
  taskName,
  onTaskNameChange,
}: ShareBarProps) {
  const [toast, setToast] = useState<string | null>(null);

  async function handleCopy(text: string, successMessage: string) {
    const ok = await copyText(text);
    setToast(ok ? successMessage : 'Could not copy. Select the text and copy it manually.');
  }

  return (
    <>
      <Paper
        variant="outlined"
        sx={{
          mt: 3,
          p: { xs: 2.5, md: 3 },
          borderRadius: 3,
          bgcolor: 'primary.light',
          '@media print': { display: 'none' },
        }}
      >
        <TextField
          label="Name this scenario (optional)"
          value={taskName}
          onChange={(e) => onTaskNameChange(e.target.value.slice(0, 60))}
          size="small"
          placeholder="Invoice processing"
          helperText="Named tasks make a shared link make sense on its own."
          slotProps={{ htmlInput: { maxLength: 60 } }}
          sx={{ mb: 2, width: '100%', maxWidth: 360 }}
        />

        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 2,
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Box sx={{ minWidth: 220, flex: '1 1 260px' }}>
            <Typography sx={{ fontWeight: 800, color: 'text.primary' }}>
              Send it to whoever signs off on it
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5, color: 'text.secondary', maxWidth: 460 }}>
              The link carries every number you entered, so they open a live calculator, not a
              screenshot. They can change an assumption they disagree with and watch it move.
            </Typography>
          </Box>

          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }} useFlexGap>
            <Button
              variant="contained"
              size="small"
              startIcon={<LinkRoundedIcon />}
              onClick={() => handleCopy(shareUrl, 'Link copied to the clipboard')}
            >
              Copy link
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<ContentCopyRoundedIcon />}
              onClick={() => handleCopy(summaryText, 'Summary copied, ready to paste')}
            >
              Copy summary
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<DownloadRoundedIcon />}
              onClick={() => downloadCsv(csvText, filename)}
            >
              CSV
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<PrintRoundedIcon />}
              onClick={() => window.print()}
            >
              Print
            </Button>
          </Stack>
        </Box>
      </Paper>

      <Snackbar
        open={toast !== null}
        autoHideDuration={3000}
        onClose={() => setToast(null)}
        message={toast ?? ''}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </>
  );
}
