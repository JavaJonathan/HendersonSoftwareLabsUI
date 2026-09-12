import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

/**
 * A number that eases to its new value instead of jumping. Used for the calculator's
 * headline figure, where the movement is the point: dragging a slider should feel like it
 * is moving something real.
 *
 * Deliberately animates the *value*, not a CSS property, so whatever `format` produces
 * (hours, money, percent) counts up in step. Honors reduced motion by snapping instantly.
 */

interface CountUpProps {
  value: number;
  format: (value: number) => string;
  /** Milliseconds for a full traverse. Short: this sits under a live slider. */
  durationMs?: number;
}

/** Ease-out cubic - fast at first, settles gently, no overshoot. */
function easeOut(t: number): number {
  return 1 - (1 - t) ** 3;
}

export function CountUp({ value, format, durationMs = 450 }: CountUpProps) {
  const reduce = useReducedMotion() ?? false;
  const [shown, setShown] = useState(value);
  /**
   * What is on screen right now. A new target mid-flight has to start from here, not from
   * where the last run began, or dragging a slider reads as a series of jumps.
   */
  const shownRef = useRef(value);

  useEffect(() => {
    if (reduce || !Number.isFinite(value)) {
      shownRef.current = value;
      setShown(value);
      return;
    }

    const from = shownRef.current;
    if (Math.abs(from - value) < 1e-9) return;

    let frame = 0;
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const next = t >= 1 ? value : from + (value - from) * easeOut(t);
      shownRef.current = next;
      setShown(next);
      if (t < 1) frame = requestAnimationFrame(step);
    };

    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [value, durationMs, reduce]);

  return <>{format(shown)}</>;
}
