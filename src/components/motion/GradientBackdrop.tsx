import { useEffect } from 'react';
import Box from '@mui/material/Box';
import { motion, useMotionValue, useSpring } from 'framer-motion';

interface GradientBackdropProps {
  variant?: 'light' | 'dark';
  /** Adds a subtle whole-backdrop shift toward the cursor, layered on top of the drift animation. */
  interactive?: boolean;
}

export function GradientBackdrop({ variant = 'light', interactive = false }: GradientBackdropProps) {
  const primaryOpacity = variant === 'dark' ? 0.35 : 0.16;
  const secondaryOpacity = variant === 'dark' ? 0.22 : 0.1;

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 40, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 40, damping: 20 });

  useEffect(() => {
    if (!interactive) return;

    function handlePointerMove(event: PointerEvent) {
      const normalizedX = (event.clientX / window.innerWidth - 0.5) * 2;
      const normalizedY = (event.clientY / window.innerHeight - 0.5) * 2;
      mouseX.set(normalizedX * 18);
      mouseY.set(normalizedY * 18);
    }

    window.addEventListener('pointermove', handlePointerMove);
    return () => window.removeEventListener('pointermove', handlePointerMove);
  }, [interactive, mouseX, mouseY]);

  return (
    <motion.div
      aria-hidden
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: -1,
        pointerEvents: 'none',
        overflow: 'hidden',
        x: interactive ? springX : 0,
        y: interactive ? springY : 0,
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
          width: 480,
          height: 480,
          borderRadius: '50%',
          background: `radial-gradient(circle, rgba(37,99,235,${primaryOpacity}) 0%, rgba(37,99,235,0) 70%)`,
          filter: 'blur(10px)',
        }}
      />
      <Box
        component={motion.div}
        animate={{ x: [0, -20, 0], y: [0, 18, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
        sx={{
          position: 'absolute',
          top: 80,
          left: -160,
          width: 420,
          height: 420,
          borderRadius: '50%',
          background: `radial-gradient(circle, rgba(37,99,235,${secondaryOpacity}) 0%, rgba(37,99,235,0) 70%)`,
          filter: 'blur(10px)',
        }}
      />
    </motion.div>
  );
}
