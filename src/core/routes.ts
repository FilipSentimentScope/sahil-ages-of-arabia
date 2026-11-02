/**
 * Routes and decision points [GDD section 12].
 *
 * A route is a caravan or a ship sent from the town for a chosen length of time. On the way it
 * stops at decision points, each a choice between a safer and a riskier option. When it returns,
 * its cargo (coin in the slice) goes into the treasury.
 *
 * Rules and their origin:
 * - Trip lengths, routes out at once (3 in Age V), 12 fully rewarded routes a day, the coast or
 *   open sea odds and hull repair: [GDD section 12], numbers in content/routes.json.
 * - Welcome-back bonus on the next routes after a long absence: [GDD section 18].
 * - Decision points come due at even steps along the trip and wait, in order, for the player. A
 *   decision never stops the trip: whatever is still unanswered when the route comes home takes
 *   its default (safer) option, so a player who is asleep is never punished [ASSUMPTION]. (An
 *   earlier draft answered a point as soon as the next came due; in Showcase time that left under
 *   three seconds per point on the short errand.)
 * - One hull state for all the town's ships; ships cannot sail while in repair [ASSUMPTION].
 *
 * Every random outcome uses the town's saved Rng state, so results repeat for the same actions.
 */
import { HOUR_MS } from './clock';
import type { LoadedContent } from './content';
import { Rng } from './rng';
import { depositCoin, tick, type ActiveRoute, type CoinDeposit, type Result, type TownState } from './settlement';
import type { DecisionDef, OutcomeDef, RouteDef, TripDef } from './types';

const MINUTE_MS = 60_000;
const DAY_MS = 24 * HOUR_MS;

export function routeDef(c: LoadedContent, id: string): RouteDef | undefined {
  return c.routes.routes.find((r) => r.id === id);
}

function tripOf(c: LoadedContent, def: RouteDef): TripDef {
  const trip = c.routes.trips.find((t) => t.id === def.trip);
  if (!trip) throw new Error(`route ${def.id}: unknown trip ${def.trip}`); // validated at load
  return trip;
}

function baseMs(c: LoadedContent, def: RouteDef): number {
  return tripOf(c, def).minutes * MINUTE_MS;
}

/** Game time decision i comes due: evenly spaced along the base trip, never after the return. */
export function decisionDueAt(c: LoadedContent, r: ActiveRoute, i: number): number {
  const def = routeDef(c, r.routeId)!;
  const n = def.decisions.length;
  return Math.min(r.departedAt + (baseMs(c, def) * (i + 1)) / (n + 1), r.returnAt);
}

/** Expected cargo multiplier of an option, for the interface and for checking content against the GDD. */
export function expectedCargoMult(outcomes: OutcomeDef[]): number {
  const total = outcomes.reduce((s, o) => s + o.weight, 0);
  return outcomes.reduce((s, o) => s + (o.weight / total) * (o.cargoMult ?? 1), 0);
}

// ---------------------------------------------------------------------------
// Progress: answer overdue decisions for the player and finish hull repairs.

/** Bring routes and the hull up to `now`. Called by every route action; safe to call any time. */
export function advanceRoutes(s: TownState, c: LoadedContent, now: number): void {
  if (s.hull.repairDoneAt !== null && s.hull.repairDoneAt <= now) {
    s.hull = { damaged: false, repairDoneAt: null };
  }
  for (const r of s.routes) {
    const def = routeDef(c, r.routeId);
    if (!def) continue;
    // Answer for the player only once the route is home. A default that adds time can move the
    // return later again, in which case the remaining points wait for the player once more.
    for (let i = 0; i < def.decisions.length && r.returnAt <= now; i++) {
      if (r.choices[i]) continue;
      resolve(s, c, r, def, i, def.decisions[i]!.defaultOption, true, now);
    }
  }
}

function resolve(
  s: TownState,
  c: LoadedContent,
  r: ActiveRoute,
  def: RouteDef,
  i: number,
  option: 'a' | 'b',
  auto: boolean,
  now: number,
): OutcomeDef {
  const d: DecisionDef = def.decisions[i]!;
  const opt = d.options.find((o) => o.id === option)!;
  const rng = new Rng(s.rngState);
  const total = opt.outcomes.reduce((sum, o) => sum + o.weight, 0);
  let roll = rng.next() * total;
  let pick = opt.outcomes.length - 1;
  for (let k = 0; k < opt.outcomes.length; k++) {
    roll -= opt.outcomes[k]!.weight;
    if (roll < 0) {
      pick = k;
      break;
    }
  }
  s.rngState = rng.seed;
  const out = opt.outcomes[pick]!;
  r.choices[i] = { option, outcome: pick, auto };
  if (out.cargoMult !== undefined) r.cargoMult *= out.cargoMult;
  // Time effects never move the return into the past: a route already due stays due now.
  const floor = Math.min(r.returnAt, Math.max(now, decisionDueAt(c, r, i)));
  if (out.timePct !== undefined) r.returnAt = Math.max(floor, r.returnAt + out.timePct * baseMs(c, def));
  if (out.delayHours !== undefined) r.returnAt += out.delayHours * HOUR_MS;
  if (out.hullDamage) s.hull.damaged = true;
  if (out.relation) s.relations[out.relation.rival] = (s.relations[out.relation.rival] ?? 0) + out.relation.delta;
  return out;
}

