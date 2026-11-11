/**
 * Economy simulator (P2-06, P2-09; rebuilt for P2-10 on 2 Nov 2026).
 *
 * Plays the GDD's player types (section 18) through Age V of the slice with the real core rules
 * and content, and measures how long each takes to finish the age.
 *
 * Player types [GDD section 18 table]: visits, routes and history questions per day.
 *   heavy 15 / 12 / 6, engaged 7 / 6 / 3, casual 3 / 3 / 1.
 * Plus a hoarder [P2-10]: engaged visits and routes, but never upgrades; saves coin for the goals.
 *
 * Age V ends when three goals are met [GDD section 4], with costs from content/age5-goals.json:
 *   research trunk finished, Great Fort built in its stages, Chronicle questions answered.
 *
 * Targets [GDD sections 4 and 18]: engaged about 5 days; casual no more than about 1.8x engaged;
 * heavy about 1.5x faster than engaged. Treasury overflow under 15% for spending players [GDD 25];
 * a hoarder should feel the limit.
 *
 * The greedy strategy is simple on purpose ([ASSUMPTION] in every choice): build the next building
 * in a fixed order, pay research as soon as it can, pay a fort stage as soon as it can, upgrade
 * whatever pays for itself within PAYBACK_HOURS, send the route that earns most before the next
 * visit, answer each decision with the option that pays more per hour.
 *
 * Usage: npm run sim -- [days] [profile] [--daily] [--seed=N]
 */
import { ageProgress, buildLandmarkStage, recordCorrectAnswer, startResearch, trunkLearned } from '../src/core/age';
import { HOUR_MS } from '../src/core/clock';
import { advanceGifts, claimTask, claimableTasks, collectGift, townRank } from '../src/core/tasks';
import { loadDefaultContent } from '../src/core/content-pack';
import { registerVisit, sellFood } from '../src/core/market';
import {
  chooseOption,
  collectRoute,
  freeRouteSlots,
  pendingDecision,
  repairHull,
  routeBaseCoin,
  routeDef,
  sendRoute,
} from '../src/core/routes';
import {
  canPlace,
  collect,
  createTown,
  outputPerHour,
  place,
  treasuryLimit,
  upgrade,
  upgradeCost,
  waterCapacity,
  waterUsed,
  type TownState,
} from '../src/core/settlement';
import type { OutcomeDef } from '../src/core/types';

const content = loadDefaultContent();
/** Random seed for route outcomes; vary it to check results do not hang on luck. */
const SEED = Number(process.argv.find((a) => a.startsWith('--seed='))?.slice(7) ?? 12345);
const goals = content.ageGoals;

interface Profile {
  name: string;
  visitsPerDay: number;
  routesPerDay: number;
  questionsPerDay: number;
  upgrades: boolean;
}

const PROFILES: Profile[] = [
  { name: 'heavy', visitsPerDay: 15, routesPerDay: 12, questionsPerDay: 6, upgrades: true },
  { name: 'engaged', visitsPerDay: 7, routesPerDay: 6, questionsPerDay: 3, upgrades: true },
  { name: 'casual', visitsPerDay: 3, routesPerDay: 3, questionsPerDay: 1, upgrades: true },
  { name: 'hoarder', visitsPerDay: 7, routesPerDay: 6, questionsPerDay: 3, upgrades: false },
];

/** [ASSUMPTION] An upgrade is worth it if it pays for itself within this many hours. */
const PAYBACK_HOURS = 48;

/** [ASSUMPTION] Build order for the greedy player. Wells are added whenever water runs out. */
const BUILD_ORDER = [
  'date_grove', 'souq', 'scribe_house', 'barasti_house', 'jetty', 'majlis', 'date_grove',
  'pearl_merchant', 'fish_trap', 'treasury', 'scribe_house', 'storehouse', 'souq', 'watchtower',
];

// ---------------------------------------------------------------------------
// Value of resources to the greedy player

/** Coin value of one unit, for comparing upgrades. Knowledge counts while research remains. */
function valueOf(resource: string | null, researchLeft: boolean): number {
  if (resource === 'coin') return 1;
  if (resource === 'food') return content.balance.market.foodBasePrice;
  if (resource === 'knowledge') return researchLeft ? 1 : 0.1;
  return 0.1; // reputation has no use in the slice core yet
}

