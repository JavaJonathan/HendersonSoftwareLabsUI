import { useEffect, useMemo, useReducer, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { Footer } from '../../components/layout/Footer';
import { Reveal } from '../../components/motion/Reveal';
import { GradientBackdrop } from '../../components/motion/GradientBackdrop';
import { TaskCostControls } from '../../components/tools/TaskCostControls';
import { TaskCostResults } from '../../components/tools/TaskCostResults';
import { parseHourly, parseRange } from './parseInput';
import {
  calculateTaskCost,
  DEFAULT_SCHEDULE,
  EXAMPLE_INPUTS,
  forPeriod,
  type DisplayPeriod,
  type Frequency,
  type TaskCostInputs,
} from './taskCostModel';
import { formatQuantity, hoursUnit } from './taskCostFormat';

const CONTACT_HREF = 'mailto:jonathan@HendersonSoftwareLabs.com?subject=Improving%20a%20workflow';

interface FormState {
  currentSeconds: number;
  improvedSeconds: number;
  executionsRaw: string;
  frequency: Frequency;
  hourlyRaw: string;
  workdaysRaw: string;
  weeksRaw: string;
}

const EXAMPLE_STATE: FormState = {
  currentSeconds: EXAMPLE_INPUTS.currentSeconds,
  improvedSeconds: EXAMPLE_INPUTS.improvedSeconds,
  executionsRaw: String(EXAMPLE_INPUTS.executionsPerPeriod),
  frequency: EXAMPLE_INPUTS.frequency,
  hourlyRaw: '',
  workdaysRaw: String(EXAMPLE_INPUTS.schedule.workdaysPerWeek),
  weeksRaw: String(EXAMPLE_INPUTS.schedule.workingWeeksPerYear),
};

type FieldKey = 'executionsRaw' | 'hourlyRaw' | 'workdaysRaw' | 'weeksRaw';

type FormAction =
  | { type: 'currentSeconds'; value: number }
  | { type: 'improvedSeconds'; value: number }
  | { type: 'frequency'; value: Frequency }
  | { type: 'field'; key: FieldKey; value: string }
  | { type: 'reset' };

function reducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case 'currentSeconds':
      return { ...state, currentSeconds: action.value };
    case 'improvedSeconds':
      return { ...state, improvedSeconds: action.value };
    case 'frequency':
      return { ...state, frequency: action.value };
    case 'field':
      return { ...state, [action.key]: action.value };
    case 'reset':
      return { ...EXAMPLE_STATE };
  }
}

