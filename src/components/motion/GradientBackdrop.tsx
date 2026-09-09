import { useEffect, useRef } from 'react';
import Box from '@mui/material/Box';
import { motion, useMotionValue, useReducedMotion, useSpring } from 'framer-motion';

interface GradientBackdropProps {
  variant?: 'light' | 'dark';
  /** Adds a subtle whole-backdrop shift toward the cursor, layered on top of the drift animation. */
  interactive?: boolean;
  /**
   * Opt-in extras for the marketing hero: a nearer, snappier parallax layer for depth and a
   * soft radial spotlight that tracks the cursor. Requires `interactive`. Skipped on coarse
   * pointers and when the user prefers reduced motion.
   */
  spotlight?: boolean;
}

export function GradientBackdrop({
  variant = 'light',
  interactive = false,
  spotlight = false,
}: GradientBackdropProps) {
  const primaryOpacity = variant === 'dark' ? 0.5 : 0.16;
  const secondaryOpacity = variant === 'dark' ? 0.32 : 0.1;
  const primarySize = variant === 'dark' ? 620 : 480;
  const secondarySize = variant === 'dark' ? 540 : 420;

  const reduce = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);

  // Far layer - slow, low-amplitude drift of the whole backdrop.
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 40, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 40, damping: 20 });

  // Near layer - snappier, larger travel so the two blobs separate in depth as the cursor moves.
  const nearX = useMotionValue(0);
  const nearY = useMotionValue(0);
  const nearSpringX = useSpring(nearX, { stiffness: 90, damping: 18 });
  const nearSpringY = useSpring(nearY, { stiffness: 90, damping: 18 });

  // Spotlight - raw cursor position in px relative to the backdrop, lightly sprung.
  const spotX = useMotionValue(-1000);
  const spotY = useMotionValue(-1000);
  const spotSpringX = useSpring(spotX, { stiffness: 260, damping: 30 });
  const spotSpringY = useSpring(spotY, { stiffness: 260, damping: 30 });

  const active = interactive && !reduce;

  useEffect(() => {
    if (!active) return;
    if (window.matchMedia('(pointer: coarse)').matches) return;

    function handlePointerMove(event: PointerEvent) {
      const nx = (event.clientX / window.innerWidth - 0.5) * 2;
      const ny = (event.clientY / window.innerHeight - 0.5) * 2;
      mouseX.set(nx * 18);
      mouseY.set(ny * 18);
      nearX.set(nx * 42);
      nearY.set(ny * 42);

      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        spotX.set(event.clientX - rect.left);
        spotY.set(event.clientY - rect.top);
      }
    }

    window.addEventListener('pointermove', handlePointerMove);
    return () => window.removeEventListener('pointermove', handlePointerMove);
  }, [active, mouseX, mouseY, nearX, nearY, spotX, spotY]);

  return (
    <motion.div
      ref={containerRef}
      aria-hidden
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: -1,
        pointerEvents: 'none',
        overflow: 'hidden',
        x: active ? springX : 0,
        y: active ? springY : 0,
      }}
    >
      <Box
        component={motion.div}
        animate={{ x: [0, 24, 0], y: [0, -16, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        sx={{
          position: 'absolute',
          top: -140,
          right: -120,
          width: primarySize,
          height: primarySize,
          borderRadius: '50%',
          background: `radial-gradient(circle, rgba(37,99,235,${primaryOpacity}) 0%, rgba(37,99,235,0) 70%)`,
          filter: 'blur(10px)',
        }}
      />

      <motion.div
        style={{ position: 'absolute', inset: 0, x: active ? nearSpringX : 0, y: active ? nearSpringY : 0 }}
      >
        <Box
          component={motion.div}
          animate={{ x: [0, -20, 0], y: [0, 18, 0] }}
          transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
          sx={{
            position: 'absolute',
            top: 80,
            left: -160,
            width: secondarySize,
            height: secondarySize,
            borderRadius: '50%',
            background: `radial-gradient(circle, rgba(37,99,235,${secondaryOpacity}) 0%, rgba(37,99,235,0) 70%)`,
            filter: 'blur(10px)',
          }}
        />
      </motion.div>

      {spotlight && active && (
        <Box
          component={motion.div}
          style={{ left: spotSpringX, top: spotSpringY }}
          sx={{
            position: 'absolute',
            width: 520,
            height: 520,
            marginLeft: '-260px',
            marginTop: '-260px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(37,99,235,0.10) 0%, rgba(37,99,235,0) 65%)',
          }}
        />
      )}
    </motion.div>
  );
}
