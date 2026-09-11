import type { StationKind } from './lineModel';

/**
 * A colour identity per kind of work.
 *
 * Without this the pile is six columns of identical grey rectangles and tells you nothing. With
 * it, the shape of the backlog is readable at a glance: a wall of amber means invoicing is what
 * is drowning you, and that is precisely the judgement the section wants a visitor to make for
 * themselves before it says a word.
 *
 * The hues are deliberately kept at one saturation and lightness so they read as a designed set
 * rather than a highlighter drawer, and the site's own primary blue leads the line. Nothing here
 * is red: red is reserved for genuine trouble, and a busy afternoon is not trouble.
 */
export interface StationTheme {
  /** The kind's own colour, used on its icon, its tab, and its station accent. */
  ink: string;
  /** A pale wash of the same hue, for automated stations and hover states. */
  wash: string;
  /** A mid tone for borders that need to read as coloured rather than grey. */
  edge: string;
}

export const STATION_THEME: Record<StationKind, StationTheme> = {
  Intake: { ink: '#2563eb', wash: '#eff6ff', edge: '#bfdbfe' },
  Validate: { ink: '#0d9488', wash: '#f0fdfa', edge: '#99f6e4' },
  Invoice: { ink: '#d97706', wash: '#fffbeb', edge: '#fde68a' },
  Notify: { ink: '#7c3aed', wash: '#f5f3ff', edge: '#ddd6fe' },
  Sync: { ink: '#0891b2', wash: '#ecfeff', edge: '#a5f3fc' },
  Report: { ink: '#db2777', wash: '#fdf2f8', edge: '#fbcfe8' },
};

/** The stage the whole line sits on, so the game reads as a place and not a panel. */
export const STAGE_BG = 'linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%)';
export const STAGE_DOT = 'radial-gradient(circle, rgba(15, 23, 42, 0.055) 1px, transparent 1px)';
export const STAGE_DOT_SIZE = '14px 14px';

/** The belt itself. Darker than the stage so work reads as sitting on top of it. */
export const BELT_EDGE = '#94a3b8';
export const BELT_TREAD = 'rgba(255, 255, 255, 0.55)';
