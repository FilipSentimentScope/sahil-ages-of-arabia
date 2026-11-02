import { describe, expect, it } from 'vitest';
import { testContent } from './fixtures';
import {
  HOUR_MS,
  canPlace,
  collect,
  createTown,
  depositCoin,
  outputPerHour,
  place,
  storageCap,
  tick,
  treasuryLimit,
  upgrade,
  upgradeCost,
  waterCapacity,
  waterUsed,
  type TownState,
} from '../../src/core';

const content = testContent();
const T0 = 1_000_000;

function richTown(): TownState {
  const s = createTown(content, T0);
  s.resources.coin = 100_000;
  return s;
}

/** Place or fail the test. */
function mustPlace(s: TownState, id: string, x: number, y: number, t = T0) {
  const r = place(s, content, id, x, y, t);
  if (!r.ok) throw new Error(`place ${id} at ${x},${y} failed: ${r.error}`);
  return r.building;
}

describe('production [GDD section 6]', () => {
  it('matches the GDD example: level 5 date grove makes 60 food/h, 75 beside water', () => {
    const s = richTown();
    mustPlace(s, 'well', 0, 3);
    const lone = mustPlace(s, 'date_grove', 4, 3);
    const watered = mustPlace(s, 'date_grove', 1, 3);
    lone.level = 5;
    watered.level = 5;
    expect(outputPerHour(s, content, lone)).toBe(60);
    expect(outputPerHour(s, content, watered)).toBe(75);
  });

  it('doubles output at milestone levels (10, 25, ...)', () => {
    const s = richTown();
    mustPlace(s, 'well', 0, 3);
    const g = mustPlace(s, 'date_grove', 4, 4);
    g.level = 9;
    const at9 = outputPerHour(s, content, g);
    g.level = 10;
    expect(outputPerHour(s, content, g)).toBeCloseTo((at9 / 9) * 10 * 2);
  });

  it('counts at most four helpful neighbours and stacks different tags', () => {
    const s = richTown();
    mustPlace(s, 'well', 1, 0); // water for houses and farms
    const souq = mustPlace(s, 'souq', 3, 3);
    expect(outputPerHour(s, content, souq)).toBe(10);
    mustPlace(s, 'barasti_house', 3, 2);
    mustPlace(s, 'date_grove', 2, 3);
    expect(outputPerHour(s, content, souq)).toBeCloseTo(10 * 1.2);
  });
});

describe('storage [GDD section 6]', () => {
  it('fills for four hours, then stops until collected', () => {
    const s = richTown();
    mustPlace(s, 'well', 0, 3);
    const g = mustPlace(s, 'date_grove', 4, 3);
    tick(s, content, T0 + 2 * HOUR_MS);
    expect(g.stored).toBeCloseTo(24);
    tick(s, content, T0 + 10 * HOUR_MS);
    expect(g.stored).toBeCloseTo(storageCap(s, content, g));
    expect(g.stored).toBeCloseTo(48);
    const r = collect(s, content, g.uid, T0 + 10 * HOUR_MS);
    expect(r.ok && r.amount).toBe(48);
    expect(s.resources.food).toBe(48);
  });

  it('refuses to collect an empty store', () => {
    const s = richTown();
    mustPlace(s, 'well', 0, 3);
    const g = mustPlace(s, 'date_grove', 4, 3);
    const r = collect(s, content, g.uid, T0);
    expect(r).toEqual({ ok: false, error: 'nothing_to_collect' });
  });
});

