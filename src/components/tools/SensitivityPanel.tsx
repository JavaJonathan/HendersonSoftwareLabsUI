import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import QueryStatsRoundedIcon from '@mui/icons-material/QueryStatsRounded';
import { SensitivityChart } from './SensitivityChart';
import type { SensitivityEntry } from '../../pages/tools/taskCostModel';

/**
 * The panel that tells you how much to trust the number above it.
 *
 * Any calculator can produce a confident figure from six guesses. This one says which of
 * the six the figure actually rests on, so the next five minutes of effort go somewhere
 * useful. It is also the honest answer to "you just made that up": yes, partly, and here is
 * exactly how much that costs you.
 *
 * The chart itself is opt-in (`open`/`onOpen`): the heading stays visible while scrolling
 * past so the feature is discoverable, but the tornado chart and its narrative, the most
 * "financial model" looking thing on the page, only render once someone actually asks for
 * them. Nobody just checking a number needs to scroll past it.
 */

interface SensitivityPanelProps {
  entries: SensitivityEntry[];
  base: number;
  format: (value: number) => string;
  /** "a year" or "a month", to finish the sentence in the intro. */
  unitNoun: string;
  open: boolean;
  onOpen: () => void;
}

export function SensitivityPanel({
  entries,
  base,
  format,
  unitNoun,
  open,
  onOpen,
}: SensitivityPanelProps) {
  if (entries.length === 0) return null;
  const widest = entries[0];

  if (!open) {
    return (
      <Paper variant="outlined" sx={{ mt: 3, p: { xs: 2.5, md: 3.5 }, borderRadius: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary' }}>
          Which guess is carrying this?
        </Typography>
        <Box
          sx={{
            mt: 2,
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 2,
            justifyContent: 'space-between',
          }}
        >
          <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 480 }}>
            Every number above is somebody's estimate. See which one this result actually
            depends on most.
          </Typography>
          <Button variant="outlined" size="small" startIcon={<QueryStatsRoundedIcon />} onClick={onOpen}>
            Show the breakdown
          </Button>
        </Box>
      </Paper>
    );
  }

  return (
    <Paper variant="outlined" sx={{ mt: 3, p: { xs: 2.5, md: 3.5 }, borderRadius: 3 }}>
      <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary' }}>
        Which guess is carrying this?
      </Typography>
      <Typography variant="body2" sx={{ mt: 1, mb: 3, color: 'text.secondary', maxWidth: 680 }}>
        Each bar moves one input over a plausible range and holds everything else still, so you
        can see what the answer really depends on. Widest bar first.
      </Typography>

      <SensitivityChart entries={entries} base={base} format={format} />

      <Box
        sx={{
          mt: 3,
          p: 2,
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.default',
        }}
      >
        <Typography variant="body2" sx={{ color: 'text.primary' }}>
          <Box component="span" sx={{ fontWeight: 700 }}>
            {widest.label}
          </Box>{' '}
          moves the result more than anything else here, by about{' '}
          <Box component="span" sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
            {format(widest.swing)}
          </Box>{' '}
          {unitNoun} across its range. If you only go and check one number before quoting this
          figure, check that one.
        </Typography>
      </Box>
    </Paper>
  );
}
