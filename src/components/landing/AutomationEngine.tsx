import {
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import SwapHorizRoundedIcon from '@mui/icons-material/SwapHorizRounded';
import {
  AnimatePresence,
  motion,
  useInView,
  useMotionTemplate,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionValue,
} from 'framer-motion';
import { Reveal } from '../motion/Reveal';
import { PRESETS, PRESET_ORDER, type PresetId } from './automationEngine/presets';
import { STAGE_CX, VB_W } from './automationEngine/geometry';
import { Pipeline } from './automationEngine/Pipeline';
import { JobLayer } from './automationEngine/JobLayer';
import { useJobSimulation } from './automationEngine/useJobSimulation';

const START = 38;
const MIN = 6;
const MAX = 94;
const STORAGE_KEY = 'hsl_ae_preset';
const clampPos = (v: number) => Math.min(MAX, Math.max(MIN, v));

function loadPreset(): PresetId {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v && v in PRESETS) return v as PresetId;
  } catch {
    /* private mode / disabled storage — fall through to default */
  }
  return 'ecommerce';
}

/**
 * "The Automation Engine" — the homepage's signature interaction. One living operations
 * pipeline: drag the handle and order sweeps across it stage by stage; pick an industry to
 * reskin every stage; tap a stage to see what HSL would build there. All client-side SVG +
 * framer-motion — no backend, no assets, no AWS cost.
 */
