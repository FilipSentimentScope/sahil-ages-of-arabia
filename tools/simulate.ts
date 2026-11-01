/**
 * Economy simulator (task P2-06, extended in P2-09).
 *
 * Plays the GDD's three player types (section 18: heavy 15 visits a day, engaged 7, casual 3)
 * against the current content and core rules with a simple greedy strategy.
 *
 * What it measures, against GDD targets:
 * - Time to reach the same progress (economy value per hour) for each player type.
 *   GDD section 18: casual players take no more than about 2x as long as engaged players;
 *   heavy players are about 1.5x faster than engaged.
 * - Share of coin income lost or diverted by the treasury limit.
 *   GDD section 25: act if more than 15% overflows.
 * - Food stock (food must have a use; the market is the first sink).
 *
 * Scope: settlement and food market only. Routes, diving, rivals and research are not in the
 * core yet, and routes are meant to be the main coin source (GDD section 12). Absolute speeds
 * are therefore not meaningful yet; the ratios between player types are.
 *
 * Usage: npm run sim -- [days] [profile] [--daily]
 */
import { HOUR_MS } from '../src/core/clock';
import { loadDefaultContent } from '../src/core/content-pack';
import { registerVisit, sellFood } from '../src/core/market';
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

const content = loadDefaultContent();

interface Profile {
  name: string;
  visitsPerDay: number;
}

const PROFILES: Profile[] = [
  { name: 'heavy', visitsPerDay: 15 },
  { name: 'engaged', visitsPerDay: 7 },
  { name: 'casual', visitsPerDay: 3 },
];

/** Economy value per hour at which we record "progress reached". */
const MILESTONES = [100, 200, 400, 800];

/** [ASSUMPTION] Build order for the greedy player. Wells are added whenever water runs out. */
const BUILD_ORDER = [
  'date_grove', 'souq', 'barasti_house', 'scribe_house', 'majlis', 'date_grove',
  'jetty', 'pearl_merchant', 'fish_trap', 'treasury', 'storehouse', 'souq', 'watchtower',
];

function bestCell(s: TownState, defId: string, now: number): { x: number; y: number } | null {
  let best: { x: number; y: number; score: number } | null = null;
  for (let y = 0; y < s.height; y++) {
    for (let x = 0; x < s.width; x++) {
      if (!canPlace(s, content, defId, x, y).ok) continue;
      const trial = structuredClone(s);
      const r = place(trial, content, defId, x, y, now);
      if (!r.ok) continue;
      const score = outputPerHour(trial, content, r.building);
      if (!best || score > best.score) best = { x, y, score };
    }
  }
  return best;
}

/** Value of one unit of each resource, in coin, for the greedy player's choices. */
function valueOf(resource: string | null): number {
  if (resource === 'coin') return 1;
  if (resource === 'food') return content.balance.market.foodBasePrice;
  return 0.5; // [ASSUMPTION] knowledge and reputation have no use yet in the core
}

/** Economy value per hour: coin plus food at base price (knowledge and reputation not counted yet). */
function economyValue(s: TownState): number {
  return s.buildings.reduce((sum, b) => {
    const p = content.building(b.defId).produces;
    return p === 'coin' || p === 'food' ? sum + outputPerHour(s, content, b) * valueOf(p) : sum;
  }, 0);
}

function spend(s: TownState, now: number): void {
  for (let guard = 0; guard < 200; guard++) {
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
      const cell = bestCell(s, next, now);
      if (cell && place(s, content, next, cell.x, cell.y, now).ok) continue;
    }
    let pick: { uid: number; value: number } | null = null;
    for (const b of s.buildings) {
      const def = content.building(b.defId);
      const cost = upgradeCost(def, b.level, content.balance.upgradeCostGrowth);
      if (cost === undefined || cost > s.resources.coin || !def.produces) continue;
      const before = outputPerHour(s, content, b);
      b.level += 1;
      const after = outputPerHour(s, content, b);
      b.level -= 1;
      const value = ((after - before) * valueOf(def.produces)) / cost;
      if (!pick || value > pick.value) pick = { uid: b.uid, value };
    }
    if (pick && upgrade(s, content, pick.uid, now).ok) continue;
    return;
  }
}

interface Totals {
  grossCoin: number;
  lost: number;
  toChest: number;
}

