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
import { TaskCostControls } from '../../components/tools/TaskCostControls';
import { TaskCostResults } from '../../components/tools/TaskCostResults';
import { PaybackPanel } from '../../components/tools/PaybackPanel';
import { SensitivityPanel } from '../../components/tools/SensitivityPanel';
import { ShareBar } from '../../components/tools/ShareBar';
import { usePageMeta } from '../../hooks/usePageMeta';
import { buildCsv, buildSummaryText, slugify } from './taskCostExport';
import { useTaskCostScenario } from '../../components/tools/useTaskCostScenario';
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

export function TaskCostCalculatorPage() {
  usePageMeta({
    title: 'Task Cost Calculator: what repetitive work costs | Henderson Software Labs',
    description: META_DESCRIPTION,
    canonical: CANONICAL,
    jsonLd: JSON_LD,
  });

  const {
    state, dispatch, mathOpen, toggleMath, sensitivityOpen, openSensitivity,
    scenario, inputs, results, errors, projection, drivers, hasCost, hasInput,
    showSticky, stickyDelta, introText, onPatch, onTogglePanel, onPeriodChange,
    shareUrl, exportBundle,
  } = useTaskCostScenario(CANONICAL);

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
