/**
 * The settlement (GDD pillar 1, section 6): grid, placement, neighbours,
 * production, storage, water limit, upgrades and the treasury limit.
 *
 * Rules marked [GDD] are original design. Rules marked [ASSUMPTION] fill a gap
 * in the GDD and are listed in docs/GAME_DESIGN.md under open items.
 */
import { HOUR_MS } from './clock';
import type { LoadedContent } from './content';
import { hexNeighbours } from './hex';
import type { BuildingDef, ResourceId, TerrainId } from './types';

export interface PlacedBuilding {
  uid: number;
  defId: string;
  level: number;
  x: number;
  y: number;
  /** Output waiting in the building's own store (fractional). */
  stored: number;
}

/** A square block of plots in map coordinates (hex offset rows, see hex.ts). */
export interface PlotArea {
  x: number;
  y: number;
  size: number;
}

/** A route that is out: a caravan or a ship [GDD section 12]. See routes.ts. */
export interface ActiveRoute {
  uid: number;
  routeId: string;
  departedAt: number;
  /** Game time it returns; decisions can move it. */
  returnAt: number;
  /** Product of all cargo effects from decisions so far. */
  cargoMult: number;
  /** Fixed at departure: welcome-back bonus, damaged hull, daily limit. */
  sendMult: number;
  /** One entry per decision point: null until answered, or answered for the player. */
  choices: ({ option: 'a' | 'b'; outcome: number; auto: boolean } | null)[];
}

export interface TownState {
  schema: 4;
  /** Game time the town was founded; market days count from here. */
  foundedAt: number;
  mapId: string;
  width: number;
  height: number;
  /** Row-major terrain, length width * height. */
  terrain: TerrainId[];
  /** Plots open at the start; everything outside the open area is shown but locked. */
  openStart: PlotArea;
  /** Current side of the open area; grows at each age change [GDD section 15]. */
  openSize: number;
  /** Plots added to each side of the open area per age change [GDD: one row and one column]. */
  openGrowthPerAge: number;
  buildings: PlacedBuilding[];
  nextUid: number;
  resources: Record<ResourceId, number>;
  /** Savings chest (sanduq) balance in coin [GDD section 20]. */
  chest: number;
  /** Game time of the last production update, in ms. */
  lastTick: number;
  /** Food market memory: how much food was sold recently, decaying over time. */
  market: { foodSoldRecent: number; lastUpdate: number };
  /** Game time of the player's last visit (for the welcome-back bonus). */
  lastVisit: number;
  /** Routes left that get the welcome-back bonus [GDD section 18]. */
  welcomeBackCharges: number;
  /** State of the seeded random generator, so outcomes are repeatable and saved. */
  rngState: number;
  routes: ActiveRoute[];
  nextRouteUid: number;
  /** Routes sent on the current game day (for the daily limit of full rewards). */
  routesToday: { day: number; count: number };
  /** One hull state for the town's ships in the slice [ASSUMPTION]. */
  hull: { damaged: boolean; repairDoneAt: number | null };
  /** Relations with rival towns, by id. The full scale comes with P4-03. */
  relations: Record<string, number>;
}

export type ActionError =
  | 'not_enough_coin'
  | 'not_enough_water'
  | 'cell_taken'
  | 'out_of_bounds'
  | 'tile_locked'
  | 'wrong_terrain'
  | 'max_count'
  | 'max_level'
  | 'nothing_to_collect'
  | 'too_little_to_sell'
  | 'unknown_building'
  | 'unknown_route'
  | 'needs_building'
  | 'no_free_route'
  | 'ship_in_repair'
  | 'route_not_back'
  | 'no_decision'
  | 'hull_fine';

export type Result<T = object> = ({ ok: true } & T) | { ok: false; error: ActionError };

// ---------------------------------------------------------------------------
// Creation and lookup

export function createTown(content: LoadedContent, gameNow: number, seed: number = gameNow): TownState {
  const { map, balance } = content;
  const terrain: TerrainId[] = [];
  for (const row of map.rows) for (const ch of row) terrain.push(map.terrainCodes[ch] as TerrainId);
  return {
    schema: 4,
    rngState: seed >>> 0,
    routes: [],
    nextRouteUid: 1,
    routesToday: { day: 0, count: 0 },
    hull: { damaged: false, repairDoneAt: null },
    relations: {},
    openStart: { ...map.openArea },
    openSize: map.openArea.size,
    openGrowthPerAge: map.openGrowthPerAge,
    foundedAt: gameNow,
    market: { foodSoldRecent: 0, lastUpdate: gameNow },
    lastVisit: gameNow,
    welcomeBackCharges: 0,
    mapId: map.id,
    width: map.width,
    height: map.height,
    terrain,
    buildings: [],
    nextUid: 1,
    resources: { ...balance.startingResources },
    chest: 0,
    lastTick: gameNow,
  };
}