describe('placement rules', () => {
  it('blocks building past water capacity [GDD: water as the limit]', () => {
    const s = richTown();
    expect(canPlace(s, content, 'date_grove', 1, 1)).toEqual({ ok: false, error: 'not_enough_water' });
    mustPlace(s, 'well', 0, 3);
    expect(waterCapacity(s, content)).toBe(6);
    for (let x = 1; x <= 5; x++) mustPlace(s, 'date_grove', x, 4);
    mustPlace(s, 'date_grove', 1, 3);
    expect(waterUsed(s, content)).toBe(6);
    expect(canPlace(s, content, 'date_grove', 2, 3)).toEqual({ ok: false, error: 'not_enough_water' });
  });

  it('respects terrain, occupancy and max counts', () => {
    const s = richTown();
    expect(canPlace(s, content, 'fish_trap', 1, 1)).toEqual({ ok: false, error: 'wrong_terrain' });
    expect(canPlace(s, content, 'fish_trap', 1, 5).ok).toBe(true);
    mustPlace(s, 'jetty', 0, 5);
    expect(canPlace(s, content, 'jetty', 1, 5)).toEqual({ ok: false, error: 'max_count' });
    expect(canPlace(s, content, 'fish_trap', 0, 5)).toEqual({ ok: false, error: 'cell_taken' });
    expect(canPlace(s, content, 'well', 9, 9)).toEqual({ ok: false, error: 'out_of_bounds' });
  });

  it('charges coin and refuses when short', () => {
    const s = createTown(content, T0);
    s.resources.coin = 49;
    expect(canPlace(s, content, 'well', 0, 3)).toEqual({ ok: false, error: 'not_enough_coin' });
    s.resources.coin = 50;
    mustPlace(s, 'well', 0, 3);
    expect(s.resources.coin).toBe(0);
  });
});

describe('upgrades [GDD: each level about 14% more]', () => {
  it('grows cost by 14% per level', () => {
    const def = content.building('date_grove');
    expect(upgradeCost(def, 1, 0.14)).toBe(30);
    expect(upgradeCost(def, 2, 0.14)).toBe(Math.round(30 * 1.14));
    expect(upgradeCost(def, 11, 0.14)).toBe(Math.round(30 * 1.14 ** 10));
  });

  it('upgrades a producer and refuses non-upgradable buildings', () => {
    const s = richTown();
    mustPlace(s, 'well', 0, 3);
    const g = mustPlace(s, 'date_grove', 4, 3);
    const r = upgrade(s, content, g.uid, T0);
    expect(r.ok).toBe(true);
    expect(g.level).toBe(2);
    const house = mustPlace(s, 'barasti_house', 2, 3);
    expect(upgrade(s, content, house.uid, T0)).toEqual({ ok: false, error: 'max_level' });
  });
});

describe('treasury limit [GDD section 9]', () => {
  it('sends 30% of overflow to the savings chest and loses the rest', () => {
    const s = createTown(content, T0);
    const limit = treasuryLimit(s, content);
    s.resources.coin = limit - 100;
    const d = depositCoin(s, content, 300);
    expect(d.added).toBe(100);
    expect(d.toChest).toBeCloseTo(60);
    expect(d.lost).toBeCloseTo(140);
    expect(s.resources.coin).toBe(limit);
    expect(s.chest).toBeCloseTo(60);
  });

  it('never sits below 1.5x the most expensive current purchase', () => {
    const s = richTown();
    mustPlace(s, 'well', 0, 3);
    const g = mustPlace(s, 'date_grove', 4, 3);
    g.level = 40;
    const cost = upgradeCost(content.building('date_grove'), 40, 0.14)!;
    expect(treasuryLimit(s, content)).toBeGreaterThanOrEqual(Math.ceil(cost * 1.5));
  });

  it('rises with treasury levels', () => {
    const s = richTown();
    // With the age's goals finished, only buildings set the price floor, so the base limit shows.
    s.age.node = content.ageGoals.research.trunk.length;
    s.age.stage = content.ageGoals.landmark.stages.length;
    expect(treasuryLimit(s, content)).toBe(600);
    const t = mustPlace(s, 'treasury', 3, 1);
    expect(treasuryLimit(s, content)).toBe(1000);
    expect(upgrade(s, content, t.uid, T0).ok).toBe(true);
    expect(treasuryLimit(s, content)).toBe(1400);
  });
});
