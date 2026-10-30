/**
 * Loads and validates content. Bad content fails loudly at startup with a
 * message that names the file field, instead of misbehaving in play.
 */
import type { BalanceConfig, BuildingDef, ContentPack, MapDef, ResourceId, TerrainId } from './types';
import { RESOURCE_IDS } from './types';

const TERRAINS: readonly TerrainId[] = ['open', 'coast', 'creek', 'dune', 'sabkha', 'mountain', 'wadi'];

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
  req(isNum(bal.maxHelpfulNeighbours) && bal.maxHelpfulNeighbours >= 0, 'balance.maxHelpfulNeighbours must be >= 0');
  const t = bal.treasury;
  req(t && isNum(t.baseLimit) && t.baseLimit > 0, 'balance.treasury.baseLimit must be > 0');
  req(isNum(t.overflowToChest) && t.overflowToChest >= 0 && t.overflowToChest <= 1, 'balance.treasury.overflowToChest must be in [0, 1]');
  req(isNum(t.warnAt) && t.warnAt > 0 && t.warnAt <= 1, 'balance.treasury.warnAt must be in (0, 1]');
  req(isNum(t.minMultipleOfTopPrice) && t.minMultipleOfTopPrice >= 1, 'balance.treasury.minMultipleOfTopPrice must be >= 1');
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
}

export interface LoadedContent extends ContentPack {
  byId: Map<string, BuildingDef>;
  building(id: string): BuildingDef;
}

export function loadContent(raw: { buildings: BuildingDef[]; balance: BalanceConfig; map: MapDef }): LoadedContent {
  req(Array.isArray(raw.buildings) && raw.buildings.length > 0, 'no buildings');
  raw.buildings.forEach(validateBuilding);
  validateBalance(raw.balance);
  validateMap(raw.map);
  const byId = new Map<string, BuildingDef>();
  for (const b of raw.buildings) {
    req(!byId.has(b.id), `duplicate building id "${b.id}"`);
    byId.set(b.id, b);
  }
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
