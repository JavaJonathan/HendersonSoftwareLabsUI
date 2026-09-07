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

const START = 54;
const MIN = 5;
const MAX = 95;

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
  // Higher pos hides more of the "after" layer, so "before" dominates — labels track that.
  const beforeOpacity = useTransform(source, [42, 60], [0.35, 1]);
  const afterOpacity = useTransform(source, [42, 60], [1, 0.35]);

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
              aspectRatio: { xs: '3 / 2', sm: '16 / 10', md: '16 / 9' },
              borderRadius: 4,
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
              <StatText>about 6 hrs / week</StatText>
            </CornerLabel>
            <CornerLabel h="right" v="bottom" opacity={afterOpacity} tone="brand">
              <StatText>about 15 min / week</StatText>
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
      <AccessTimeRoundedIcon sx={{ fontSize: { xs: 13, sm: 14 } }} />
      <Typography component="span" sx={{ fontSize: { xs: 11, sm: 12 }, fontWeight: 700, lineHeight: 1 }}>
        {children}
      </Typography>
    </>
  );
}

function LabelText({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <>
      <Typography component="span" sx={{ fontWeight: 800, fontSize: { xs: 12, sm: 13 }, lineHeight: 1 }}>
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
        [v]: { xs: 10, sm: 14 },
        [h]: { xs: 10, sm: 14 },
        px: 1.25,
        py: 0.75,
        borderRadius: 9999,
        bgcolor: tone === 'brand' ? 'primary.main' : 'rgba(255,255,255,0.92)',
        color: tone === 'brand' ? 'primary.contrastText' : 'text.secondary',
        border: tone === 'brand' ? 'none' : '1px solid',
        borderColor: 'divider',
        backdropFilter: 'blur(4px)',
        boxShadow: '0 4px 12px -6px rgba(15, 23, 42, 0.25)',
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
        <path d="M60 55 C 120 20, 150 150, 220 120" />
        <path d="M85 130 C 140 90, 90 40, 230 60" strokeDasharray="4 4" />
        <path d="M55 95 C 130 130, 180 30, 250 110" />
        <path d="M110 45 C 150 120, 210 130, 245 150" strokeDasharray="3 5" />
      </g>

      <NoteCard x={40} y={30} rotate={-7} />
      <NoteCard x={128} y={20} rotate={5} accent />
      <NoteCard x={214} y={38} rotate={9} />
      <NoteCard x={54} y={104} rotate={4} />
      <NoteCard x={150} y={118} rotate={-6} accent />
      <NoteCard x={228} y={110} rotate={7} />

      <AlertBadge cx={120} cy={28} />
      <AlertBadge cx={224} cy={148} />
    </svg>
  );
}

function NoteCard({ x, y, rotate, accent }: { x: number; y: number; rotate: number; accent?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate})`}>
      <rect
        width="52"
        height="34"
        rx="4"
        fill={accent ? '#fef3c7' : '#ffffff'}
        stroke={accent ? '#f59e0b' : '#e2e8f0'}
        strokeWidth="1.5"
      />
      <line x1="8" y1="12" x2="40" y2="12" stroke={accent ? '#d97706' : '#cbd5e1'} strokeWidth="2" strokeLinecap="round" />
      <line x1="8" y1="20" x2="32" y2="20" stroke={accent ? '#d97706' : '#cbd5e1'} strokeWidth="2" strokeLinecap="round" />
    </g>
  );
}

function AlertBadge({ cx, cy }: { cx: number; cy: number }) {
  return (
    <g transform={`translate(${cx} ${cy})`}>
      <circle r="8" fill="#f59e0b" />
      <text x="0" y="3.5" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="800">
        !
      </text>
    </g>
  );
}

function AfterScene() {
  const nodes = [26, 100, 174, 248];
  const y = 78;
  return (
    <svg {...sceneSvgProps} role="img" aria-label="A clean automated pipeline of connected steps">
      <rect width="320" height="190" fill="#ffffff" />

      <g stroke="#2563eb" strokeWidth="2" fill="none">
        {nodes.slice(0, -1).map((nx, i) => (
          <g key={nx}>
            <line x1={nx + 46} y1={y + 17} x2={nodes[i + 1]} y2={y + 17} />
            <path d={`M${nodes[i + 1] - 6} ${y + 13} l6 4 l-6 4`} strokeLinecap="round" strokeLinejoin="round" />
          </g>
        ))}
      </g>

      {nodes.map((nx, i) => (
        <g key={nx} transform={`translate(${nx} ${y})`}>
          <rect
            width="46"
            height="34"
            rx="5"
            fill={i === 1 ? '#eff6ff' : '#ffffff'}
            stroke="#bfdbfe"
            strokeWidth="1.5"
          />
          <line x1="8" y1="12" x2="38" y2="12" stroke="#93c5fd" strokeWidth="2" strokeLinecap="round" />
          <line x1="8" y1="20" x2="28" y2="20" stroke="#93c5fd" strokeWidth="2" strokeLinecap="round" />
          <g transform="translate(38 -4)">
            <circle r="7" fill="#16a34a" />
            <path d="M-3 0 l2 2 l4 -4" fill="none" stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        </g>
      ))}
    </svg>
  );
}
