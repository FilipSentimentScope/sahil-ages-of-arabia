import { describe, expect, it } from 'vitest';
import {
  HOUR_MS,
  advanceRoutes,
  chooseOption,
  collectRoute,
  createTown,
  decisionDueAt,
  deserialize,
  expectedCargoMult,
  pendingDecision,
  registerVisit,
  repairHull,
  routeBaseCoin,
  routeCargo,
  routeDef,
  sendRoute,
  treasuryLimit,
  type TownState,
  SAVE_VERSION,
} from '../../src/core';
import { loadContent } from '../../src/core/content';
import { testContent } from './fixtures';

const c = testContent();
const T0 = 1_000_000;
const MIN = 60_000;

/** A town that already has a souq and a jetty, plenty of coin and a big treasury. */
function town(seed = 7): TownState {
  const s = createTown(c, T0, seed);
  s.buildings.push(
    { uid: 1, defId: 'souq', level: 1, x: 3, y: 3, stored: 0 },
    { uid: 2, defId: 'jetty', level: 1, x: 0, y: 5, stored: 0 },
    { uid: 3, defId: 'treasury', level: 20, x: 1, y: 1, stored: 0 },
  );
  s.nextUid = 4;
  s.resources.coin = 1000;
  return s;
}

function send(s: TownState, id: string, t = T0) {
  const r = sendRoute(s, c, id, t);
  if (!r.ok) throw new Error(r.error);
  return r.route;
}

describe('routes [GDD section 12]', () => {
  it('uses the GDD trip lengths and keeps three routes out at once in Age V', () => {
    const s = town();
    expect(send(s, 'date_gardens').returnAt - T0).toBe(8 * MIN);
    expect(send(s, 'oasis_market').returnAt - T0).toBe(2 * HOUR_MS);
    expect(send(s, 'bombay').returnAt - T0).toBe(14 * HOUR_MS);
    expect(sendRoute(s, c, 'date_gardens', T0)).toEqual({ ok: false, error: 'no_free_route' });
  });

  it('needs a jetty for the sea and a souq for the caravan [ASSUMPTION]', () => {
    const s = createTown(c, T0);
    expect(sendRoute(s, c, 'island_harbour', T0)).toEqual({ ok: false, error: 'needs_building' });
    expect(sendRoute(s, c, 'oasis_market', T0)).toEqual({ ok: false, error: 'needs_building' });
    expect(sendRoute(s, c, 'date_gardens', T0).ok).toBe(true);
    expect(sendRoute(s, c, 'nowhere', T0)).toEqual({ ok: false, error: 'unknown_route' });
  });

  it('matches the GDD worked example: coast about 1,000 per 1,000-coin voyage, open sea about 1,150', () => {
    const heading = routeDef(c, 'bombay')!.decisions.find((d) => d.id === 'heading')!;
    expect(expectedCargoMult(heading.options[0]!.outcomes)).toBeCloseTo(1, 5);
    expect(expectedCargoMult(heading.options[1]!.outcomes) * 1000).toBeCloseTo(1147.5, 1);
  });

  it('every risky option pays more per hour on average than its safe one [GDD: riskier pays 10% to 20% more]', () => {
    // Value per hour over the whole trip: cargo divided by the trip length after time effects.
    const perHour = (c0: typeof c, routeId: string, outcomes: { weight: number; cargoMult?: number; timePct?: number; delayHours?: number }[]) => {
      const def = routeDef(c0, routeId)!;
      const hours = c0.routes.trips.find((t) => t.id === def.trip)!.minutes / 60;
      const total = outcomes.reduce((a, o) => a + o.weight, 0);
      return outcomes.reduce((a, o) => a + (o.weight / total) * ((o.cargoMult ?? 1) / (1 + (o.timePct ?? 0) + (o.delayHours ?? 0) / hours)), 0);
    };
    for (const r of c.routes.routes) {
      for (const d of r.decisions) {
        if (d.id === 'harbour_fee') continue; // trades coin for relations, not risk
        const safe = perHour(c, r.id, d.options[0]!.outcomes);
        const risky = perHour(c, r.id, d.options[1]!.outcomes);
        expect(risky, `${r.id}/${d.id}`).toBeGreaterThan(safe);
      }
    }
  });
});

