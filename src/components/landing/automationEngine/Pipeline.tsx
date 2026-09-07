import { motion, useTransform, type MotionValue } from 'framer-motion';
import {
  ENTRY_X,
  EXIT_X,
  LABEL_Y,
  NODE_CY,
  NODE_H,
  NODE_W,
  RAIL_Y,
  STAGE_CX,
  VB_H,
  VB_W,
} from './geometry';

/**
 * The morphing pipeline scene: four stations above a conveyor belt. Every element
 * interpolates from `dial` (0 = manual chaos, 100 = automated calm) and each station
 * resolves as the dial sweeps past it, so dragging reads as order moving left-to-right
 * across the operation. Job tokens (JobLayer) ride the belt on top of this.
 */

const GATES = [16, 38, 58, 78];
const GATE_HALF = 16;
const CHAOS_ROT = [-7, 6, -5, 8];
const CHAOS_DY = [9, -7, 11, -6];
/** Stations that show a "something slipped" badge while manual. */
const ERROR_STAGES = new Set([1, 3]);

const TOP_H = 24;
const BOTTOM_Y = VB_H - 24;

interface PipelineProps {
  dial: MotionValue<number>;
  reduce: boolean;
  active: boolean;
  selectedStage: number | null;
  stageLabels: string[];
  backlogCount: number;
}

export function Pipeline({ dial, reduce, active, selectedStage, stageLabels, backlogCount }: PipelineProps) {
  const flow = active && !reduce;
  const warmOpacity = useTransform(dial, [10, 60], [1, 0]);
  const pileChips = Math.min(7, Math.max(0, backlogCount));

  return (
    <svg
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      preserveAspectRatio="xMidYMid meet"
      width="100%"
      height="100%"
      style={{ position: 'absolute', inset: 0, display: 'block' }}
      aria-hidden
    >
      <defs>
        <linearGradient id="ae-warm" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#f59e0b" stopOpacity="0.1" />
          <stop offset="0.58" stopColor="#f59e0b" stopOpacity="0" />
        </linearGradient>
      </defs>

      <rect width={VB_W} height={VB_H} fill="#ffffff" />
      <motion.rect width={VB_W} height={VB_H} fill="url(#ae-warm)" style={{ opacity: warmOpacity }} />

      <rect x={0} y={0} width={VB_W} height={TOP_H} fill="#fbfcfd" />
      <line x1={0} y1={TOP_H} x2={VB_W} y2={TOP_H} stroke="#eef2f7" strokeWidth={1} />
      <rect x={0} y={BOTTOM_Y} width={VB_W} height={VB_H - BOTTOM_Y} fill="#fbfcfd" />
      <line x1={0} y1={BOTTOM_Y} x2={VB_W} y2={BOTTOM_Y} stroke="#eef2f7" strokeWidth={1} />

      {/* the conveyor belt */}
      <line x1={ENTRY_X - 4} y1={RAIL_Y} x2={EXIT_X + 4} y2={RAIL_Y} stroke="#e7ecf2" strokeWidth={5} strokeLinecap="round" />

      {/* backlog piling up at the entry */}
      <g>
        {Array.from({ length: pileChips }, (_, k) => (
          <rect
            key={k}
            x={ENTRY_X - 12 + (k % 3) * 4}
            y={RAIL_Y - 5 - Math.floor(k / 3) * 11}
            width={13}
            height={10}
            rx={2}
            fill="#fff7ed"
            stroke="#f59e0b"
            strokeWidth={1}
          />
        ))}
      </g>

      {STAGE_CX.map((cx, i) => (
        <Stage
          key={i}
          i={i}
          cx={cx}
          dial={dial}
          flow={flow}
          selected={selectedStage === i}
          label={stageLabels[i] ?? ''}
        />
      ))}
    </svg>
  );
}

