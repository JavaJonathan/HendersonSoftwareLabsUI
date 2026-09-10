import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import ArrowUpwardRoundedIcon from '@mui/icons-material/ArrowUpwardRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import BoltRoundedIcon from '@mui/icons-material/BoltRounded';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import wordmark from '../../assets/branding/wordmark-light.png';
import { SURFACE_DARK } from '../../theme';
import { GradientBackdrop } from '../motion/GradientBackdrop';

const EMAIL = 'jonathan@HendersonSoftwareLabs.com';
const buttonReset = {
  appearance: 'none',
  border: 'none',
  background: 'transparent',
  font: 'inherit',
  p: 0,
  m: 0,
  textAlign: 'left',
} as const;

/**
 * The sign-off. A dark, roomy footer that earns its place: one last CTA, a conveyor of
 * task tokens running along the top edge (the site's motif), a live Maryland clock, a
 * click-to-copy email, a springy back-to-top - and a wordmark you can triple-click to send
 * the conveyor into overdrive. Every animation is gated by reduced motion.
 */
export function Footer() {
  const reduce = useReducedMotion() ?? false;
  const [overdrive, setOverdrive] = useState(false);
  const clicks = useRef<{ n: number; t: number }>({ n: 0, t: 0 });

  function pokeWordmark() {
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    if (reduce) return;
    const c = clicks.current;
    c.n += 1;
    window.clearTimeout(c.t);
    if (c.n >= 3) {
      c.n = 0;
      setOverdrive(true);
      window.setTimeout(() => setOverdrive(false), 3400);
      return;
    }
    c.t = window.setTimeout(() => {
      c.n = 0;
    }, 600);
  }

  return (
    <Box
      component="footer"
      sx={{ position: 'relative', overflow: 'hidden', bgcolor: SURFACE_DARK, color: 'rgba(255,255,255,0.7)' }}
    >
      <GradientBackdrop variant="dark" interactive />
      <PipelineStrip overdrive={overdrive} reduce={reduce} />

      <Container maxWidth="lg" sx={{ position: 'relative', pt: { xs: 6, md: 8 }, pb: { xs: 4, md: 5 } }}>
        {overdrive && (
          <Box
            component={motion.div}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.5,
              mb: 3,
              px: 1.25,
              py: 0.4,
              borderRadius: 9999,
              bgcolor: 'rgba(59, 130, 246, 0.16)',
              color: '#93c5fd',
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            <BoltRoundedIcon sx={{ fontSize: 14 }} />
            Automation overdrive
          </Box>
        )}

        <Box
          sx={{
            display: 'grid',
            gap: { xs: 5, md: 4 },
            gridTemplateColumns: { xs: '1fr', sm: '1.7fr 1fr 1.3fr' },
          }}
        >
          <Box>
            <Box
              component="button"
              type="button"
              onClick={pokeWordmark}
              aria-label="Henderson Software Labs - back to top"
              sx={{ ...buttonReset, cursor: 'pointer', display: 'block' }}
            >
              <Box component="img" src={wordmark} alt="" sx={{ height: 38, width: 'auto', display: 'block', userSelect: 'none' }} />
            </Box>
            <Typography variant="body2" sx={{ mt: 2.5, maxWidth: 300, color: 'rgba(255,255,255,0.55)' }}>
              Custom software and automation for small businesses.
            </Typography>
            <LiveClock />
          </Box>

          <Box>
            <ColHeading>Explore</ColHeading>
            <Stack spacing={1.25} sx={{ mt: 2 }}>
              <FooterLink href="/#what-we-do">Services</FooterLink>
              <FooterLink href="/#how-it-works">How it works</FooterLink>
              <FooterLink to="/tools/task-cost-calculator">Task cost calculator</FooterLink>
              <FooterLink to="/portfolio">About the team</FooterLink>
              <FooterLink to="/login">Client login</FooterLink>
            </Stack>
          </Box>

          <Box>
            <ColHeading>Get in touch</ColHeading>
            <Stack spacing={1.5} sx={{ mt: 2 }}>
              <CopyEmail />
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.55)' }}>
                Maryland, USA
              </Typography>
            </Stack>
          </Box>
        </Box>

        <Divider sx={{ my: { xs: 4, md: 5 }, borderColor: 'rgba(255,255,255,0.1)' }} />

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>
            © {new Date().getFullYear()} Henderson Software Labs · Built in Maryland, one automation at a time.
          </Typography>
          <BackToTop reduce={reduce} />
        </Box>
      </Container>

      {/* oversized wordmark, bled off the bottom edge as a signature */}
      <Box
        aria-hidden
        sx={{ position: 'relative', px: 2, overflow: 'hidden', mt: { xs: -3, md: -5 }, pointerEvents: 'none' }}
      >
        <Box
          component="img"
          src={wordmark}
          alt=""
          sx={{ display: 'block', width: '100%', maxWidth: 1400, mx: 'auto', opacity: 0.09, mb: { xs: '-3%', md: '-2.5%' }, userSelect: 'none' }}
        />
      </Box>
    </Box>
  );
}

