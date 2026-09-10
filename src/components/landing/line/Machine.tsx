import { useEffect, useRef } from 'react';
import {
  animate,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  type MotionValue,
} from 'framer-motion';
import type { Mood } from './lineModel';

/**
 * The sorter: the character at the end of the belt that everything cleared travels into.
 *
 * It carries all the warmth in this section, so it is drawn as an actual object rather than a
 * rounded rectangle with a face. It has a body, a recessed display panel holding the face, an
 * antenna, a plinth it stands on, an in-tray the belt feeds, and an out-tray where finished work
 * stacks up. The geometry is built around one measured fact: the belt's centre line lands near
 * the bottom edge of this viewBox, so the mouth is at the base where the belt actually arrives,
 * not partway up the side where it would be pointing at nothing.
 *
 * A few deliberate bits of animation craft:
 *
 * The antenna trails the body on its own softer spring, so it lags and overshoots instead of
 * moving rigidly with everything else. Secondary motion like that is most of what separates
 * something that feels alive from something that is merely animated.
 *
 * The eyes carry a fixed highlight and track the belt, so it is visibly watching the work come
 * in. Rattle amplitude is squared, so it is genuinely still when calm rather than permanently
 * twitching.
 *
 * Everything moves by transform or opacity only, never by animating SVG geometry, and every
 * visual property derives from a single scalar through `useTransform` in the house idiom.
 *
 * It is `aria-hidden`: the same state is published in words by the mood chip beside it, which is
 * also why that chip exists for sighted users. State is never carried by colour alone.
 */

interface MachineProps {
  /** 0 to 1, how buried it is. */
  stress: number;
  mood: Mood;
  reduce: boolean;
  /** Bumped when an automation unlocks. */
  partyNonce: number;
  /** Bumped when the backlog drops sharply. */
  reliefNonce: number;
  /** Bumped every time work is cleared, so the machine visibly swallows it. */
  gulpNonce: number;
}

const LOOPS: Record<Mood, { blink: number; halo: number }> = {
  calm: { blink: 4.4, halo: 2.6 },
  busy: { blink: 3.2, halo: 1.7 },
  swamped: { blink: 2.3, halo: 1.05 },
};

/** Per-element constants that lerp to zero, the same idiom the old pipeline used for its chaos. */
const CONFETTI = [
  { rot: -26, dx: -18, rise: 30 },
  { rot: 20, dx: -8, rise: 38 },
  { rot: -14, dx: 2, rise: 44 },
  { rot: 28, dx: 12, rise: 38 },
  { rot: -20, dx: 20, rise: 30 },
];

