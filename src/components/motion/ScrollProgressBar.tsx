import { motion, useScroll } from 'framer-motion';

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
        background: 'linear-gradient(90deg, #2563eb, #60a5fa)',
        zIndex: 2000,
        pointerEvents: 'none',
        scaleX: scrollYProgress,
      }}
    />
  );
}
