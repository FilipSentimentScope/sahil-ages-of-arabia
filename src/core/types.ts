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
export type TerrainId = 'open' | 'coast' | 'creek' | 'dune' | 'sabkha' | 'mountain' | 'wadi' | 'sea';

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
  /** Block of plots open at the start of the age; the rest of the map is locked. */
  openArea: { x: number; y: number; size: number };
  /** Rows and columns added to the open block at each age change [GDD section 15: 1]. */
  openGrowthPerAge: number;
}

export interface ContentPack {
  buildings: BuildingDef[];
  balance: BalanceConfig;
  map: MapDef;
  routes: RoutesConfig;
  ageGoals: AgeGoalsConfig;
  questions: QuestionsConfig;
  archive: ArchiveConfig;
  tasks: TasksConfig;
}

// ---------------------------------------------------------------------------
// Routes and decision points [GDD section 12]

/** One possible result of a decision option. Weights within an option are relative. */
export interface OutcomeDef {
  weight: number;
  /** Text key describing what happened. */
  textKey: string;
  /** Multiplies the route's cargo, e.g. 1.35 = +35%, 0.5 = half lost. */
  cargoMult?: number;
  /** Changes the trip time by this share of its base length, e.g. 0.25 = 25% longer. */
  timePct?: number;
  /** Delays the return by this many hours (coin that arrives later). */
  delayHours?: number;
  /** Damages the hull: later sea trips pay less until repaired [GDD section 12]. */
  hullDamage?: boolean;
  /** Changes relations with a rival town. */
  relation?: { rival: string; delta: number };
}

export interface OptionDef {
  id: 'a' | 'b';
  /** 'safe' or 'risky', for the interface. The coast/open sea choice has risk on both sides. */
  kind: 'safe' | 'risky';
  textKey: string;
  outcomes: OutcomeDef[];
}

export interface DecisionDef {
  id: string;
  textKey: string;
  options: OptionDef[];
  /** Chosen for the player when they do not answer in time [ASSUMPTION]. */
  defaultOption: 'a' | 'b';
}

export interface TripDef {
  id: string;
  minutes: number;
  /** Coin a route of this length brings home before decisions and bonuses [ASSUMPTION values]. */
  baseCoin: number;
  /** [ASSUMPTION] Plus this many hours of the town's coin income at departure (more per hour on short trips). */
  townIncomeHours: number;
}

export interface RouteDef {
  id: string;
  nameKey: string;
  status: ContentStatus;
  trip: string;
  sea: boolean;
  /** Building the town needs before this route can be sent (jetty for the sea) [ASSUMPTION]. */
  requires?: string;
  decisions: DecisionDef[];
}

export interface RoutesConfig {
  status: ContentStatus;
  /** Routes out at the same time (GDD section 12: 3 for every player in Age V). */
  slots: number;
  /** Routes per game day that pay full rewards (GDD: 12). */
  dailyFullRewards: number;
  /** [ASSUMPTION] Share of the reward paid for routes past the daily limit. */
  overLimitShare: number;
  /** [GDD section 12] Damaged hull: later sea trips pay 20% less until 200 coin and one hour of repair. */
  hull: { damagedCargoMult: number; repairCost: number; repairHours: number };
  trips: TripDef[];
  routes: RouteDef[];
}

// ---------------------------------------------------------------------------
// The age's three goals [GDD section 4 "How an age ends", section 8 research]

export interface ResearchNodeDef {
  id: string;
  knowledge: number;
  coin: number;
  minutes: number;
}

export interface AgeGoalsConfig {
  status: ContentStatus;
  /** Trunk nodes in order; the last one unlocks the landmark [GDD section 8]. */
  research: { trunk: ResearchNodeDef[] };
  /** The landmark, paid in stages over several visits [GDD section 9]. */
  landmark: { id: string; stages: number[] };
  /** Questions needed to complete the age's Chronicle chapter (slice: 8). */
  chronicle: { questions: number };
  /** [ASSUMPTION] Knowledge earned per correct history question. */
  question: { knowledge: number };
}

// ---------------------------------------------------------------------------
// History questions and the Archive [GDD section 18 "History questions", "The Archive"]

export interface QuestionText {
  prompt: string;
  options: string[];
  explanation: string;
}

export interface QuestionDef {
  id: string;
  /** why / what / how / follow: the GDD wants mostly "why". */
  kind: string;
  status: ContentStatus;
  /** Archive page a right answer opens. */
  archive: string;
  sources: string[];
  /** Text per language; Arabic is written separately, never translated [GDD]. */
  en: QuestionText;
  ar?: QuestionText;
  /** Index of the right option in the text's options. */
  answer: number;
}

export interface QuestionsConfig {
  status: ContentStatus;
  /** Questions per game day [GDD section 18: 6, the daily cap]. */
  dailyCap: number;
  questions: QuestionDef[];
}

export interface ArchivePage {
  id: string;
  status: ContentStatus;
  title: string;
  body: string;
  youngReader: string;
  sources: string[];
}

export interface ArchiveConfig {
  pages: ArchivePage[];
  sourceList: Record<string, string> | { id: string; [k: string]: unknown }[];
}

// ---------------------------------------------------------------------------
// Town tasks, ranks and sea gifts [RECOMMENDATION, 11 Nov 2026; not in GDD v4.0]

export type TaskKind = 'buildings' | 'building_level' | 'routes_done' | 'food_sold' | 'gifts' | 'questions' | 'research' | 'fort';

export interface TaskDef {
  id: string;
  kind: TaskKind;
  /** For 'buildings': count only this building; absent means any building. */
  defId?: string;
  count: number;
  reward: { coin?: number; knowledge?: number };
}

export interface TasksConfig {
  status: ContentStatus;
  /** Ranks in order; a rank is held once this many tasks are claimed. */
  ranks: { id: string; tasks: number }[];
  gifts: { everyMinutes: number; lastsMinutes: number; incomeMinutes: number; minCoin: number };
  tasks: TaskDef[];
}
