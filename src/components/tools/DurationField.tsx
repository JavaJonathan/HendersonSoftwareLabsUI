import { useEffect, useId, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { formatDuration } from '../../pages/tools/taskCostFormat';

/**
 * A paired minutes + seconds input for a task duration. The canonical value is a count of
 * seconds, owned by the parent; this component keeps its own raw text state so a partial
 * edit is never clobbered, and re-syncs when `seconds` changes from elsewhere (the slider,
 * "Reset example"). Minutes may exceed 59 (tasks longer than an hour, where an hours-and-
 * minutes readout is shown underneath rather than adding a third box); seconds are 0-59.
 */

interface DurationFieldProps {
  label: string;
  seconds: number;
  onChange: (seconds: number) => void;
  helperText?: string;
  /** Marks the field group as invalid to the user without blocking input. */
  disabled?: boolean;
}

function decompose(totalSeconds: number): { minutes: number; seconds: number } {
  const safe = Number.isFinite(totalSeconds) && totalSeconds > 0 ? Math.round(totalSeconds) : 0;
  return { minutes: Math.floor(safe / 60), seconds: safe % 60 };
}

const onlyDigits = (raw: string) => raw.replace(/[^0-9]/g, '');

export function DurationField({ label, seconds, onChange, helperText, disabled }: DurationFieldProps) {
  const groupId = useId();
  const initial = decompose(seconds);
  const [minutesRaw, setMinutesRaw] = useState(String(initial.minutes));
  const [secondsRaw, setSecondsRaw] = useState(String(initial.seconds));
  const lastEmitted = useRef(seconds);

  // Re-sync when the value changes from outside this component.
  useEffect(() => {
    if (Math.abs(seconds - lastEmitted.current) < 0.5) return;
    const next = decompose(seconds);
    setMinutesRaw(String(next.minutes));
    setSecondsRaw(String(next.seconds));
    lastEmitted.current = seconds;
  }, [seconds]);

  const minutesValue = minutesRaw === '' ? 0 : Number(minutesRaw);
  const secondsValue = secondsRaw === '' ? 0 : Number(secondsRaw);
  const secondsInvalid = secondsValue > 59;

  function emit(nextMinutes: number, nextSeconds: number) {
    if (nextSeconds > 59) return; // hold the last valid total until the seconds field is fixed
    const total = nextMinutes * 60 + nextSeconds;
    lastEmitted.current = total;
    onChange(total);
  }

  function handleMinutes(raw: string) {
    const cleaned = onlyDigits(raw).slice(0, 5);
    setMinutesRaw(cleaned);
    emit(cleaned === '' ? 0 : Number(cleaned), secondsValue);
  }

  function handleSeconds(raw: string) {
    const cleaned = onlyDigits(raw).slice(0, 2);
    setSecondsRaw(cleaned);
    emit(minutesValue, cleaned === '' ? 0 : Number(cleaned));
  }

  return (
    <Box role="group" aria-labelledby={groupId}>
      <Typography
        id={groupId}
        component="span"
        sx={{ display: 'block', fontSize: 14, fontWeight: 600, color: 'text.primary', mb: 1 }}
      >
        {label}
      </Typography>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start' }}>
        <TextField
          label="Minutes"
          value={minutesRaw}
          onChange={(e) => handleMinutes(e.target.value)}
          size="small"
          disabled={disabled}
          slotProps={{ htmlInput: { inputMode: 'numeric', 'aria-label': `${label} - minutes` } }}
          sx={{ width: 104 }}
        />
        <TextField
          label="Seconds"
          value={secondsRaw}
          onChange={(e) => handleSeconds(e.target.value)}
          size="small"
          disabled={disabled}
          error={secondsInvalid}
          helperText={secondsInvalid ? '0-59' : undefined}
          slotProps={{ htmlInput: { inputMode: 'numeric', 'aria-label': `${label} - seconds` } }}
          sx={{ width: 104 }}
        />
      </Stack>
      {minutesValue >= 60 && (
        <Typography variant="caption" sx={{ display: 'block', mt: 0.75, color: 'text.secondary' }}>
          {`= ${formatDuration(minutesValue * 60 + secondsValue)}`}
        </Typography>
      )}
      {helperText && (
        <Typography variant="caption" sx={{ display: 'block', mt: 0.75, color: 'text.secondary' }}>
          {helperText}
        </Typography>
      )}
    </Box>
  );
}