describe('decision points', () => {
  it('come due at even steps and wait, in order, for the player', () => {
    const s = town();
    const r = send(s, 'oasis_market'); // three points: at 30, 60 and 90 minutes of 120
    expect(decisionDueAt(c, r, 0) - T0).toBe(30 * MIN);
    expect(pendingDecision(s, c, r.uid, T0 + 29 * MIN)).toBeUndefined();
    expect(pendingDecision(s, c, r.uid, T0 + 31 * MIN)).toBe(0);
    const res = chooseOption(s, c, r.uid, 'b', T0 + 31 * MIN);
    expect(res.ok && res.decision).toBe(0);
    expect(chooseOption(s, c, r.uid, 'b', T0 + 40 * MIN)).toEqual({ ok: false, error: 'no_decision' });
    // Late is fine: at 100 minutes both remaining points are due and are answered in order.
    expect(pendingDecision(s, c, r.uid, T0 + 100 * MIN)).toBe(1);
    chooseOption(s, c, r.uid, 'a', T0 + 100 * MIN);
    expect(pendingDecision(s, c, r.uid, T0 + 100 * MIN)).toBe(2);
  });

  it('stay open after the route is home, without time effects, until it is unloaded [ASSUMPTION]', () => {
    const s = town();
    const r = send(s, 'island_harbour');
    const home = T0 + 3 * HOUR_MS; // a player who looks in after the trip is over
    expect(r.choices).toEqual([null, null, null]);
    expect(pendingDecision(s, c, r.uid, home)).toBe(0);
    chooseOption(s, c, r.uid, 'a', home); // coast
    chooseOption(s, c, r.uid, 'a', home); // wait for the tide: +25% time, but the trip is over
    expect(r.returnAt - T0).toBe(120 * MIN);
    // The last point is left open: unloading takes its default (pay the fee).
    const res = collectRoute(s, c, r.uid, home);
    expect(res.ok).toBe(true);
    expect(r.choices[2]).toMatchObject({ option: 'a', auto: true });
  });

  it('pay the base cargo for a route left alone with only free safe options', () => {
    const s = town();
    const expected = Math.floor(routeBaseCoin(s, c, 'date_gardens'));
    const r = send(s, 'date_gardens');
    const res = collectRoute(s, c, r.uid, T0 + 8 * MIN);
    expect(res.ok && res.coin).toBe(expected);
    expect(s.routes).toHaveLength(0);
  });

  it('cannot unload a route before it is home', () => {
    const s = town();
    const r = send(s, 'date_gardens');
    expect(collectRoute(s, c, r.uid, T0 + 7 * MIN)).toEqual({ ok: false, error: 'route_not_back' });
  });

  it('applies time effects: waiting for the tide makes the island run 25% longer', () => {
    const s = town();
    const r = send(s, 'island_harbour');
    chooseOption(s, c, r.uid, 'a', T0 + 30 * MIN); // coast
    chooseOption(s, c, r.uid, 'a', T0 + 60 * MIN); // wait for the tide
    expect(r.returnAt - T0).toBe(150 * MIN);
  });

  it('a route left alone takes every default when unloaded', () => {
    const s = town();
    const base = routeBaseCoin(s, c, 'island_harbour');
    const r = send(s, 'island_harbour');
    // Defaults: coast, wait for the tide (no time effect once home), pay the fee (-10% cargo, relations up).
    expect(collectRoute(s, c, r.uid, T0 + 119 * MIN)).toEqual({ ok: false, error: 'route_not_back' });
    const res = collectRoute(s, c, r.uid, T0 + 120 * MIN);
    expect(res.ok && res.coin).toBe(Math.floor(base * 0.9));
    expect(s.relations.island_harbour).toBe(2);
  });

  it('bad route data fails loudly at startup', () => {
    const broken = { ...c.routes, routes: [{ ...c.routes.routes[0]!, trip: 'teleport' }] };
    expect(() => loadContent({ ...c, routes: broken })).toThrow(/unknown trip/);
    const noB = { ...c.routes, routes: [{ ...c.routes.routes[0]!, requires: 'castle' }] };
    expect(() => loadContent({ ...c, routes: noB })).toThrow(/unknown building/);
  });

  it('are repeatable: the same seed and the same choices give the same results', () => {
    const run = () => {
      const s = town(42);
      const r = send(s, 'bombay');
      for (let i = 0; i < 4; i++) {
        const due = decisionDueAt(c, r, i);
        chooseOption(s, c, r.uid, 'b', due);
      }
      return { choices: r.choices.map((ch) => ch?.outcome), cargo: routeCargo(c, r) };
    };
    expect(run()).toEqual(run());
  });

  it('roll outcomes at the content odds: open sea storms about 30% of the time', () => {
    let storms = 0;
    const n = 3000;
    for (let seed = 1; seed <= n; seed++) {
      const s = town(seed);
      const r = send(s, 'island_harbour');
      const res = chooseOption(s, c, r.uid, 'b', T0 + 30 * MIN);
      if (res.ok && res.outcome.textKey === 'route.out.storm') storms++;
    }
    expect(storms / n).toBeGreaterThan(0.27);
    expect(storms / n).toBeLessThan(0.33);
  });
});

