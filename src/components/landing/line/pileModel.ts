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
 * target and 1.4.11 wants 3:1 contrast on anything that carries meaning, and a pile of tiny pale
 * rectangles fails both. So the hit area is deliberately larger than the drawn token, and the
 * token's border is darker than the rest of the site's hairlines.
 */

export const PILE_COLS = 3;
export const PILE_ROWS = 2;

/** Slot pitch. Wider than the token so neighbouring hit areas never overlap. */
export const CELL_W = 32;
export const CELL_H = 24;

/** The drawn token. */
export const TOKEN_W = 26;
export const TOKEN_H = 18;

/**
 * The touch target, expanded around the token via a pseudo-element. Exactly the WCAG 2.5.8
 * minimum vertically, because the cell pitch is 24 and anything larger would make neighbouring
 * targets overlap, which is its own failure: a tap near an edge would clear the wrong task.
 */
export const HIT_W = 30;
export const HIT_H = 24;

/** 3:1 against white, unlike the #cbd5e1 used for decorative hairlines elsewhere. */
export const TOKEN_BORDER = '#94a3b8';

export const PILE_W = PILE_COLS * CELL_W;
export const PILE_H = PILE_ROWS * CELL_H;

/** The most tokens a pile can hold. Matches CAP_PER_KIND; the test asserts they agree. */
export const PILE_CAPACITY = PILE_COLS * PILE_ROWS;

/**
 * A fixed jitter per slot so a full pile reads as stacked paperwork rather than a spreadsheet.
 * Constant rather than random, so a token never jumps when React re-renders and so the layout is
 * assertable in a test.
 */
const SLOT_ROTATION = [-4, 3, -2, 4, -3, 2];

export interface PileSlot {
  index: number;
  /** Top-left of the drawn token, relative to the pile box. */
  x: number;
  y: number;
  rotate: number;
}

/**
 * Slot for the nth waiting task. Index 0 is bottom left and the pile grows upward, so work
 * visibly stacks the way a physical in-tray does.
 */
export function slotFor(index: number): PileSlot {
  const safe = Math.max(0, Math.min(PILE_CAPACITY - 1, Math.floor(index)));
  const row = Math.floor(safe / PILE_COLS);
  const col = safe % PILE_COLS;

  return {
    index: safe,
    x: col * CELL_W + (CELL_W - TOKEN_W) / 2,
    y: (PILE_ROWS - 1 - row) * CELL_H + (CELL_H - TOKEN_H) / 2,
    rotate: SLOT_ROTATION[safe % SLOT_ROTATION.length],
  };
}

export function pileSlots(): PileSlot[] {
  return Array.from({ length: PILE_CAPACITY }, (_, index) => slotFor(index));
}
