import { useRef, useState, type KeyboardEvent, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import SwapHorizRoundedIcon from '@mui/icons-material/SwapHorizRounded';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionValue,
} from 'framer-motion';
import { Reveal } from '../motion/Reveal';

const START = 52;
const MIN = 6;
const MAX = 94;

const clampPos = (v: number) => Math.min(MAX, Math.max(MIN, v));

/**
 * "See the difference" — a draggable before/after wipe comparing a manual process with the
 * same work automated. The signature interaction on the marketing page: it demonstrates the
 * pitch rather than decorating it. Fully operable by pointer, touch and keyboard.
 */
export function BeforeAfter() {
  const reduce = useReducedMotion();
  const stageRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  const pos = useMotionValue(START);
  const smooth = useSpring(pos, { stiffness: 240, damping: 32, mass: 0.4 });
  const source = reduce ? pos : smooth;

  const [ariaNow, setAriaNow] = useState(START);
  useMotionValueEvent(source, 'change', (v) => {
    const rounded = Math.round(v);
    setAriaNow((prev) => (prev === rounded ? prev : rounded));
  });

  const clipPath = useMotionTemplate`inset(0 0 0 ${source}%)`;
  const handleLeft = useMotionTemplate`${source}%`;
  // Higher pos hides more of the "after" layer, so "before" dominates — labels track that,
  // and the de-emphasized side's labels fade fully out before the handle reaches them.
  const beforeOpacity = useTransform(source, [24, 60], [0, 1]);
  const afterOpacity = useTransform(source, [44, 80], [1, 0]);

  function posFromClientX(clientX: number) {
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return pos.get();
    return clampPos(((clientX - rect.left) / rect.width) * 100);
  }

  function handleStagePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    pos.set(posFromClientX(event.clientX));
  }

  function handleGripPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    draggingRef.current = true;
    pos.set(posFromClientX(event.clientX));
  }

  function handleGripPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!draggingRef.current) return;
    pos.set(posFromClientX(event.clientX));
  }

  function handleGripPointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    draggingRef.current = false;
    event.currentTarget.releasePointerCapture(event.pointerId);
  }

  function handleGripKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const current = pos.get();
    const step = event.shiftKey ? 10 : 2;
    let next: number | null = null;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') next = current - step;
    else if (event.key === 'ArrowRight' || event.key === 'ArrowUp') next = current + step;
    else if (event.key === 'Home') next = MIN;
    else if (event.key === 'End') next = MAX;
    if (next === null) return;
    event.preventDefault();
    pos.set(clampPos(next));
  }

  return (
    <Container maxWidth="lg" id="before-after" sx={{ py: { xs: 4, md: 5 } }}>
      <Reveal>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 700, letterSpacing: 1 }}>
            The Difference
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', mt: 1 }}>
            From manual workarounds to running itself.
          </Typography>
          <Typography sx={{ mt: 1.5, color: 'text.secondary', maxWidth: 560, mx: 'auto' }}>
            Drag to compare a typical manual process with the same work after we automate it.
          </Typography>
        </Box>
      </Reveal>

      <Reveal delay={0.1} fullWidth>
        <Box sx={{ maxWidth: 900, mx: 'auto' }}>
          <Box
            ref={stageRef}
            onPointerDown={handleStagePointerDown}
            sx={{
              position: 'relative',
              width: '100%',
              aspectRatio: { xs: '4 / 3', sm: '3 / 2', md: '16 / 10' },
              borderRadius: { xs: 3, sm: 4 },
              overflow: 'hidden',
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: '0 24px 48px -24px rgba(15, 23, 42, 0.28)',
              userSelect: 'none',
              touchAction: 'pan-y',
              bgcolor: '#ffffff',
            }}
          >
            <Box sx={{ position: 'absolute', inset: 0, bgcolor: '#f8fafc' }}>
              <BeforeScene />
            </Box>

            <Box
              component={motion.div}
              style={{ clipPath }}
              sx={{ position: 'absolute', inset: 0, bgcolor: '#ffffff', willChange: 'clip-path' }}
            >
              <AfterScene />
            </Box>

            <CornerLabel h="left" v="top" opacity={beforeOpacity} tone="muted">
              <LabelText title="Before" subtitle="manual" />
            </CornerLabel>
            <CornerLabel h="right" v="top" opacity={afterOpacity} tone="brand">
              <LabelText title="After" subtitle="automated" />
            </CornerLabel>

            <CornerLabel h="left" v="bottom" opacity={beforeOpacity} tone="muted">
              <StatText>~6 hrs / week</StatText>
            </CornerLabel>
            <CornerLabel h="right" v="bottom" opacity={afterOpacity} tone="brand">
              <StatText>~15 min / week</StatText>
            </CornerLabel>

            <Box
              component={motion.div}
              style={{ left: handleLeft }}
              role="slider"
              tabIndex={0}
              aria-label="Reveal the automated version"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={ariaNow}
              aria-valuetext={`${ariaNow}% automated`}
              onPointerDown={handleGripPointerDown}
              onPointerMove={handleGripPointerMove}
              onPointerUp={handleGripPointerUp}
              onPointerCancel={handleGripPointerUp}
              onKeyDown={handleGripKeyDown}
              sx={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                zIndex: 3,
                width: 44,
                ml: '-22px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'ew-resize',
                touchAction: 'none',
                outline: 'none',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  width: 2,
                  bgcolor: 'primary.main',
                  boxShadow: '0 0 0 1px rgba(255,255,255,0.65)',
                },
                '&:focus-visible .ba-grip': {
                  boxShadow: '0 0 0 4px rgba(37, 99, 235, 0.35)',
                },
              }}
            >
              <Box
                className="ba-grip"
                sx={{
                  position: 'relative',
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  bgcolor: '#ffffff',
                  border: '1px solid',
                  borderColor: 'divider',
                  color: 'primary.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 6px 16px -4px rgba(15, 23, 42, 0.3)',
                  transition: 'box-shadow 0.2s ease',
                }}
              >
                <SwapHorizRoundedIcon fontSize="small" />
              </Box>
            </Box>
          </Box>

          <Typography
            variant="caption"
            sx={{ display: 'block', textAlign: 'center', mt: 1.5, color: 'text.secondary' }}
          >
            Drag the handle — or focus it and use the arrow keys
          </Typography>
        </Box>
      </Reveal>
    </Container>
  );
}

