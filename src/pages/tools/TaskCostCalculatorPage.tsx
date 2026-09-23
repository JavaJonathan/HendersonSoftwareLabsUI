import { useCallback, useEffect, useMemo, useReducer } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
import GlobalStyles from '@mui/material/GlobalStyles';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { Footer } from '../../components/layout/Footer';
import { Reveal } from '../../components/motion/Reveal';
import { GradientBackdrop } from '../../components/motion/GradientBackdrop';
import { TaskCostControls, type PanelKey } from '../../components/tools/TaskCostControls';
import { TaskCostResults } from '../../components/tools/TaskCostResults';
import { PaybackPanel } from '../../components/tools/PaybackPanel';
import { SensitivityPanel } from '../../components/tools/SensitivityPanel';
import { ShareBar } from '../../components/tools/ShareBar';
import { usePageMeta } from '../../hooks/usePageMeta';
import { EXAMPLE_FORM, resolveForm, toFormState, type FormState } from './taskCostForm';
import { buildCsv, buildSummaryText, slugify } from './taskCostExport';
import { toInputs, type Scenario } from './taskCostScenario';
import { decodeScenario, encodeScenario, hasScenarioParams } from './taskCostUrl';
import {
  calculateTaskCost,
  DEFAULT_INVESTMENT,
  forPeriod,
  projectCashflow,
  sensitivity,
  type DisplayPeriod,
} from './taskCostModel';
import { formatMoney, formatQuantity, hoursUnit } from './taskCostFormat';

const CONTACT_HREF = 'mailto:jonathan@HendersonSoftwareLabs.com?subject=Improving%20a%20workflow';
const CANONICAL = 'https://hendersonsoftwarelabs.com/tools/task-cost-calculator';
const META_DESCRIPTION =
  'Work out what a repetitive task costs your team per year, what fixing it is worth, and how long it takes to pay for itself. Free, runs entirely in your browser, and every result has a shareable link.';

const JSON_LD = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Repetitive Task Cost Calculator',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Any',
  url: CANONICAL,
  description: META_DESCRIPTION,
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  publisher: { '@type': 'Organization', name: 'Henderson Software Labs' },
});

/** Where the numbers on screen came from, which decides how the page introduces them. */
type Origin = 'example' | 'shared';

interface PageState {
  form: FormState;
  period: DisplayPeriod;
  origin: Origin;
  /** True once the visitor has changed anything, so the numbers are theirs now. */
  touched: boolean;
  panels: Record<PanelKey, boolean>;
}

type PageAction =
  | { type: 'patch'; patch: Partial<FormState> }
  | { type: 'period'; period: DisplayPeriod }
  | { type: 'panel'; key: PanelKey }
  | { type: 'openPanel'; key: PanelKey }
  | { type: 'reset' };

const CLOSED_PANELS: Record<PanelKey, boolean> = {
  schedule: false,
  assumptions: false,
  investment: false,
};

function reducer(state: PageState, action: PageAction): PageState {
  switch (action.type) {
    case 'patch':
      return {
        ...state,
        form: { ...state.form, ...action.patch },
        touched: true,
      };
    case 'period':
      return { ...state, period: action.period };
    case 'panel':
      return { ...state, panels: { ...state.panels, [action.key]: !state.panels[action.key] } };
    case 'openPanel':
      return { ...state, panels: { ...state.panels, [action.key]: true } };
    case 'reset':
      return {
        form: EXAMPLE_FORM,
        period: 'year',
        origin: 'example',
        touched: false,
        panels: { ...CLOSED_PANELS },
      };
  }
}

/**
 * A shared link is the tool's save file, so the URL is read before anything renders. A link
 * that sets an assumption also opens the panel holding it, otherwise the recipient sees a
 * number they cannot account for behind a panel that looks shut and empty.
 */