describe('cargo grows with the town [ASSUMPTION, P2-10]', () => {
  it('adds hours of the town coin income, more per hour on short trips', () => {
    const s = town();
    const rate = s.buildings.filter((b) => b.defId === 'souq').length * 10; // one level-1 souq, no neighbours
    expect(routeBaseCoin(s, c, 'date_gardens')).toBeCloseTo(20 + rate * 0.5);
    expect(routeBaseCoin(s, c, 'bombay')).toBeCloseTo(1000 + rate * 14);
  });

  it('unloading a big cargo uses the room the treasury kept for it (bug found in P2-10)', () => {
    // Cheap goals, so nothing else lifts the limit above the base: only the room kept for the cargo.
    const cheap = loadContent({ ...c, ageGoals: { ...c.ageGoals, research: { trunk: [{ id: 'x', knowledge: 1, coin: 1, minutes: 1 }] }, landmark: { id: 'y', stages: [1] } } });
    const s = createTown(cheap, T0);
    s.buildings.push({ uid: 1, defId: 'jetty', level: 1, x: 0, y: 5, stored: 0 });
    s.resources.coin = 0;
    const sent = sendRoute(s, cheap, 'bombay', T0);
    if (!sent.ok) throw new Error(sent.error);
    const r = sent.route;
    const res = collectRoute(s, cheap, r.uid, T0 + 20 * HOUR_MS); // after every default, including the slower wind
    expect(res.ok).toBe(true);
    expect(res.ok && res.coin).toBeGreaterThan(600); // more than the base limit, so the kept room matters
    expect(res.ok && res.deposit.lost + res.deposit.toChest).toBe(0);
    expect(s.resources.coin).toBe(res.ok ? res.coin : -1);
  });

  it('the treasury makes room for cargo that is on its way home', () => {
    const s = town();
    const r = send(s, 'bombay');
    expect(treasuryLimit(s, c)).toBeGreaterThanOrEqual(Math.ceil(c.balance.treasury.minMultipleOfCoinStorage * routeCargo(c, r)));
  });
});

describe('hull, daily limit and welcome-back bonus', () => {
  it('a reef damages the hull: later sea trips pay 20% less until 200 coin and an hour of repair', () => {
    const s = town();
    s.hull.damaged = true;
    const r = send(s, 'island_harbour');
    expect(r.sendMult).toBeCloseTo(0.8);
    expect(send(s, 'date_gardens').sendMult).toBe(1); // land routes are not affected
    // Repair, with no ship at sea (a ship out could hit a new reef while we wait).
    const p = town();
    p.hull.damaged = true;
    expect(repairHull(p, c, T0).ok).toBe(true);
    expect(p.resources.coin).toBe(800);
    expect(sendRoute(p, c, 'island_harbour', T0 + 10 * MIN)).toEqual({ ok: false, error: 'ship_in_repair' });
    expect(repairHull(p, c, T0 + 10 * MIN)).toEqual({ ok: false, error: 'ship_in_repair' });
    advanceRoutes(p, c, T0 + HOUR_MS);
    expect(p.hull).toEqual({ damaged: false, repairDoneAt: null });
    expect(repairHull(p, c, T0 + HOUR_MS)).toEqual({ ok: false, error: 'hull_fine' });
  });

  it('pays full rewards for 12 routes a game day, then a reduced share [GDD 12; share ASSUMPTION]', () => {
    const s = town();
    let t = T0;
    for (let i = 0; i < 12; i++) {
      const r = send(s, 'date_gardens', t);
      expect(r.sendMult).toBe(1);
      t += 8 * MIN;
      collectRoute(s, c, r.uid, t);
    }
    expect(send(s, 'date_gardens', t).sendMult).toBe(c.routes.overLimitShare);
  });

  it('spends a welcome-back charge on the next route for +50% [GDD section 18]', () => {
    const s = town();
    registerVisit(s, c, T0 + 13 * HOUR_MS);
    expect(s.welcomeBackCharges).toBe(3);
    const r = send(s, 'date_gardens', T0 + 13 * HOUR_MS);
    expect(r.sendMult).toBeCloseTo(1.5);
    expect(s.welcomeBackCharges).toBe(2);
  });

  it('a version 3 save gains empty route state', () => {
    const { rngState: _a, routes: _b, nextRouteUid: _c, routesToday: _d, hull: _e, relations: _f, ...old } = createTown(c, T0);
    const v3 = { version: 3, savedAtReal: 0, clock: { game: T0, real: 0, scale: 1 }, town: { ...old, schema: 3 } };
    const f = deserialize(JSON.stringify(v3));
    expect(f.version).toBe(SAVE_VERSION);
    expect(f.town.routes).toEqual([]);
    expect(f.town.hull).toEqual({ damaged: false, repairDoneAt: null });
  });
});