function bestCell(s: TownState, defId: string, now: number): { x: number; y: number } | null {
  let best: { x: number; y: number; score: number } | null = null;
  for (let y = 0; y < s.height; y++) {
    for (let x = 0; x < s.width; x++) {
      if (!canPlace(s, content, defId, x, y).ok) continue;
      const trial = structuredClone(s);
      const r = place(trial, content, defId, x, y, now);
      if (!r.ok) continue;
      // Score: the building's own output plus what it adds to its neighbours.
      const score = trial.buildings.reduce((sum, b) => sum + outputPerHour(trial, content, b), 0);
      if (!best || score > best.score) best = { x, y, score };
    }
  }
  return best;
}

// ---------------------------------------------------------------------------
// Age goals: the core rules in src/core/age.ts

const trunk = goals.research.trunk;
const stages = goals.landmark.stages;

// ---------------------------------------------------------------------------
// Totals

interface Totals {
  buildingCoin: number;
  routeCoin: number;
  marketCoin: number;
  lost: number;
  toChest: number;
  routesSent: number;
  giftCoin: number;
}

function addDeposit(t: Totals, d: { lost: number; toChest: number }): void {
  t.lost += d.lost;
  t.toChest += d.toChest;
}

// ---------------------------------------------------------------------------
// One visit

function perHourValue(routeId: string, outcomes: OutcomeDef[]): number {
  const def = routeDef(content, routeId)!;
  const hours = content.routes.trips.find((t) => t.id === def.trip)!.minutes / 60;
  const total = outcomes.reduce((a, o) => a + o.weight, 0);
  return outcomes.reduce(
    (a, o) => a + (o.weight / total) * ((o.cargoMult ?? 1) / (1 + (o.timePct ?? 0) + (o.delayHours ?? 0) / hours)),
    0,
  );
}

function handleRoutes(s: TownState, p: Profile, now: number, nextVisit: number, sentToday: { n: number }, t: Totals): void {
  for (const r of [...s.routes]) {
    for (let guard = 0; guard < 5; guard++) {
      const i = pendingDecision(s, content, r.uid, now);
      if (i === undefined) break;
      const d = routeDef(content, r.routeId)!.decisions[i]!;
      const pick = perHourValue(r.routeId, d.options[1]!.outcomes) > perHourValue(r.routeId, d.options[0]!.outcomes) ? 'b' : 'a';
      chooseOption(s, content, r.uid, d.id === 'harbour_fee' ? 'a' : pick, now);
    }
    const back = collectRoute(s, content, r.uid, now);
    if (back.ok) {
      t.routeCoin += back.coin;
      addDeposit(t, back.deposit);
    }
  }
  if (s.hull.damaged && s.hull.repairDoneAt === null && s.resources.coin >= content.routes.hull.repairCost * 3) {
    repairHull(s, content, now);
  }
  // Send the route that earns most before the slot can be reused (at the visit after it returns).
  const wait = Math.max(1, nextVisit - now);
  while (freeRouteSlots(s, content) > 0 && sentToday.n < p.routesPerDay) {
    let best: { id: string; score: number } | null = null;
    for (const def of content.routes.routes) {
      if (def.requires && !s.buildings.some((b) => b.defId === def.requires)) continue;
      if (def.sea && s.hull.repairDoneAt !== null) continue;
      const trip = content.routes.trips.find((x) => x.id === def.trip)!;
      const tripMs = trip.minutes * 60_000;
      const busy = Math.ceil(tripMs / wait) * wait; // the slot comes back at a visit
      const score = routeBaseCoin(s, content, def.id) / busy;
      if (!best || score > best.score) best = { id: def.id, score };
    }
    if (!best || !sendRoute(s, content, best.id, now).ok) break;
    sentToday.n++;
    t.routesSent++;
  }
}