function ColHeading({ children }: { children: ReactNode }) {
  return (
    <Typography
      sx={{ fontSize: 12, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}
    >
      {children}
    </Typography>
  );
}

function FooterLink({ children, href, to }: { children: ReactNode; href?: string; to?: string }) {
  return (
    <Box
      component={to ? RouterLink : 'a'}
      {...(to ? { to } : { href })}
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.5,
        alignSelf: 'flex-start',
        color: 'rgba(255,255,255,0.6)',
        textDecoration: 'none',
        fontSize: 14,
        transition: 'color 0.2s ease',
        '& .fl-arrow': { opacity: 0, transform: 'translateX(-5px)', transition: 'opacity 0.2s ease, transform 0.2s ease', fontSize: 15 },
        '&:hover': { color: '#ffffff' },
        '&:hover .fl-arrow': { opacity: 1, transform: 'translateX(0)' },
        '&:focus-visible': { outline: '2px solid rgba(147, 197, 253, 0.6)', outlineOffset: 3, borderRadius: 1 },
      }}
    >
      {children}
      <ArrowForwardRoundedIcon className="fl-arrow" />
    </Box>
  );
}

function marylandParts() {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    hour: 'numeric',
    minute: '2-digit',
  });
  return fmt.format(new Date());
}

function LiveClock() {
  const reduce = useReducedMotion() ?? false;
  const [time, setTime] = useState(() => safeTime());

  useEffect(() => {
    const id = window.setInterval(() => setTime(safeTime()), 1000);
    return () => window.clearInterval(id);
  }, []);

  if (!time) return null;

  return (
    <Box sx={{ mt: 2.5, display: 'inline-flex', alignItems: 'center', gap: 1, color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>
      <Box
        component={motion.span}
        aria-hidden
        animate={reduce ? undefined : { opacity: [1, 0.25, 1] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#4ade80', display: 'block' }}
      />
      It&apos;s {time} for us in Maryland
    </Box>
  );
}

function safeTime(): string {
  try {
    return marylandParts();
  } catch {
    return '';
  }
}

function CopyEmail() {
  const [copied, setCopied] = useState(false);

  async function copy() {
    let ok = false;
    try {
      await navigator.clipboard.writeText(EMAIL);
      ok = true;
    } catch {
      try {
        const ta = document.createElement('textarea');
        ta.value = EMAIL;
        ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
        document.body.appendChild(ta);
        ta.select();
        ok = document.execCommand('copy');
        document.body.removeChild(ta);
      } catch {
        ok = false;
      }
    }
    if (!ok) return;
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Box
      component="button"
      type="button"
      onClick={copy}
      sx={{
        ...buttonReset,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 1,
        alignSelf: 'flex-start',
        cursor: 'pointer',
        color: 'rgba(255,255,255,0.7)',
        fontSize: 14,
        transition: 'color 0.2s ease',
        '&:hover': { color: '#ffffff' },
        '&:focus-visible': { outline: '2px solid rgba(147, 197, 253, 0.6)', outlineOffset: 3, borderRadius: 1 },
      }}
    >
      <Box component="span" sx={{ wordBreak: 'break-all' }}>
        {EMAIL}
      </Box>
      <Box
        component="span"
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.25,
          fontSize: 12,
          flexShrink: 0,
          color: copied ? '#4ade80' : 'rgba(255,255,255,0.4)',
        }}
      >
        {copied ? <CheckRoundedIcon sx={{ fontSize: 14 }} /> : <ContentCopyRoundedIcon sx={{ fontSize: 13 }} />}
        {copied ? 'Copied' : 'Copy'}
      </Box>
    </Box>
  );
}

function BackToTop({ reduce }: { reduce: boolean }) {
  return (
    <Box
      component="button"
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' })}
      aria-label="Back to top"
      sx={{
        ...buttonReset,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 1,
        cursor: 'pointer',
        color: 'rgba(255,255,255,0.6)',
        fontSize: 13,
        fontWeight: 600,
        transition: 'color 0.2s ease',
        '&:hover': { color: '#ffffff' },
        '&:hover .btt-ring': { transform: 'translateY(-3px)', borderColor: 'rgba(147, 197, 253, 0.7)' },
        '&:focus-visible': { outline: '2px solid rgba(147, 197, 253, 0.6)', outlineOffset: 3, borderRadius: 9999 },
      }}
    >
      Back to top
      <Box
        className="btt-ring"
        sx={{
          width: 30,
          height: 30,
          borderRadius: '50%',
          border: '1px solid rgba(255,255,255,0.2)',
          display: 'grid',
          placeItems: 'center',
          transition: 'transform 0.25s ease, border-color 0.2s ease',
        }}
      >
        <ArrowUpwardRoundedIcon sx={{ fontSize: 16 }} />
      </Box>
    </Box>
  );
}

function PipelineStrip({ overdrive, reduce }: { overdrive: boolean; reduce: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: '0px' });
  const run = inView && !reduce;

  const count = overdrive ? 10 : 4;
  const duration = overdrive ? 1.7 : 7.5;

  return (
    <Box
      ref={ref}
      aria-hidden
      sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 10, zIndex: 1, pointerEvents: 'none' }}
    >
      <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', bgcolor: 'rgba(255,255,255,0.12)' }} />
      {run &&
        Array.from({ length: count }).map((_, i) => (
          <Box
            key={`${overdrive ? 'od' : 'base'}-${i}`}
            component={motion.span}
            initial={{ x: '-3vw' }}
            animate={{ x: '103vw' }}
            transition={{ duration, delay: (i / count) * duration, repeat: Infinity, ease: 'linear' }}
            sx={{
              position: 'absolute',
              top: 0,
              width: 5,
              height: 5,
              borderRadius: '50%',
              bgcolor: overdrive ? '#93c5fd' : '#3b82f6',
              boxShadow: '0 0 8px rgba(59, 130, 246, 0.85)',
              transform: 'translateY(-40%)',
            }}
          />
        ))}
    </Box>
  );
}
