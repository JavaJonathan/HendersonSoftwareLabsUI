import { useCallback, useEffect, useMemo, useReducer } from 'react';
import { EXAMPLE_FORM, resolveForm, toFormState, type FormState } from '../../pages/tools/taskCostForm';
import { toInputs, type Scenario } from '../../pages/tools/taskCostScenario';
import { decodeScenario, encodeScenario, hasScenarioParams } from '../../pages/tools/taskCostUrl';
import {
  calculateTaskCost, DEFAULT_INVESTMENT, forPeriod, projectCashflow, sensitivity,
  type DisplayPeriod,
} from '../../pages/tools/taskCostModel';
import type { PanelKey } from './TaskCostControls';

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

export function useTaskCostScenario(canonical: string) {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);
  const [mathOpen, toggleMath] = useReducer((open: boolean) => !open, false);
  // One-way reveal: nobody needs to re-hide the tornado chart once they've asked for it.
  const [sensitivityOpen, openSensitivity] = useReducer(() => true, false);

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
    const origin = typeof window === 'undefined' ? canonical : `${window.location.origin}${window.location.pathname}`;
    return query ? `${origin}?${query}` : origin;
  }, [query, canonical]);

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

  return {
    state, dispatch, mathOpen, toggleMath, sensitivityOpen, openSensitivity,
    scenario, inputs, results, errors, projection, drivers, hasCost, hasInput,
    showSticky, stickyDelta, introText, onPatch, onTogglePanel, onPeriodChange,
    shareUrl, exportBundle,
  };
}