// ---------------------------------------------------------------------------
// Queries

export function freeRouteSlots(s: TownState, c: LoadedContent): number {
  return Math.max(0, c.routes.slots - s.routes.length);
}

/** The decision a route is waiting on now, if any (index into the route's decisions). */
export function pendingDecision(s: TownState, c: LoadedContent, uid: number, now: number): number | undefined {
  const r = s.routes.find((x) => x.uid === uid);
  if (!r || r.returnAt <= now) return undefined;
  const def = routeDef(c, r.routeId);
  if (!def) return undefined;
  const i = r.choices.findIndex((ch) => ch === null);
  if (i < 0 || decisionDueAt(c, r, i) > now) return undefined;
  return i;
}

/** Coin the route will bring if nothing else changes (before the treasury limit). */
export function routeCargo(c: LoadedContent, r: ActiveRoute): number {
  const def = routeDef(c, r.routeId)!;
  return Math.floor(tripOf(c, def).baseCoin * r.cargoMult * r.sendMult);
}

// ---------------------------------------------------------------------------
// Player actions

export function sendRoute(s: TownState, c: LoadedContent, routeId: string, now: number): Result<{ route: ActiveRoute }> {
  tick(s, c, now);
  advanceRoutes(s, c, now);
  const def = routeDef(c, routeId);
  if (!def) return { ok: false, error: 'unknown_route' };
  if (def.requires && !s.buildings.some((b) => b.defId === def.requires)) return { ok: false, error: 'needs_building' };
  if (def.sea && s.hull.repairDoneAt !== null) return { ok: false, error: 'ship_in_repair' };
  if (freeRouteSlots(s, c) <= 0) return { ok: false, error: 'no_free_route' };

  // Daily limit [GDD]: the day is counted from the town's founding, like market day.
  const day = Math.floor(Math.max(0, now - s.foundedAt) / DAY_MS);
  if (s.routesToday.day !== day) s.routesToday = { day, count: 0 };
  let sendMult = s.routesToday.count < c.routes.dailyFullRewards ? 1 : c.routes.overLimitShare;
  s.routesToday.count += 1;
  if (s.welcomeBackCharges > 0) {
    s.welcomeBackCharges -= 1;
    sendMult *= 1 + c.balance.welcomeBack.routeBonus;
  }
  if (def.sea && s.hull.damaged) sendMult *= c.routes.hull.damagedCargoMult;

  const route: ActiveRoute = {
    uid: s.nextRouteUid++,
    routeId,
    departedAt: now,
    returnAt: now + baseMs(c, def),
    cargoMult: 1,
    sendMult,
    choices: def.decisions.map(() => null),
  };
  s.routes.push(route);
  return { ok: true, route };
}

/** Answer the decision a route is waiting on. */
export function chooseOption(
  s: TownState,
  c: LoadedContent,
  uid: number,
  option: 'a' | 'b',
  now: number,
): Result<{ decision: number; outcome: OutcomeDef }> {
  tick(s, c, now);
  advanceRoutes(s, c, now);
  const r = s.routes.find((x) => x.uid === uid);
  if (!r) return { ok: false, error: 'unknown_route' };
  const i = pendingDecision(s, c, uid, now);
  if (i === undefined) return { ok: false, error: 'no_decision' };
  const outcome = resolve(s, c, r, routeDef(c, r.routeId)!, i, option, false, now);
  return { ok: true, decision: i, outcome };
}

/** Unload a route that has come home: its coin goes into the treasury. */
export function collectRoute(
  s: TownState,
  c: LoadedContent,
  uid: number,
  now: number,
): Result<{ coin: number; deposit: CoinDeposit }> {
  tick(s, c, now);
  advanceRoutes(s, c, now);
  const r = s.routes.find((x) => x.uid === uid);
  if (!r) return { ok: false, error: 'unknown_route' };
  if (r.returnAt > now) return { ok: false, error: 'route_not_back' };
  const coin = routeCargo(c, r);
  s.routes = s.routes.filter((x) => x.uid !== uid);
  return { ok: true, coin, deposit: depositCoin(s, c, coin) };
}

/** Pay to repair a damaged hull; ships stay in port until it is done [GDD: 200 coin, one hour]. */
export function repairHull(s: TownState, c: LoadedContent, now: number): Result<{ doneAt: number }> {
  tick(s, c, now);
  advanceRoutes(s, c, now);
  if (!s.hull.damaged) return { ok: false, error: 'hull_fine' };
  if (s.hull.repairDoneAt !== null) return { ok: false, error: 'ship_in_repair' };
  const { repairCost, repairHours } = c.routes.hull;
  if (s.resources.coin < repairCost) return { ok: false, error: 'not_enough_coin' };
  s.resources.coin -= repairCost;
  s.hull.repairDoneAt = now + repairHours * HOUR_MS;
  return { ok: true, doneAt: s.hull.repairDoneAt };
}