function visit(s: TownState, now: number, t: Totals): void {
  registerVisit(s, content, now);
  for (const b of s.buildings) {
    const r = collect(s, content, b.uid, now);
    if (r.ok && r.deposit) {
      t.grossCoin += r.amount;
      t.lost += r.deposit.lost;
      t.toChest += r.deposit.toChest;
    }
  }
  if (s.resources.food >= 1) {
    const r = sellFood(s, content, s.resources.food, now);
    if (r.ok) {
      t.grossCoin += r.coin;
      t.lost += r.deposit.lost;
      t.toChest += r.deposit.toChest;
    }
  }
  spend(s, now);
}

interface RunResult {
  profile: string;
  reached: (number | null)[];
  overflowShare: number;
  foodEnd: number;
  valueEnd: number;
}

function run(profile: Profile, days: number, daily: boolean): RunResult {
  const s = createTown(content, 0);
  const totals: Totals = { grossCoin: 0, lost: 0, toChest: 0 };
  const reached: (number | null)[] = MILESTONES.map(() => null);
  if (daily) {
    console.log(`\n== ${profile.name}: ${profile.visitsPerDay} visits a day ==`);
    console.log('day   coin  limit  chest  lost%  food  value/h  bldgs  levels');
  }
  for (let d = 0; d < days; d++) {
    const before = { ...totals };
    for (let v = 0; v < profile.visitsPerDay; v++) {
      const hour = profile.visitsPerDay === 1 ? 7 : 7 + (16 * v) / (profile.visitsPerDay - 1);
      const now = d * 24 * HOUR_MS + hour * HOUR_MS;
      visit(s, now, totals);
      const value = economyValue(s);
      MILESTONES.forEach((m, i) => {
        if (reached[i] === null && value >= m) reached[i] = d + hour / 24;
      });
    }
    if (daily) {
      const gross = totals.grossCoin - before.grossCoin;
      const lostPct = gross > 0 ? (100 * (totals.lost + totals.toChest - before.lost - before.toChest)) / gross : 0;
      const row = [
        d + 1, Math.floor(s.resources.coin), treasuryLimit(s, content), Math.floor(s.chest), lostPct.toFixed(1),
        Math.floor(s.resources.food), Math.round(economyValue(s)), s.buildings.length,
        s.buildings.reduce((a, b) => a + b.level, 0),
      ];
      console.log(row.map((v, i) => String(v).padStart(i === 0 ? 3 : 6)).join(' '));
    }
  }
  return {
    profile: profile.name,
    reached,
    overflowShare: totals.grossCoin > 0 ? (totals.lost + totals.toChest) / totals.grossCoin : 0,
    foodEnd: s.resources.food,
    valueEnd: economyValue(s),
  };
}

const args = process.argv.slice(2);
const daily = args.includes('--daily');
const positional = args.filter((a) => !a.startsWith('--'));
const days = Number(positional[0] ?? 21);
const only = positional[1];

const results = PROFILES.filter((p) => !only || p.name === only).map((p) => run(p, days, daily));

console.log(`\n== Summary over ${days} days ==`);
console.log(`Days to reach economy value per hour of: ${MILESTONES.join(', ')}`);
for (const r of results) {
  const cells = r.reached.map((d) => (d === null ? '  never' : d.toFixed(1).padStart(7))).join(' ');
  console.log(
    `${r.profile.padEnd(8)} ${cells}   overflow ${(100 * r.overflowShare).toFixed(1)}%   food left ${Math.floor(r.foodEnd)}   value/h ${Math.round(r.valueEnd)}`,
  );
}

const by = (n: string) => results.find((r) => r.profile === n);
const eng = by('engaged');
const cas = by('casual');
const hev = by('heavy');
if (eng && cas && hev) {
  console.log('\nRatios per milestone (GDD targets: casual/engaged <= 2.0, engaged/heavy about 1.5)');
  MILESTONES.forEach((m, i) => {
    const e = eng.reached[i];
    const c = cas.reached[i];
    const h = hev.reached[i];
    const ce = e && c ? (c / e).toFixed(2) : 'n/a';
    const eh = e && h ? (e / h).toFixed(2) : 'n/a';
    console.log(`  ${String(m).padStart(5)}/h   casual/engaged ${ce}   engaged/heavy ${eh}`);
  });
}
