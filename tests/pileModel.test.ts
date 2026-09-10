import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CAP_PER_KIND } from '../src/components/landing/line/lineModel.ts';
import {
  HIT_H,
  HIT_W,
  PILE_CAPACITY,
  PILE_COLS,
  PILE_H,
  PILE_ROWS,
  PILE_W,
  TOKEN_H,
  TOKEN_W,
  pileSlots,
  slotFor,
} from '../src/components/landing/line/pileModel.ts';

test('the pile holds exactly one full column of waiting work', () => {
  const r = PILE_CAPACITY;
  assert.equal(r, CAP_PER_KIND);
  assert.equal(r, PILE_COLS * PILE_ROWS);
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

test('neighbouring hit areas do not overlap', () => {
  const slots = pileSlots();

  for (let a = 0; a < slots.length; a += 1) {
    for (let b = a + 1; b < slots.length; b += 1) {
      // Hit areas are centred on the drawn token, so compare their expanded boxes.
      const boxA = {
        left: slots[a].x - (HIT_W - TOKEN_W) / 2,
        top: slots[a].y - (HIT_H - TOKEN_H) / 2,
      };
      const boxB = {
        left: slots[b].x - (HIT_W - TOKEN_W) / 2,
        top: slots[b].y - (HIT_H - TOKEN_H) / 2,
      };

      const overlaps =
        boxA.left < boxB.left + HIT_W &&
        boxB.left < boxA.left + HIT_W &&
        boxA.top < boxB.top + HIT_H &&
        boxB.top < boxA.top + HIT_H;

      assert.ok(!overlaps, `slots ${a} and ${b} overlap`);
    }
  }
});

test('the pile grows upward from the bottom left', () => {
  const slots = pileSlots();
  assert.equal(slots[0].x, slotFor(0).x);
  // The first slot sits on the bottom row, the last on the top.
  assert.ok(slots[0].y > slots[PILE_CAPACITY - 1].y);
  const r = slots[1].x;
  assert.ok(r > slots[0].x, 'the second slot is to the right of the first');
});

test('every slot stays inside the pile box', () => {
  for (const slot of pileSlots()) {
    assert.ok(slot.x >= 0 && slot.x + TOKEN_W <= PILE_W, `slot ${slot.index} x`);
    assert.ok(slot.y >= 0 && slot.y + TOKEN_H <= PILE_H, `slot ${slot.index} y`);
  }
  const r = slotFor(PILE_CAPACITY - 1);
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
