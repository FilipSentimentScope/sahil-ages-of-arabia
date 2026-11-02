/**
 * The next-step bar: one clear suggestion, read from the town's state, so the player always knows
 * a useful thing to do (Filip's playtest, 2 Nov: "I do not know which action I can take").
 * Presentation logic only: it reads core state and never changes it.
 */
import type { LoadedContent, TownState } from '../core';
import {
  ageProgress,
  canPlace,
  outputPerHour,
  pendingDecision,
  routeDef,
  storageCap,
  upgradeCost,
  waterCapacity,
  waterUsed,
} from '../core';
import { t } from './i18n';
import { tr } from './describe';

export type GuideAction =
  | { kind: 'build'; defId: string }
  | { kind: 'collect' }
  | { kind: 'sell' }
  | { kind: 'decide'; uid: number }
  | { kind: 'unload'; uid: number }
  | { kind: 'routes' }
  | { kind: 'goals' }
  | { kind: 'open'; uid: number }
  | { kind: 'none' };

export interface Suggestion {
  icon: string;
  text: string;
  action: GuideAction;
  /** Label for the button; empty when there is nothing to tap. */
  go: string;
}

function anyPlot(s: TownState, c: LoadedContent, defId: string): boolean {
  for (let y = 0; y < s.height; y++) for (let x = 0; x < s.width; x++) if (canPlace(s, c, defId, x, y).ok) return true;
  return false;
}

export function suggest(s: TownState, c: LoadedContent, now: number, waitText: (gameMs: number) => string): Suggestion {
  const has = (id: string) => s.buildings.some((b) => b.defId === id);
  const go = t('ui.go');
  // 1. Things waiting on the player.
  for (const r of s.routes) {
    if (pendingDecision(s, c, r.uid, now) !== undefined) return { icon: '❓', text: t('guide.answer'), action: { kind: 'decide', uid: r.uid }, go };
  }
  for (const r of s.routes) {
    if (r.returnAt <= now) return { icon: TRIP_ICON_OF(c, r.routeId), text: t('guide.unload'), action: { kind: 'unload', uid: r.uid }, go };
  }
  // 2. The basics of a new town.
  if (!has('well')) return { icon: '💧', text: t('guide.build_well'), action: { kind: 'build', defId: 'well' }, go };
  if (!has('date_grove')) return { icon: '🌴', text: t('guide.build_grove'), action: { kind: 'build', defId: 'date_grove' }, go };
  // 3. Stores more than half full.
  const filling = s.buildings.some((b) => {
    const cap = storageCap(s, c, b);
    return cap > 0 && b.stored >= Math.max(1, cap * 0.5);
  });
  if (filling) return { icon: '🧺', text: t('guide.collect'), action: { kind: 'collect' }, go };
  if (s.resources.food >= 20) return { icon: '🍞', text: t('guide.sell'), action: { kind: 'sell' }, go };
  if (!has('souq') && s.resources.coin >= c.building('souq').placeCost && anyPlot(s, c, 'souq')) {
    return { icon: '🏪', text: t('guide.build_souq'), action: { kind: 'build', defId: 'souq' }, go };
  }
  if (waterUsed(s, c) >= waterCapacity(s, c) && s.resources.coin >= c.building('well').placeCost) {
    return { icon: '💧', text: t('guide.more_water'), action: { kind: 'build', defId: 'well' }, go };
  }
  // 4. Routes and goals.
  if (s.routes.length < c.routes.slots) return { icon: '🐪', text: t('guide.send'), action: { kind: 'routes' }, go };
  const p = ageProgress(s, c, now);
  const node = c.ageGoals.research.trunk[s.age.node];
  if (node && p.research.busyUntil === null && s.resources.knowledge >= node.knowledge && s.resources.coin >= node.coin) {
    return { icon: '📜', text: t('guide.research'), action: { kind: 'goals' }, go };
  }
  const stage = c.ageGoals.landmark.stages[s.age.stage];
  if (p.landmark.unlocked && stage !== undefined && s.resources.coin >= stage) {
    return { icon: '🏰', text: t('guide.fort'), action: { kind: 'goals' }, go };
  }
  if (p.chronicle.done < p.chronicle.of) return { icon: '📖', text: t('guide.question'), action: { kind: 'goals' }, go };
  // 5. The cheapest useful upgrade the player can afford.
  let best: { uid: number; name: string; cost: number } | null = null;
  for (const b of s.buildings) {
    const def = c.building(b.defId);
    const cost = upgradeCost(def, b.level, c.balance.upgradeCostGrowth);
    if (!def.produces || cost === undefined || cost > s.resources.coin) continue;
    if (!best || cost < best.cost) best = { uid: b.uid, name: t(def.nameKey), cost };
  }
  if (best) return { icon: '⬆️', text: tr('guide.upgrade', { name: best.name }), action: { kind: 'open', uid: best.uid }, go };
  // 6. Nothing to do right now: say when the next store fills.
  let soonest = Infinity;
  for (const b of s.buildings) {
    const rate = outputPerHour(s, c, b);
    const cap = storageCap(s, c, b);
    if (rate > 0 && b.stored < cap) soonest = Math.min(soonest, ((cap * 0.5 - b.stored) / rate) * 3_600_000);
  }
  const wait = Number.isFinite(soonest) ? waitText(Math.max(0, soonest)) : '…';
  return { icon: '⏳', text: tr('guide.wait', { time: wait }), action: { kind: 'none' }, go: '' };
}

function TRIP_ICON_OF(c: LoadedContent, routeId: string): string {
  const def = routeDef(c, routeId);
  return def?.sea ? '⛵' : '🐪';
}
