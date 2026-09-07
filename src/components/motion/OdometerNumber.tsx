import { useRef } from 'react';
import Box from '@mui/material/Box';
import { motion, useInView, useReducedMotion } from 'framer-motion';

interface OdometerNumberProps {
  /** Final value to display. Each digit rolls up to its target when scrolled into view. */
  value: number;
  /** Roll duration in ms (columns stagger on top of this). */
  durationMs?: number;
}

const DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

/**
 * Renders an integer as a set of vertical digit reels that roll up to their target
 * value the first time the number scrolls into view — the odometer flourish on the
 * hero stat cards. Falls back to the static final value when the user prefers
 * reduced motion. Mirrors `useCountUp`'s in-view trigger (`once`, `-100px` margin).
 */
export function OdometerNumber({ value, durationMs = 1100 }: OdometerNumberProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });
  const reduce = useReducedMotion();

  const chars = Math.max(0, Math.round(value)).toString().split('');
  const settled = inView || reduce;

  return (
    <Box
      ref={ref}
      component="span"
      sx={{
        display: 'inline-flex',
        height: '1em',
        overflow: 'hidden',
        lineHeight: 1,
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      {chars.map((ch, i) => {
        const digit = Number(ch);
        return (
          <Box
            // Index key is intentional: the digit count for a given stat never changes at runtime.
            key={i}
            component={motion.span}
            initial={false}
            animate={{ y: settled ? `-${digit}em` : '0em' }}
            transition={
              reduce
                ? { duration: 0 }
                : { duration: durationMs / 1000, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }
            }
            sx={{ display: 'flex', flexDirection: 'column' }}
          >
            {DIGITS.map((d) => (
              <Box component="span" key={d} sx={{ height: '1em' }}>
                {d}
              </Box>
            ))}
          </Box>
        );
      })}
    </Box>
  );
}