export function Machine({ stress: rawStress, mood, reduce, partyNonce, reliefNonce, gulpNonce }: MachineProps) {
  const target = useMotionValue(rawStress);
  const stress = useSpring(
    target,
    reduce ? { stiffness: 500, damping: 50, mass: 0.5 } : { stiffness: 60, damping: 18, mass: 1 },
  );

  const wobble = useMotionValue(0);
  const scan = useMotionValue(0);
  const relief = useMotionValue(0);
  const party = useMotionValue(0);
  const gulp = useMotionValue(0);

  useEffect(() => {
    target.set(Number.isFinite(rawStress) ? Math.min(1, Math.max(0, rawStress)) : 0);
  }, [rawStress, target]);

  useEffect(() => {
    if (reduce) return;
    const shake = animate(wobble, [-1, 1, -1], { repeat: Infinity, duration: 0.16, ease: 'linear' });
    const look = animate(scan, [-1, 1, -1], { repeat: Infinity, duration: 5.4, ease: 'easeInOut' });
    return () => {
      shake.stop();
      look.stop();
    };
  }, [reduce, wobble, scan]);

  const firstParty = useRef(true);
  useEffect(() => {
    if (firstParty.current) {
      firstParty.current = false;
      return;
    }
    if (reduce) {
      party.set(1);
      const id = window.setTimeout(() => party.set(0), 1500);
      return () => window.clearTimeout(id);
    }
    const controls = animate(party, [0, 1, 0], { duration: 2.5, ease: 'easeOut' });
    return () => controls.stop();
  }, [partyNonce, party, reduce]);

  const firstRelief = useRef(true);
  useEffect(() => {
    if (firstRelief.current) {
      firstRelief.current = false;
      return;
    }
    if (reduce) return;
    const controls = animate(relief, [1, 0], { duration: 1.2, ease: 'easeOut' });
    return () => controls.stop();
  }, [reliefNonce, relief, reduce]);

  const firstGulp = useRef(true);
  useEffect(() => {
    if (firstGulp.current) {
      firstGulp.current = false;
      return;
    }
    if (reduce) return;
    const controls = animate(gulp, [0, 1, 0], { duration: 0.34, ease: 'easeOut' });
    return () => controls.stop();
  }, [gulpNonce, gulp, reduce]);

  const shakeX = useTransform([stress, wobble], ([s, w]: number[]) => s * s * 1.9 * w);
  const bodyRotate = useTransform(
    [stress, wobble, party],
    ([s, w, p]: number[]) => s * s * 0.9 * w + Math.sin(p * Math.PI * 2) * 5,
  );
  const hop = useTransform([party, gulp], ([p, g]: number[]) =>
    (p <= 0 ? 0 : p < 0.3 ? -10 * (p / 0.3) : p < 0.6 ? -10 * (1 - (p - 0.3) / 0.3) : 0) + g * 1.6,
  );
  const squash = useTransform([relief, gulp], ([r, g]: number[]) => (r < 0.25 ? 1 : 0.93) * (1 - g * 0.07));

  // The antenna is deliberately on a slower spring than the body, so it trails and overshoots.
  const antennaLag = useSpring(shakeX, { stiffness: 130, damping: 9, mass: 0.7 });
  const antennaTilt = useTransform(antennaLag, (x: number) => -x * 1.8);

  const bodyStroke = useTransform(stress, [0, 0.55, 1], ['#93c5fd', '#cbd5e1', '#f59e0b']);
  const panelFill = useTransform(stress, [0, 1], ['#eff6ff', '#fff7ed']);

  const eyeSquint = useTransform(stress, [0, 0.4, 0.75, 1], [1, 1, 0.62, 0.4]);
  const eyeWiden = useTransform(stress, [0, 0.75, 1], [1, 1, 1.22]);
  const pupilX = useTransform([scan, stress, wobble], ([p, s, w]: number[]) => p * 2 + s * w * 0.7);

  const smile = useTransform([stress, relief], ([s, r]: number[]) => Math.max(1 - s / 0.45, r));
  const flat = useTransform(stress, [0.25, 0.5, 0.75], [0, 1, 0]);
  const grimace = useTransform(stress, [0.6, 1], [0, 1]);

  const lampGreen = useTransform([stress, party], ([s, p]: number[]) => Math.max(1 - s / 0.35, p));
  const lampAmber = useTransform(stress, [0.3, 0.55, 0.9], [0, 1, 0.4]);
  const lampHot = useTransform(stress, [0.85, 1], [0, 1]);

  const puffOpacity = useTransform(relief, [0, 0.5, 1], [0, 0.55, 0]);
  const puffScale = useTransform(relief, [0, 1], [0.3, 1]);
  const puffY = useTransform(relief, [0, 1], [0, -12]);

  // The mouth flexes as each task goes down, so clicking visibly feeds it.
  const mouthScale = useTransform(gulp, [0, 1], [1, 1.28]);
  // Inverted on purpose: the out-tray flows when automation carries the load and stalls when the
  // machine is buried, because throughput is exactly what automation buys.
  const outTrayOpacity = useTransform(stress, [0.5, 1], [1, 0.3]);

  return (
    <svg
      viewBox="0 0 120 120"
      preserveAspectRatio="xMidYMid meet"
      width="100%"
      height="100%"
      aria-hidden
      style={{ display: 'block', overflow: 'visible' }}
    >
      <defs>
        <linearGradient id="hsl-machine-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#eef2f7" />
        </linearGradient>
        <linearGradient id="hsl-machine-base" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e2e8f0" />
          <stop offset="1" stopColor="#cbd5e1" />
        </linearGradient>
      </defs>

      <g transform="translate(60 60)">
        {/* grounding shadow, so it stands rather than floats */}
        <ellipse cx={0} cy={57} rx={31} ry={3.4} fill="rgba(15, 23, 42, 0.13)" />

        {/* the in-tray the belt runs onto */}
        <path
          d="M -58 45 L -30 42 L -30 55 L -58 55 Z"
          fill="url(#hsl-machine-base)"
          stroke="#94a3b8"
          strokeWidth={1.4}
          strokeLinejoin="round"
        />

        <motion.g style={{ x: shakeX, y: hop, rotate: bodyRotate }}>
          <motion.g style={{ scaleY: squash, transformBox: 'fill-box', transformOrigin: 'bottom' }}>
            {/* plinth */}
            <rect x={-31} y={37} width={62} height={19} rx={5} fill="url(#hsl-machine-base)" stroke="#94a3b8" strokeWidth={1.5} />
            {/* vents */}
            <rect x={8} y={43} width={16} height={2.2} rx={1.1} fill="#94a3b8" opacity={0.5} />
            <rect x={8} y={48} width={16} height={2.2} rx={1.1} fill="#94a3b8" opacity={0.5} />

            {/* the mouth the work goes into, at the height the belt actually arrives */}
            <motion.g style={{ scaleX: mouthScale, transformBox: 'fill-box', transformOrigin: 'center' }}>
              <rect x={-33} y={41} width={15} height={12} rx={2.5} fill="#334155" />
              <rect x={-33} y={41} width={15} height={3} rx={1.5} fill="#1e293b" />
            </motion.g>

            {/* body */}
            <motion.rect
              x={-34}
              y={-28}
              width={68}
              height={68}
              rx={17}
              fill="url(#hsl-machine-body)"
              strokeWidth={2}
              style={{ stroke: bodyStroke }}
            />

            {/* side bolts, the small asymmetries that stop it reading as a primitive */}
            <circle cx={-28} cy={30} r={2} fill="#cbd5e1" />
            <circle cx={28} cy={30} r={2} fill="#cbd5e1" />

            {/* recessed display panel holding the face */}
            <motion.rect
              x={-26}
              y={-19}
              width={52}
              height={39}
              rx={12}
              stroke="#dbe3ec"
              strokeWidth={1.4}
              style={{ fill: panelFill }}
            />

            <motion.g
              animate={reduce ? undefined : { scaleY: [1, 1, 0.1, 1, 1] }}
              transition={{
                duration: LOOPS[mood].blink,
                times: [0, 0.93, 0.96, 0.99, 1],
                repeat: Infinity,
                ease: 'linear',
              }}
              style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
            >
              <Eye cx={-12} squint={eyeSquint} widen={eyeWiden} pupilX={pupilX} />
              <Eye cx={12} squint={eyeSquint} widen={eyeWiden} pupilX={pupilX} />
            </motion.g>

            {/* mouth: three stacked paths crossfaded on staggered ranges, never a path morph */}
            <g transform="translate(0 13)">
              <motion.path d="M -10 0 Q 0 8, 10 0" fill="none" stroke="#64748b" strokeWidth={2} strokeLinecap="round" style={{ opacity: smile }} />
              <motion.path d="M -10 3 L 10 3" fill="none" stroke="#64748b" strokeWidth={2} strokeLinecap="round" style={{ opacity: flat }} />
              <motion.path d="M -10 6 Q 0 -2, 10 6" fill="none" stroke="#b45309" strokeWidth={2} strokeLinecap="round" style={{ opacity: grimace }} />
            </g>
          </motion.g>

          {/* antenna, trailing the body on its own softer spring */}
          <motion.g style={{ rotate: antennaTilt, transformBox: 'fill-box', transformOrigin: 'bottom' }}>
            <line x1={0} y1={-28} x2={0} y2={-42} stroke="#cbd5e1" strokeWidth={2.5} strokeLinecap="round" />
            <circle cx={0} cy={-46} r={5.4} fill="#ffffff" stroke="#e2e8f0" strokeWidth={1.4} />
            <motion.circle cx={0} cy={-46} r={3.4} fill="#16a34a" style={{ opacity: lampGreen }} />
            <motion.circle cx={0} cy={-46} r={3.4} fill="#f59e0b" style={{ opacity: lampAmber }} />
            <motion.circle cx={0} cy={-46} r={3.4} fill="#f97316" style={{ opacity: lampHot }} />
            {!reduce && (
              <motion.circle
                cx={0}
                cy={-46}
                r={5.4}
                fill="none"
                stroke="#93c5fd"
                strokeWidth={1.3}
                animate={{ scale: [1, 1.45, 1], opacity: [0.4, 0, 0.4] }}
                transition={{ duration: LOOPS[mood].halo, repeat: Infinity, ease: 'easeInOut' }}
                style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
              />
            )}
          </motion.g>

          {/* the out-tray, where finished work stacks up */}
          <motion.g style={{ opacity: outTrayOpacity }}>
            <path d="M 34 18 L 52 14 L 52 27 L 34 27 Z" fill="#ffffff" stroke="#bfdbfe" strokeWidth={1.4} strokeLinejoin="round" />
            <rect x={38} y={16} width={11} height={2.4} rx={1.2} fill="#bfdbfe" />
            <rect x={38} y={20} width={8} height={2.4} rx={1.2} fill="#dbeafe" />
          </motion.g>

          {/* the relief exhale */}
          <motion.g style={{ opacity: puffOpacity, scale: puffScale, y: puffY }}>
            <circle cx={-20} cy={-34} r={4} fill="none" stroke="#bfdbfe" strokeWidth={1.4} />
            <circle cx={20} cy={-34} r={4} fill="none" stroke="#bfdbfe" strokeWidth={1.4} />
          </motion.g>

          {CONFETTI.map((bit, i) => (
            <ConfettiBit key={i} party={party} bit={bit} index={i} />
          ))}
        </motion.g>
      </g>
    </svg>
  );
}

