import { createTheme } from '@mui/material/styles';

const headingFont = '"Plus Jakarta Sans", "Segoe UI", system-ui, sans-serif';
const bodyFont = '"Inter", "Segoe UI", system-ui, sans-serif';

/** Muted page-shell background used behind every authenticated/form page. */
export const SURFACE_SUBTLE = '#f8fafc';

/** Dark brand surface used for hero-style panels on a dark background (CTA banner, footer, login branding panel). */
export const SURFACE_DARK = '#0b1734';

export const theme = createTheme({
  palette: {
    primary: {
      main: '#2563eb',
      dark: '#1d4ed8',
      light: '#eff6ff',
      contrastText: '#ffffff',
    },
    text: {
      primary: '#0f172a',
      secondary: '#64748b',
    },
    background: {
      default: '#ffffff',
      paper: '#ffffff',
    },
    divider: '#e2e8f0',
  },
  shape: {
    borderRadius: 14,
  },
  typography: {
    fontFamily: bodyFont,
    h1: { fontFamily: headingFont, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1 },
    h2: { fontFamily: headingFont, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.15 },
    h3: { fontFamily: headingFont, fontWeight: 700, letterSpacing: '-0.01em' },
    h4: { fontFamily: headingFont, fontWeight: 800, letterSpacing: '-0.015em' },
    h5: { fontFamily: headingFont, fontWeight: 800 },
    h6: { fontFamily: headingFont, fontWeight: 700 },
    overline: { fontFamily: headingFont, fontWeight: 700, letterSpacing: '0.1em' },
    button: { fontFamily: headingFont, textTransform: 'none', fontWeight: 600 },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: ({ ownerState }) => ({
          borderRadius: 9999,
          paddingLeft: 20,
          paddingRight: 20,
          paddingTop: 10,
          paddingBottom: 10,
          boxShadow: 'none',
          transition: 'transform 0.18s ease, box-shadow 0.18s ease, background-color 0.18s ease',
          '&:hover': {
            boxShadow:
              ownerState.variant === 'contained' && ownerState.color === 'primary'
                ? '0 8px 20px -6px rgba(37, 99, 235, 0.45)'
                : 'none',
            transform: 'translateY(-1px)',
          },
          '&:active': { transform: 'translateY(0)' },
        }),
        outlined: {
          borderColor: '#cbd5e1',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 9999,
          fontWeight: 600,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
          transition: 'transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease',
          '&:hover': {
            transform: 'translateY(-3px)',
            boxShadow: '0 16px 32px -12px rgba(15, 23, 42, 0.16)',
            borderColor: '#bfdbfe',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
        outlined: {
          transition: 'transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease',
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        input: {
          // Chrome/Edge tint autofilled fields with their own pale-blue background by default,
          // which clashes with the app's own field styling. Force it back to match instead.
          '&:-webkit-autofill': {
            WebkitBoxShadow: '0 0 0 1000px #ffffff inset',
            WebkitTextFillColor: '#0f172a',
            caretColor: '#0f172a',
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          borderBottom: '1px solid #f1f5f9',
          transition: 'box-shadow 0.25s ease, backdrop-filter 0.25s ease, background-color 0.25s ease',
        },
      },
    },
  },
});