export function AutomationEngine() {
  const reduce = useReducedMotion() ?? false;
  const sectionRef = useRef<HTMLDivElement>(null);
  const inView = useInView(sectionRef, { margin: '0px 0px -20% 0px' });

  const stageRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const stageBtnRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const dial = useMotionValue(START);
  const smooth = useSpring(dial, { stiffness: 240, damping: 32, mass: 0.4 });
  const source = reduce ? dial : smooth;

  const [ariaNow, setAriaNow] = useState(START);
  useMotionValueEvent(source, 'change', (v) => {
    const r = Math.round(v);
    setAriaNow((p) => (p === r ? p : r));
  });

  const handleLeft = useMotionTemplate`${source}%`;
  const manualOpacity = useTransform(source, [22, 55], [1, 0.2]);
  const autoOpacity = useTransform(source, [45, 78], [0.2, 1]);
  const manualPhrase = useTransform(source, [30, 54], [1, 0]);
  const autoPhrase = useTransform(source, [46, 70], [0, 1]);

  const [presetId, setPresetId] = useState<PresetId>(loadPreset);
  const preset = PRESETS[presetId];

  const { jobs } = useJobSimulation({
    dial: source,
    active: inView,
    reduce,
    kindCount: preset.jobKinds.length,
  });

  const [selectedStage, setSelectedStage] = useState<number | null>(null);
  const [focusStage, setFocusStage] = useState(0);

  function selectPreset(id: PresetId) {
    setPresetId(id);
    setSelectedStage(null);
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
      /* ignore */
    }
  }

  function posFromClientX(clientX: number) {
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return dial.get();
    return clampPos(((clientX - rect.left) / rect.width) * 100);
  }

  function handleStagePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    dial.set(posFromClientX(event.clientX));
  }

  function handleGripPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    draggingRef.current = true;
    dial.set(posFromClientX(event.clientX));
  }

  function handleGripPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (draggingRef.current) dial.set(posFromClientX(event.clientX));
  }

  function handleGripPointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    draggingRef.current = false;
    event.currentTarget.releasePointerCapture(event.pointerId);
  }

  function handleGripKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const current = dial.get();
    const step = event.shiftKey ? 10 : 3;
    let next: number | null = null;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') next = current - step;
    else if (event.key === 'ArrowRight' || event.key === 'ArrowUp') next = current + step;
    else if (event.key === 'Home') next = MIN;
    else if (event.key === 'End') next = MAX;
    if (next === null) return;
    event.preventDefault();
    dial.set(clampPos(next));
  }

  function toggleStage(i: number) {
    setSelectedStage((prev) => (prev === i ? null : i));
    setFocusStage(i);
  }

  function handleStageKeyDown(event: KeyboardEvent<HTMLButtonElement>, i: number) {
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      const dir = event.key === 'ArrowRight' ? 1 : -1;
      const n = (i + dir + STAGE_CX.length) % STAGE_CX.length;
      setFocusStage(n);
      stageBtnRefs.current[n]?.focus();
    } else if (event.key === 'Escape') {
      setSelectedStage(null);
    }
  }

  return (
    <Container ref={sectionRef} maxWidth="lg" id="automation-engine" sx={{ py: { xs: 4, md: 5 } }}>
      <Reveal>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 700, letterSpacing: 1 }}>
            See it work
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', mt: 1 }}>
            Watch the busywork run itself.
          </Typography>
          <Typography sx={{ mt: 1.5, color: 'text.secondary', maxWidth: 580, mx: 'auto' }}>
            Every small business has repetitive steps like these. Pick one, then drag from
            manual to automated.
          </Typography>
        </Box>
      </Reveal>

      <Reveal delay={0.08} fullWidth>
        <Box sx={{ maxWidth: 920, mx: 'auto' }}>
          <Box
            role="radiogroup"
            aria-label="Choose an industry"
            sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 2, flexWrap: 'wrap' }}
          >
            {PRESET_ORDER.map((id) => {
              const active = id === presetId;
              return (
                <Box
                  key={id}
                  component="button"
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => selectPreset(id)}
                  sx={{
                    px: 2,
                    py: 0.75,
                    borderRadius: 9999,
                    fontFamily: 'inherit',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                    border: '1px solid',
                    borderColor: active ? 'primary.main' : 'divider',
                    bgcolor: active ? 'primary.main' : '#ffffff',
                    color: active ? 'primary.contrastText' : 'text.secondary',
                    transition: 'background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease',
                    '&:focus-visible': { outline: 'none', boxShadow: '0 0 0 3px rgba(37, 99, 235, 0.35)' },
                    '&:hover': { borderColor: active ? 'primary.main' : '#cbd5e1' },
                  }}
                >
                  {PRESETS[id].label}
                </Box>
              );
            })}
          </Box>

          <Box
            ref={stageRef}
            onPointerDown={handleStagePointerDown}
            onKeyDown={(event) => {
              if (event.key === 'Escape') setSelectedStage(null);
            }}
            sx={{
              position: 'relative',
              width: '100%',
              aspectRatio: { xs: '4 / 3', sm: '16 / 9', md: '19 / 10' },
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
            <Pipeline
              dial={source}
              reduce={reduce}
              active={inView}
              selectedStage={selectedStage}
              stageLabels={preset.stages.map((s) => s.shortLabel)}
            />

            <JobLayer jobs={jobs} />

            <Box role="group" aria-label={`${preset.label} pipeline stages`}>
              {preset.stages.map((stage, i) => (
                <Box
                  key={i}
                  component="button"
                  type="button"
                  ref={(el: HTMLButtonElement | null) => {
                    stageBtnRefs.current[i] = el;
                  }}
                  tabIndex={focusStage === i ? 0 : -1}
                  aria-expanded={selectedStage === i}
                  aria-controls="ae-explainer"
                  aria-label={`${stage.label} — what we build`}
                  onPointerDown={(event) => event.stopPropagation()}
                  onClick={() => toggleStage(i)}
                  onKeyDown={(event) => handleStageKeyDown(event, i)}
                  sx={{
                    position: 'absolute',
                    left: `${(STAGE_CX[i] / VB_W) * 100}%`,
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '24%',
                    height: '72%',
                    p: 0,
                    background: 'transparent',
                    border: 'none',
                    borderRadius: 3,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    outline: 'none',
                    '&:focus-visible': { boxShadow: '0 0 0 3px rgba(37, 99, 235, 0.4)' },
                  }}
                />
              ))}
            </Box>

            <CornerLabel h="left" v="top" opacity={manualOpacity} tone="muted">
              <LabelStrong>Manual</LabelStrong>
            </CornerLabel>
            <CornerLabel h="right" v="top" opacity={autoOpacity} tone="brand">
              <LabelStrong>Automated</LabelStrong>
            </CornerLabel>
            <SceneFooter manualPhrase={manualPhrase} autoPhrase={autoPhrase} />

            <AnimatePresence>
              {selectedStage !== null && (
                <Box
                  key={presetId + selectedStage}
                  component={motion.div}
                  id="ae-explainer"
                  role="region"
                  aria-label={`${preset.stages[selectedStage].label} — an example of what we'd automate`}
                  initial={{ y: 24, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 24, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 320, damping: 30 }}
                  onPointerDown={(event) => event.stopPropagation()}
                  sx={{
                    position: 'absolute',
                    left: 12,
                    right: 12,
                    bottom: 12,
                    zIndex: 6,
                    display: 'flex',
                    gap: 1.5,
                    p: 2,
                    bgcolor: '#ffffff',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 3,
                    boxShadow: '0 16px 40px -12px rgba(15, 23, 42, 0.3)',
                  }}
                >
                  <Box sx={{ flexShrink: 0, width: 5, borderRadius: 9999, bgcolor: 'primary.main' }} />
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography
                      variant="overline"
                      sx={{ display: 'block', fontSize: 10, fontWeight: 800, letterSpacing: 1, color: 'primary.main', lineHeight: 1.4 }}
                    >
                      An example · {preset.stages[selectedStage].label}
                    </Typography>
                    <Typography sx={{ mt: 0.5, fontSize: 13, color: 'text.secondary' }}>
                      {preset.stages[selectedStage].explainer}
                    </Typography>
                    <Typography sx={{ mt: 1, fontSize: 11.5, color: 'text.disabled', fontStyle: 'italic' }}>
                      We build this custom around how your business actually works.
                    </Typography>
                  </Box>
                  <IconButton
                    size="small"
                    aria-label="Close"
                    onClick={() => setSelectedStage(null)}
                    sx={{ flexShrink: 0, alignSelf: 'flex-start' }}
                  >
                    <CloseRoundedIcon fontSize="small" />
                  </IconButton>
                </Box>
              )}
            </AnimatePresence>

            <Box
              component={motion.div}
              style={{ left: handleLeft }}
              role="slider"
              tabIndex={0}
              aria-label="Automation level"
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
                zIndex: 5,
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
                  top: '12%',
                  bottom: '20%',
                  width: 2,
                  bgcolor: 'primary.main',
                  boxShadow: '0 0 0 1px rgba(255, 255, 255, 0.65)',
                },
                '&:focus-visible .ae-grip': { boxShadow: '0 0 0 4px rgba(37, 99, 235, 0.35)' },
              }}
            >
              <Box
                className="ae-grip"
                sx={{
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
            Drag from manual to automated · tap any step for an example
          </Typography>
        </Box>
      </Reveal>
    </Container>
  );
}

