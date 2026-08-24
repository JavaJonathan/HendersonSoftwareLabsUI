import Box from '@mui/material/Box';
import { motion } from 'framer-motion';

export function GradientBackdrop() {
  return (
    <Box
      aria-hidden
      sx={{
        position: 'absolute',
        inset: 0,
        zIndex: -1,
        pointerEvents: 'none',
        overflow: 'hidden',
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
          background: 'radial-gradient(circle, rgba(37,99,235,0.16) 0%, rgba(37,99,235,0) 70%)',
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
          background: 'radial-gradient(circle, rgba(37,99,235,0.10) 0%, rgba(37,99,235,0) 70%)',
          filter: 'blur(10px)',
        }}
      />
    </Box>
  );
}
