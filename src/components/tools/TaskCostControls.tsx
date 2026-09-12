import { useState, type ReactNode } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import Collapse from '@mui/material/Collapse';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Slider from '@mui/material/Slider';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Button from '@mui/material/Button';
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import { useReducedMotion } from 'framer-motion';
import { DurationField } from './DurationField';
import { Expandable } from './Expandable';
import { SliderField } from './SliderField';
import { sanitizeNumeric } from '../../pages/tools/parseInput';
import { formatDuration, formatMoney } from '../../pages/tools/taskCostFormat';
import type { FormErrors, FormState } from '../../pages/tools/taskCostForm';
import {
  DEFAULT_ASSUMPTIONS,
  DEFAULT_INVESTMENT,
  DEFAULT_SCHEDULE,
  type Frequency,
} from '../../pages/tools/taskCostModel';

export type PanelKey = 'schedule' | 'assumptions' | 'investment';

interface TaskCostControlsProps {
  form: FormState;
  errors: FormErrors;
  onPatch: (patch: Partial<FormState>) => void;
  onReset: () => void;
  openPanels: Record<PanelKey, boolean>;
  onTogglePanel: (key: PanelKey) => void;
}

const SCHEDULE_NOTE: Record<Frequency, string> = {
  workday:
    'Runs per year = runs per workday x workdays per week x working weeks per year. Both settings below apply.',
  week: 'Runs per year = runs per week x working weeks per year. Only working weeks per year applies here; workdays per week is ignored.',
  month:
    'Runs per year = runs per month x 12. Neither setting below applies, a monthly rate always uses 12 months.',
};

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <Typography
      variant="overline"
      sx={{ display: 'block', color: 'primary.main', fontWeight: 700, letterSpacing: 1, mb: 1.5 }}
    >
      {children}
    </Typography>
  );
}

