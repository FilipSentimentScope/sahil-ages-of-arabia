import { describe, expect, it } from 'vitest';
import { HOUR_MS, SAVE_VERSION, advanceGifts, claimTask, claimableTasks, collectGift, createTown, deserialize, giftValue, place, taskProgress, townRank } from '../../src/core';
import { loadDefaultContent } from '../../src/core/content-pack';
import { testContent } from './fixtures';

const c = testContent();
const T0 = 1_000_000;

describe('town tasks and ranks [RECOMMENDATION]', () => {
  it('a task pays its reward once, only when done', () => {
    const s = createTown(c, T0);
    expect(claimTask(s, c, 'first_well', T0)).toEqual({ ok: false, error: 'task_not_done' });
    const spot = [...Array(36).keys()].map((i) => ({ x: i % 6, y: Math.floor(i / 6) })).find((p) => place(s, c, 'well', p.x, p.y, T0).ok);
    expect(spot).toBeDefined();
    expect(claimableTasks(s, c).map((t) => t.id)).toContain('first_well');
    const coin = s.resources.coin;
    const r = claimTask(s, c, 'first_well', T0);
    expect(r).toMatchObject({ ok: true, coin: 30 });
    expect(s.resources.coin).toBe(coin + 30);
    expect(claimTask(s, c, 'first_well', T0)).toEqual({ ok: false, error: 'task_claimed' });
    expect(claimTask(s, c, 'nope', T0)).toEqual({ ok: false, error: 'unknown_task' });
  });

  it('claimed tasks raise the rank at the content thresholds', () => {
    const c = loadDefaultContent(); // the real 12 by 12 map, so land can open
    const s = createTown(c, T0);
    expect(townRank(s, c)).toMatchObject({ index: 0, id: 'camp' });
    s.progress.claimed = ['a', 'b'];
    s.progress.stats.foodSold = 20;
    const r = claimTask(s, c, 'sell_food', T0);
    expect(r.ok && r.rankUp).toBe('hamlet');
    expect(r.ok && r.landOpened).toBe(13); // 6 by 6 grows to 7 by 7
    expect(s.openSize).toBe(7);
    expect(townRank(s, c).next).toEqual({ id: 'village', tasksLeft: 4 });
  });

  it('every task can be measured and has a reward', () => {
    const s = createTown(c, T0);
    for (const t of c.tasks.tasks) {
      expect(taskProgress(s, c, t).need).toBeGreaterThan(0);
      expect((t.reward.coin ?? 0) + (t.reward.knowledge ?? 0)).toBeGreaterThan(0);
    }
  });
});

describe('sea gifts [RECOMMENDATION]', () => {
  it('washes ashore on a free open plot, pays once, then waits for the next', () => {
    const s = createTown(c, T0);
    advanceGifts(s, c, T0);
    expect(s.progress.gift).toBeNull();
    expect(collectGift(s, c, T0)).toEqual({ ok: false, error: 'no_gift' });
    const t = s.progress.nextGiftAt;
    advanceGifts(s, c, t);
    expect(s.progress.gift).not.toBeNull();
    const coin = s.resources.coin;
    const r = collectGift(s, c, t);
    expect(r.ok && r.coin).toBe(giftValue(s, c));
    expect(s.resources.coin).toBe(coin + c.tasks.gifts.minCoin);
    expect(s.progress.stats.gifts).toBe(1);
    expect(collectGift(s, c, t)).toEqual({ ok: false, error: 'no_gift' });
  });

  it('is taken back by the tide if left too long', () => {
    const s = createTown(c, T0);
    advanceGifts(s, c, s.progress.nextGiftAt);
    advanceGifts(s, c, s.progress.gift!.until + 1);
    expect(s.progress.gift).toBeNull();
    expect(s.progress.nextGiftAt).toBeGreaterThan(T0 + HOUR_MS / 2);
  });

  it('a version 6 save gains empty progress', () => {
    const { progress: _p, ...old } = createTown(c, T0);
    const f = deserialize(JSON.stringify({ version: 6, savedAtReal: 0, clock: { game: T0, real: 0, scale: 1 }, town: { ...old, schema: 6 } }));
    expect(f.version).toBe(SAVE_VERSION);
    expect(f.town.progress.claimed).toEqual([]);
  });
});