function StatText({ children }: { children: ReactNode }) {
  return (
    <>
      <AccessTimeRoundedIcon sx={{ fontSize: { xs: 12, sm: 14 } }} />
      <Typography component="span" sx={{ fontSize: { xs: 10.5, sm: 12 }, fontWeight: 700, lineHeight: 1 }}>
        {children}
      </Typography>
    </>
  );
}

function LabelText({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <>
      <Typography component="span" sx={{ fontWeight: 800, fontSize: { xs: 11.5, sm: 13 }, lineHeight: 1 }}>
        {title}
      </Typography>
      <Typography
        component="span"
        sx={{ fontSize: 11, lineHeight: 1, opacity: 0.85, display: { xs: 'none', sm: 'inline' } }}
      >
        {subtitle}
      </Typography>
    </>
  );
}

function CornerLabel({
  h,
  v,
  opacity,
  tone,
  children,
}: {
  h: 'left' | 'right';
  v: 'top' | 'bottom';
  opacity: MotionValue<number>;
  tone: 'muted' | 'brand';
  children: ReactNode;
}) {
  return (
    <Box
      component={motion.div}
      style={{ opacity }}
      sx={{
        position: 'absolute',
        zIndex: 4,
        [v]: { xs: 12, sm: 16 },
        [h]: { xs: 12, sm: 16 },
        px: 1.25,
        py: 0.75,
        borderRadius: 9999,
        bgcolor: tone === 'brand' ? 'primary.main' : '#ffffff',
        color: tone === 'brand' ? 'primary.contrastText' : 'text.secondary',
        border: tone === 'brand' ? 'none' : '1px solid',
        borderColor: 'divider',
        boxShadow: '0 4px 14px -4px rgba(15, 23, 42, 0.3)',
        pointerEvents: 'none',
        display: 'flex',
        alignItems: 'center',
        gap: 0.75,
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </Box>
  );
}

/* -------------------------------------------------------------------------- */
/* Scenes — abstract node diagrams, drawn from theme tokens. `meet` keeps the  */
/* whole diagram visible at every stage aspect ratio; the layer's bgcolor      */
/* matches the scene fill so any letterboxing is invisible.                    */
/* -------------------------------------------------------------------------- */

const sceneSvgProps = {
  viewBox: '0 0 320 190',
  preserveAspectRatio: 'xMidYMid meet',
  width: '100%',
  height: '100%',
  style: { display: 'block', fontFamily: 'inherit' },
} as const;

function BeforeScene() {
  return (
    <svg {...sceneSvgProps} role="img" aria-label="A tangle of disconnected manual steps">
      <rect width="320" height="190" fill="#f8fafc" />

      <g fill="none" stroke="#cbd5e1" strokeWidth="1.5">
        <path d="M56 58 C 122 18, 150 156, 232 128" />
        <path d="M86 138 C 150 92, 92 34, 244 56" strokeDasharray="4 4" />
        <path d="M50 100 C 132 140, 188 26, 262 118" />
        <path d="M112 42 C 156 128, 214 138, 256 160" strokeDasharray="3 5" />
      </g>

      <NoteCard x={30} y={22} rotate={-8} />
      <NoteCard x={126} y={14} rotate={5} accent />
      <NoteCard x={222} y={30} rotate={10} />
      <NoteCard x={28} y={110} rotate={5} />
      <NoteCard x={140} y={126} rotate={-7} accent />
      <NoteCard x={228} y={112} rotate={8} />

      <AlertBadge cx={120} cy={22} />
      <AlertBadge cx={226} cy={160} />
    </svg>
  );
}

function NoteCard({ x, y, rotate, accent }: { x: number; y: number; rotate: number; accent?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate})`}>
      <rect
        width="58"
        height="42"
        rx="5"
        fill={accent ? '#fef3c7' : '#ffffff'}
        stroke={accent ? '#f59e0b' : '#e2e8f0'}
        strokeWidth="1.5"
      />
      <line x1="9" y1="15" x2="46" y2="15" stroke={accent ? '#d97706' : '#cbd5e1'} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="9" y1="25" x2="37" y2="25" stroke={accent ? '#d97706' : '#cbd5e1'} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="9" y1="33" x2="42" y2="33" stroke={accent ? '#e0a95a' : '#dde3ea'} strokeWidth="2.5" strokeLinecap="round" />
    </g>
  );
}

function AlertBadge({ cx, cy }: { cx: number; cy: number }) {
  return (
    <g transform={`translate(${cx} ${cy})`}>
      <circle r="9" fill="#f59e0b" />
      <text x="0" y="4" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="800">
        !
      </text>
    </g>
  );
}

function AfterScene() {
  const xs = [16, 92, 168, 244];
  const nodeW = 54;
  const nodeH = 60;
  const nodeY = 66;
  const midY = nodeY + nodeH / 2;
  return (
    <svg {...sceneSvgProps} role="img" aria-label="A clean automated pipeline of connected steps">
      <rect width="320" height="190" fill="#ffffff" />

      {/* status dots */}
      <circle cx="18" cy="36" r="3" fill="#cbd5e1" />
      <circle cx="30" cy="36" r="3" fill="#cbd5e1" />
      <circle cx="42" cy="36" r="3" fill="#16a34a" />

      {/* rail + connectors */}
      <line x1="12" y1={midY} x2="308" y2={midY} stroke="#dbeafe" strokeWidth="2" />
      <g stroke="#2563eb" strokeWidth="2" fill="none">
        {xs.slice(0, -1).map((nx, i) => (
          <g key={nx}>
            <line x1={nx + nodeW} y1={midY} x2={xs[i + 1]} y2={midY} />
            <path d={`M${xs[i + 1] - 6} ${midY - 4} l6 4 l-6 4`} strokeLinecap="round" strokeLinejoin="round" />
          </g>
        ))}
      </g>

      {/* nodes */}
      {xs.map((nx, i) => (
        <g key={nx} transform={`translate(${nx} ${nodeY})`}>
          <rect
            width={nodeW}
            height={nodeH}
            rx="7"
            fill={i === 1 ? '#eff6ff' : '#ffffff'}
            stroke="#bfdbfe"
            strokeWidth="1.5"
          />
          <line x1="10" y1="17" x2={nodeW - 10} y2="17" stroke="#93c5fd" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="10" y1="27" x2={nodeW - 18} y2="27" stroke="#bfdbfe" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="10" y1="37" x2={nodeW - 13} y2="37" stroke="#bfdbfe" strokeWidth="2.5" strokeLinecap="round" />
          <g transform={`translate(${nodeW - 7} -3)`}>
            <circle r="6.5" fill="#16a34a" />
            <path
              d="M-3 0 l2 2 l3.8 -4"
              fill="none"
              stroke="#ffffff"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
          <line x1="8" y1={nodeH + 13} x2={nodeW - 8} y2={nodeH + 13} stroke="#e2e8f0" strokeWidth="3" strokeLinecap="round" />
        </g>
      ))}
    </svg>
  );
}