export function terrainAt(s: TownState, x: number, y: number): TerrainId | undefined {
  if (x < 0 || y < 0 || x >= s.width || y >= s.height) return undefined;
  return s.terrain[y * s.width + x];
}

export function buildingAt(s: TownState, x: number, y: number): PlacedBuilding | undefined {
  return s.buildings.find((b) => b.x === x && b.y === y);
}

export function findBuilding(s: TownState, uid: number): PlacedBuilding | undefined {
  return s.buildings.find((b) => b.uid === uid);
}

/**
 * Buildings on the six touching hexes. The GDD's cap of four helpful neighbours is applied in
 * neighbourBonusPct, so on hexes the player chooses which four count [GDD section 6].
 */
export function neighboursOf(s: TownState, b: Pick<PlacedBuilding, 'x' | 'y'>): PlacedBuilding[] {
  const out: PlacedBuilding[] = [];
  for (const h of hexNeighbours(b.x, b.y)) {
    const n = buildingAt(s, h.x, h.y);
    if (n) out.push(n);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Open and locked land. The GDD grows the town one row and one column at every age change,
// from 6 by 6 in Age I to 12 by 12 in Age VII [GDD section 15]. The whole map is drawn from the
// start; plots outside the open area are locked, so the player sees where the town will grow.

/** The open block now. It grows around its starting block and never leaves the map. */
export function openArea(s: TownState): PlotArea {
  const size = Math.min(s.openSize, s.width, s.height);
  const grown = size - s.openStart.size;
  // [ASSUMPTION] Growth alternates sides: the first new row and column go above and to the left.
  const x = clamp(s.openStart.x - Math.ceil(grown / 2), 0, s.width - size);
  const y = clamp(s.openStart.y - Math.ceil(grown / 2), 0, s.height - size);
  return { x, y, size };
}

export function isOpen(s: TownState, x: number, y: number): boolean {
  const a = openArea(s);
  return x >= a.x && y >= a.y && x < a.x + a.size && y < a.y + a.size;
}

/** Open more land at an age change. Returns the plots that opened. */
export function growTown(s: TownState): { x: number; y: number }[] {
  const before = openArea(s);
  s.openSize = Math.min(s.openSize + s.openGrowthPerAge, Math.min(s.width, s.height));
  const after = openArea(s);
  const opened: { x: number; y: number }[] = [];
  for (let y = after.y; y < after.y + after.size; y++) {
    for (let x = after.x; x < after.x + after.size; x++) {
      const was = x >= before.x && y >= before.y && x < before.x + before.size && y < before.y + before.size;
      if (!was) opened.push({ x, y });
    }
  }
  return opened;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

// ---------------------------------------------------------------------------
// Water [GDD: every building reserves water; you cannot build past capacity]

export function waterCapacity(s: TownState, c: LoadedContent): number {
  return s.buildings.reduce((sum, b) => sum + c.building(b.defId).waterProvided * b.level, 0);
}

export function waterUsed(s: TownState, c: LoadedContent): number {
  return s.buildings.reduce((sum, b) => sum + c.building(b.defId).waterUse, 0);
}

// ---------------------------------------------------------------------------
// Production

/** Number of milestone levels reached; each doubles output [GDD: 10, 25, 50, 100, 200]. */
export function milestonesReached(level: number, milestones: number[]): number {
  return milestones.filter((m) => level >= m).length;
}

export function nextMilestone(level: number, milestones: number[]): number | undefined {
  return milestones.find((m) => m > level);
}

/** Total neighbour bonus in percent, counting at most maxHelpfulNeighbours helpful neighbours. */
export function neighbourBonusPct(s: TownState, c: LoadedContent, b: PlacedBuilding): number {
  const def = c.building(b.defId);
  if (def.neighbourBonuses.length === 0) return 0;
  const contributions: number[] = [];
  for (const n of neighboursOf(s, b)) {
    const tags = c.building(n.defId).tags;
    // [ASSUMPTION] A neighbour matching several bonus tags contributes each matching bonus once.
    const pct = def.neighbourBonuses.reduce((sum, nb) => (tags.includes(nb.fromTag) ? sum + nb.pct : sum), 0);
    if (pct > 0) contributions.push(pct);
  }
  contributions.sort((a, z) => z - a);
  return contributions.slice(0, c.balance.maxHelpfulNeighbours).reduce((a, v) => a + v, 0);
}

/** Output per hour after level, milestones and neighbours. Leaders and age multipliers come later. */
export function outputPerHour(s: TownState, c: LoadedContent, b: PlacedBuilding): number {
  const def = c.building(b.defId);
  if (!def.produces) return 0;
  const base = def.outputPerLevelPerHour * b.level * 2 ** milestonesReached(b.level, c.balance.milestoneLevels);
  return base * (1 + neighbourBonusPct(s, c, b) / 100);
}

/**
 * Hours of output a building can hold: 4 at level 1 [GDD], rising with level [ASSUMPTION],
 * capped at 10 [GDD: "ten hours by the middle of the game"]. Research will add to this later.
 */
export function storageHours(c: LoadedContent, level: number): number {
  const b = c.balance;
  return Math.min(b.maxStorageHours, b.baseStorageHours + (level - 1) * b.storageHoursPerLevel);
}

/** Storage cap in units, raised by neighbouring storehouses [ASSUMPTION for the storehouse]. */
export function storageCap(s: TownState, c: LoadedContent, b: PlacedBuilding): number {
  const bonus = neighboursOf(s, b).reduce((sum, n) => sum + (c.building(n.defId).neighbourStorageBonus ?? 0), 0);
  return outputPerHour(s, c, b) * storageHours(c, b.level) * (1 + bonus);
}

/**
 * Advance production to gameNow. Production runs at full speed until a store is
 * full, then stops [GDD section 6, "Storage and time away"]. Call before any change
 * to the grid, because rates depend on neighbours.
 */
export function tick(s: TownState, c: LoadedContent, gameNow: number): void {
  const dtHours = Math.max(0, gameNow - s.lastTick) / HOUR_MS;
  if (dtHours > 0) {
    for (const b of s.buildings) {
      const rate = outputPerHour(s, c, b);
      if (rate <= 0) continue;
      b.stored = Math.min(storageCap(s, c, b), b.stored + rate * dtHours);
    }
  }
  s.lastTick = Math.max(s.lastTick, gameNow);
}

// ---------------------------------------------------------------------------
// Treasury [GDD section 9]

export function upgradeCost(def: BuildingDef, level: number, growth: number): number | undefined {
  if (def.firstUpgradeCost <= 0) return undefined;
  return Math.round(def.firstUpgradeCost * (1 + growth) ** (level - 1));
}

function countOf(s: TownState, defId: string): number {
  return s.buildings.filter((b) => b.defId === defId).length;
}

/** Most expensive thing the player could buy right now (used by the treasury safety rule). */
export function topCurrentPrice(s: TownState, c: LoadedContent): number {
  let top = 0;
  for (const def of c.buildings) {
    if (def.maxCount !== undefined && countOf(s, def.id) >= def.maxCount) continue;
    top = Math.max(top, def.placeCost);
  }
  for (const b of s.buildings) {
    const cost = upgradeCost(c.building(b.defId), b.level, c.balance.upgradeCostGrowth);
    if (cost !== undefined) top = Math.max(top, cost);
  }
  return top;
}

/** Combined storage of all coin-producing buildings: what one full collection can bring in. */
export function coinStorageTotal(s: TownState, c: LoadedContent): number {
  return s.buildings
    .filter((b) => c.building(b.defId).produces === 'coin')
    .reduce((sum, b) => sum + storageCap(s, c, b), 0);
}

/**
 * Treasury limit: base plus treasury levels, never below 1.5x the top current price [GDD],
 * and never below 1.25x one full collection of coin [ASSUMPTION, see BalanceConfig].
 */
export function treasuryLimit(s: TownState, c: LoadedContent): number {
  const t = c.balance.treasury;
  const fromBuildings = s.buildings.reduce(
    (sum, b) => sum + (c.building(b.defId).treasuryLimitPerLevel ?? 0) * b.level,
    0,
  );
  return Math.max(
    t.baseLimit + fromBuildings,
    Math.ceil(t.minMultipleOfTopPrice * topCurrentPrice(s, c)),
    Math.ceil(t.minMultipleOfCoinStorage * coinStorageTotal(s, c)),
  );
}

export interface CoinDeposit {
  added: number;
  toChest: number;
  lost: number;
}

/** Add coin. Above the limit, 30% of the excess goes to the savings chest and the rest is lost [GDD]. */
export function depositCoin(s: TownState, c: LoadedContent, amount: number): CoinDeposit {
  const limit = treasuryLimit(s, c);
  const space = Math.max(0, limit - s.resources.coin);
  const added = Math.min(space, amount);
  const excess = amount - added;
  const toChest = excess * c.balance.treasury.overflowToChest;
  s.resources.coin += added;
  s.chest += toChest;
  return { added, toChest, lost: excess - toChest };
}

export function treasuryNearlyFull(s: TownState, c: LoadedContent): boolean {
  return s.resources.coin >= treasuryLimit(s, c) * c.balance.treasury.warnAt;
}

// ---------------------------------------------------------------------------
// Player actions. Each one ticks first so production up to now uses the old layout.

export function canPlace(s: TownState, c: LoadedContent, defId: string, x: number, y: number): Result {
  const def = c.byId.get(defId);
  if (!def) return { ok: false, error: 'unknown_building' };
  const terrain = terrainAt(s, x, y);
  if (terrain === undefined) return { ok: false, error: 'out_of_bounds' };
  if (!isOpen(s, x, y)) return { ok: false, error: 'tile_locked' };
  if (buildingAt(s, x, y)) return { ok: false, error: 'cell_taken' };
  const allowed = def.allowedTerrain.length ? def.allowedTerrain : ['open'];
  if (!allowed.includes(terrain)) return { ok: false, error: 'wrong_terrain' };
  if (def.maxCount !== undefined && countOf(s, defId) >= def.maxCount) return { ok: false, error: 'max_count' };
  if (def.waterUse > 0 && waterUsed(s, c) + def.waterUse > waterCapacity(s, c)) {
    return { ok: false, error: 'not_enough_water' };
  }
  if (s.resources.coin < def.placeCost) return { ok: false, error: 'not_enough_coin' };
  return { ok: true };
}

export function place(
  s: TownState,
  c: LoadedContent,
  defId: string,
  x: number,
  y: number,
  gameNow: number,
): Result<{ building: PlacedBuilding }> {
  tick(s, c, gameNow);
  const check = canPlace(s, c, defId, x, y);
  if (!check.ok) return check;
  const def = c.building(defId);
  s.resources.coin -= def.placeCost;
  const building: PlacedBuilding = { uid: s.nextUid++, defId, level: 1, x, y, stored: 0 };
  s.buildings.push(building);
  return { ok: true, building };
}

export function upgrade(
  s: TownState,
  c: LoadedContent,
  uid: number,
  gameNow: number,
): Result<{ building: PlacedBuilding; cost: number }> {
  tick(s, c, gameNow);
  const b = findBuilding(s, uid);
  if (!b) return { ok: false, error: 'unknown_building' };
  const cost = upgradeCost(c.building(b.defId), b.level, c.balance.upgradeCostGrowth);
  if (cost === undefined) return { ok: false, error: 'max_level' };
  if (s.resources.coin < cost) return { ok: false, error: 'not_enough_coin' };
  s.resources.coin -= cost;
  b.level += 1;
  return { ok: true, building: b, cost };
}

export function collect(
  s: TownState,
  c: LoadedContent,
  uid: number,
  gameNow: number,
): Result<{ resource: ResourceId; amount: number; deposit?: CoinDeposit }> {
  tick(s, c, gameNow);
  const b = findBuilding(s, uid);
  if (!b) return { ok: false, error: 'unknown_building' };
  const def = c.building(b.defId);
  const amount = Math.floor(b.stored);
  if (!def.produces || amount < 1) return { ok: false, error: 'nothing_to_collect' };
  b.stored -= amount;
  if (def.produces === 'coin') {
    return { ok: true, resource: 'coin', amount, deposit: depositCoin(s, c, amount) };
  }
  s.resources[def.produces] += amount;
  return { ok: true, resource: def.produces, amount };
}

/** Collect from every producer at once. Returns totals per resource. */
export function collectAll(s: TownState, c: LoadedContent, gameNow: number): Record<ResourceId, number> {
  const totals: Record<ResourceId, number> = { coin: 0, food: 0, knowledge: 0, reputation: 0 };
  for (const b of s.buildings) {
    const r = collect(s, c, b.uid, gameNow);
    if (r.ok) totals[r.resource] += r.deposit ? r.deposit.added : r.amount;
  }
  return totals;
}