function spend(s: TownState, p: Profile, now: number): void {
  // 1. Research and 2. the Great Fort, as soon as the rules allow.
  startResearch(s, content, now);
  buildLandmarkStage(s, content, now);
  const researchLeft = s.age.node < trunk.length;
  // Coin to keep back for the next goal once its other conditions are met.
  const reserve = (): number => {
    const n = trunk[s.age.node];
    if (n && s.resources.knowledge >= n.knowledge) return n.coin;
    if (trunkLearned(s, content, now) && s.age.stage < stages.length) return stages[s.age.stage]! * 0.5; // [ASSUMPTION] saves half, invests the rest
    return 0;
  };
  for (let guard = 0; guard < 300; guard++) {
    // 3. Next building in the order (wells when water runs out).
    const built = new Map<string, number>();
    for (const b of s.buildings) built.set(b.defId, (built.get(b.defId) ?? 0) + 1);
    const counts = new Map<string, number>();
    let next: string | undefined;
    for (const id of BUILD_ORDER) {
      counts.set(id, (counts.get(id) ?? 0) + 1);
      if ((built.get(id) ?? 0) < (counts.get(id) ?? 0)) {
        next = id;
        break;
      }
    }
    if (next) {
      const def = content.building(next);
      if (def.waterUse > 0 && waterUsed(s, content) + def.waterUse > waterCapacity(s, content)) next = 'well';
      const cost = content.building(next).placeCost;
      const cell = s.resources.coin - cost >= reserve() ? bestCell(s, next, now) : null;
      if (cell && place(s, content, next, cell.x, cell.y, now).ok) continue;
    }
    if (!p.upgrades) return;
    // 4. Upgrades that pay for themselves within PAYBACK_HOURS, best first.
    let pick: { uid: number; payback: number } | null = null;
    for (const b of s.buildings) {
      const def = content.building(b.defId);
      const cost = upgradeCost(def, b.level, content.balance.upgradeCostGrowth);
      if (cost === undefined || s.resources.coin - cost < reserve()) continue;
      const v = valueOf(def.produces, researchLeft);
      const before = s.buildings.reduce((a, x) => a + outputPerHour(s, content, x) * valueOf(content.building(x.defId).produces, researchLeft), 0);
      b.level += 1;
      const after = s.buildings.reduce((a, x) => a + outputPerHour(s, content, x) * valueOf(content.building(x.defId).produces, researchLeft), 0);
      b.level -= 1;
      if (v === 0 && after === before) continue;
      const payback = after > before ? cost / (after - before) : Infinity;
      if (payback <= PAYBACK_HOURS && (!pick || payback < pick.payback)) pick = { uid: b.uid, payback };
    }
    if (pick && upgrade(s, content, pick.uid, now).ok) continue;
    // 5. [ASSUMPTION] A spending player does not sit on a nearly full treasury: above half the limit,
    //    buy the cheapest upgrade even if it pays back slowly.
    if (s.resources.coin - reserve() > treasuryLimit(s, content) * 0.5) {
      let cheapest: { uid: number; cost: number } | null = null;
      for (const b of s.buildings) {
        const cost = upgradeCost(content.building(b.defId), b.level, content.balance.upgradeCostGrowth);
        if (cost !== undefined && s.resources.coin - cost >= reserve() && (!cheapest || cost < cheapest.cost)) cheapest = { uid: b.uid, cost };
      }
      if (cheapest && upgrade(s, content, cheapest.uid, now).ok) continue;
    }
    return;
  }
}

function visit(s: TownState, p: Profile, now: number, nextVisit: number, q: { owed: number }, sent: { n: number }, t: Totals): void {
  registerVisit(s, content, now);
  for (const b of s.buildings) {
    const r = collect(s, content, b.uid, now);
    if (r.ok && r.deposit) {
      t.buildingCoin += r.amount;
      addDeposit(t, r.deposit);
    }
  }
  if (s.resources.food >= 1) {
    const r = sellFood(s, content, s.resources.food, now);
    if (r.ok) {
      t.marketCoin += r.coin;
      addDeposit(t, r.deposit);
    }
  }
  handleRoutes(s, p, now, nextVisit, sent, t);
  // History questions: spread the day's quota over the visits. Each gives knowledge [ASSUMPTION value].
  q.owed += p.questionsPerDay / p.visitsPerDay;
  while (q.owed >= 1) {
    q.owed -= 1;
    recordCorrectAnswer(s, content, now);
  }
  // Tasks are claimed as they finish; a sea gift is picked up if one is on the shore [P2-11].
  for (const task of claimableTasks(s, content)) claimTask(s, content, task.id, now);
  advanceGifts(s, content, now);
  const gift = collectGift(s, content, now);
  if (gift.ok) t.giftCoin += gift.coin;
  spend(s, p, now);
}

// ---------------------------------------------------------------------------

interface RunResult {
  profile: string;
  doneDay: number | null;
  overflowShare: number;
  routeShare: number;
  routesPerDay: number;
  levels: number;
  extra: string;
  trunkDay: number | null;
}

function visitHours(n: number): number[] {
  return Array.from({ length: n }, (_, v) => (n === 1 ? 7 : 7 + (16 * v) / (n - 1)));
}

