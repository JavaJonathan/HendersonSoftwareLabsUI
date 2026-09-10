import type { ReactNode } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Slider from '@mui/material/Slider';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Button from '@mui/material/Button';
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded';
import { DurationField } from './DurationField';
import { Expandable } from './Expandable';
import { sanitizeNumeric } from '../../pages/tools/parseInput';
import { formatDuration } from '../../pages/tools/taskCostFormat';
import type { Frequency } from '../../pages/tools/taskCostModel';

interface TaskCostControlsProps {
  currentSeconds: number;
  improvedSeconds: number;
  onCurrentSeconds: (seconds: number) => void;
  onImprovedSeconds: (seconds: number) => void;

  executionsRaw: string;
  onExecutionsRaw: (value: string) => void;
  executionsError: string | null;

  frequency: Frequency;
  onFrequency: (frequency: Frequency) => void;

  hourlyRaw: string;
  onHourlyRaw: (value: string) => void;
  hourlyError: string | null;

  workdaysRaw: string;
  weeksRaw: string;
  onWorkdaysRaw: (value: string) => void;
  onWeeksRaw: (value: string) => void;
  workdaysError: string | null;
  weeksError: string | null;

  scheduleOpen: boolean;
  onToggleSchedule: () => void;

  onReset: () => void;
}

const SCHEDULE_NOTE: Record<Frequency, string> = {
  workday:
    'Runs per year = runs per workday x workdays per week x working weeks per year. Both settings below apply.',
  week: 'Runs per year = runs per week x working weeks per year. Only working weeks per year applies here; workdays per week is ignored.',
  month:
    'Runs per year = runs per month x 12. Neither setting below applies - a monthly rate always uses 12 months.',
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

export function TaskCostControls({
  currentSeconds,
  improvedSeconds,
  onCurrentSeconds,
  onImprovedSeconds,
  executionsRaw,
  onExecutionsRaw,
  executionsError,
  frequency,
  onFrequency,
  hourlyRaw,
  onHourlyRaw,
  hourlyError,
  workdaysRaw,
  weeksRaw,
  onWorkdaysRaw,
  onWeeksRaw,
  workdaysError,
  weeksError,
  scheduleOpen,
  onToggleSchedule,
  onReset,
}: TaskCostControlsProps) {
  const sliderMax = Math.max(60, Math.ceil(currentSeconds));
  const sliderStep = sliderMax > 1200 ? 5 : 1;
  const improvedLonger = improvedSeconds > currentSeconds && currentSeconds > 0;

  return (
    <Paper variant="outlined" sx={{ p: { xs: 2.5, md: 3 }, borderRadius: 3 }}>
      <Stack spacing={3}>
        <Box>
          <SectionLabel>The task today</SectionLabel>
          <Stack spacing={2.5}>
            <DurationField
              label="Current time per task"
              seconds={currentSeconds}
              onChange={onCurrentSeconds}
            />
            <NumericField
              label="Total task runs across the team"
              value={executionsRaw}
              onChange={onExecutionsRaw}
              error={executionsError}
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
                value={frequency}
                onChange={(_, value: Frequency | null) => {
                  if (value) onFrequency(value);
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
              seconds={improvedSeconds}
              onChange={onImprovedSeconds}
              helperText="Your estimate. Not a promise of what can be automated."
            />
            <Box>
              <Slider
                value={Math.min(improvedSeconds, sliderMax)}
                min={0}
                max={sliderMax}
                step={sliderStep}
                onChange={(_, value) => onImprovedSeconds(value as number)}
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
              {improvedLonger && (
                <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: 'warning.main' }}>
                  Longer than the current time. The results show the extra time this would add.
                </Typography>
              )}
            </Box>
          </Stack>
        </Box>

        <Divider />

        <Box>
          <SectionLabel>Optional</SectionLabel>
          <NumericField
            label="Hourly labor cost"
            value={hourlyRaw}
            onChange={onHourlyRaw}
            error={hourlyError}
            helperText="Leave blank for time only. Add it to also estimate the value of recovered time."
            startAdornment="$"
            width={200}
          />
        </Box>

        <Expandable title="Working schedule" open={scheduleOpen} onToggle={onToggleSchedule}>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap' }} useFlexGap>
              <NumericField
                label="Workdays per week"
                value={workdaysRaw}
                onChange={onWorkdaysRaw}
                error={workdaysError}
                width={160}
              />
              <NumericField
                label="Working weeks per year"
                value={weeksRaw}
                onChange={onWeeksRaw}
                error={weeksError}
                width={190}
              />
            </Stack>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {SCHEDULE_NOTE[frequency]}
            </Typography>
          </Stack>
        </Expandable>

        <Box>
          <Button
            variant="text"
            size="small"
            startIcon={<RestartAltRoundedIcon />}
            onClick={onReset}
          >
            Reset example
          </Button>
        </Box>
      </Stack>
    </Paper>
  );
}
