/**
 * Shared types for the core rules. The core has no graphics and no browser
 * dependencies, so the simulator, the tests and a future server can run it.
 *
 * Every number that balances the game lives in content (JSON), not here.
 */

/** Collectable resources shown to the player in the slice. */
export type ResourceId = 'coin' | 'food' | 'knowledge' | 'reputation';

export const RESOURCE_IDS: readonly ResourceId[] = ['coin', 'food', 'knowledge', 'reputation'];

/** Fixed terrain on a grid cell (GDD section 6, "Placement and neighbours"). */
export type TerrainId = 'open' | 'coast' | 'creek' | 'dune' | 'sabkha' | 'mountain' | 'wadi';

/** Review status carried by every content record. Nothing ships while "draft". */
export type ContentStatus = 'draft' | 'designer-approved' | 'historian-reviewed' | 'approved';

export interface NeighbourBonus {
  /** Tag a neighbouring building must carry for the bonus to apply. */
  fromTag: string;
  /** Percentage added to output per qualifying neighbour, e.g. 25 = +25%. */
  pct: number;
}

export interface BuildingDef {
  id: string;
  /** Text key; display text lives in content/<lang>/strings.json. */
  nameKey: string;
  status: ContentStatus;
  tags: string[];
  /** Resource produced, or null for buildings that only enable or boost. */
  produces: ResourceId | null;
  /** Output per hour per level, before multipliers. */
  outputPerLevelPerHour: number;
  /** Coin price to place the building at level 1. */
  placeCost: number;
  /** Coin price of the first upgrade (level 1 to 2). Later levels grow by balance.upgradeCostGrowth. */
  firstUpgradeCost: number;
  /** Water capacity this building reserves while it stands. */
  waterUse: number;
  /** Water capacity this building provides per level (wells, channels). */
  waterProvided: number;
  /** Terrain the building may stand on. Empty means "open" only. */
  allowedTerrain: TerrainId[];
  neighbourBonuses: NeighbourBonus[];
  /** Optional: treasury limit added per level (treasury building). */
  treasuryLimitPerLevel?: number;
  /** Optional: storage multiplier given to orthogonal neighbours, e.g. 0.25 = +25%. */
  neighbourStorageBonus?: number;
  /** Maximum number of this building in one town, if limited. */
  maxCount?: number;
}

export interface BalanceConfig {
  status: ContentStatus;
  /** Each upgrade costs this much more than the last (GDD: about 14%). */
  upgradeCostGrowth: number;
  /** Levels at which output doubles (GDD: 10, 25, 50, 100, 200). */
  milestoneLevels: number[];
  /** Hours of output a building stores before it stops (GDD: 4 at the start). */
  baseStorageHours: number;
  /** [ASSUMPTION] Storage hours added per level above 1 ("upgrades raise this", GDD section 6). */
  storageHoursPerLevel: number;
  /** Storage ceiling in hours (GDD: ten hours by the middle of the game). */
  maxStorageHours: number;
  /** Most helpful neighbours a building counts (GDD: 4). */
  maxHelpfulNeighbours: number;
  treasury: {
    baseLimit: number;
    /** Share of overflow that goes to the savings chest (GDD: 30%). */
    overflowToChest: number;
    /** Warn the player at this fill share (GDD: 90%). */
    warnAt: number;
    /** Limit is at least this multiple of the most expensive current purchase (GDD: 1.5). */
    minMultipleOfTopPrice: number;
    /**
     * [ASSUMPTION] Limit is at least this multiple of all coin buildings' combined storage, so that
     * collecting full stores never overflows on its own. Overflow then only punishes hoarding,
     * which is the GDD's intent (section 9) and its 15% overflow threshold (section 25).
     */
    minMultipleOfCoinStorage: number;
  };
  /** Food market [GDD section 9: prices change daily, peak on market day, fall when you sell a lot]. */
  market: {
    /** Coin per food unit before saturation. */
    foodBasePrice: number;
    /** Food sold recently at which the price has halved. */
    foodSaturation: number;
    /** Hours for the price to recover after selling (GDD: over the following day). */
    recoveryHours: number;
    marketDayMultiplier: number;
    /** Day of the 7-day week (0 to 6, counted from the town's founding) that is market day. */
    marketDayIndex: number;
  };
  /** [GDD section 18] After this many hours away, the next routes bring back more. */
  welcomeBack: {
    awayHours: number;
    routeCharges: number;
    routeBonus: number;
  };
  startingResources: Record<ResourceId, number>;
  /** Game-time multiplier per time mode. Playtest must stay 1 (real GDD timers). */
  timeModes: { showcase: number; playtest: number };
}

export interface MapDef {
  id: string;
  status: ContentStatus;
  width: number;
  height: number;
  /** Row-major terrain codes, one string per row. See terrainCodes. */
  rows: string[];
  terrainCodes: Record<string, TerrainId>;
}

export interface ContentPack {
  buildings: BuildingDef[];
  balance: BalanceConfig;
  map: MapDef;
}