function LabelStrong({ children }: { children: ReactNode }) {
  return (
    <Typography component="span" sx={{ fontWeight: 800, fontSize: { xs: 11.5, sm: 13 }, lineHeight: 1 }}>
      {children}
    </Typography>
  );
}

function SceneFooter({
  manualPhrase,
  autoPhrase,
}: {
  manualPhrase: MotionValue<number>;
  autoPhrase: MotionValue<number>;
}) {
  const phraseSx = {
    position: 'absolute',
    right: 0,
    top: 0,
    whiteSpace: 'nowrap',
    fontSize: { xs: 9, sm: 10.5 },
    fontWeight: 700,
    lineHeight: 1,
  } as const;
  return (
    <Box
      aria-hidden
      sx={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: '12%',
        minHeight: 22,
        zIndex: 4,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: { xs: 1.5, sm: 2.5 },
        pointerEvents: 'none',
      }}
    >
      <Box
        component="span"
        sx={{ display: 'flex', alignItems: 'center', gap: 0.7, fontSize: { xs: 9, sm: 10.5 }, fontWeight: 600, color: 'text.disabled' }}
      >
        <Box component="svg" viewBox="0 0 22 14" sx={{ width: 20, height: 13, flexShrink: 0 }}>
          <rect x={1} y={1} width={20} height={12} rx={3} fill="#ffffff" stroke="#cbd5e1" strokeWidth={1.3} />
          <rect x={3.4} y={4} width={5} height={5} rx={1} fill="#ffffff" stroke="#cbd5e1" strokeWidth={1.2} />
          <line x1={11} y1={5} x2={18} y2={5} stroke="#cbd5e1" strokeWidth={1.5} strokeLinecap="round" />
          <line x1={11} y1={9} x2={16} y2={9} stroke="#dbe2ea" strokeWidth={1.5} strokeLinecap="round" />
        </Box>
        one task
      </Box>

      <Box sx={{ position: 'relative', height: 14, minWidth: { xs: 128, sm: 168 } }}>
        <Box component={motion.span} style={{ opacity: manualPhrase }} sx={{ ...phraseSx, color: '#b45309' }}>
          A person touches every task
        </Box>
        <Box component={motion.span} style={{ opacity: autoPhrase }} sx={{ ...phraseSx, color: 'primary.main' }}>
          Tasks move on their own
        </Box>
      </Box>
    </Box>
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
