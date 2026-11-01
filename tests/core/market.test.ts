import { describe, expect, it } from 'vitest';
import { loadDefaultContent } from '../../src/core/content-pack';
import {
  HOUR_MS,
  coinStorageTotal,
  createTown,
  deserialize,
  foodPrice,
  isMarketDay,
  place,
  quoteFoodSale,
  registerVisit,
  sellFood,
  storageHours,
  treasuryLimit,
  type TownState,
} from '../../src/core';

const content = loadDefaultContent();
const DAY = 24 * HOUR_MS;

function town(): TownState {
  const s = createTown(content, 0);
  s.resources.coin = 100_000;
  return s;
}

describe('storage hours grow with level [GDD 4 h start, 10 h ceiling]', () => {
  it('starts at 4 hours and stops at 10', () => {
    expect(storageHours(content, 1)).toBe(4);
    expect(storageHours(content, 3)).toBe(5);
    expect(storageHours(content, 13)).toBe(10);
    expect(storageHours(content, 40)).toBe(10);
  });
});

describe('treasury limit covers one full coin collection [ASSUMPTION]', () => {
  it('never sits below 1.25x the combined coin storage', () => {
    const s = town();
    place(s, content, 'well', 1, 3, 0);
    const souq = place(s, content, 'souq', 3, 3, 0);
    if (!souq.ok) throw new Error(souq.error);
    souq.building.level = 30;
    expect(treasuryLimit(s, content)).toBeGreaterThanOrEqual(Math.ceil(1.25 * coinStorageTotal(s, content)));
  });
});

describe('food market [GDD section 9]', () => {
  it('pays less per unit the more you sell at once', () => {
    const s = town();
    const small = quoteFoodSale(s, content, 100, DAY);
    const large = quoteFoodSale(s, content, 1000, DAY);
    expect(large).toBeGreaterThan(small);
    expect(large / 1000).toBeLessThan(small / 100);
  });

  it('lowers the price after a sale and recovers it over the following day', () => {
    const s = town();
    s.resources.food = 2000;
    const before = foodPrice(s, content, DAY);
    const r = sellFood(s, content, 800, DAY);
    expect(r.ok).toBe(true);
    const after = foodPrice(s, content, DAY);
    expect(after).toBeLessThan(before * 0.5);
    const nextDay = foodPrice(s, content, 2 * DAY);
    expect(nextDay).toBeGreaterThan(before * 0.9);
  });

  it('pays more on market day', () => {
    const s = town();
    const marketDay = content.balance.market.marketDayIndex;
    const onDay = marketDay * DAY + HOUR_MS;
    const offDay = ((marketDay + 1) % 7) * DAY + HOUR_MS;
    expect(isMarketDay(s, content, onDay)).toBe(true);
    expect(isMarketDay(s, content, offDay)).toBe(false);
    expect(foodPrice(s, content, onDay)).toBeCloseTo(
      foodPrice(s, content, offDay) * content.balance.market.marketDayMultiplier,
    );
  });

  it('moves food into coin through the treasury and refuses an empty sale', () => {
    const s = createTown(content, 0);
    s.resources.food = 500;
    const coin0 = s.resources.coin;
    const r = sellFood(s, content, 500, HOUR_MS);
    if (!r.ok) throw new Error(r.error);
    expect(s.resources.food).toBe(0);
    expect(s.resources.coin).toBe(coin0 + r.deposit.added);
    expect(sellFood(s, content, 10, HOUR_MS)).toEqual({ ok: false, error: 'nothing_to_collect' });
  });

  it('refuses a sale worth less than one coin and keeps the food (bug found in e2e)', () => {
    const s = createTown(content, 0);
    s.resources.food = 2;
    expect(sellFood(s, content, 2, HOUR_MS)).toEqual({ ok: false, error: 'too_little_to_sell' });
    expect(s.resources.food).toBe(2);
  });
});

describe('welcome-back bonus [GDD section 18]', () => {
  it('grants three route charges after 12 hours away, not after a short break', () => {
    const s = createTown(content, 0);
    expect(registerVisit(s, content, 2 * HOUR_MS).welcomeBack).toBe(false);
    expect(s.welcomeBackCharges).toBe(0);
    expect(registerVisit(s, content, 15 * HOUR_MS).welcomeBack).toBe(true);
    expect(s.welcomeBackCharges).toBe(3);
  });
});

describe('save migration', () => {
  it('upgrades a version 1 save', () => {
    const v1 = {
      version: 1,
      savedAtReal: 0,
      clock: { game: 5000, real: 0, scale: 1 },
      town: { ...createTown(content, 5000), schema: 1, foundedAt: undefined, market: undefined },
    };
    const f = deserialize(JSON.stringify(v1));
    expect(f.version).toBe(2);
    expect(f.town.schema).toBe(2);
    expect(f.town.market.foodSoldRecent).toBe(0);
    expect(f.town.welcomeBackCharges).toBe(0);
  });
});
