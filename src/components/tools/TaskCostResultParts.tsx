import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { CountUp } from './CountUp';
import { type DisplayPeriod, type TaskCostInputs, type TaskCostResults as Results } from '../../pages/tools/taskCostModel';
import { formatCount, formatDuration, formatMoney, formatQuantity, hoursUnit } from '../../pages/tools/taskCostFormat';

const RECOVERED_COLOR = '#059669';
const ADDED_COLOR = '#b45309';

interface HeadlineProps {
  value: number;
  format: (value: number) => string;
  unit: string;
  color: string;
  label: string;
  range: string | null;
  sub: string;
}

export function Headline({ value, format, unit, color, label, range, sub }: HeadlineProps) {
  return (
    <Box>
      <Typography
        component="p"
        sx={{
          fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
          fontWeight: 800,
          fontSize: { xs: 40, sm: 42, md: 52 },
          lineHeight: 1,
          letterSpacing: '-0.02em',
          color,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        <CountUp value={value} format={format} />
        <Typography
          component="span"
          sx={{ ml: 0.75, fontSize: { xs: 16, md: 19 }, fontWeight: 700, color: 'text.secondary' }}
        >
          {unit}
        </Typography>
      </Typography>
      <Typography sx={{ mt: 1, fontWeight: 700, color: 'text.primary', fontSize: 15 }}>
        {label}
      </Typography>
      {range && (
        <Typography
          variant="body2"
          sx={{ mt: 0.5, color: 'text.secondary', fontVariantNumeric: 'tabular-nums' }}
        >
          Likely {range}
        </Typography>
      )}
      {sub && (
        <Typography variant="body2" sx={{ mt: 0.25, color: 'text.secondary' }}>
          {sub}
        </Typography>
      )}
    </Box>
  );
}

export function StatTile({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <Box
      sx={{
        p: 1.5,
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.default',
      }}
    >
      <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: 'text.secondary' }}>
        {label}
      </Typography>
      <Typography
        sx={{
          fontSize: 18,
          fontWeight: 800,
          color: 'text.primary',
          fontVariantNumeric: 'tabular-nums',
          mt: 0.25,
        }}
      >
        {value}
      </Typography>
      {note && (
        <Typography sx={{ fontSize: 11.5, color: 'text.secondary', mt: 0.25 }}>{note}</Typography>
      )}
    </Box>
  );
}

interface BarsProps {
  currentAnnualHours: number;
  improvedAnnualHours: number;
  currentValue: number;
  improvedValue: number;
  period: DisplayPeriod;
  isIncrease: boolean;
  reduce: boolean;
}

export function BeforeAfterBars({
  currentAnnualHours,
  improvedAnnualHours,
  currentValue,
  improvedValue,
  period,
  isIncrease,
  reduce,
}: BarsProps) {
  const scaleMax = Math.max(currentAnnualHours, improvedAnnualHours);

  if (scaleMax <= 0) {
    return (
      <Box
        sx={{
          p: 2,
          borderRadius: 2,
          border: '1px dashed',
          borderColor: 'divider',
          color: 'text.secondary',
          fontSize: 14,
        }}
      >
        Enter a current task time and how often it runs to see the comparison.
      </Box>
    );
  }

  const currentPct = (currentAnnualHours / scaleMax) * 100;
  const improvedPct = (improvedAnnualHours / scaleMax) * 100;
  const ghostLeft = Math.min(currentPct, improvedPct);
  const ghostWidth = Math.abs(currentPct - improvedPct);
  const transition = reduce ? 'none' : 'width 0.35s cubic-bezier(0.22, 1, 0.36, 1)';

  return (
    <Stack spacing={2}>
      <BarRow
        label="Current workflow"
        valueText={`${formatQuantity(currentValue)} ${hoursUnit(period)}`}
        fillPct={currentPct}
        fillColor="#1d4ed8"
        transition={transition}
        ghost={
          isIncrease && ghostWidth > 0.5
            ? { left: ghostLeft, width: ghostWidth, color: ADDED_COLOR }
            : null
        }
      />
      <BarRow
        label="Improved workflow"
        valueText={`${formatQuantity(improvedValue)} ${hoursUnit(period)}`}
        fillPct={improvedPct}
        fillColor="#60a5fa"
        transition={transition}
        ghost={
          !isIncrease && ghostWidth > 0.5
            ? { left: ghostLeft, width: ghostWidth, color: RECOVERED_COLOR }
            : null
        }
      />
    </Stack>
  );
}

interface BarRowProps {
  label: string;
  valueText: string;
  fillPct: number;
  fillColor: string;
  transition: string;
  ghost: { left: number; width: number; color: string } | null;
}

function BarRow({ label, valueText, fillPct, fillColor, transition, ghost }: BarRowProps) {
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 0.5 }}>
        <Typography component="span" sx={{ fontSize: 13, fontWeight: 600, color: 'text.primary' }}>
          {label}
        </Typography>
        <Typography
          component="span"
          sx={{ fontSize: 13, fontWeight: 700, color: 'text.primary', fontVariantNumeric: 'tabular-nums' }}
        >
          {valueText}
        </Typography>
      </Box>
      <Box
        sx={{
          position: 'relative',
          height: 26,
          borderRadius: 1,
          bgcolor: 'divider',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            width: `${Math.max(0, Math.min(100, fillPct))}%`,
            bgcolor: fillColor,
            borderRadius: 1,
            transition,
          }}
        />
        {ghost && (
          <Box
            aria-hidden
            sx={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: `${ghost.left}%`,
              width: `${ghost.width}%`,
              border: '1px dashed',
              borderColor: ghost.color,
              backgroundImage: `repeating-linear-gradient(45deg, ${ghost.color}22 0 6px, transparent 6px 12px)`,
              borderRadius: 1,
              transition,
            }}
          />
        )}
      </Box>
    </Box>
  );
}