/**
 * One eye. The fixed highlight is doing more work than its size suggests: a flat dark pupil reads
 * as a printed dot, and the same pupil with a catchlight reads as wet and alive.
 */
function Eye({
  cx,
  squint,
  widen,
  pupilX,
}: {
  cx: number;
  squint: MotionValue<number>;
  widen: MotionValue<number>;
  pupilX: MotionValue<number>;
}) {
  return (
    <g transform={`translate(${cx} -3)`}>
      <motion.rect
        x={-6}
        y={-6.5}
        width={12}
        height={13}
        rx={6}
        fill="#ffffff"
        stroke="#94a3b8"
        strokeWidth={1.4}
        style={{ scaleY: squint, scaleX: widen, transformBox: 'fill-box', transformOrigin: 'center' }}
      />
      <motion.g style={{ x: pupilX }}>
        <circle cy={0.5} r={3.2} fill="#0f172a" />
        <circle cx={-1.1} cy={-0.9} r={1.15} fill="#ffffff" />
      </motion.g>
    </g>
  );
}

function ConfettiBit({
  party,
  bit,
  index,
}: {
  party: MotionValue<number>;
  bit: { rot: number; dx: number; rise: number };
  index: number;
}) {
  const y = useTransform(party, [0, 1], [0, -bit.rise]);
  const x = useTransform(party, [0, 1], [0, bit.dx]);
  const spin = useTransform(party, [0, 1], [0, bit.rot]);
  const opacity = useTransform(party, [0, 0.15, 0.75, 1], [0, 1, 1, 0]);

  return (
    <motion.rect
      x={-2}
      y={-40}
      width={4.5}
      height={4.5}
      rx={1.3}
      fill={index % 2 === 0 ? '#2563eb' : '#93c5fd'}
      style={{ x, y, rotate: spin, opacity, transformBox: 'fill-box', transformOrigin: 'center' }}
    />
  );
}