function run(p: Profile, days: number, daily: boolean): RunResult {
  const s = createTown(content, 0, SEED);
  let doneAt: number | null = null;
  const t: Totals = { buildingCoin: 0, routeCoin: 0, marketCoin: 0, lost: 0, toChest: 0, routesSent: 0, giftCoin: 0 };
  const q = { owed: 0 };
  let trunkAt: number | null = null;
  let atDone: Totals | null = null;
  const hours = visitHours(p.visitsPerDay);
  if (daily) {
    console.log(`\n== ${p.name}: ${p.visitsPerDay} visits, ${p.routesPerDay} routes, ${p.questionsPerDay} questions a day ==`);
    console.log('day   coin  limit  know  node stage  q  lost%  route%  levels');
  }
  for (let d = 0; d < days; d++) {
    const before = { ...t };
    const sent = { n: 0 };
    hours.forEach((h, v) => {
      const now = d * 24 * HOUR_MS + h * HOUR_MS;
      const next = v + 1 < hours.length ? d * 24 * HOUR_MS + hours[v + 1]! * HOUR_MS : (d + 1) * 24 * HOUR_MS + hours[0]! * HOUR_MS;
      visit(s, p, now, next, q, sent, t);
      if (trunkAt === null && trunkLearned(s, content, now)) trunkAt = now;
      if (doneAt === null && ageProgress(s, content, now).complete) {
        doneAt = now;
        atDone = { ...t };
      }
    });
    if (daily) {
      const gross = t.buildingCoin + t.routeCoin + t.marketCoin - before.buildingCoin - before.routeCoin - before.marketCoin;
      const lost = t.lost + t.toChest - before.lost - before.toChest;
      const routes = t.routeCoin - before.routeCoin;
      const row = [
        d + 1, Math.floor(s.resources.coin), treasuryLimit(s, content), Math.floor(s.resources.knowledge), s.age.node, s.age.stage, s.age.questions,
        gross > 0 ? ((100 * lost) / gross).toFixed(1) : '0', gross > 0 ? ((100 * routes) / gross).toFixed(0) : '0',
        s.buildings.reduce((a, b) => a + b.level, 0),
      ];
      console.log(row.map((v, i) => String(v).padStart(i === 0 ? 3 : 6)).join(' '));
    }
  }
  // Measure money flows up to the end of the age (or the whole run if it never ends).
  const m = atDone ?? t;
  const gross = m.buildingCoin + m.routeCoin + m.marketCoin;
  return {
    profile: p.name,
    doneDay: doneAt === null ? null : doneAt / (24 * HOUR_MS),
    trunkDay: trunkAt === null ? null : trunkAt / (24 * HOUR_MS),
    overflowShare: gross > 0 ? (m.lost + m.toChest) / gross : 0,
    routeShare: gross > 0 ? m.routeCoin / gross : 0,
    routesPerDay: t.routesSent / days,
    levels: s.buildings.reduce((a, b) => a + b.level, 0),
    extra: `gifts ${Math.round(t.giftCoin)} coin, ${s.progress.claimed.length} tasks, rank ${townRank(s, content).id}`,
  };
}

const args = process.argv.slice(2);
const daily = args.includes('--daily');
const positional = args.filter((a) => !a.startsWith('--'));
const days = Number(positional[0] ?? 14);
const only = positional[1];

const results = PROFILES.filter((p) => !only || p.name === only).map((p) => run(p, days, daily));

console.log(`\n== Age V over ${days} days (targets: engaged about 5 days, casual <= 1.8x engaged, heavy about 1.5x faster) ==`);
console.log('profile   trunk done  age done   overflow  coin from routes  routes/day  levels');
for (const r of results) {
  const f = (x: number | null) => (x === null ? 'never' : x.toFixed(1)).padStart(10);
  console.log(
    `${r.profile.padEnd(8)} ${f(r.trunkDay)} ${f(r.doneDay)}   ${(100 * r.overflowShare).toFixed(1).padStart(6)}%   ${(100 * r.routeShare).toFixed(0).padStart(14)}%   ${r.routesPerDay.toFixed(1).padStart(9)}   ${String(r.levels).padStart(5)}   ${r.extra}`,
  );
}
const by = (n: string) => results.find((r) => r.profile === n)?.doneDay ?? null;
const [e, c, h] = [by('engaged'), by('casual'), by('heavy')];
if (e && c && h) console.log(`\nRatios: casual/engaged ${(c / e).toFixed(2)} (target <= 1.8)   engaged/heavy ${(e / h).toFixed(2)} (target about 1.5)`);
