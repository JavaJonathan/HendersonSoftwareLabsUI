import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import ArrowUpwardRoundedIcon from '@mui/icons-material/ArrowUpwardRounded';
import { useReducedMotion } from 'framer-motion';
import { Headline, StatTile, BeforeAfterBars, MathBreakdown } from './TaskCostResultParts';
import { Expandable } from './Expandable';
import {
  forPeriod,
  type DisplayPeriod,
  type TaskCostInputs,
  type TaskCostResults as Results,
} from '../../pages/tools/taskCostModel';
import {
  formatCount,
  formatDuration,
  formatMoney,
  formatPercent,
  formatQuantity,
  hoursUnit,
  moneyUnit,
  perPeriodLabel,
  periodNoun,
} from '../../pages/tools/taskCostFormat';

interface TaskCostResultsProps {
  results: Results;
  inputs: TaskCostInputs;
  period: DisplayPeriod;
  onPeriodChange: (period: DisplayPeriod) => void;
  hasCost: boolean;
  mathOpen: boolean;
  onToggleMath: () => void;
}

const srOnly = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  p: 0,
  m: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: 0,
} as const;

const RECOVERED_COLOR = '#059669';
const ADDED_COLOR = '#b45309';
const EPSILON = 1e-9;

export function TaskCostResults({
  results,
  inputs,
  period,
  onPeriodChange,
  hasCost,
  mathOpen,
  onToggleMath,
}: TaskCostResultsProps) {
  const reduce = useReducedMotion() ?? false;

  // Nothing to compare until there is both a current time to improve on and a run rate.
  const hasInput = results.annualExecutions > 0 && results.currentAnnualHours > 0;
  const isFlat = Math.abs(results.annualHoursDelta) < EPSILON;
  const isIncrease = results.isIncrease;

  const deltaDisplay = forPeriod(results.annualHoursDelta, period);
  const daysDisplay = forPeriod(results.annualEightHourDays, period);
  const valueDisplay =
    results.annualValueDelta === null ? null : forPeriod(results.annualValueDelta, period);

  const noun = periodNoun(period);
  const currentVal = forPeriod(results.currentAnnualHours, period);
  const improvedVal = forPeriod(results.improvedAnnualHours, period);

  const PROMPT = 'Enter a current task time and how often it runs to compare the two workflows.';

  const textEquivalent = !hasInput
    ? PROMPT
    : `Current workflow: ${formatQuantity(currentVal)} hours per ${noun}. ` +
      `Improved workflow: ${formatQuantity(improvedVal)} hours per ${noun}. ` +
      `Difference: ${formatQuantity(Math.abs(deltaDisplay))} hours ${
        isIncrease ? 'added' : isFlat ? 'unchanged' : 'recovered'
      } per ${noun}.`;

  const liveSummary = !hasInput
    ? ''
    : isFlat
      ? 'The improved time matches the current time, so no time is recovered.'
      : `About ${formatQuantity(Math.abs(deltaDisplay))} hours ${
          isIncrease ? 'added' : 'recovered'
        } per ${noun}, roughly ${formatQuantity(Math.abs(daysDisplay))} eight-hour days${
          valueDisplay === null ? '' : `, about ${formatMoney(Math.abs(valueDisplay))}`
        }.`;

  const [liveText, setLiveText] = useState('');
  useEffect(() => {
    const id = window.setTimeout(() => setLiveText(liveSummary), 700);
    return () => window.clearTimeout(id);
  }, [liveSummary]);

  const headlineColor = isIncrease ? ADDED_COLOR : 'primary.main';
  const hoursRange = results.annualHoursRange;
  const valueRange = results.annualValueRange;

  return (
    <Paper variant="outlined" sx={{ p: { xs: 2.5, md: 3.5 }, borderRadius: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
        <ToggleButtonGroup
          exclusive
          size="small"
          value={period}
          onChange={(_, value: DisplayPeriod | null) => {
            if (value) onPeriodChange(value);
          }}
          aria-label="Show results per year or per month"
          sx={{ '@media print': { display: 'none' } }}
        >
          <ToggleButton value="year">Yearly</ToggleButton>
          <ToggleButton value="month">Monthly</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {!hasInput ? (
        <Box sx={{ py: { xs: 4, md: 6 }, px: 2, textAlign: 'center', color: 'text.secondary' }}>
          <Typography sx={{ fontWeight: 700, color: 'text.primary' }}>
            Add the task details to see hours recovered
          </Typography>
          <Typography variant="body2" sx={{ mt: 1, maxWidth: 340, mx: 'auto' }}>
            {PROMPT}
          </Typography>
        </Box>
      ) : (
        <>
          {/* Headline: hours always, money alongside it once a rate is known. */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: hasCost ? { xs: '1fr', sm: '1fr 1fr' } : '1fr',
              gap: { xs: 2, sm: 3 },
              alignItems: 'start',
              textAlign: hasCost ? 'left' : { xs: 'left', md: 'center' },
            }}
          >
            <Headline
              value={isFlat ? 0 : Math.abs(deltaDisplay)}
              format={formatQuantity}
              unit={hoursUnit(period)}
              color={headlineColor}
              label={
                isFlat
                  ? 'No change in time'
                  : `${isIncrease ? 'Extra hours required' : 'Hours recovered'} ${perPeriodLabel(period)}`
              }
              range={
                isFlat || hoursRange.low === hoursRange.high
                  ? null
                  : `${formatQuantity(Math.abs(forPeriod(hoursRange.low, period)))} to ${formatQuantity(
                      Math.abs(forPeriod(hoursRange.high, period)),
                    )} ${hoursUnit(period)}`
              }
              sub={
                isFlat
                  ? 'The improved time matches the current time.'
                  : `${formatQuantity(Math.abs(daysDisplay))} eight-hour ${
                      Math.abs(daysDisplay) === 1 ? 'workday' : 'workdays'
                    }, ${formatPercent(Math.abs(results.reductionFraction))} of the task`
              }
            />

            {hasCost && valueDisplay !== null && (
              <Box
                sx={{
                  borderLeft: { xs: 'none', sm: '1px solid' },
                  borderTop: { xs: '1px solid', sm: 'none' },
                  borderColor: { xs: 'divider', sm: 'divider' },
                  pl: { xs: 0, sm: 3 },
                  pt: { xs: 2, sm: 0 },
                }}
              >
                <Headline
                  value={isFlat ? 0 : Math.abs(valueDisplay)}
                  format={formatMoney}
                  unit={moneyUnit(period)}
                  color={isIncrease ? ADDED_COLOR : RECOVERED_COLOR}
                  label={
                    isIncrease
                      ? `Added labor cost ${perPeriodLabel(period)}`
                      : `Value of that time ${perPeriodLabel(period)}`
                  }
                  range={
                    isFlat || valueRange === null
                      ? null
                      : `${formatMoney(Math.abs(forPeriod(valueRange.low, period)))} to ${formatMoney(
                          Math.abs(forPeriod(valueRange.high, period)),
                        )}`
                  }
                  sub={
                    results.effectiveHourlyCost === null
                      ? ''
                      : `at ${formatMoney(results.effectiveHourlyCost)} per hour, fully loaded`
                  }
                />
              </Box>
            )}
          </Box>

          {!hasCost && (
            <Typography
              variant="body2"
              sx={{ mt: 1.5, color: 'text.secondary', textAlign: { xs: 'left', md: 'center' } }}
            >
              Add an hourly labor cost on the left to see what that time is worth, when it pays
              for itself, and the return on the spend.
            </Typography>
          )}

          {/* Before / after bars */}
          <Box sx={{ mt: 3.5 }} role="img" aria-label={textEquivalent}>
            <BeforeAfterBars
              currentAnnualHours={results.currentAnnualHours}
              improvedAnnualHours={results.improvedAnnualHours}
              currentValue={currentVal}
              improvedValue={improvedVal}
              period={period}
              isIncrease={isIncrease}
              reduce={reduce}
            />
          </Box>

          {!isFlat && (
            <Stack
              direction="row"
              spacing={0.75}
              sx={{
                mt: 1.5,
                alignItems: 'center',
                color: isIncrease ? ADDED_COLOR : RECOVERED_COLOR,
                fontWeight: 700,
              }}
            >
              <ArrowUpwardRoundedIcon
                sx={{ fontSize: 18, transform: isIncrease ? 'rotate(45deg)' : 'none' }}
              />
              <Typography component="span" sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                {`${formatQuantity(Math.abs(deltaDisplay))} ${hoursUnit(period)} ${
                  isIncrease ? 'added' : 'recovered'
                }`}
              </Typography>
            </Stack>
          )}

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(3, 1fr)' },
              gap: 1.5,
              mt: 3,
            }}
          >
            <StatTile label="Runs per year" value={formatCount(results.annualExecutions)} />
            <StatTile
              label="Time per run today"
              value={formatDuration(inputs.currentSeconds)}
              note={
                inputs.assumptions.reworkPct > 0
                  ? `plus ${formatCount(inputs.assumptions.reworkPct)}% rework`
                  : undefined
              }
            />
            <StatTile
              label="Time per run after"
              value={formatDuration(inputs.improvedSeconds)}
              note={
                inputs.assumptions.adoptionPct < 100
                  ? `on ${formatCount(inputs.assumptions.adoptionPct)}% of runs`
                  : undefined
              }
            />
          </Box>

          <Typography variant="caption" sx={{ display: 'block', mt: 2, color: 'text.secondary' }}>
            {textEquivalent}
          </Typography>
        </>
      )}
      <Box aria-live="polite" sx={srOnly}>
        {liveText}
      </Box>

      <Box sx={{ mt: 2.5 }}>
        <Expandable title="How this is calculated" open={mathOpen} onToggle={onToggleMath}>
          <MathBreakdown results={results} inputs={inputs} hasCost={hasCost} />
        </Expandable>
      </Box>
    </Paper>
  );
}
