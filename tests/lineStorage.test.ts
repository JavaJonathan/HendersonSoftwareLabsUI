import assert from 'node:assert/strict';
import test from 'node:test';
import { STATION_KIND_ORDER, seedLocalProgress } from '../src/components/landing/line/lineModel.ts';
import {
  loadLocal, loadPreset, loadSeenUnlocks, removeLegacyLineStorage,
  saveLocal, savePreset, saveSeenUnlocks,
} from '../src/components/landing/line/lineStorage.ts';

function memoryStorage(): Storage {
  const values = new Map<string, string>();
  return {
    get length() { return values.size; },
    clear: () => values.clear(),
    getItem: key => values.get(key) ?? null,
    key: index => [...values.keys()][index] ?? null,
    removeItem: key => { values.delete(key); },
    setItem: (key, value) => { values.set(key, value); },
  };
}

test('local progress round trips and future markers stop at the current time', () => {
  const storage = memoryStorage();
  const now = 10_000;
  const progress = seedLocalProgress(now);
  const kind = STATION_KIND_ORDER[0];
  progress.clearedThrough[kind] = now + 60_000;
  saveLocal(progress, storage);

  assert.equal(loadLocal(now, storage).clearedThrough[kind], now);
  storage.setItem('hsl_line_cleared', '{broken');
  assert.deepEqual(loadLocal(now, storage), seedLocalProgress(now));
});

test('unlocks and presets ignore unknown stored values', () => {
  const storage = memoryStorage();
  const kind = STATION_KIND_ORDER[0];
  saveSeenUnlocks(new Set([kind]), storage);
  assert.deepEqual([...loadSeenUnlocks(storage)], [kind]);
  storage.setItem('hsl_line_unlocks', JSON.stringify([kind, 'unknown']));
  assert.deepEqual([...loadSeenUnlocks(storage)], [kind]);

  savePreset('agency', storage);
  assert.equal(loadPreset(storage), 'agency');
  storage.setItem('hsl_line_preset', 'unknown');
  assert.equal(loadPreset(storage), 'ecommerce');
});

test('legacy storage is removed without touching current progress', () => {
  const storage = memoryStorage();
  storage.setItem('hsl_line_station', 'old');
  storage.setItem('hsl_line_cleared', '{}');
  removeLegacyLineStorage(storage);
  assert.equal(storage.getItem('hsl_line_station'), null);
  assert.equal(storage.getItem('hsl_line_cleared'), '{}');
});
