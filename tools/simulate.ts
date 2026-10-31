/**
 * Economy simulator, first version (task P2-06).
 *
 * Plays the GDD's three player types (section 18: heavy 15 visits a day, engaged 7, casual 3)
 * against the current content and core rules, with a simple greedy strategy, and prints one
 * line per day. It covers the settlement only: routes, diving, rivals and research are not in
 * the core yet, and routes are meant to be the main coin source (GDD section 12), so coin
 * results here understate the real economy. Use it to compare balance changes, not as a forecast.
 *
 * Usage: npm run sim -- [days] [profile]
 *   e.g. npm run sim -- 7 casual
 */
import { HOUR_MS } from '../src/core/clock';
import { loadDefaultContent } from '../src/core/content-pack';
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

/** [ASSUMPTION] Build order for the greedy player. Wells are added whenever water runs out. */
const BUILD_ORDER = [
  'date_grove', 'souq', 'barasti_house', 'scribe_house', 'majlis', 'date_grove',
  'jetty', 'pearl_merchant', 'fish_trap', 'treasury', 'storehouse', 'souq', 'watchtower',
];

/** Best cell for a building: the one where its own output would be highest (ties: first found). */
function bestCell(s: TownState, defId: string, now: number): { x: number; y: number } | null {
  let best: { x: number; y: number; score: number } | null = null;
  for (let y = 0; y < s.height; y++) {
    for (let x = 0; x < s.width; x++) {
      if (!canPlace(s, content, defId, x, y).ok) continue;
      const trial = structuredClone(s);
      const r = place(trial, content, defId, x, y, now);
      if (!r.ok) continue;
      const score = outputPerHour(trial, content, r.building) + (defId === 'well' ? (y === 3 ? 1 : 0) : 0);
      if (!best || score > best.score) best = { x, y, score };
    }
  }
  return best;
}

interface DayStats {
  lostCoin: number;
}

function spend(s: TownState, now: number): void {
  for (let guard = 0; guard < 100; guard++) {
    const built = new Map<string, number>();
    for (const b of s.buildings) built.set(b.defId, (built.get(b.defId) ?? 0) + 1);
    // Next building in the order that the town does not have enough of yet.
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
    // Otherwise upgrade the producer with the best output gain per coin.
    let pick: { uid: number; value: number } | null = null;
    for (const b of s.buildings) {
      const def = content.building(b.defId);
      const cost = upgradeCost(def, b.level, content.balance.upgradeCostGrowth);
      if (cost === undefined || cost > s.resources.coin || !def.produces) continue;
      const before = outputPerHour(s, content, b);
      b.level += 1;
      const after = outputPerHour(s, content, b);
      b.level -= 1;
      const weight = def.produces === 'coin' ? 1 : 0.5; // [ASSUMPTION] coin matters most for now
      const value = ((after - before) * weight) / cost;
      if (!pick || value > pick.value) pick = { uid: b.uid, value };
    }
    if (pick && upgrade(s, content, pick.uid, now).ok) continue;
    return;
  }
}

function visit(s: TownState, now: number, stats: DayStats): void {
  for (const b of s.buildings) {
    const r = collect(s, content, b.uid, now);
    if (r.ok && r.deposit) stats.lostCoin += r.deposit.lost;
  }
  spend(s, now);
}

function run(profile: Profile, days: number): void {
  const start = 0;
  const s = createTown(content, start);
  console.log(`\n== ${profile.name}: ${profile.visitsPerDay} visits a day, ${days} days ==`);
  console.log('day  coin  limit  chest  lost  food  know  rep  bldgs  levels  coin/h');
  for (let d = 0; d < days; d++) {
    const stats: DayStats = { lostCoin: 0 };
    // Visits spread evenly between 07:00 and 23:00.
    for (let v = 0; v < profile.visitsPerDay; v++) {
      const hour = profile.visitsPerDay === 1 ? 7 : 7 + (16 * v) / (profile.visitsPerDay - 1);
      visit(s, start + d * 24 * HOUR_MS + hour * HOUR_MS, stats);
    }
    const coinRate = s.buildings
      .filter((b) => content.building(b.defId).produces === 'coin')
      .reduce((a, b) => a + outputPerHour(s, content, b), 0);
    const levels = s.buildings.reduce((a, b) => a + b.level, 0);
    const r = s.resources;
    const row = [
      d + 1, Math.floor(r.coin), treasuryLimit(s, content), Math.floor(s.chest), Math.floor(stats.lostCoin),
      Math.floor(r.food), Math.floor(r.knowledge), Math.floor(r.reputation), s.buildings.length, levels, Math.round(coinRate),
    ];
    console.log(row.map((v, i) => String(v).padStart(i === 0 ? 3 : 5)).join(' '));
  }
}

const days = Number(process.argv[2] ?? 21);
const only = process.argv[3];
for (const p of PROFILES) if (!only || p.name === only) run(p, days);
