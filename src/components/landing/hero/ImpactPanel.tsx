import { useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { SxProps, Theme } from '@mui/material/styles';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { useCountUp } from '../../../hooks/useCountUp';
import { IMPACT, hoursSavedBase } from './impactModel';

/**
 * The hero's proof panel: two numbers on one white surface. "Hours saved" counts up on
 * load and then keeps creeping upward - a live "and counting" figure. "Workflows automated"
 * is a plain count with a concrete supporting line, so it reads the same whether it's 8
 * or 80.
 */

const HEADING_FONT = '"Plus Jakarta Sans", system-ui, sans-serif';
const REVEAL_MS = 3000;

const bigNumberSx: SxProps<Theme> = {
  fontFamily: HEADING_FONT,
  fontWeight: 800,
  fontSize: { xs: 32, md: 52 },
  lineHeight: 1,
  color: 'primary.main',
  fontVariantNumeric: 'tabular-nums',
  letterSpacing: '-0.02em',
};

const plusSx: SxProps<Theme> = {
  fontFamily: HEADING_FONT,
  fontWeight: 800,
  fontSize: { xs: 18, md: 26 },
  color: 'primary.main',
  lineHeight: 1,
};

const cellSx: SxProps<Theme> = { flex: 1, minWidth: 0, px: { xs: 2.5, md: 3.5 }, py: { xs: 2.5, md: 3.5 } };
const labelSx: SxProps<Theme> = { mt: 1.25, fontWeight: 700, color: 'text.primary', fontSize: 16 };
const subSx: SxProps<Theme> = { mt: 0.25, color: 'text.secondary' };

export function ImpactPanel() {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'row', md: 'column' },
        borderRadius: 4,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: '#ffffff',
        boxShadow: '0 30px 60px -32px rgba(15, 23, 42, 0.28)',
        overflow: 'hidden',
      }}
    >
      <HoursStat />
      <Box
        sx={{
          alignSelf: 'stretch',
          bgcolor: 'divider',
          width: { xs: '1px', md: 'auto' },
          height: { xs: 'auto', md: '1px' },
          my: { xs: 2.5, md: 0 },
          mx: { xs: 0, md: 3.5 },
        }}
      />
      <WorkflowsStat />
    </Box>
  );
}

function useAccruingHours(reduce: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });
  const [display, setDisplay] = useState(0);
  const [ticked, setTicked] = useState(false);

  useEffect(() => {
    if (!inView) return;

    if (reduce) {
      setDisplay(hoursSavedBase());
      return;
    }

    let raf = 0;
    let interval = 0;
    let start: number | null = null;
    let sessionTicks = 0;
    const target = hoursSavedBase();

    function reveal(t: number) {
      if (start === null) start = t;
      const p = Math.min((t - start) / REVEAL_MS, 1);
      const eased = 1 - (1 - p) ** 3;
      setDisplay(Math.round(eased * target));
      if (p < 1) {
        raf = requestAnimationFrame(reveal);
        return;
      }
      interval = window.setInterval(() => {
        sessionTicks += 1;
        setDisplay(hoursSavedBase() + sessionTicks);
        setTicked(true);
        window.setTimeout(() => setTicked(false), 260);
      }, IMPACT.liveTickSeconds * 1000);
    }

    raf = requestAnimationFrame(reveal);
    return () => {
      cancelAnimationFrame(raf);
      window.clearInterval(interval);
    };
  }, [inView, reduce]);

  return { ref, display, ticked, inView };
}

function HoursStat() {
  const reduce = useReducedMotion() ?? false;
  const { ref, display, ticked, inView } = useAccruingHours(reduce);

  return (
    <Box ref={ref} sx={cellSx}>
      <Box
        component={motion.div}
        animate={{ scale: ticked && !reduce ? [1, 1.04, 1] : 1 }}
        transition={{ duration: 0.26, ease: 'easeOut' }}
        sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5, transformOrigin: 'left' }}
      >
        <Typography component="span" sx={bigNumberSx}>
          {display.toLocaleString()}
        </Typography>
        <Typography component="span" sx={plusSx}>
          +
        </Typography>
      </Box>

      <Typography sx={labelSx}>Hours saved</Typography>
      <Typography variant="body2" sx={subSx}>
        manual work taken off client teams
      </Typography>

      <Box sx={{ mt: 1.5, display: 'flex', alignItems: 'center', gap: 0.75, opacity: inView ? 1 : 0 }}>
        <Box
          component={motion.span}
          aria-hidden
          animate={reduce ? undefined : { opacity: [1, 0.3, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'primary.main', display: 'block' }}
        />
        <Typography component="span" sx={{ fontSize: 12.5, fontWeight: 600, color: 'text.disabled', letterSpacing: 0.2 }}>
          and counting
        </Typography>
      </Box>
    </Box>
  );
}

function WorkflowsStat() {
  const reduce = useReducedMotion() ?? false;
  const { ref, value } = useCountUp(IMPACT.workflows);
  const shown = reduce ? IMPACT.workflows : value;

  return (
    <Box sx={cellSx}>
      <Box ref={ref} sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
        <Typography component="span" sx={bigNumberSx}>
          {shown}
        </Typography>
        <Typography component="span" sx={plusSx}>
          +
        </Typography>
      </Box>

      <Typography sx={labelSx}>Workflows automated</Typography>
      <Typography variant="body2" sx={subSx}>
        each replaces a recurring manual job
      </Typography>
    </Box>
  );
}
