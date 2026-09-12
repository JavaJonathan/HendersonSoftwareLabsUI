import type { ReactNode } from 'react';
import Box from '@mui/material/Box';
import Slider from '@mui/material/Slider';
import Typography from '@mui/material/Typography';

/**
 * A labelled slider with its current value shown as text on the same line.
 *
 * Every judgement call in this calculator is a slider rather than a text field on purpose:
 * a text field asks "what is the correct number?", which nobody knows, while a slider asks
 * "roughly where?" and shows the answer moving as you decide.
 */

interface SliderFieldProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  /** Renders the value shown beside the label and in the drag tooltip. */
  format: (value: number) => string;
  help?: ReactNode;
  /** Marks where the shipped default sits, so "back to normal" is findable. */
  marks?: { value: number; label: string }[];
}

export function SliderField({
  label,
  value,
  onChange,
  min,
  max,
  step,
  format,
  help,
  marks,
}: SliderFieldProps) {
  const labelId = `slider-${label.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}`;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 1 }}>
        <Typography
          id={labelId}
          component="span"
          sx={{ fontSize: 13.5, fontWeight: 600, color: 'text.primary' }}
        >
          {label}
        </Typography>
        <Typography
          component="span"
          sx={{
            fontSize: 13.5,
            fontWeight: 800,
            color: 'primary.main',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {format(value)}
        </Typography>
      </Box>
      <Slider
        value={value}
        min={min}
        max={max}
        step={step}
        marks={marks}
        onChange={(_, next) => onChange(next as number)}
        valueLabelDisplay="auto"
        valueLabelFormat={format}
        getAriaValueText={format}
        aria-labelledby={labelId}
        size="small"
        sx={{ mt: marks ? 0 : -0.5, mb: marks ? 0 : -0.5 }}
      />
      {help && (
        <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', mt: -0.25 }}>
          {help}
        </Typography>
      )}
    </Box>
  );
}
