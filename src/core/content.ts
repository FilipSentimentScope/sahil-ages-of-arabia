/**
 * Loads and validates content. Bad content fails loudly at startup with a
 * message that names the file field, instead of misbehaving in play.
 */
import type { AgeGoalsConfig, BalanceConfig, BuildingDef, ContentPack, MapDef, ResourceId, RoutesConfig, TerrainId } from './types';
import { RESOURCE_IDS } from './types';

const TERRAINS: readonly TerrainId[] = ['open', 'coast', 'creek', 'dune', 'sabkha', 'mountain', 'wadi', 'sea'];

export class ContentError extends Error {
  constructor(message: string) {
    super(`Content error: ${message}`);
    this.name = 'ContentError';
  }
}

function req(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new ContentError(msg);
}

function isNum(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

function validateBuilding(b: BuildingDef, i: number): void {
  const at = `buildings[${i}] (${String(b?.id)})`;
  req(typeof b.id === 'string' && b.id.length > 0, `${at}: id missing`);
  req(typeof b.nameKey === 'string', `${at}: nameKey missing`);
  req(Array.isArray(b.tags), `${at}: tags must be an array`);
  req(b.produces === null || RESOURCE_IDS.includes(b.produces as ResourceId), `${at}: unknown resource "${String(b.produces)}"`);
  for (const k of ['outputPerLevelPerHour', 'placeCost', 'firstUpgradeCost', 'waterUse', 'waterProvided'] as const) {
    req(isNum(b[k]) && b[k] >= 0, `${at}: ${k} must be a number >= 0`);
  }
  req(b.produces === null || b.outputPerLevelPerHour > 0, `${at}: producer needs outputPerLevelPerHour > 0`);
  req(Array.isArray(b.allowedTerrain), `${at}: allowedTerrain must be an array`);
  for (const t of b.allowedTerrain) req(TERRAINS.includes(t), `${at}: unknown terrain "${t}"`);
  req(Array.isArray(b.neighbourBonuses), `${at}: neighbourBonuses must be an array`);
  for (const nb of b.neighbourBonuses) {
    req(typeof nb.fromTag === 'string' && isNum(nb.pct), `${at}: bad neighbour bonus`);
  }
}

function validateBalance(bal: BalanceConfig): void {
  req(isNum(bal.upgradeCostGrowth) && bal.upgradeCostGrowth > 0, 'balance.upgradeCostGrowth must be > 0');
  req(Array.isArray(bal.milestoneLevels), 'balance.milestoneLevels must be an array');
  req(isNum(bal.baseStorageHours) && bal.baseStorageHours > 0, 'balance.baseStorageHours must be > 0');
  req(isNum(bal.storageHoursPerLevel) && bal.storageHoursPerLevel >= 0, 'balance.storageHoursPerLevel must be >= 0');
  req(isNum(bal.maxStorageHours) && bal.maxStorageHours >= bal.baseStorageHours, 'balance.maxStorageHours must be >= baseStorageHours');
  const mk = bal.market;
  req(mk && isNum(mk.foodBasePrice) && mk.foodBasePrice > 0, 'balance.market.foodBasePrice must be > 0');
  req(isNum(mk.foodSaturation) && mk.foodSaturation > 0, 'balance.market.foodSaturation must be > 0');
  req(isNum(mk.recoveryHours) && mk.recoveryHours > 0, 'balance.market.recoveryHours must be > 0');
  req(isNum(mk.marketDayMultiplier) && mk.marketDayMultiplier >= 1, 'balance.market.marketDayMultiplier must be >= 1');
  req(Number.isInteger(mk.marketDayIndex) && mk.marketDayIndex >= 0 && mk.marketDayIndex <= 6, 'balance.market.marketDayIndex must be 0 to 6');
  const wb = bal.welcomeBack;
  req(wb && isNum(wb.awayHours) && wb.awayHours > 0, 'balance.welcomeBack.awayHours must be > 0');
  req(Number.isInteger(wb.routeCharges) && wb.routeCharges >= 0, 'balance.welcomeBack.routeCharges must be an integer >= 0');
  req(isNum(wb.routeBonus) && wb.routeBonus >= 0, 'balance.welcomeBack.routeBonus must be >= 0');
  req(isNum(bal.maxHelpfulNeighbours) && bal.maxHelpfulNeighbours >= 0, 'balance.maxHelpfulNeighbours must be >= 0');
  const t = bal.treasury;
  req(t && isNum(t.baseLimit) && t.baseLimit > 0, 'balance.treasury.baseLimit must be > 0');
  req(isNum(t.overflowToChest) && t.overflowToChest >= 0 && t.overflowToChest <= 1, 'balance.treasury.overflowToChest must be in [0, 1]');
  req(isNum(t.warnAt) && t.warnAt > 0 && t.warnAt <= 1, 'balance.treasury.warnAt must be in (0, 1]');
  req(isNum(t.minMultipleOfTopPrice) && t.minMultipleOfTopPrice >= 1, 'balance.treasury.minMultipleOfTopPrice must be >= 1');
  req(isNum(t.minMultipleOfCoinStorage) && t.minMultipleOfCoinStorage >= 0, 'balance.treasury.minMultipleOfCoinStorage must be >= 0');
  for (const r of RESOURCE_IDS) req(isNum(bal.startingResources?.[r]), `balance.startingResources.${r} missing`);
  req(bal.timeModes?.playtest === 1, 'balance.timeModes.playtest must be 1 (real GDD timers)');
  req(isNum(bal.timeModes?.showcase) && bal.timeModes.showcase >= 1, 'balance.timeModes.showcase must be >= 1');
}

function validateMap(m: MapDef): void {
  req(isNum(m.width) && isNum(m.height), 'map width/height missing');
  req(Array.isArray(m.rows) && m.rows.length === m.height, `map "${m.id}": expected ${m.height} rows`);
  m.rows.forEach((row, y) => {
    req(row.length === m.width, `map "${m.id}" row ${y}: expected ${m.width} cells`);
    for (const ch of row) {
      const t = m.terrainCodes[ch];
      req(t !== undefined && TERRAINS.includes(t), `map "${m.id}" row ${y}: unknown terrain code "${ch}"`);
    }
  });
  const a = m.openArea;
  req(a && isNum(a.x) && isNum(a.y) && isNum(a.size) && a.size >= 1, `map "${m.id}": openArea missing`);
  req(a.x >= 0 && a.y >= 0 && a.x + a.size <= m.width && a.y + a.size <= m.height, `map "${m.id}": openArea leaves the map`);
  req(Number.isInteger(m.openGrowthPerAge) && m.openGrowthPerAge >= 0, `map "${m.id}": openGrowthPerAge must be a whole number`);
}

function validateRoutes(r: RoutesConfig, buildingIds: Set<string>): void {
  req(r && Array.isArray(r.trips) && Array.isArray(r.routes), 'routes: trips and routes must be arrays');
  req(Number.isInteger(r.slots) && r.slots >= 1, 'routes.slots must be a whole number >= 1');
  req(Number.isInteger(r.dailyFullRewards) && r.dailyFullRewards >= 1, 'routes.dailyFullRewards must be >= 1');
  req(isNum(r.overLimitShare) && r.overLimitShare >= 0 && r.overLimitShare <= 1, 'routes.overLimitShare must be 0 to 1');
  req(isNum(r.hull?.damagedCargoMult) && isNum(r.hull?.repairCost) && isNum(r.hull?.repairHours), 'routes.hull incomplete');
  const trips = new Set<string>();
  for (const t of r.trips) {
    req(typeof t.id === 'string' && isNum(t.minutes) && t.minutes > 0 && isNum(t.baseCoin) && isNum(t.townIncomeHours), `routes trip "${String(t.id)}" incomplete`);
    trips.add(t.id);
  }
  const ids = new Set<string>();
  for (const route of r.routes) {
    const at = `route "${String(route.id)}"`;
    req(typeof route.id === 'string' && !ids.has(route.id), `${at}: id missing or duplicate`);
    ids.add(route.id);
    req(trips.has(route.trip), `${at}: unknown trip "${route.trip}"`);
    req(route.requires === undefined || buildingIds.has(route.requires), `${at}: requires unknown building "${String(route.requires)}"`);
    req(Array.isArray(route.decisions) && route.decisions.length >= 1, `${at}: needs decision points`);
    for (const d of route.decisions) {
      req(d.options?.length === 2 && d.options[0]?.id === 'a' && d.options[1]?.id === 'b', `${at} decision "${d.id}": needs options a and b`);
      req(d.defaultOption === 'a' || d.defaultOption === 'b', `${at} decision "${d.id}": defaultOption must be a or b`);
      for (const o of d.options) {
        req(o.outcomes.length >= 1, `${at} decision "${d.id}" option ${o.id}: no outcomes`);
        for (const out of o.outcomes) req(isNum(out.weight) && out.weight > 0, `${at} decision "${d.id}" option ${o.id}: weights must be > 0`);
      }
    }
  }
}

function validateAgeGoals(g: AgeGoalsConfig): void {
  req(g && Array.isArray(g.research?.trunk) && g.research.trunk.length >= 1, 'ageGoals.research.trunk needs nodes');
  for (const n of g.research.trunk) {
    req(typeof n.id === 'string' && isNum(n.knowledge) && isNum(n.coin) && isNum(n.minutes) && n.minutes >= 0, `ageGoals research node "${String(n.id)}" incomplete`);
  }
  req(Array.isArray(g.landmark?.stages) && g.landmark.stages.length >= 1 && g.landmark.stages.every((c) => isNum(c) && c > 0), 'ageGoals.landmark.stages must be positive numbers');
  req(Number.isInteger(g.chronicle?.questions) && g.chronicle.questions >= 0, 'ageGoals.chronicle.questions must be a whole number');
  req(isNum(g.question?.knowledge) && g.question.knowledge >= 0, 'ageGoals.question.knowledge missing');
}

export interface LoadedContent extends ContentPack {
  byId: Map<string, BuildingDef>;
  building(id: string): BuildingDef;
}

export function loadContent(raw: ContentPack): LoadedContent {
  req(Array.isArray(raw.buildings) && raw.buildings.length > 0, 'no buildings');
  raw.buildings.forEach(validateBuilding);
  validateBalance(raw.balance);
  validateMap(raw.map);
  const byId = new Map<string, BuildingDef>();
  for (const b of raw.buildings) {
    req(!byId.has(b.id), `duplicate building id "${b.id}"`);
    byId.set(b.id, b);
  }
  validateRoutes(raw.routes, new Set(byId.keys()));
  validateAgeGoals(raw.ageGoals);
  return {
    ...raw,
    byId,
    building(id: string): BuildingDef {
      const def = byId.get(id);
      if (!def) throw new ContentError(`unknown building "${id}"`);
      return def;
    },
  };
}
