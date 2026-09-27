import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { SxProps, Theme } from '@mui/material/styles';
import { useReducedMotion } from 'framer-motion';
import { useCountUp } from '../../../hooks/useCountUp';
import { IMPACT, hoursSavedBase } from './impactModel';

/** Project estimates and a separate workflow count, with a one-time entrance animation. */

const HEADING_FONT = '"Plus Jakarta Sans", system-ui, sans-serif';

const bigNumberSx: SxProps<Theme> = {
  fontFamily: HEADING_FONT,
  fontWeight: 800,
  fontSize: { xs: 32, md: 52 },
  lineHeight: 1,
  color: 'primary.main',
  fontVariantNumeric: 'tabular-nums',
  letterSpacing: '-0.02em',
};

const cellSx: SxProps<Theme> = { flex: 1, minWidth: 0, px: { xs: 2.5, md: 3.5 }, py: { xs: 2.5, md: 3.5 } };
const labelSx: SxProps<Theme> = { mt: 1.25, fontWeight: 700, color: 'text.primary', fontSize: 16 };
const subSx: SxProps<Theme> = { mt: 0.25, color: 'text.secondary' };

export function ImpactPanel() {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 4,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: '#ffffff',
        boxShadow: '0 30px 60px -32px rgba(15, 23, 42, 0.28)',
        overflow: 'hidden',
      }}
    >
      <HoursStat />
      <Box
        sx={{
          alignSelf: 'stretch',
          bgcolor: 'divider',
          height: '1px',
          mx: 3.5,
        }}
      />
      <WorkflowsStat />
    </Box>
  );
}

function HoursStat() {
  const reduce = useReducedMotion() ?? false;
  const [estimate] = useState(() => hoursSavedBase());
  const { ref, value } = useCountUp(estimate, 3000);
  const shown = reduce ? estimate : value;
  const launchDate = IMPACT.since.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <Box ref={ref} sx={cellSx}>
      <Typography component="div" sx={bigNumberSx}>{shown.toLocaleString()}</Typography>
      <Typography sx={labelSx}>Estimated hours saved</Typography>
      <Typography variant="body2" sx={subSx}>
        Across one client’s automated workflows. An estimate, not measured time tracking.
      </Typography>
      <Box component="details" sx={{ mt: 1.5, color: 'text.secondary', fontSize: 13 }}>
        <Box component="summary" sx={{ cursor: 'pointer', fontWeight: 600, '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 3 } }}>
          How we estimate this
        </Box>
        <Typography variant="body2" sx={{ mt: 1 }}>
          {estimate.toLocaleString()} estimated hours: {IMPACT.employeesAffected} employees × {IMPACT.hoursSavedPerEmployeePerWorkday} estimated hour saved per employee per weekday since {launchDate}.
          This assumes Monday through Friday throughout that period and does not adjust for holidays or absences. Actual savings vary.
        </Typography>
      </Box>
    </Box>
  );
}

function WorkflowsStat() {
  const reduce = useReducedMotion() ?? false;
  const { ref, value } = useCountUp(IMPACT.workflows);
  const shown = reduce ? IMPACT.workflows : value;

  return (
    <Box sx={cellSx}>
      <Box ref={ref} sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
        <Typography component="span" sx={bigNumberSx}>
          {shown}
        </Typography>
      </Box>

      <Typography sx={labelSx}>Workflows automated</Typography>
      <Typography variant="body2" sx={subSx}>
        each replaces a recurring manual job
      </Typography>
    </Box>
  );
}
