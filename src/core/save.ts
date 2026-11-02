/**
 * Save and load. The save is versioned JSON so later builds can migrate old saves.
 * Storage itself is behind an adapter: browser localStorage now, Capacitor
 * Preferences in the apps, a server later.
 */
import type { ClockSnapshot } from './clock';
import type { TownState } from './settlement';

export const SAVE_VERSION = 6;

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
  if (f.version === 1) migrateV1(f);
  if (f.version === 2) migrateV2(f);
  if (f.version === 3) migrateV3(f);
  if (f.version === 4) migrateV4(f);
  if (f.version === 5) migrateV5(f);
  if (f.version !== SAVE_VERSION) throw new SaveError(`Unsupported save version ${String(f.version)}`);
  if (!f.clock || typeof f.clock.game !== 'number' || typeof f.clock.real !== 'number' || !(f.clock.scale > 0)) {
    throw new SaveError('Save file clock is invalid');
  }
  if (!f.town || f.town.schema !== 6 || !Array.isArray(f.town.buildings)) {
    throw new SaveError('Save file town is invalid');
  }
  return f as SaveFile;
}

/** Version 1 saves predate the market and welcome-back fields: add them with neutral values. */
function migrateV1(f: Partial<SaveFile>): void {
  const town = f.town as unknown as Record<string, unknown> | undefined;
  if (town && town.schema === 1) {
    const last = typeof town.lastTick === 'number' ? town.lastTick : 0;
    town.schema = 2;
    town.foundedAt = last;
    town.market = { foodSoldRecent: 0, lastUpdate: last };
    town.lastVisit = last;
    town.welcomeBackCharges = 0;
  }
  f.version = 2;
}

/**
 * Version 2 saves were made on the square 6 by 6 grid. They keep their own terrain and become a
 * small hex town with every plot open (no buildings move). New towns use the 12 by 12 hex map.
 */
function migrateV2(f: Partial<SaveFile>): void {
  const town = f.town as unknown as Record<string, unknown> | undefined;
  if (town && town.schema === 2) {
    const w = typeof town.width === 'number' ? town.width : 6;
    const h = typeof town.height === 'number' ? town.height : 6;
    const size = Math.min(w, h);
    town.schema = 3;
    town.openStart = { x: 0, y: 0, size };
    town.openSize = size;
    town.openGrowthPerAge = 1;
  }
  f.version = 3;
}

/** Version 3 saves predate routes: add an empty route state and a random seed from the save time. */
function migrateV3(f: Partial<SaveFile>): void {
  const town = f.town as unknown as Record<string, unknown> | undefined;
  if (town && town.schema === 3) {
    town.schema = 4;
    town.rngState = (typeof town.lastTick === 'number' ? town.lastTick : 1) >>> 0;
    town.routes = [];
    town.nextRouteUid = 1;
    town.routesToday = { day: 0, count: 0 };
    town.hull = { damaged: false, repairDoneAt: null };
    town.relations = {};
  }
  f.version = 4;
}

/** Version 4 saves predate the age's goals: start them from nothing. */
function migrateV4(f: Partial<SaveFile>): void {
  const town = f.town as unknown as Record<string, unknown> | undefined;
  if (town && town.schema === 4) {
    town.schema = 5;
    town.age = { node: 0, researchDoneAt: typeof town.lastTick === 'number' ? town.lastTick : 0, stage: 0, questions: 0 };
  }
  f.version = 5;
}

/** Version 5 saves predate real questions: placeholder answers keep counting, nothing is marked answered. */
function migrateV5(f: Partial<SaveFile>): void {
  const town = f.town as unknown as Record<string, unknown> | undefined;
  if (town && town.schema === 5) {
    town.schema = 6;
    const age = (town.age ?? {}) as Record<string, unknown>;
    age.answered = [];
    age.missed = [];
    age.questionsToday = { day: 0, count: 0 };
    town.age = age;
  }
  f.version = 6;
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
