import { useId, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useElementWidth } from '../../hooks/useElementWidth';
import { formatMoney, formatMoneyCompact, formatMonths } from '../../pages/tools/taskCostFormat';
import type { Projection } from '../../pages/tools/taskCostModel';

/**
 * Cumulative money position over the projection horizon: down by the build cost on day one,
 * climbing as the saving lands, crossing zero at break-even.
 *
 * This is the chart the tool exists for. "187 hours a year" is abstract; "you are square in
 * month 14 and up $31k by month 36" is a decision. Drawn by hand in SVG rather than pulling
 * in a chart library, which keeps the lazy-loaded tool bundle small.
 */

const NEGATIVE = '#dc2626';
const POSITIVE = '#059669';
const LINE = '#1d4ed8';
const AXIS = '#94a3b8';
const GRID = '#e2e8f0';

const PAD = { top: 18, right: 18, bottom: 30, left: 62 };
const HEIGHT = 250;

interface PaybackChartProps {
  projection: Projection;
  /** Used only for the accessible description. */
  horizonMonths: number;
}

/**
 * Roughly six x-axis ticks, on a month boundary a person would actually pick, but not more
 * than the plot is wide enough to label without adjacent ticks overlapping: at ~45px per
 * label, a phone-width chart fits three or four, not seven.
 */
function tickStep(horizon: number, plotW: number): number {
  const maxTicks = Math.min(7, Math.max(3, Math.floor(plotW / 45)));
  for (const step of [1, 2, 3, 6, 12, 24]) {
    if (horizon / step + 1 <= maxTicks) return step;
  }
  return 24;
}

