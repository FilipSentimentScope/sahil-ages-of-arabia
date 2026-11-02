import { describe, expect, it } from 'vitest';
import { loadDefaultContent } from '../../src/core/content-pack';
import {
  ContentError,
  GameClock,
  HOUR_MS,
  Rng,
  createTown,
  deserialize,
  loadContent,
  loadFrom,
  place,
  serialize,
  type StorageAdapter,
} from '../../src/core';

describe('GameClock', () => {
  it('runs at the given scale and rebases without jumping', () => {
    let real = 0;
    const clock = new GameClock(() => real, 60, 0);
    real = 1000;
    expect(clock.now()).toBe(60_000);
    clock.setScale(1);
    expect(clock.now()).toBe(60_000);
    real = 2000;
    expect(clock.now()).toBe(61_000);
  });

  it('turns real time away into game time on restore (production while away)', () => {
    let real = 0;
    const clock = new GameClock(() => real, 60, 0);
    real = 1000;
    const snap = clock.snapshot();
    real = 61_000; // one real minute closed
    const restored = GameClock.restore(snap, () => real);
    expect(restored.now()).toBe(60_000 + 60_000 * 60);
  });

  it('ignores a device clock moved backwards', () => {
    let real = 10_000;
    const snap = new GameClock(() => real, 1, 5000).snapshot();
    real = 0;
    expect(GameClock.restore(snap, () => real).now()).toBe(snap.game);
  });
});

describe('Rng', () => {
  it('is repeatable for a seed', () => {
    const a = new Rng(42);
    const b = new Rng(42);
    const seqA = Array.from({ length: 5 }, () => a.next());
    const seqB = Array.from({ length: 5 }, () => b.next());
    expect(seqA).toEqual(seqB);
    expect(new Set(seqA).size).toBe(5);
    for (const v of seqA) expect(v >= 0 && v < 1).toBe(true);
  });
});

describe('content validation', () => {
  it('loads the default pack', () => {
    const c = loadDefaultContent();
    expect(c.buildings).toHaveLength(12);
    expect(c.building('date_grove').produces).toBe('food');
  });

  it('the playable map leaves room for the slice inside its open block', () => {
    const c = loadDefaultContent();
    const { openArea: a, rows, terrainCodes } = c.map;
    // [GDD section 15] the town tops out at 12 by 12, so the map is drawn at that size.
    expect([c.map.width, c.map.height]).toEqual([12, 12]);
    const inside: string[] = [];
    for (let y = a.y; y < a.y + a.size; y++) for (let x = a.x; x < a.x + a.size; x++) inside.push(terrainCodes[rows[y]![x]!]!);
    expect(inside.filter((t) => t === 'open').length).toBeGreaterThanOrEqual(12);
    // Shore plots for the jetty and fish traps, and creek plots for wells and groves.
    expect(inside.filter((t) => t === 'coast').length).toBeGreaterThanOrEqual(3);
    expect(inside.filter((t) => t === 'creek').length).toBeGreaterThanOrEqual(2);
  });

  it('fails loudly on bad content', () => {
    const c = loadDefaultContent();
    const bad = c.buildings.map((b) => (b.id === 'souq' ? { ...b, produces: 'gold' as never } : b));
    expect(() => loadContent({ buildings: bad, balance: c.balance, map: c.map, routes: c.routes, ageGoals: c.ageGoals })).toThrow(ContentError);
    const badMap = { ...c.map, rows: [...c.map.rows.slice(0, -1), 'ccccccccccX~'] };
    expect(() => loadContent({ buildings: c.buildings, balance: c.balance, map: badMap, routes: c.routes, ageGoals: c.ageGoals })).toThrow(/unknown terrain code/);
    const offMap = { ...c.map, openArea: { x: 8, y: 8, size: 6 } };
    expect(() => loadContent({ buildings: c.buildings, balance: c.balance, map: offMap, routes: c.routes, ageGoals: c.ageGoals })).toThrow(/openArea leaves the map/);
    const badBalance = { ...c.balance, timeModes: { showcase: 60, playtest: 2 } };
    expect(() => loadContent({ buildings: c.buildings, balance: badBalance, map: c.map, routes: c.routes, ageGoals: c.ageGoals })).toThrow(/playtest must be 1/);
  });
});

describe('save and load', () => {
  it('round-trips a town and its clock', () => {
    const c = loadDefaultContent();
    let real = 0;
    const clock = new GameClock(() => real, 1, HOUR_MS);
    const town = createTown(c, clock.now());
    const a = c.map.openArea;
    expect(place(town, c, 'well', a.x + 1, a.y + 1, clock.now()).ok).toBe(true);
    const text = serialize(town, clock.snapshot());
    const file = deserialize(text);
    expect(file.town.buildings).toHaveLength(1);
    expect(file.clock.game).toBe(HOUR_MS);
  });

  it('treats a corrupt save as no save, with a reason', () => {
    const store: Record<string, string> = { k: '{broken' };
    const adapter: StorageAdapter = {
      get: (k) => store[k] ?? null,
      set: (k, v) => void (store[k] = v),
      remove: (k) => void delete store[k],
    };
    const r = loadFrom(adapter, 'k');
    expect(r.file).toBeNull();
    expect(r.error).toMatch(/not valid JSON/);
    expect(loadFrom(adapter, 'missing')).toEqual({ file: null });
  });
});