export function MathBreakdown({
  results,
  inputs,
  hasCost,
}: {
  results: Results;
  inputs: TaskCostInputs;
  hasCost: boolean;
}) {
  const a = inputs.assumptions;
  const execs = formatCount(inputs.executionsPerPeriod);
  const runsPerYear = formatCount(results.annualExecutions);
  const twoDp = (n: number) => n.toLocaleString('en-US', { maximumFractionDigits: 2 });
  // "5m 00s (300s)" for durations over a minute; just "30s" when the two would repeat.
  const durationExpr = (s: number) =>
    s >= 60 ? `${formatDuration(s)} (${formatCount(s)}s)` : formatDuration(s);

  const frequencyMath =
    inputs.frequency === 'workday'
      ? `${execs} × ${formatCount(inputs.schedule.workdaysPerWeek)} workdays/wk × ${formatCount(
          inputs.schedule.workingWeeksPerYear,
        )} wks/yr`
      : inputs.frequency === 'week'
        ? `${execs} × ${formatCount(inputs.schedule.workingWeeksPerYear)} wks/yr`
        : `${execs} × 12 months`;

  const rows: { label: string; expr: string }[] = [
    { label: 'Runs per year', expr: `${frequencyMath} = ${runsPerYear} runs` },
  ];

  if (a.reworkPct > 0) {
    rows.push({
      label: 'Rework today',
      expr: `${durationExpr(inputs.currentSeconds)} × (1 + ${formatCount(a.reworkPct)}%) = ${twoDp(
        inputs.currentSeconds * (1 + a.reworkPct / 100),
      )}s really spent per run`,
    });
  }

  rows.push({
    label: 'Current time per year',
    expr: `${durationExpr(inputs.currentSeconds)}${
      a.reworkPct > 0 ? ' + rework' : ''
    } × ${runsPerYear} ÷ 3,600 = ${twoDp(results.currentAnnualHours)} hrs`,
  });

  if (a.adoptionPct < 100) {
    rows.push({
      label: 'Adoption',
      expr: `${formatCount(a.adoptionPct)}% of ${runsPerYear} runs = ${formatCount(
        results.adoptedExecutions,
      )} runs move to the new way; the rest stay on the old one`,
    });
  }

  rows.push(
    {
      label: 'Time per year after',
      expr: `${durationExpr(inputs.improvedSeconds)}${
        a.improvedReworkPct > 0 ? ' + rework' : ''
      }, blended across all runs = ${twoDp(results.improvedAnnualHours)} hrs`,
    },
    {
      label: results.isIncrease ? 'Extra time per year' : 'Recovered per year',
      expr: `${twoDp(results.currentAnnualHours)} - ${twoDp(results.improvedAnnualHours)} = ${twoDp(
        results.annualHoursDelta,
      )} hrs`,
    },
    {
      label: 'In eight-hour workdays',
      expr: `${twoDp(results.annualHoursDelta)} ÷ 8 = ${twoDp(results.annualEightHourDays)} days`,
    },
  );

  if (hasCost && results.annualValueDelta !== null) {
    const loadingPart =
      a.loadingMultiplier === 1
        ? `${formatMoney(inputs.hourlyCost ?? 0)}/hr`
        : `${formatMoney(inputs.hourlyCost ?? 0)}/hr × ${a.loadingMultiplier}x loaded = ${formatMoney(
            results.effectiveHourlyCost ?? 0,
          )}/hr`;
    rows.push({ label: 'Hourly cost used', expr: loadingPart });

    if (a.realizationPct < 100) {
      rows.push({
        label: 'Value realization',
        expr: `only ${formatCount(a.realizationPct)}% of the recovered hours are counted as value`,
      });
    }

    rows.push({
      label: 'Estimated value',
      expr: `${twoDp(results.annualHoursDelta)} hrs${
        a.realizationPct < 100 ? ` × ${formatCount(a.realizationPct)}%` : ''
      } × ${formatMoney(results.effectiveHourlyCost ?? 0)}/hr = ${formatMoney(
        results.annualValueDelta,
      )}`,
    });
  }

  if (a.uncertaintyPct > 0) {
    rows.push({
      label: 'Range shown',
      expr: `the headline ± ${formatCount(a.uncertaintyPct)}%, because every figure above is an estimate`,
    });
  }

  return (
    <Stack spacing={1.25} sx={{ mt: 1 }}>
      {rows.map((row) => (
        <Box key={row.label}>
          <Typography sx={{ fontSize: 12, fontWeight: 700, color: 'text.primary' }}>
            {row.label}
          </Typography>
          <Typography
            sx={{ fontSize: 12.5, color: 'text.secondary', fontVariantNumeric: 'tabular-nums' }}
          >
            {row.expr}
          </Typography>
        </Box>
      ))}
      <Typography sx={{ fontSize: 11.5, color: 'text.disabled', mt: 0.5 }}>
        Monthly results are these annual totals divided by 12, shown as monthly averages.
      </Typography>
    </Stack>
  );
}