function initialState(): PageState {
  const search = typeof window === 'undefined' ? '' : window.location.search;
  if (!hasScenarioParams(search)) {
    return {
      form: EXAMPLE_FORM,
      period: 'year',
      origin: 'example',
      touched: false,
      panels: { ...CLOSED_PANELS },
    };
  }

  const scenario = decodeScenario(search);
  const form = toFormState(scenario);
  return {
    form,
    period: scenario.period,
    origin: 'shared',
    touched: false,
    panels: {
      schedule: false,
      assumptions:
        form.adoptionPct !== EXAMPLE_FORM.adoptionPct ||
        form.reworkPct !== EXAMPLE_FORM.reworkPct ||
        form.improvedReworkPct !== EXAMPLE_FORM.improvedReworkPct ||
        form.realizationPct !== EXAMPLE_FORM.realizationPct,
      investment:
        form.buildCostRaw !== '' ||
        form.monthlyCostRaw !== '' ||
        form.rampMonths !== DEFAULT_INVESTMENT.rampMonths ||
        form.horizonMonths !== DEFAULT_INVESTMENT.horizonMonths,
    },
  };
}

export function TaskCostCalculatorPage() {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);
  const [mathOpen, toggleMath] = useReducer((open: boolean) => !open, false);
  // One-way reveal: nobody needs to re-hide the tornado chart once they've asked for it.
  const [sensitivityOpen, openSensitivity] = useReducer(() => true, false);

  usePageMeta({
    title: 'Task Cost Calculator: what repetitive work costs | Henderson Software Labs',
    description: META_DESCRIPTION,
    canonical: CANONICAL,
    jsonLd: JSON_LD,
  });

  const { scenario: resolved, errors } = useMemo(() => resolveForm(state.form), [state.form]);
  const scenario = useMemo<Scenario>(
    () => ({ ...resolved, period: state.period }),
    [resolved, state.period],
  );

  const inputs = useMemo(() => toInputs(scenario), [scenario]);
  const results = useMemo(() => calculateTaskCost(inputs), [inputs]);
  const projection = useMemo(
    () => projectCashflow(results, inputs.investment),
    [results, inputs.investment],
  );
  const drivers = useMemo(() => sensitivity(inputs), [inputs]);

  const hasCost = results.annualValueDelta !== null;
  const hasInput = results.annualExecutions > 0 && results.currentAnnualHours > 0;

  // Keep the address bar in step with the form, quietly. `replaceState` rather than a router
  // navigation: the query string is state, not a destination, and nobody wants twenty
  // history entries from dragging one slider.
  const query = useMemo(() => encodeScenario(scenario), [scenario]);
  useEffect(() => {
    const id = window.setTimeout(() => {
      const next = `${window.location.pathname}${query ? `?${query}` : ''}`;
      window.history.replaceState(null, '', next);
    }, 350);
    return () => window.clearTimeout(id);
  }, [query]);

  const shareUrl = useMemo(() => {
    const origin = typeof window === 'undefined' ? CANONICAL : `${window.location.origin}${window.location.pathname}`;
    return query ? `${origin}?${query}` : origin;
  }, [query]);

  const exportBundle = useMemo(
    () => ({ scenario, results, projection, shareUrl }),
    [scenario, results, projection, shareUrl],
  );

  const onPatch = useCallback((patch: Partial<FormState>) => dispatch({ type: 'patch', patch }), []);
  const onTogglePanel = useCallback((key: PanelKey) => dispatch({ type: 'panel', key }), []);
  const onPeriodChange = useCallback(
    (period: DisplayPeriod) => dispatch({ type: 'period', period }),
    [],
  );

  const stickyDelta = Math.abs(forPeriod(results.annualHoursDelta, state.period));
  const showSticky = hasInput && stickyDelta > 1e-9;

  // Someone arriving on a shared link is looking at another person's numbers. Telling them
  // it is "an example: a 5-minute task" when the page shows an invoice workflow is the one
  // sentence that would make the whole share feature feel broken.
  const introText =
    state.origin === 'shared' && !state.touched
      ? 'Opened from a shared link, already filled in with somebody else’s numbers. Change anything you disagree with and the link updates as you go, so you can send it back.'
      : state.touched
        ? 'These are your numbers. The link at the bottom of the page carries all of them, or use Reset example to start over.'
        : 'Loaded with an example: a 5-minute task cut to 30 seconds, run 10 times per workday. Change any field to match your own.';

  return (
    <>
      {/* A printed copy should read as a one-page memo: the answer, the charts, the caveats. */}
      <GlobalStyles
        styles={{
          '@media print': {
            body: { background: '#ffffff' },
            'a[href]::after': { content: '""' },
          },
        }}
      />

      <Box sx={{ position: 'relative', overflow: 'hidden' }}>
        <Box sx={{ '@media print': { display: 'none' } }}>
          <GradientBackdrop />
        </Box>
        <Container
          maxWidth="lg"
          sx={{ pt: { xs: 4, md: 5 }, pb: { xs: 2, md: 3 }, position: 'relative' }}
        >
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
                '@media print': { display: 'none' },
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
            <Typography
              sx={{ mt: 2, maxWidth: 620, color: 'text.secondary', fontSize: { xs: 16, md: 18 } }}
            >
              Put in how long a task takes and how often it runs. Get the hours it eats a year,
              what they are worth, how long a fix takes to pay for itself, and which of your
              assumptions the whole answer is resting on.
            </Typography>
          </Reveal>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ pb: { xs: 6, md: 8 } }}>
        <Reveal>
          <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary', maxWidth: 760 }}>
            {introText}
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
              '@media print': { display: 'none' },
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
              {formatQuantity(stickyDelta)} {hoursUnit(state.period)}
            </Typography>
            <Typography
              component="span"
              sx={{ fontSize: 13, color: 'text.secondary', fontWeight: 600 }}
            >
              {results.isIncrease ? 'added' : 'recovered'}
            </Typography>
          </Box>
        )}

        <Box
          sx={{
            display: 'grid',
            // Every track is `minmax(0, 1fr)`, not bare `1fr`: a plain `1fr` track is
            // shorthand for `minmax(auto, 1fr)`, so if anything inside it (the dual-headline
            // row, the tornado chart's labels, `PaybackChart`'s `useElementWidth`-sized SVG)
            // has a wider natural minimum than its fair share of the row, the whole grid
            // overflows the viewport instead of shrinking. Caught at 960px, just past the
            // `md` breakpoint where the two-column layout is tightest, and separately at
            // `xs`: a bare `1fr` there left the single mobile column free to grow to fit
            // `PaybackChart`'s SVG, which measures its own wrapper's width via
            // `getBoundingClientRect` to size itself, so an unconstrained wrapper and the
            // SVG's intrinsic width lock each other into staying wide instead of converging
            // on the viewport's actual width.
            gridTemplateColumns: {
              xs: 'minmax(0, 1fr)',
              md: 'minmax(320px, 380px) minmax(0, 1fr)',
            },
            gap: { xs: 3, md: 4 },
            alignItems: 'start',
            '@media print': { display: 'block' },
          }}
        >
          <Box
            sx={{
              // On mobile this puts Controls before Results (input before output, and
              // right above the fields the `showSticky` strip is tracking as they're
              // edited); on desktop it's just the left column. Same order value either
              // way, since the two-column desktop split already matches it.
              order: 1,
              // Controls has a ceiling: even every panel expanded, it tops out around
              // 1000-1200px. The result/payback/sensitivity/share column to the right has
              // none, it only grows. Pin the side with a ceiling, not the side that keeps
              // getting taller, that's what keeps this from ever leaving dead space beside
              // it. `maxHeight` + `overflowY` is a safety net for the rare case (every panel
              // open, on a short laptop screen) where controls itself would exceed the
              // viewport: it scrolls in its own lane rather than sticking with part of
              // itself permanently off-screen. Desktop only: the two-column layout only
              // exists at `md`+, and mobile already has its own compact sticky strip
              // (`showSticky`, above) rather than a full pinned sidebar.
              position: { md: 'sticky' },
              top: { md: 24 },
              alignSelf: 'start',
              maxHeight: { md: 'calc(100vh - 48px)' },
              overflowY: { md: 'auto' },
              '@media print': { position: 'static', maxHeight: 'none', overflow: 'visible' },
            }}
          >
            <Reveal fullWidth>
              <TaskCostControls
                form={state.form}
                errors={errors}
                onPatch={onPatch}
                onReset={() => dispatch({ type: 'reset' })}
                openPanels={state.panels}
                onTogglePanel={onTogglePanel}
              />
            </Reveal>
          </Box>

          {/* Everything about the computed result, in reading order: the number, the payback
              story, what it depends on, and how to send it. Grouped in one column so it
              reads as a single continuous answer while `TaskCostControls` stays pinned
              beside it, rather than being separated into full-width sections that used to
              sit below the whole grid. */}
          <Box sx={{ order: 2 }}>
            <Reveal fullWidth>
              <TaskCostResults
                results={results}
                inputs={inputs}
                period={state.period}
                onPeriodChange={onPeriodChange}
                hasCost={hasCost}
                mathOpen={mathOpen}
                onToggleMath={toggleMath}
              />
            </Reveal>

            {hasInput && projection && (
              <Reveal fullWidth>
                <PaybackPanel
                  projection={projection}
                  investment={inputs.investment}
                  isIncrease={results.isIncrease}
                  onAddCost={() => dispatch({ type: 'openPanel', key: 'investment' })}
                />
              </Reveal>
            )}

            {hasInput && (
              <Reveal fullWidth>
                <SensitivityPanel
                  entries={drivers}
                  base={hasCost ? (results.annualValueDelta ?? 0) : results.annualHoursDelta}
                  format={hasCost ? formatMoney : (v) => `${formatQuantity(v)} hrs`}
                  unitNoun="per year"
                  open={sensitivityOpen}
                  onOpen={openSensitivity}
                />
              </Reveal>
            )}

            {hasInput && (
              <Reveal fullWidth>
                <ShareBar
                  shareUrl={shareUrl}
                  summaryText={buildSummaryText(exportBundle)}
                  csvText={buildCsv(exportBundle)}
                  filename={slugify(scenario.taskName)}
                  taskName={state.form.taskName}
                  onTaskNameChange={(taskName) => onPatch({ taskName })}
                />
              </Reveal>
            )}
          </Box>
        </Box>

        <Reveal>
          <Paper
            variant="outlined"
            sx={{ mt: 3, p: { xs: 2.5, md: 3 }, borderRadius: 3, bgcolor: 'background.default' }}
          >
            <Typography sx={{ fontWeight: 800, color: 'text.primary', fontSize: 15 }}>
              What this number is, and what it is not
            </Typography>
            <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary', maxWidth: 760 }}>
              Recovered time is labor capacity, not cash that appears in an account. It supports
              more work, faster service, or less overtime, and it only becomes a saving if you do
              something with it. Monetary results are an estimate of that capacity.
            </Typography>
            <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary', maxWidth: 760 }}>
              Every figure here comes from numbers you supplied. The tool is only as good as
              they are, which is exactly why it shows a range and a sensitivity chart rather
              than a single confident total.
            </Typography>
            <Typography variant="caption" sx={{ display: 'block', mt: 1.5, color: 'text.secondary' }}>
              Everything is calculated in your browser. Nothing you enter is sent anywhere or
              saved. The link you copy carries your numbers in the address itself.
            </Typography>
          </Paper>
        </Reveal>

        <Reveal>
          <Paper
            variant="outlined"
            sx={{
              mt: 3,
              p: { xs: 3, md: 4 },
              borderRadius: 3,
              textAlign: 'center',
              '@media print': { display: 'none' },
            }}
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
              What’s slowing you down?
            </Button>
          </Paper>
        </Reveal>
      </Container>

      <Box sx={{ '@media print': { display: 'none' } }}>
        <Footer />
      </Box>
    </>
  );
}
