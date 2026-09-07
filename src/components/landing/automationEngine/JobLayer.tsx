import { ENTRY_X, EXIT_X, LANE_DY, RAIL_Y, VB_H, VB_W } from './geometry';
import type { Job } from './useJobSimulation';

/**
 * The task cards moving through the pipeline, as an SVG overlay in the pipeline's
 * coordinate space. React only touches this on add/remove — the simulation loop writes
 * each card's `transform` straight to the DOM node it captures via the ref callback, and
 * flips `data-state` for the stuck / slipped / done styling below.
 */

export function JobLayer({ jobs }: { jobs: Job[] }) {
  return (
    <svg
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      preserveAspectRatio="xMidYMid meet"
      width="100%"
      height="100%"
      style={{ position: 'absolute', inset: 0, display: 'block', pointerEvents: 'none' }}
      aria-hidden
    >
      <style>{`
        .ae-card, .ae-check { transition: stroke 150ms ease, fill 150ms ease; }
        .ae-tick { opacity: 0; transition: opacity 150ms ease; }
        .ae-job[data-state="stuck"] .ae-card { stroke: #f59e0b; }
        .ae-job[data-state="error"] .ae-card { stroke: #ef4444; }
        .ae-job[data-state="done"] .ae-card { stroke: #2563eb; }
        .ae-job[data-state="done"] .ae-check { fill: #2563eb; stroke: #2563eb; }
        .ae-job[data-state="done"] .ae-tick { opacity: 1; }
      `}</style>
      {jobs.map((job) => {
        const x = ENTRY_X + (EXIT_X - ENTRY_X) * job.progress;
        const y = RAIL_Y + job.lane * LANE_DY;
        return (
          <g
            key={job.id}
            className="ae-job"
            ref={(el) => {
              job.el = el;
            }}
            transform={`translate(${x} ${y})`}
          >
            <rect className="ae-card" x={-11} y={-7} width={22} height={14} rx={3} fill="#ffffff" stroke="#cbd5e1" strokeWidth={1.3} />
            <rect className="ae-check" x={-8} y={-2.6} width={5.2} height={5.2} rx={1.2} fill="#ffffff" stroke="#cbd5e1" strokeWidth={1.2} />
            <path className="ae-tick" d="M-7 0 l1.4 1.5 l3 -3.4" fill="none" stroke="#ffffff" strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round" />
            <line x1={-0.5} y1={-1.6} x2={8} y2={-1.6} stroke="#cbd5e1" strokeWidth={1.5} strokeLinecap="round" />
            <line x1={-0.5} y1={2} x2={5.5} y2={2} stroke="#dbe2ea" strokeWidth={1.5} strokeLinecap="round" />
          </g>
        );
      })}
    </svg>
  );
}
