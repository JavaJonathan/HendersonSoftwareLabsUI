import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { SensitivityEntry } from '../../pages/tools/taskCostModel';

/**
 * A tornado chart: how far the yearly result moves when one input changes and everything
 * else is held still, widest swing at the top.
 *
 * This is the honest answer to "how much should I trust this number?". It says out loud
 * which assumption the estimate actually rests on, so the next five minutes of effort go
 * to the input that deserves them rather than the one that was easiest to guess.
 *
 * Built from boxes rather than SVG: the rows are just a label and a proportional bar, and
 * flexbox reflows them on a narrow screen for free.
 */

const DOWNSIDE = '#f59e0b';
const UPSIDE = '#2563eb';

interface SensitivityChartProps {
  entries: SensitivityEntry[];
  /** The unchanged result every bar is measured against. */
  base: number;
  format: (value: number) => string;
}

export function SensitivityChart({ entries, base, format }: SensitivityChartProps) {
  if (entries.length === 0) return null;

  const lows = entries.map((e) => Math.min(e.low, e.high));
  const highs = entries.map((e) => Math.max(e.low, e.high));
  const rawMin = Math.min(base, ...lows);
  const rawMax = Math.max(base, ...highs);
  const span = rawMax - rawMin || 1;
  const min = rawMin - span * 0.04;
  const max = rawMax + span * 0.04;
  const pct = (value: number) => ((value - min) / (max - min)) * 100;
  const basePct = pct(base);

  return (
    <Stack spacing={2}>
      {entries.map((entry) => {
        const low = Math.min(entry.low, entry.high);
        const high = Math.max(entry.low, entry.high);
        const lowPct = pct(low);
        const highPct = pct(high);
        // Each bar is split at the unchanged result: worse to the left, better to the right.
        const downLeft = Math.min(lowPct, basePct);
        const downWidth = Math.max(0, basePct - downLeft);
        const upWidth = Math.max(0, highPct - basePct);

        return (
          <Box key={entry.label}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                gap: 1,
                mb: 0.5,
                flexWrap: 'wrap',
              }}
            >
              <Typography component="span" sx={{ fontSize: 13, fontWeight: 700, color: 'text.primary' }}>
                {entry.label}{' '}
                <Box component="span" sx={{ fontWeight: 500, color: 'text.secondary' }}>
                  ({entry.note})
                </Box>
              </Typography>
              <Typography
                component="span"
                sx={{
                  fontSize: 12.5,
                  fontWeight: 700,
                  color: 'text.secondary',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {`${format(low)} to ${format(high)}`}
              </Typography>
            </Box>

            <Box
              sx={{
                position: 'relative',
                height: 20,
                borderRadius: 1,
                bgcolor: 'action.hover',
                overflow: 'hidden',
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  left: `${downLeft}%`,
                  width: `${downWidth}%`,
                  bgcolor: DOWNSIDE,
                  opacity: 0.85,
                }}
              />
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  left: `${basePct}%`,
                  width: `${upWidth}%`,
                  bgcolor: UPSIDE,
                  opacity: 0.85,
                }}
              />
              <Box
                aria-hidden
                sx={{
                  position: 'absolute',
                  top: -2,
                  bottom: -2,
                  left: `${basePct}%`,
                  width: '2px',
                  ml: '-1px',
                  bgcolor: 'text.primary',
                }}
              />
            </Box>
          </Box>
        );
      })}

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center', pt: 0.5 }}>
        <Legend color="text.primary" label={`Your estimate: ${format(base)}`} isLine />
        <Legend color={DOWNSIDE} label="Lower than your estimate" />
        <Legend color={UPSIDE} label="Higher than your estimate" />
      </Box>
    </Stack>
  );
}

function Legend({ color, label, isLine = false }: { color: string; label: string; isLine?: boolean }) {
  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
      <Box
        aria-hidden
        sx={{
          width: isLine ? 2 : 12,
          height: isLine ? 14 : 12,
          borderRadius: isLine ? 0 : 0.5,
          bgcolor: color,
        }}
      />
      <Typography component="span" sx={{ fontSize: 12, color: 'text.secondary', fontWeight: 600 }}>
        {label}
      </Typography>
    </Box>
  );
}
