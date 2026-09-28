import { PRESETS, type PresetId } from './presets.ts';
import {
  STATION_KIND_ORDER, isStationKind, seedLocalProgress,
  type LocalProgress, type StationKind,
} from './lineModel.ts';

const CLEARED_KEY = 'hsl_line_cleared';
const UNLOCKS_KEY = 'hsl_line_unlocks';
const PRESET_KEY = 'hsl_line_preset';
const LEGACY_KEY = 'hsl_line_station';

export function loadLocal(now: number, storage: Storage = localStorage): LocalProgress {
  try {
    const raw = storage.getItem(CLEARED_KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        const source = parsed as Record<string, unknown>;
        const seeded = seedLocalProgress(now);
        for (const kind of STATION_KIND_ORDER) {
          const value = source[kind];
          // A future marker would leave the pile empty forever, so cap it at now.
          if (typeof value === 'number' && Number.isFinite(value)) {
            seeded.clearedThrough[kind] = Math.min(now, value);
          }
        }
        return seeded;
      }
    }
  } catch {
    /* Private mode, disabled storage, or a hand-edited value: start with a full backlog. */
  }
  return seedLocalProgress(now);
}

export function loadSeenUnlocks(storage: Storage = localStorage): Set<StationKind> {
  try {
    const raw = storage.getItem(UNLOCKS_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    if (Array.isArray(parsed)) return new Set(parsed.filter(isStationKind));
  } catch {
    /* Ignore inaccessible or invalid storage. */
  }
  return new Set();
}

export function loadPreset(storage: Storage = localStorage): PresetId {
  try {
    const value = storage.getItem(PRESET_KEY);
    if (value && value in PRESETS) return value as PresetId;
  } catch {
    /* Ignore inaccessible storage. */
  }
  return 'ecommerce';
}

export function saveLocal(next: LocalProgress, storage: Storage = localStorage) {
  try {
    storage.setItem(CLEARED_KEY, JSON.stringify(next.clearedThrough));
  } catch {
    /* A private session starts with a full backlog next time. */
  }
}

export function saveSeenUnlocks(unlocks: Set<StationKind>, storage: Storage = localStorage) {
  try {
    storage.setItem(UNLOCKS_KEY, JSON.stringify([...unlocks]));
  } catch {
    /* Ignore inaccessible storage. */
  }
}

export function savePreset(id: PresetId, storage: Storage = localStorage) {
  try {
    storage.setItem(PRESET_KEY, id);
  } catch {
    /* Ignore inaccessible storage. */
  }
}

export function removeLegacyLineStorage(storage: Storage = localStorage) {
  try {
    storage.removeItem(LEGACY_KEY);
  } catch {
    /* Ignore inaccessible storage. */
  }
}