function Stage({
  i,
  cx,
  dial,
  flow,
  selected,
  label,
}: {
  i: number;
  cx: number;
  dial: MotionValue<number>;
  flow: boolean;
  selected: boolean;
  label: string;
}) {
  const g = GATES[i];
  const resolve = useTransform(dial, [g - GATE_HALF, g + GATE_HALF], [0, 1]);

  const nodeStroke = useTransform(resolve, [0, 1], ['#e2e8f0', '#93c5fd']);
  const nodeFill = useTransform(resolve, [0, 1], ['#ffffff', i === 1 ? '#eff6ff' : '#ffffff']);
  const dotFill = useTransform(resolve, [0, 1], ['#cbd5e1', '#2563eb']);
  const rot = useTransform(resolve, [0, 1], [CHAOS_ROT[i], 0]);
  const dy = useTransform(resolve, [0, 1], [CHAOS_DY[i], 0]);
  const dropStroke = useTransform(resolve, [0, 1], ['#e2e8f0', '#93c5fd']);

  const errOpacity = useTransform(resolve, [0.15, 0.5], [1, 0]);
  const okOpacity = useTransform(resolve, [0.55, 1], [0, 1]);
  const beltGrey = useTransform(resolve, [0.1, 0.6], [1, 0]);
  const beltBlue = useTransform(resolve, [0.35, 1], [0, 1]);
  const labelFill = useTransform(resolve, [0, 1], ['#94a3b8', '#64748b']);

  const segStart = i === 0 ? ENTRY_X - 4 : STAGE_CX[i - 1];
  const segEnd = cx;
  const halfW = NODE_W / 2;
  const halfH = NODE_H / 2;
  const isLast = i === STAGE_CX.length - 1;

  return (
    <g>
      {/* incoming belt segment */}
      <motion.line
        x1={segStart}
        y1={RAIL_Y}
        x2={segEnd}
        y2={RAIL_Y}
        stroke="#cbd5e1"
        strokeWidth={2}
        strokeDasharray="5 5"
        strokeLinecap="round"
        style={{ opacity: beltGrey }}
      />
      <motion.line x1={segStart} y1={RAIL_Y} x2={segEnd} y2={RAIL_Y} stroke="#2563eb" strokeWidth={4} strokeLinecap="round" style={{ opacity: beltBlue }} />
      {flow && (
        <motion.line
          x1={segStart}
          y1={RAIL_Y}
          x2={segEnd}
          y2={RAIL_Y}
          stroke="#bfdbfe"
          strokeWidth={4}
          strokeDasharray="1 9"
          strokeLinecap="round"
          style={{ opacity: beltBlue }}
          animate={{ strokeDashoffset: [0, -20] }}
          transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }}
        />
      )}
      {isLast && (
        <>
          <motion.line x1={cx} y1={RAIL_Y} x2={EXIT_X + 4} y2={RAIL_Y} stroke="#2563eb" strokeWidth={4} strokeLinecap="round" style={{ opacity: beltBlue }} />
          {flow && (
            <motion.line
              x1={cx}
              y1={RAIL_Y}
              x2={EXIT_X + 4}
              y2={RAIL_Y}
              stroke="#bfdbfe"
              strokeWidth={4}
              strokeDasharray="1 9"
              strokeLinecap="round"
              style={{ opacity: beltBlue }}
              animate={{ strokeDashoffset: [0, -20] }}
              transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }}
            />
          )}
        </>
      )}

      {/* drop connector from station to belt */}
      <motion.line x1={cx} y1={NODE_CY + halfH} x2={cx} y2={RAIL_Y - 2} strokeWidth={2} strokeLinecap="round" style={{ stroke: dropStroke }} />

      {/* the station */}
      <g transform={`translate(${cx} ${NODE_CY})`}>
        {selected && (
          <rect x={-halfW - 5} y={-halfH - 5} width={NODE_W + 10} height={NODE_H + 10} rx={13} fill="none" stroke="#2563eb" strokeWidth={2} opacity={0.55} />
        )}
        <motion.g style={{ y: dy, rotate: rot }}>
          <motion.rect x={-halfW} y={-halfH} width={NODE_W} height={NODE_H} rx={10} strokeWidth={1.75} style={{ fill: nodeFill, stroke: nodeStroke }} />
          <motion.circle cx={-halfW + 12} cy={-halfH + 13} r={3.2} style={{ fill: dotFill }} />
          <line x1={-halfW + 20} y1={-halfH + 13} x2={halfW - 11} y2={-halfH + 13} stroke="#dbe2ea" strokeWidth={2.5} strokeLinecap="round" />
          <line x1={-halfW + 11} y1={2} x2={halfW - 11} y2={2} stroke="#e7ecf2" strokeWidth={2.5} strokeLinecap="round" />
          <line x1={-halfW + 11} y1={11} x2={halfW - 18} y2={11} stroke="#e7ecf2" strokeWidth={2.5} strokeLinecap="round" />
        </motion.g>

        {ERROR_STAGES.has(i) && (
          <motion.g transform={`translate(${halfW - 3} ${-halfH + 3})`} style={{ opacity: errOpacity }}>
            <circle r={7.5} fill="#f59e0b" />
            <text x={0} y={4} textAnchor="middle" fontSize={10} fontWeight={800} fill="#ffffff">
              !
            </text>
          </motion.g>
        )}
        <motion.g transform={`translate(${halfW - 3} ${-halfH + 3})`} style={{ opacity: okOpacity }}>
          <circle r={6.5} fill="#16a34a" />
          <path d="M-2.8 0 l1.8 1.8 l3.4 -3.6" fill="none" stroke="#ffffff" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
        </motion.g>
      </g>

      <motion.text
        x={cx}
        y={LABEL_Y}
        textAnchor="middle"
        fontSize={12}
        fontWeight={selected ? 800 : 700}
        stroke="#ffffff"
        strokeWidth={3.5}
        strokeLinejoin="round"
        fill={selected ? '#2563eb' : undefined}
        style={selected ? { paintOrder: 'stroke' } : { fill: labelFill, paintOrder: 'stroke' }}
      >
        {label}
      </motion.text>
    </g>
  );
}
