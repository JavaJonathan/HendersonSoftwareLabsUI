import { type ReactNode } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Collapse from '@mui/material/Collapse';
import Button from '@mui/material/Button';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import { useReducedMotion } from 'framer-motion';
import { sanitizeNumeric } from '../../pages/tools/parseInput';

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <Typography
      variant="overline"
      sx={{ display: 'block', color: 'primary.main', fontWeight: 700, letterSpacing: 1, mb: 1.5 }}
    >
      {children}
    </Typography>
  );
}

export function NumericField({
  label,
  value,
  onChange,
  error,
  helperText,
  startAdornment,
  width = '100%',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error: string | null;
  helperText?: string;
  startAdornment?: ReactNode;
  width?: number | string;
}) {
  return (
    <TextField
      label={label}
      value={value}
      onChange={(e) => onChange(sanitizeNumeric(e.target.value))}
      size="small"
      error={Boolean(error)}
      helperText={error ?? helperText}
      slotProps={{
        htmlInput: { inputMode: 'decimal', maxLength: 12 },
        input: startAdornment
          ? { startAdornment: <InputAdornment position="start">{startAdornment}</InputAdornment> }
          : undefined,
      }}
      sx={{ width }}
    />
  );
}

/**
 * A lightweight disclosure nested *inside* an already-open `Expandable` panel, for the
 * handful of inputs most visitors never need to touch (rework, value realization, payback
 * timing). Deliberately not a second `Expandable`: a bordered box inside a bordered box
 * reads as clutter, so this is just a text button over a `Collapse`.
 */
export function MoreToggle({
  label,
  badge,
  open,
  onToggle,
  children,
}: {
  label: string;
  badge: string | null;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  const reduce = useReducedMotion() ?? false;

  return (
    <Box>
      <Button
        variant="text"
        size="small"
        onClick={onToggle}
        aria-expanded={open}
        endIcon={
          <ExpandMoreRoundedIcon
            sx={{
              fontSize: 18,
              transition: reduce ? 'none' : 'transform 0.2s ease',
              transform: open ? 'rotate(180deg)' : 'none',
            }}
          />
        }
        sx={{ px: 0.5, fontWeight: 700, justifyContent: 'flex-start' }}
      >
        {label}
        {badge && (
          <Box
            component="span"
            sx={{
              ml: 1,
              px: 0.9,
              py: 0.15,
              borderRadius: 9999,
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              fontSize: 11,
              fontWeight: 700,
              lineHeight: 1.6,
            }}
          >
            {badge}
          </Box>
        )}
      </Button>
      <Collapse in={open} timeout={reduce ? 0 : 'auto'}>
        <Stack spacing={2.75} sx={{ mt: 2 }}>
          {children}
        </Stack>
      </Collapse>
    </Box>
  );
}
