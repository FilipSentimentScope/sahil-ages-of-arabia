/**
 * Save and load. The save is versioned JSON so later builds can migrate old saves.
 * Storage itself is behind an adapter: browser localStorage now, Capacitor
 * Preferences in the apps, a server later.
 */
import type { ClockSnapshot } from './clock';
import type { TownState } from './settlement';

export const SAVE_VERSION = 1;

export interface SaveFile {
  version: number;
  savedAtReal: number;
  clock: ClockSnapshot;
  town: TownState;
}

export interface StorageAdapter {
  get(key: string): string | null;
  set(key: string, value: string): void;
  remove(key: string): void;
}

export function serialize(town: TownState, clock: ClockSnapshot): string {
  const file: SaveFile = { version: SAVE_VERSION, savedAtReal: clock.real, clock, town };
  return JSON.stringify(file);
}

export class SaveError extends Error {}

export function deserialize(text: string): SaveFile {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new SaveError('Save file is not valid JSON');
  }
  const f = data as Partial<SaveFile>;
  if (!f || typeof f !== 'object') throw new SaveError('Save file is empty');
  if (f.version !== SAVE_VERSION) throw new SaveError(`Unsupported save version ${String(f.version)}`);
  if (!f.clock || typeof f.clock.game !== 'number' || typeof f.clock.real !== 'number' || !(f.clock.scale > 0)) {
    throw new SaveError('Save file clock is invalid');
  }
  if (!f.town || f.town.schema !== 1 || !Array.isArray(f.town.buildings)) {
    throw new SaveError('Save file town is invalid');
  }
  return f as SaveFile;
}

/** Load a save, or return null if there is none or it is unreadable (the caller starts a new town). */
export function loadFrom(storage: StorageAdapter, key: string): { file: SaveFile | null; error?: string } {
  const text = storage.get(key);
  if (text === null) return { file: null };
  try {
    return { file: deserialize(text) };
  } catch (e) {
    return { file: null, error: e instanceof Error ? e.message : String(e) };
  }
}
