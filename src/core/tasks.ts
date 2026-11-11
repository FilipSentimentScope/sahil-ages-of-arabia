/**
 * Town tasks, ranks and sea gifts [RECOMMENDATION, 11 Nov 2026; not in GDD v4.0].
 *
 * Tasks are short goals read from the town's state; each pays a small reward once, when the
 * player claims it. Claimed tasks raise the town's rank (camp to pearl port), a title only.
 * A sea gift washes ashore now and then: tapping it pays a few minutes of the town's coin income.
 * Numbers are in content/tasks.json. Gift positions use the town's saved Rng.
 */
import type { LoadedContent } from './content';
import { Rng } from './rng';
import { townCoinPerHour } from './routes';
import { buildingAt, depositCoin, isOpen, terrainAt, tick, type Result, type TownState } from './settlement';
import type { TaskDef } from './types';

const MINUTE_MS = 60_000;

export function taskProgress(s: TownState, c: LoadedContent, t: TaskDef): { have: number; need: number; done: boolean; claimed: boolean } {
  let have = 0;
  if (t.kind === 'buildings') have = s.buildings.filter((b) => !t.defId || b.defId === t.defId).length;
  else if (t.kind === 'building_level') have = s.buildings.reduce((m, b) => Math.max(m, b.level), 0);
  else if (t.kind === 'routes_done') have = s.progress.stats.routesDone;
  else if (t.kind === 'food_sold') have = s.progress.stats.foodSold;
  else if (t.kind === 'gifts') have = s.progress.stats.gifts;
  else if (t.kind === 'questions') have = s.age.questions;
  else if (t.kind === 'research') have = s.age.researchDoneAt <= s.lastTick ? s.age.node : s.age.node - 1;
  else if (t.kind === 'fort') have = s.age.stage;
  void c;
  return { have: Math.min(have, t.count), need: t.count, done: have >= t.count, claimed: s.progress.claimed.includes(t.id) };
}

/** Tasks finished but not yet claimed. */
export function claimableTasks(s: TownState, c: LoadedContent): TaskDef[] {
  return c.tasks.tasks.filter((t) => {
    const p = taskProgress(s, c, t);
    return p.done && !p.claimed;
  });
}

export function townRank(s: TownState, c: LoadedContent): { index: number; id: string; next?: { id: string; tasksLeft: number } } {
  const n = s.progress.claimed.length;
  let index = 0;
  c.tasks.ranks.forEach((r, i) => {
    if (n >= r.tasks) index = i;
  });
  const next = c.tasks.ranks[index + 1];
  return { index, id: c.tasks.ranks[index]!.id, next: next ? { id: next.id, tasksLeft: next.tasks - n } : undefined };
}

export function claimTask(s: TownState, c: LoadedContent, id: string, now: number): Result<{ coin: number; knowledge: number; rankUp: string | null }> {
  tick(s, c, now);
  const t = c.tasks.tasks.find((x) => x.id === id);
  if (!t) return { ok: false, error: 'unknown_task' };
  const p = taskProgress(s, c, t);
  if (p.claimed) return { ok: false, error: 'task_claimed' };
  if (!p.done) return { ok: false, error: 'task_not_done' };
  const before = townRank(s, c).index;
  s.progress.claimed.push(id);
  const coin = t.reward.coin ? depositCoin(s, c, t.reward.coin).added : 0;
  const knowledge = t.reward.knowledge ?? 0;
  s.resources.knowledge += knowledge;
  const after = townRank(s, c);
  return { ok: true, coin, knowledge, rankUp: after.index > before ? after.id : null };
}

/** Bring the sea gift up to `now`: a new one washes ashore, an old one is taken back by the tide. */
export function advanceGifts(s: TownState, c: LoadedContent, now: number): void {
  const g = c.tasks.gifts;
  const p = s.progress;
  if (p.gift && now > p.gift.until) {
    p.gift = null;
    p.nextGiftAt = now + g.everyMinutes * MINUTE_MS;
  }
  if (p.gift || now < p.nextGiftAt) return;
  // Free plots in the open block: the shore first, then any open ground.
  const free: { x: number; y: number; shore: boolean }[] = [];
  for (let y = 0; y < s.height; y++) {
    for (let x = 0; x < s.width; x++) {
      if (!isOpen(s, x, y) || buildingAt(s, x, y)) continue;
      const terr = terrainAt(s, x, y);
      if (terr === 'coast' || terr === 'open') free.push({ x, y, shore: terr === 'coast' });
    }
  }
  const pool = free.some((f) => f.shore) ? free.filter((f) => f.shore) : free;
  if (!pool.length) {
    p.nextGiftAt = now + g.everyMinutes * MINUTE_MS;
    return;
  }
  const rng = new Rng(s.rngState);
  const spot = pool[rng.int(pool.length)]!;
  s.rngState = rng.seed;
  p.gift = { x: spot.x, y: spot.y, until: now + g.lastsMinutes * MINUTE_MS };
}

export function giftValue(s: TownState, c: LoadedContent): number {
  const g = c.tasks.gifts;
  return Math.floor(Math.max(g.minCoin, (townCoinPerHour(s, c) * g.incomeMinutes) / 60));
}

export function collectGift(s: TownState, c: LoadedContent, now: number): Result<{ coin: number; x: number; y: number }> {
  tick(s, c, now);
  advanceGifts(s, c, now);
  const gift = s.progress.gift;
  if (!gift) return { ok: false, error: 'no_gift' };
  const coin = depositCoin(s, c, giftValue(s, c)).added;
  s.progress.gift = null;
  s.progress.stats.gifts += 1;
  s.progress.nextGiftAt = now + c.tasks.gifts.everyMinutes * MINUTE_MS;
  return { ok: true, coin, x: gift.x, y: gift.y };
}