export function TaskCostCalculatorPage() {
  const [state, dispatch] = useReducer(reducer, EXAMPLE_STATE);
  const [period, setPeriod] = useState<DisplayPeriod>('year');
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [mathOpen, setMathOpen] = useState(false);

  useEffect(() => {
    const previous = document.title;
    document.title = 'Task Cost Calculator | Henderson Software Labs';
    return () => {
      document.title = previous;
    };
  }, []);

  const executions = useMemo(
    () => parseRange(state.executionsRaw, { min: 0, allowEmpty: true, emptyValue: 0 }),
    [state.executionsRaw],
  );
  const workdays = useMemo(
    () =>
      parseRange(state.workdaysRaw, { min: 1, max: 7, fallback: DEFAULT_SCHEDULE.workdaysPerWeek }),
    [state.workdaysRaw],
  );
  const weeks = useMemo(
    () =>
      parseRange(state.weeksRaw, {
        min: 0,
        minExclusive: true,
        max: 52,
        fallback: DEFAULT_SCHEDULE.workingWeeksPerYear,
      }),
    [state.weeksRaw],
  );
  const hourly = useMemo(() => parseHourly(state.hourlyRaw), [state.hourlyRaw]);

  const inputs = useMemo<TaskCostInputs>(
    () => ({
      currentSeconds: state.currentSeconds,
      improvedSeconds: state.improvedSeconds,
      executionsPerPeriod: executions.value,
      frequency: state.frequency,
      schedule: {
        workdaysPerWeek: workdays.value,
        workingWeeksPerYear: weeks.value,
      },
      hourlyCost: hourly.value,
    }),
    [
      state.currentSeconds,
      state.improvedSeconds,
      state.frequency,
      executions.value,
      workdays.value,
      weeks.value,
      hourly.value,
    ],
  );

  const results = useMemo(() => calculateTaskCost(inputs), [inputs]);
  const hasCost = hourly.value !== null;

  const stickyDelta = Math.abs(forPeriod(results.annualHoursDelta, period));
  const showSticky =
    results.annualExecutions > 0 && results.currentAnnualHours > 0 && stickyDelta > 1e-9;

  return (
    <>
      <Box sx={{ position: 'relative', overflow: 'hidden' }}>
        <GradientBackdrop />
        <Container maxWidth="lg" sx={{ pt: { xs: 4, md: 5 }, pb: { xs: 2, md: 3 }, position: 'relative' }}>
          <Reveal>
            <Link
              component={RouterLink}
              to="/"
              underline="none"
              color="text.secondary"
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.5,
                fontSize: 14,
                fontWeight: 500,
                mb: 4,
              }}
            >
              <ArrowBackIcon sx={{ fontSize: 16 }} />
              Henderson Software Labs
            </Link>
          </Reveal>

          <Reveal delay={0.08}>
            <Typography
              variant="overline"
              sx={{ color: 'primary.main', fontWeight: 700, letterSpacing: 1 }}
            >
              Free tool
            </Typography>
            <Typography
              variant="h1"
              sx={{ fontSize: { xs: 30, md: 44 }, color: 'text.primary', mt: 1, lineHeight: 1.12 }}
            >
              What is repetitive work costing you?
            </Typography>
            <Typography sx={{ mt: 2, maxWidth: 560, color: 'text.secondary', fontSize: { xs: 16, md: 18 } }}>
              See how small improvements add up to hours recovered.
            </Typography>
          </Reveal>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ pb: { xs: 6, md: 8 } }}>
        <Reveal>
          <Typography variant="body2" sx={{ mb: 2.5, color: 'text.secondary', maxWidth: 720 }}>
            Starts with an example scenario: a 5-minute task cut to 30 seconds, run 10 times per
            workday. These are example assumptions. Change any field to match your own, or use{' '}
            <Box component="span" sx={{ fontWeight: 700 }}>
              Reset example
            </Box>{' '}
            to return to it.
          </Typography>
        </Reveal>

        {showSticky && (
          <Box
            sx={{
              display: { xs: 'flex', md: 'none' },
              position: 'sticky',
              top: 0,
              zIndex: 5,
              alignItems: 'baseline',
              gap: 1,
              px: 2,
              py: 1.25,
              mb: 2,
              borderRadius: 2,
              bgcolor: 'rgba(255,255,255,0.9)',
              backdropFilter: 'saturate(180%) blur(8px)',
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Typography
              component="span"
              sx={{
                fontWeight: 800,
                fontSize: 20,
                color: results.isIncrease ? '#b45309' : 'primary.main',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {formatQuantity(stickyDelta)} {hoursUnit(period)}
            </Typography>
            <Typography component="span" sx={{ fontSize: 13, color: 'text.secondary', fontWeight: 600 }}>
              {results.isIncrease ? 'added' : 'recovered'}
            </Typography>
          </Box>
        )}

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'minmax(320px, 380px) 1fr' },
            gap: { xs: 3, md: 4 },
            alignItems: 'start',
          }}
        >
          <Box sx={{ order: { xs: 2, md: 1 } }}>
            <Reveal fullWidth>
              <TaskCostControls
                currentSeconds={state.currentSeconds}
                improvedSeconds={state.improvedSeconds}
                onCurrentSeconds={(value) => dispatch({ type: 'currentSeconds', value })}
                onImprovedSeconds={(value) => dispatch({ type: 'improvedSeconds', value })}
                executionsRaw={state.executionsRaw}
                onExecutionsRaw={(value) => dispatch({ type: 'field', key: 'executionsRaw', value })}
                executionsError={executions.error}
                frequency={state.frequency}
                onFrequency={(value) => dispatch({ type: 'frequency', value })}
                hourlyRaw={state.hourlyRaw}
                onHourlyRaw={(value) => dispatch({ type: 'field', key: 'hourlyRaw', value })}
                hourlyError={hourly.error}
                workdaysRaw={state.workdaysRaw}
                weeksRaw={state.weeksRaw}
                onWorkdaysRaw={(value) => dispatch({ type: 'field', key: 'workdaysRaw', value })}
                onWeeksRaw={(value) => dispatch({ type: 'field', key: 'weeksRaw', value })}
                workdaysError={workdays.error}
                weeksError={weeks.error}
                scheduleOpen={scheduleOpen}
                onToggleSchedule={() => setScheduleOpen((v) => !v)}
                onReset={() => dispatch({ type: 'reset' })}
              />
            </Reveal>
          </Box>

          <Box sx={{ order: { xs: 1, md: 2 } }}>
            <Reveal fullWidth>
              <TaskCostResults
                results={results}
                inputs={inputs}
                period={period}
                onPeriodChange={setPeriod}
                hasCost={hasCost}
                mathOpen={mathOpen}
                onToggleMath={() => setMathOpen((v) => !v)}
              />
            </Reveal>
          </Box>
        </Box>

        <Reveal>
          <Paper
            variant="outlined"
            sx={{ mt: 4, p: { xs: 2.5, md: 3 }, borderRadius: 3, bgcolor: 'primary.light' }}
          >
            <Typography variant="body2" sx={{ color: 'text.primary', maxWidth: 760 }}>
              Recovered time can support more work, faster service, or less overtime. It does not
              necessarily reduce payroll expenses. Monetary results represent estimated labor
              capacity, not guaranteed cash savings.
            </Typography>
            <Typography variant="caption" sx={{ display: 'block', mt: 1.5, color: 'text.secondary' }}>
              Everything is calculated in your browser. Nothing you enter is sent anywhere or saved.
            </Typography>
          </Paper>
        </Reveal>

        <Reveal>
          <Paper
            variant="outlined"
            sx={{ mt: 3, p: { xs: 3, md: 4 }, borderRadius: 3, textAlign: 'center' }}
          >
            <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary' }}>
              Want help improving this workflow?
            </Typography>
            <Typography
              variant="body2"
              sx={{ mt: 1, color: 'text.secondary', maxWidth: 460, mx: 'auto' }}
            >
              We build the automation, integration, or internal tool that makes a repetitive task
              faster.
            </Typography>
            <Button
              variant="contained"
              size="large"
              endIcon={<ArrowForwardIcon />}
              href={CONTACT_HREF}
              sx={{ mt: 2.5 }}
            >
              Book a call
            </Button>
          </Paper>
        </Reveal>
      </Container>

      <Footer />
    </>
  );
}
