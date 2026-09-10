/**
 * Where the waiting tasks sit.
 *
 * Deliberately a pure lookup rather than a layout animation. Tokens are absolutely positioned at
 * fixed slots and only their entry and exit animate, because thirty elements doing framer-motion
 * `layout` work on every arrival would cost far more frame budget than this whole section is
 * worth. A slot's position never changes, so a token appearing or leaving never nudges its
 * neighbours.
 *
 * The sizes here are load bearing for accessibility, not taste. WCAG 2.5.8 wants a 24 by 24
 * target and 1.4.11 wants 3:1 contrast on anything that carries meaning, so the hit area is
 * deliberately larger than the drawn token and the cell pitch is never smaller than the hit area.
 * The unit test asserts that neighbouring targets cannot overlap, because a tap near an edge
 * clearing the wrong task is its own kind of failure.
 */

/**
 * Work stacks three across and two deep. A single row of six was tried and does not fit beside a
 * station on a phone: it ran straight off the edge of the card.
 */
export const PILE_COLS_WIDE = 3;
export const PILE_COLS_NARROW = 3;

/** Slot pitch. Never smaller than the hit area, so neighbouring targets cannot overlap. */
export const CELL_W = 32;
export const CELL_H = 24;

/** The drawn token. */
export const TOKEN_W = 28;
export const TOKEN_H = 20;

/** The touch target, expanded around the token via a pseudo-element. Meets WCAG 2.5.8. */
export const HIT_W = 30;
export const HIT_H = 24;

/** 3:1 against white, unlike the #cbd5e1 used for purely decorative hairlines elsewhere. */
export const TOKEN_BORDER = '#94a3b8';

/** The most tokens a pile can hold. Matches CAP_PER_KIND; the test asserts they agree. */
export const PILE_CAPACITY = 6;

/**
 * A fixed tilt per slot so a full pile reads as stacked paperwork rather than a spreadsheet.
 * Constant rather than random, so a token never jumps when React re-renders and so the layout
 * stays assertable in a test.
 */
const SLOT_ROTATION = [-5, 3, -2, 4, -3, 2];

export interface PileSlot {
  index: number;
  /** Top-left of the drawn token, relative to the pile box. */
  x: number;
  y: number;
  rotate: number;
}

export function pileRows(cols: number): number {
  return Math.ceil(PILE_CAPACITY / cols);
}

export function pileWidth(cols: number): number {
  return cols * CELL_W;
}

export function pileHeight(cols: number): number {
  return pileRows(cols) * CELL_H;
}

/**
 * Slot for the nth waiting task. Index 0 is bottom left and the pile grows up and to the right,
 * so work visibly stacks the way a physical in-tray does.
 */
export function slotFor(index: number, cols: number = PILE_COLS_WIDE): PileSlot {
  const safe = Math.max(0, Math.min(PILE_CAPACITY - 1, Math.floor(index)));
  const rows = pileRows(cols);
  const row = Math.floor(safe / cols);
  const col = safe % cols;

  return {
    index: safe,
    x: col * CELL_W + (CELL_W - TOKEN_W) / 2,
    y: (rows - 1 - row) * CELL_H + (CELL_H - TOKEN_H) / 2,
    rotate: SLOT_ROTATION[safe % SLOT_ROTATION.length],
  };
}

export function pileSlots(cols: number = PILE_COLS_WIDE): PileSlot[] {
  return Array.from({ length: PILE_CAPACITY }, (_, index) => slotFor(index, cols));
}
