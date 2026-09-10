import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CAP_PER_KIND } from '../src/components/landing/line/lineModel.ts';
import {
  HIT_H,
  HIT_W,
  PILE_CAPACITY,
  PILE_COLS_NARROW,
  PILE_COLS_WIDE,
  TOKEN_H,
  TOKEN_W,
  pileHeight,
  pileRows,
  pileSlots,
  pileWidth,
  slotFor,
} from '../src/components/landing/line/pileModel.ts';

const LAYOUTS = [PILE_COLS_WIDE, PILE_COLS_NARROW];

test('the pile holds exactly one full column of waiting work', () => {
  const r = PILE_CAPACITY;
  assert.equal(r, CAP_PER_KIND);
});

test('every layout has room for the whole cap', () => {
  for (const cols of LAYOUTS) {
    const r = pileRows(cols) * cols;
    assert.ok(r >= PILE_CAPACITY, `${cols} columns only holds ${r}`);
  }
});

test('slot positions are stable across calls', () => {
  const first = pileSlots();
  const second = pileSlots();
  assert.deepEqual(first, second);
  const r = slotFor(3);
  assert.deepEqual(r, first[3]);
});

test('every touch target meets the 24 by 24 minimum', () => {
  assert.ok(HIT_W >= 24, `hit width ${HIT_W}`);
  const r = HIT_H;
  assert.ok(r >= 24, `hit height ${r}`);
});

test('neighbouring hit areas cannot overlap in any layout', () => {
  for (const cols of LAYOUTS) {
    const slots = pileSlots(cols);

    for (let a = 0; a < slots.length; a += 1) {
      for (let b = a + 1; b < slots.length; b += 1) {
        // Hit areas are centred on the drawn token, so compare their expanded boxes.
        const left = (slot: { x: number }) => slot.x - (HIT_W - TOKEN_W) / 2;
        const top = (slot: { y: number }) => slot.y - (HIT_H - TOKEN_H) / 2;

        const overlaps =
          left(slots[a]) < left(slots[b]) + HIT_W &&
          left(slots[b]) < left(slots[a]) + HIT_W &&
          top(slots[a]) < top(slots[b]) + HIT_H &&
          top(slots[b]) < top(slots[a]) + HIT_H;

        assert.ok(!overlaps, `slots ${a} and ${b} overlap at ${cols} columns`);
      }
    }
  }
});

test('the pile grows up and to the right from the bottom left', () => {
  const slots = pileSlots(PILE_COLS_WIDE);
  assert.ok(slots[1].x > slots[0].x, 'the second slot sits right of the first');
  const r = slots[PILE_CAPACITY - 1].y;
  assert.ok(slots[0].y > r, 'the last slot sits above the first');
});

test('the narrow pile still fits beside a station on the smallest phone', () => {
  // The real constraint, and the one that bit: on a 320px screen the stage has to hold a spine,
  // a station card and this pile side by side. A single row of six came to 192px and ran clean
  // off the edge of the card, so the budget is asserted rather than eyeballed.
  const SPINE = 11;
  const STATION = 150;
  const CHROME = 40;
  const r = pileWidth(PILE_COLS_NARROW);
  assert.ok(r + SPINE + STATION + CHROME <= 320, `pile of ${r}px does not fit a 320px screen`);
});

test('every slot stays inside its own pile box', () => {
  for (const cols of LAYOUTS) {
    for (const slot of pileSlots(cols)) {
      assert.ok(slot.x >= 0 && slot.x + TOKEN_W <= pileWidth(cols), `slot ${slot.index} x at ${cols} cols`);
      assert.ok(slot.y >= 0 && slot.y + TOKEN_H <= pileHeight(cols), `slot ${slot.index} y at ${cols} cols`);
    }
  }
  const r = slotFor(PILE_CAPACITY - 1, PILE_COLS_NARROW);
  assert.ok(r.y >= 0);
});

test('every slot carries its own tilt so a full pile reads as stacked paper', () => {
  const rotations = pileSlots().map((slot) => slot.rotate);
  assert.equal(rotations.length, PILE_CAPACITY);
  assert.ok(rotations.every((value) => Number.isFinite(value) && Math.abs(value) <= 10));
  const r = new Set(rotations).size;
  assert.ok(r > 1, 'the tilts should not all be identical');
});

test('an out of range index is clamped rather than returning nonsense', () => {
  assert.deepEqual(slotFor(-5), slotFor(0));
  const r = slotFor(999);
  assert.deepEqual(r, slotFor(PILE_CAPACITY - 1));
});