function NumericField({
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

/** "2 changed" for a collapsed panel, or null when everything in it is still default. */
function changeBadge(count: number): string | null {
  return count > 0 ? `${count} changed` : null;
}

/**
 * A lightweight disclosure nested *inside* an already-open `Expandable` panel, for the
 * handful of inputs most visitors never need to touch (rework, value realization, payback
 * timing). Deliberately not a second `Expandable`: a bordered box inside a bordered box
 * reads as clutter, so this is just a text button over a `Collapse`.
 */
function MoreToggle({
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

export function TaskCostControls({
  form,
  errors,
  onPatch,
  onReset,
  openPanels,
  onTogglePanel,
}: TaskCostControlsProps) {
  const sliderMax = Math.max(60, Math.ceil(form.currentSeconds));
  const sliderStep = sliderMax > 1200 ? 5 : 1;
  const improvedLonger = form.improvedSeconds > form.currentSeconds && form.currentSeconds > 0;
  const hourly = Number(form.hourlyRaw);
  const hasHourly = form.hourlyRaw.trim() !== '' && Number.isFinite(hourly) && !errors.hourly;

  // Nested "more" disclosures, initialized once from whatever the page loaded with (the
  // example, or a decoded shared link) so a link that sets one of these never hides a value
  // the recipient can't see. They don't need to react to a later preset pick, that already
  // matches how the outer panels behave: picking a preset shows a "changed" badge rather
  // than forcing panels open, and this stays consistent with it.
  const [moreAssumptionsOpen, setMoreAssumptionsOpen] = useState(
    () =>
      form.reworkPct !== DEFAULT_ASSUMPTIONS.reworkPct ||
      form.improvedReworkPct !== DEFAULT_ASSUMPTIONS.improvedReworkPct ||
      form.realizationPct !== DEFAULT_ASSUMPTIONS.realizationPct,
  );
  const [moreInvestmentOpen, setMoreInvestmentOpen] = useState(
    () =>
      form.rampMonths !== DEFAULT_INVESTMENT.rampMonths ||
      form.horizonMonths !== DEFAULT_INVESTMENT.horizonMonths,
  );

  const scheduleChanges =
    Number(Number(form.workdaysRaw) !== DEFAULT_SCHEDULE.workdaysPerWeek) +
    Number(Number(form.weeksRaw) !== DEFAULT_SCHEDULE.workingWeeksPerYear);

  const assumptionChanges =
    Number(form.adoptionPct !== DEFAULT_ASSUMPTIONS.adoptionPct) +
    Number(form.reworkPct !== DEFAULT_ASSUMPTIONS.reworkPct) +
    Number(form.improvedReworkPct !== DEFAULT_ASSUMPTIONS.improvedReworkPct) +
    Number(form.realizationPct !== DEFAULT_ASSUMPTIONS.realizationPct) +
    Number(form.uncertaintyPct !== DEFAULT_ASSUMPTIONS.uncertaintyPct);

  const moreAssumptionChanges =
    Number(form.reworkPct !== DEFAULT_ASSUMPTIONS.reworkPct) +
    Number(form.improvedReworkPct !== DEFAULT_ASSUMPTIONS.improvedReworkPct) +
    Number(form.realizationPct !== DEFAULT_ASSUMPTIONS.realizationPct);

  const investmentChanges =
    Number(form.buildCostRaw.trim() !== '') +
    Number(form.monthlyCostRaw.trim() !== '') +
    Number(form.rampMonths !== DEFAULT_INVESTMENT.rampMonths) +
    Number(form.horizonMonths !== DEFAULT_INVESTMENT.horizonMonths);

  const moreInvestmentChanges =
    Number(form.rampMonths !== DEFAULT_INVESTMENT.rampMonths) +
    Number(form.horizonMonths !== DEFAULT_INVESTMENT.horizonMonths);

  /** Quick jumps for the improved time, phrased the way people actually describe a fix. */
  const quickTargets: { label: string; seconds: number }[] = [
    { label: 'Half the time', seconds: Math.round(form.currentSeconds / 2) },
    { label: '90% faster', seconds: Math.round(form.currentSeconds / 10) },
    { label: 'Near instant', seconds: Math.min(5, Math.round(form.currentSeconds / 10)) },
  ];

  return (
    <Paper
      variant="outlined"
      sx={{ p: { xs: 2.5, md: 3 }, borderRadius: 3, '@media print': { display: 'none' } }}
    >
      <Stack spacing={3}>
        <Box>
          <SectionLabel>The task today</SectionLabel>
          <Stack spacing={2.5}>
            <DurationField
              label="Current time per task"
              seconds={form.currentSeconds}
              onChange={(currentSeconds) => onPatch({ currentSeconds })}
            />
            <NumericField
              label="Total task runs across the team"
              value={form.executionsRaw}
              onChange={(executionsRaw) => onPatch({ executionsRaw })}
              error={errors.executions}
              helperText="Everyone who runs this task, added together. Not a per-person figure."
            />
            <Box>
              <Typography
                component="span"
                id="frequency-label"
                sx={{ display: 'block', fontSize: 14, fontWeight: 600, color: 'text.primary', mb: 1 }}
              >
                How often that many runs happen
              </Typography>
              <ToggleButtonGroup
                exclusive
                value={form.frequency}
                onChange={(_, value: Frequency | null) => {
                  if (value) onPatch({ frequency: value });
                }}
                size="small"
                fullWidth
                aria-labelledby="frequency-label"
              >
                <ToggleButton value="workday">Per workday</ToggleButton>
                <ToggleButton value="week">Per week</ToggleButton>
                <ToggleButton value="month">Per month</ToggleButton>
              </ToggleButtonGroup>
            </Box>
          </Stack>
        </Box>

        <Divider />

        <Box>
          <SectionLabel>After improvement</SectionLabel>
          <Stack spacing={2.5}>
            <DurationField
              label="Estimated time per task after improvement"
              seconds={form.improvedSeconds}
              onChange={(improvedSeconds) => onPatch({ improvedSeconds })}
              helperText="Your estimate. Not a promise of what can be automated."
            />
            <Box>
              <Slider
                value={Math.min(form.improvedSeconds, sliderMax)}
                min={0}
                max={sliderMax}
                step={sliderStep}
                onChange={(_, value) => onPatch({ improvedSeconds: value as number })}
                valueLabelDisplay="auto"
                valueLabelFormat={(value) => formatDuration(value)}
                getAriaValueText={(value) => formatDuration(value)}
                aria-label="Estimated time per task after improvement"
                sx={{ mt: 1 }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  0s
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {formatDuration(sliderMax)} (current)
                </Typography>
              </Box>
              {form.currentSeconds > 0 && (
                <Stack direction="row" spacing={0.75} sx={{ mt: 1, flexWrap: 'wrap' }} useFlexGap>
                  {quickTargets.map((target) => (
                    <Chip
                      key={target.label}
                      label={target.label}
                      size="small"
                      variant="outlined"
                      onClick={() => onPatch({ improvedSeconds: target.seconds })}
                    />
                  ))}
                </Stack>
              )}
              {improvedLonger && (
                <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'warning.main' }}>
                  Longer than the current time. The results show the extra time this would add.
                </Typography>
              )}
            </Box>
          </Stack>
        </Box>

        <Divider />

        <Box>
          <SectionLabel>Labor cost (optional)</SectionLabel>
          <Stack spacing={2}>
            <NumericField
              label="Hourly labor cost"
              value={form.hourlyRaw}
              onChange={(hourlyRaw) => onPatch({ hourlyRaw })}
              error={errors.hourly}
              helperText={
                hasHourly
                  ? undefined
                  : 'Leave blank for time only. Add it for money, payback and ROI.'
              }
              startAdornment="$"
              width={200}
            />
            {hasHourly && (
              <SliderField
                label="Fully loaded multiplier"
                value={form.loadingMultiplier}
                onChange={(loadingMultiplier) => onPatch({ loadingMultiplier })}
                min={1}
                max={2}
                step={0.05}
                format={(v) => `${v.toFixed(2)}x`}
                help={`An employee costs more than their wage: taxes, benefits, equipment, space. 1.25x to 1.4x is typical. Using ${formatMoney(
                  hourly * form.loadingMultiplier,
                )} per hour.`}
              />
            )}
          </Stack>
        </Box>

        <Expandable
          title="Working schedule"
          badge={changeBadge(scheduleChanges)}
          hint="Workdays per week and working weeks per year"
          open={openPanels.schedule}
          onToggle={() => onTogglePanel('schedule')}
        >
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap' }} useFlexGap>
              <NumericField
                label="Workdays per week"
                value={form.workdaysRaw}
                onChange={(workdaysRaw) => onPatch({ workdaysRaw })}
                error={errors.workdays}
                width={160}
              />
              <NumericField
                label="Working weeks per year"
                value={form.weeksRaw}
                onChange={(weeksRaw) => onPatch({ weeksRaw })}
                error={errors.weeks}
                width={190}
              />
            </Stack>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {SCHEDULE_NOTE[form.frequency]}
            </Typography>
          </Stack>
        </Expandable>

        <Expandable
          title="How realistic is this?"
          badge={changeBadge(assumptionChanges)}
          hint="Adoption and how confident you are"
          open={openPanels.assumptions}
          onToggle={() => onTogglePanel('assumptions')}
        >
          <Stack spacing={2.75} sx={{ mt: 1.5 }}>
            <SliderField
              label="Adoption"
              value={form.adoptionPct}
              onChange={(adoptionPct) => onPatch({ adoptionPct })}
              min={0}
              max={100}
              step={5}
              format={(v) => `${v}%`}
              help="Share of runs that actually move to the new way. Exceptions, holdouts and edge cases keep running the old one."
            />
            <SliderField
              label="Confidence band"
              value={form.uncertaintyPct}
              onChange={(uncertaintyPct) => onPatch({ uncertaintyPct })}
              min={0}
              max={50}
              step={5}
              format={(v) => `+/- ${v}%`}
              help="How far off your estimates could be. Sets the range shown under the headline."
            />

            <MoreToggle
              label="Rework and value realization"
              badge={changeBadge(moreAssumptionChanges)}
              open={moreAssumptionsOpen}
              onToggle={() => setMoreAssumptionsOpen((v) => !v)}
            >
              <SliderField
                label="Runs redone today"
                value={form.reworkPct}
                onChange={(reworkPct) => onPatch({ reworkPct })}
                min={0}
                max={50}
                step={1}
                format={(v) => `${v}%`}
                help="How often the task has to be done twice because something was wrong. Manual re-keying is where this hides."
              />
              <SliderField
                label="Runs redone after"
                value={form.improvedReworkPct}
                onChange={(improvedReworkPct) => onPatch({ improvedReworkPct })}
                min={0}
                max={50}
                step={1}
                format={(v) => `${v}%`}
                help="The same figure once the change is in. Rarely zero."
              />
              <SliderField
                label="Value realization"
                value={form.realizationPct}
                onChange={(realizationPct) => onPatch({ realizationPct })}
                min={0}
                max={100}
                step={5}
                format={(v) => `${v}%`}
                help="Share of recovered time that turns into other useful work. Five minutes handed back eleven times a day is harder to bank than one clear hour. Affects money only, never the hours."
              />
            </MoreToggle>
          </Stack>
        </Expandable>

        <Expandable
          title="Cost of the fix"
          badge={changeBadge(investmentChanges)}
          hint="Add a build cost to get payback and ROI"
          open={openPanels.investment}
          onToggle={() => onTogglePanel('investment')}
        >
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap' }} useFlexGap>
              <NumericField
                label="One-time build cost"
                value={form.buildCostRaw}
                onChange={(buildCostRaw) => onPatch({ buildCostRaw })}
                error={errors.buildCost}
                startAdornment="$"
                width={170}
              />
              <NumericField
                label="Running cost / month"
                value={form.monthlyCostRaw}
                onChange={(monthlyCostRaw) => onPatch({ monthlyCostRaw })}
                error={errors.monthlyCost}
                startAdornment="$"
                width={170}
              />
            </Stack>

            <MoreToggle
              label="Adjust the projection"
              badge={changeBadge(moreInvestmentChanges)}
              open={moreInvestmentOpen}
              onToggle={() => setMoreInvestmentOpen((v) => !v)}
            >
              <SliderField
                label="Time to full use"
                value={form.rampMonths}
                onChange={(rampMonths) => onPatch({ rampMonths })}
                min={0}
                max={12}
                step={1}
                format={(v) => (v <= 1 ? 'immediate' : `${v} months`)}
                help="Nothing lands on day one. The saving phases in evenly across this period. Assumed immediate until you say otherwise."
              />
              <SliderField
                label="Look ahead"
                value={form.horizonMonths}
                onChange={(horizonMonths) => onPatch({ horizonMonths })}
                min={6}
                max={60}
                step={6}
                format={(v) => `${v} months`}
                help="How far the payback chart projects. Defaults to three years."
              />
            </MoreToggle>

            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Leave the cost fields blank to skip payback and just see the time and money
              recovered.
            </Typography>
          </Stack>
        </Expandable>

        <Box>
          <Button variant="text" size="small" startIcon={<RestartAltRoundedIcon />} onClick={onReset}>
            Reset example
          </Button>
        </Box>
      </Stack>
    </Paper>
  );
}
