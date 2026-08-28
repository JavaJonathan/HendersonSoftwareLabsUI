import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface RevealProps {
  children: ReactNode;
  delay?: number;
  y?: number;
  /** Stretch to the full width of the parent — needed inside flex containers, where a plain
   * motion.div shrinks to fit its content as a flex item instead of filling available space. */
  fullWidth?: boolean;
}

export function Reveal({ children, delay = 0, y = 20, fullWidth = false }: RevealProps) {
  return (
    <motion.div
      style={fullWidth ? { width: '100%' } : undefined}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.55, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
    >
      {children}
    </motion.div>
  );
}