export function PaybackChart({ projection, horizonMonths }: PaybackChartProps) {
  const [wrapRef, width] = useElementWidth<HTMLDivElement>(620);
  const [hoverMonth, setHoverMonth] = useState<number | null>(null);
  const clipId = useId();

  const points = projection.points;
  const horizon = Math.max(1, points.length - 1);
  const plotW = Math.max(120, width - PAD.left - PAD.right);
  const plotH = HEIGHT - PAD.top - PAD.bottom;

  const values = points.map((p) => p.cumulative);
  const rawMin = Math.min(0, ...values);
  const rawMax = Math.max(0, ...values);
  // A flat-zero series would divide by zero; give it an arbitrary but harmless scale.
  const span = rawMax - rawMin || 1;
  const min = rawMin - span * 0.08;
  const max = rawMax + span * 0.08;

  const xFor = (month: number) => PAD.left + (month / horizon) * plotW;
  const yFor = (value: number) => PAD.top + ((max - value) / (max - min)) * plotH;
  const yZero = yFor(0);

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${xFor(p.month)},${yFor(p.cumulative)}`).join(' ');
  const areaPath = `${linePath} L${xFor(horizon)},${yZero} L${xFor(0)},${yZero} Z`;

  const step = tickStep(horizon, plotW);
  const ticks: number[] = [];
  for (let m = 0; m <= horizon; m += step) ticks.push(m);
  if (ticks[ticks.length - 1] !== horizon) ticks.push(horizon);

  const breakEvenX =
    projection.breakEvenMonthExact === null ? null : xFor(Math.min(projection.breakEvenMonthExact, horizon));

  const hovered = hoverMonth === null ? null : points[hoverMonth];

  const description =
    projection.breakEvenMonth === null
      ? `Cumulative position over ${horizonMonths} months. The spend is not recovered inside the horizon, ending at ${formatMoney(projection.netAtHorizon)}.`
      : `Cumulative position over ${horizonMonths} months. It crosses zero at ${formatMonths(
          projection.breakEvenMonthExact ?? projection.breakEvenMonth,
        )} and ends at ${formatMoney(projection.netAtHorizon)}.`;

  function handleMove(event: React.PointerEvent<SVGRectElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = (event.clientX - rect.left) / (rect.width || 1);
    const month = Math.round(ratio * horizon);
    setHoverMonth(Math.max(0, Math.min(horizon, month)));
  }

  return (
    <Box ref={wrapRef} sx={{ width: '100%' }}>
      <svg
        width={width}
        height={HEIGHT}
        viewBox={`0 0 ${width} ${HEIGHT}`}
        role="img"
        aria-label={description}
        style={{ display: 'block', touchAction: 'pan-y' }}
      >
        <defs>
          {/* Two halves of the same closed area, so gains and losses colour differently. */}
          <clipPath id={`${clipId}-up`}>
            <rect x={0} y={0} width={width} height={Math.max(0, yZero)} />
          </clipPath>
          <clipPath id={`${clipId}-down`}>
            <rect x={0} y={yZero} width={width} height={Math.max(0, HEIGHT - yZero)} />
          </clipPath>
        </defs>

        {/* Horizontal guides at the top and bottom of the value range */}
        <line x1={PAD.left} y1={yFor(rawMax)} x2={width - PAD.right} y2={yFor(rawMax)} stroke={GRID} strokeWidth={1} />
        <line x1={PAD.left} y1={yFor(rawMin)} x2={width - PAD.right} y2={yFor(rawMin)} stroke={GRID} strokeWidth={1} />

        <path d={areaPath} fill={POSITIVE} fillOpacity={0.16} clipPath={`url(#${clipId}-up)`} />
        <path d={areaPath} fill={NEGATIVE} fillOpacity={0.14} clipPath={`url(#${clipId}-down)`} />

        {/* Break-even line: zero */}
        <line
          x1={PAD.left}
          y1={yZero}
          x2={width - PAD.right}
          y2={yZero}
          stroke={AXIS}
          strokeWidth={1}
          strokeDasharray="4 4"
        />

        <path d={linePath} fill="none" stroke={LINE} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />

        {breakEvenX !== null && (
          <g>
            <line
              x1={breakEvenX}
              y1={PAD.top}
              x2={breakEvenX}
              y2={HEIGHT - PAD.bottom}
              stroke={POSITIVE}
              strokeWidth={1.5}
              strokeDasharray="5 4"
            />
            <circle cx={breakEvenX} cy={yZero} r={5} fill={POSITIVE} stroke="#ffffff" strokeWidth={2} />
            <text
              x={Math.min(breakEvenX + 8, width - PAD.right - 4)}
              y={PAD.top + 11}
              textAnchor={breakEvenX > width - 130 ? 'end' : 'start'}
              fontSize={11.5}
              fontWeight={700}
              fill={POSITIVE}
            >
              {`Break-even ${formatMonths(projection.breakEvenMonthExact ?? 0)}`}
            </text>
          </g>
        )}

        {/* Y labels: the extremes plus zero */}
        {[rawMax, 0, rawMin].map((value, index) =>
          index === 1 && (rawMax === 0 || rawMin === 0) ? null : (
            <text
              key={`y-${index}`}
              x={PAD.left - 8}
              y={yFor(value) + 4}
              textAnchor="end"
              fontSize={11}
              fill={AXIS}
            >
              {formatMoneyCompact(value)}
            </text>
          ),
        )}

        {ticks.map((month) => (
          <text
            key={`x-${month}`}
            x={xFor(month)}
            y={HEIGHT - PAD.bottom + 18}
            textAnchor={month === 0 ? 'start' : month === horizon ? 'end' : 'middle'}
            fontSize={11}
            fill={AXIS}
          >
            {month === 0 ? 'start' : `${month}m`}
          </text>
        ))}

        {hovered && (
          <g pointerEvents="none">
            <line
              x1={xFor(hovered.month)}
              y1={PAD.top}
              x2={xFor(hovered.month)}
              y2={HEIGHT - PAD.bottom}
              stroke={AXIS}
              strokeWidth={1}
            />
            <circle
              cx={xFor(hovered.month)}
              cy={yFor(hovered.cumulative)}
              r={4.5}
              fill={hovered.cumulative >= 0 ? POSITIVE : NEGATIVE}
              stroke="#ffffff"
              strokeWidth={2}
            />
          </g>
        )}

        <rect
          x={PAD.left}
          y={PAD.top}
          width={plotW}
          height={plotH}
          fill="transparent"
          onPointerMove={handleMove}
          onPointerLeave={() => setHoverMonth(null)}
        />
      </svg>

      <Box sx={{ minHeight: 22, mt: 0.5 }}>
        <Typography variant="caption" sx={{ color: 'text.secondary', fontVariantNumeric: 'tabular-nums' }}>
          {hovered
            ? `Month ${hovered.month}: ${formatMoney(hovered.cumulative)} cumulative`
            : 'Cumulative position, month by month. Hover the chart for any month.'}
        </Typography>
      </Box>
    </Box>
  );
}
