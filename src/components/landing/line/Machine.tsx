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
 * The sorting machine at the end of the belt.
 *
 * Everything cleared, by hand or automatically, travels into it, and that one image is the whole
 * argument the section is making: you and the machine do the same job, and the machine never
 * stops. It gets visibly buried as work backs up and settles as it clears, so the state of the
 * line is readable from a face rather than from a number.
 *
 * Drawn in the same line-art vocabulary as the rest of the site: one scalar drives each element
 * through `useTransform`, applied via `style` on a `motion` element rather than by animating SVG
 * attributes, with staggered sub-ranges so no two crossfades happen at once. Everything that moves
 * moves by transform or opacity only, never by animating geometry, which keeps it cheap and avoids
 * the browser inconsistencies around animated SVG attributes.
 *
 * It is `aria-hidden`. A screen reader gets the same information from the mood chip beside it,
 * which is also why that chip exists for sighted users: the state must never be carried by colour
 * alone.
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
  calm: { blink: 4.2, halo: 2.4 },
  busy: { blink: 3.2, halo: 1.7 },
  swamped: { blink: 2.4, halo: 1.1 },
};

/** Per-element constants that lerp to zero, the same idiom the old pipeline used for its chaos. */
const CONFETTI = [
  { rot: -24, dx: -16, rise: 34 },
  { rot: 18, dx: -7, rise: 40 },
  { rot: -12, dx: 2, rise: 46 },
  { rot: 26, dx: 10, rise: 40 },
  { rot: -18, dx: 18, rise: 34 },
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

  // The rattle and the eye scan. Neither starts under reduced motion, so the amplitudes derived
  // from them below are exactly zero rather than merely small.
  useEffect(() => {
    if (reduce) return;
    const shake = animate(wobble, [-1, 1, -1], { repeat: Infinity, duration: 0.16, ease: 'linear' });
    const look = animate(scan, [-1, 1, -1], { repeat: Infinity, duration: 5.2, ease: 'easeInOut' });
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
      // A static celebrating pose rather than a hop, held long enough to be noticed.
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

  // Every cleared task visibly goes somewhere: the intake flexes and the whole body takes the
  // hit. Without this the tokens fly toward a machine that does not react, and the connection
  // between the clicking and the eating is left for the visitor to infer.
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

  // Squared, so it is genuinely still when calm and only rattles when that means something.
  const shakeX = useTransform([stress, wobble], ([s, w]: number[]) => s * s * 1.8 * w);
  const bodyRotate = useTransform(
    [stress, wobble, party],
    ([s, w, p]: number[]) => s * s * 0.9 * w + Math.sin(p * Math.PI * 2) * 5,
  );
  const hop = useTransform(party, [0, 0.3, 0.6, 1], [0, -10, 0, 0]);
  const squash = useTransform([relief, gulp], ([r, g]: number[]) =>
    (r < 0.25 ? 1 : 0.92) * (1 - g * 0.06));
  const intakeScale = useTransform(gulp, [0, 1], [1, 1.22]);

  // Amber at the top of the range, never red. Red on a business page reads as an outage rather
  // than as someone having a busy afternoon.
  const bodyStroke = useTransform(stress, [0, 0.55, 1], ['#93c5fd', '#cbd5e1', '#f59e0b']);
  const bodyFill = useTransform(stress, [0, 1], ['#f8fbff', '#ffffff']);
  const footY = useTransform(stress, [0, 1], [0, 1.5]);

  // Squint by scaling a fixed rect rather than animating its height attribute.
  const eyeSquint = useTransform(stress, [0, 0.4, 0.75, 1], [1, 1, 0.64, 0.43]);
  const eyeWiden = useTransform(stress, [0, 0.75, 1], [1, 1, 1.25]);
  const pupilX = useTransform([scan, stress, wobble], ([p, s, w]: number[]) => p * 1.6 + s * w * 0.6);

  const smile = useTransform([stress, relief], ([s, r]: number[]) => Math.max(1 - s / 0.45, r));
  const flat = useTransform(stress, [0.25, 0.5, 0.75], [0, 1, 0]);
  const grimace = useTransform(stress, [0.6, 1], [0, 1]);

  const lampGreen = useTransform([stress, party], ([s, p]: number[]) => Math.max(1 - s / 0.35, p));
  const lampAmber = useTransform(stress, [0.3, 0.55, 0.9], [0, 1, 0.4]);
  // Deliberately orange rather than red at the top of the range. A red lamp on a business
  // homepage reads as something being broken, and nothing here is broken.
  const lampRed = useTransform(stress, [0.85, 1], [0, 1]);

  const puffOpacity = useTransform(relief, [0, 0.5, 1], [0, 0.5, 0]);
  const puffScale = useTransform(relief, [0, 1], [0.3, 1]);
  const puffY = useTransform(relief, [0, 1], [0, -12]);

  // Inverted on purpose: the output flows freely when automations carry the load and stutters when
  // the machine is buried, because throughput is exactly what automation buys.
  const chuteOpacity = useTransform(stress, [0.5, 1], [1, 0.25]);

  return (
    <svg
      viewBox="0 0 120 120"
      preserveAspectRatio="xMidYMid meet"
      width="100%"
      height="100%"
      aria-hidden
      style={{ display: 'block', overflow: 'visible' }}
    >
      <g transform="translate(60 60)">
        <motion.g style={{ x: shakeX, y: hop, rotate: bodyRotate }}>
          <motion.g style={{ y: footY }}>
            <rect x={-22} y={26} width={12} height={6} rx={3} fill="#e7ecf2" />
            <rect x={10} y={26} width={12} height={6} rx={3} fill="#e7ecf2" />
          </motion.g>

          {/* the intake, where the belt arrives. It flexes as each task goes down. */}
          <motion.path
            d="M -46 2 L -33 -4 L -33 16 L -46 20 Z"
            fill="#ffffff"
            stroke="#cbd5e1"
            strokeWidth={1.75}
            strokeLinejoin="round"
            style={{ scaleY: intakeScale, transformBox: 'fill-box', transformOrigin: 'center' }}
          />

          {/* the output chute */}
          <motion.g style={{ opacity: chuteOpacity }}>
            <rect x={31} y={2} width={12} height={10} rx={3} fill="#ffffff" stroke="#bfdbfe" strokeWidth={1.5} />
            <rect x={45} y={4} width={7} height={6} rx={1.5} fill="#eff6ff" stroke="#bfdbfe" strokeWidth={1.2} />
          </motion.g>

          <motion.g style={{ scaleY: squash, transformBox: 'fill-box', transformOrigin: 'bottom' }}>
            <motion.rect
              x={-32}
              y={-24}
              width={64}
              height={52}
              rx={10}
              strokeWidth={1.75}
              style={{ fill: bodyFill, stroke: bodyStroke }}
            />

            {/* status lamp: three stacked circles crossfaded, never an animated colour */}
            <g transform="translate(0 -32)">
              <circle r={4.8} fill="#ffffff" stroke="#e2e8f0" strokeWidth={1.2} />
              <motion.circle r={3} fill="#16a34a" style={{ opacity: lampGreen }} />
              <motion.circle r={3} fill="#f59e0b" style={{ opacity: lampAmber }} />
              <motion.circle r={3} fill="#f97316" style={{ opacity: lampRed }} />
              {!reduce && (
                <motion.circle
                  r={4.8}
                  fill="none"
                  stroke="#93c5fd"
                  strokeWidth={1.2}
                  animate={{ scale: [1, 1.35, 1], opacity: [0.35, 0, 0.35] }}
                  transition={{ duration: LOOPS[mood].halo, repeat: Infinity, ease: 'easeInOut' }}
                />
              )}
            </g>

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
              <Eye cx={-13} squint={eyeSquint} widen={eyeWiden} pupilX={pupilX} />
              <Eye cx={13} squint={eyeSquint} widen={eyeWiden} pupilX={pupilX} />
            </motion.g>

            {/* mouth: three stacked paths crossfaded on staggered ranges, never a path morph */}
            <g transform="translate(0 11)">
              <motion.path d="M -9 0 Q 0 7, 9 0" fill="none" stroke="#64748b" strokeWidth={1.8} strokeLinecap="round" style={{ opacity: smile }} />
              <motion.path d="M -9 2 L 9 2" fill="none" stroke="#64748b" strokeWidth={1.8} strokeLinecap="round" style={{ opacity: flat }} />
              <motion.path d="M -9 5 Q 0 -2, 9 5" fill="none" stroke="#b45309" strokeWidth={1.8} strokeLinecap="round" style={{ opacity: grimace }} />
            </g>
          </motion.g>

          {/* the relief exhale */}
          <motion.g style={{ opacity: puffOpacity, scale: puffScale, y: puffY }}>
            <circle cx={-16} cy={-30} r={4} fill="none" stroke="#bfdbfe" strokeWidth={1.3} />
            <circle cx={16} cy={-30} r={4} fill="none" stroke="#bfdbfe" strokeWidth={1.3} />
          </motion.g>

          {CONFETTI.map((bit, i) => (
            <ConfettiBit key={i} party={party} bit={bit} index={i} />
          ))}
        </motion.g>
      </g>
    </svg>
  );
}

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
    <g transform={`translate(${cx} -9)`}>
      <motion.rect
        x={-3}
        y={-3.5}
        width={6}
        height={7}
        rx={3}
        fill="#ffffff"
        stroke="#94a3b8"
        strokeWidth={1.3}
        style={{ scaleY: squint, scaleX: widen, transformBox: 'fill-box', transformOrigin: 'center' }}
      />
      <motion.circle cy={0.5} r={1.9} fill="#0f172a" style={{ x: pupilX }} />
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
      y={-26}
      width={4}
      height={4}
      rx={1.2}
      fill={index % 2 === 0 ? '#2563eb' : '#93c5fd'}
      style={{ x, y, rotate: spin, opacity, transformBox: 'fill-box', transformOrigin: 'center' }}
    />
  );
}
