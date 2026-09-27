import { motion, useScroll } from 'framer-motion';
import { ACCENT_GRADIENT } from '../../theme';

/** Thin gradient line at the very top of the viewport, filling as the page scrolls. */
export function ScrollProgressBar() {
  const { scrollYProgress } = useScroll();

  return (
    <motion.div
      aria-hidden
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 3,
        transformOrigin: '0%',
        background: ACCENT_GRADIENT,
        zIndex: 2000,
        pointerEvents: 'none',
        scaleX: scrollYProgress,
      }}
    />
  );
}
