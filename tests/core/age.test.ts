import { describe, expect, it } from 'vitest';
import {
  HOUR_MS,
  ageProgress,
  buildLandmarkStage,
  createTown,
  deserialize,
  recordCorrectAnswer,
  startResearch,
  topCurrentPrice,
  treasuryLimit,
  SAVE_VERSION,
  type TownState,
} from '../../src/core';
import { testContent } from './fixtures';

const c = testContent();
const T0 = 5_000_000;
const g = c.ageGoals;

function rich(): TownState {
  const s = createTown(c, T0);
  s.resources.coin = 1e9;
  s.resources.knowledge = 1e9;
  return s;
}

function learnTrunk(s: TownState): number {
  let t = T0;
  for (const n of g.research.trunk) {
    const r = startResearch(s, c, t);
    if (!r.ok) throw new Error(r.error);
    t += n.minutes * 60_000;
  }
  return t;
}

describe("the age's three goals [GDD section 4]", () => {
  it('research costs knowledge and coin, takes real time, one node at a time [GDD section 8]', () => {
    const s = createTown(c, T0);
    expect(startResearch(s, c, T0)).toEqual({ ok: false, error: 'not_enough_knowledge' });
    s.resources.knowledge = g.research.trunk[0]!.knowledge;
    s.resources.coin = g.research.trunk[0]!.coin;
    const r = startResearch(s, c, T0);
    expect(r.ok).toBe(true);
    expect(s.resources).toMatchObject({ knowledge: 0, coin: 0 });
    s.resources.knowledge = s.resources.coin = 1e9;
    expect(startResearch(s, c, T0 + 1)).toEqual({ ok: false, error: 'research_busy' });
    expect(ageProgress(s, c, T0 + 1).research.done).toBe(0);
    expect(ageProgress(s, c, T0 + g.research.trunk[0]!.minutes * 60_000).research.done).toBe(1);
  });

  it('the landmark stays locked until the trunk is learned, then is paid in stages', () => {
    const s = rich();
    expect(buildLandmarkStage(s, c, T0)).toEqual({ ok: false, error: 'landmark_locked' });
    const t = learnTrunk(s);
    expect(buildLandmarkStage(s, c, t - 1)).toEqual({ ok: false, error: 'landmark_locked' }); // last node still running
    for (let i = 0; i < g.landmark.stages.length; i++) expect(buildLandmarkStage(s, c, t).ok).toBe(true);
    expect(buildLandmarkStage(s, c, t)).toEqual({ ok: false, error: 'landmark_done' });
    expect(startResearch(s, c, t)).toEqual({ ok: false, error: 'research_done' });
  });

  it('the age is complete only when all three goals are met, in any order', () => {
    const s = rich();
    for (let i = 0; i < g.chronicle.questions; i++) recordCorrectAnswer(s, c, T0);
    expect(ageProgress(s, c, T0).chronicle.done).toBe(g.chronicle.questions);
    expect(ageProgress(s, c, T0).complete).toBe(false);
    const t = learnTrunk(s);
    for (let i = 0; i < g.landmark.stages.length; i++) buildLandmarkStage(s, c, t);
    expect(ageProgress(s, c, t).complete).toBe(true);
  });

  it('a correct answer gives knowledge', () => {
    const s = createTown(c, T0);
    recordCorrectAnswer(s, c, T0);
    expect(s.resources.knowledge).toBe(g.question.knowledge);
  });

  it('the treasury limit always covers the next research node and fort stage [GDD section 9]', () => {
    const s = rich();
    expect(topCurrentPrice(s, c)).toBeGreaterThanOrEqual(g.research.trunk[0]!.coin);
    const t = learnTrunk(s);
    expect(treasuryLimit(s, c)).toBeGreaterThanOrEqual(Math.ceil(1.5 * g.landmark.stages[0]!));
    for (let i = 0; i < g.landmark.stages.length - 1; i++) buildLandmarkStage(s, c, t + HOUR_MS);
    expect(treasuryLimit(s, c)).toBeGreaterThanOrEqual(Math.ceil(1.5 * g.landmark.stages.at(-1)!));
  });

  it('a version 4 save starts the goals from nothing', () => {
    const { age: _a, ...old } = createTown(c, T0);
    const v4 = { version: 4, savedAtReal: 0, clock: { game: T0, real: 0, scale: 1 }, town: { ...old, schema: 4 } };
    const f = deserialize(JSON.stringify(v4));
    expect(f.version).toBe(SAVE_VERSION);
    expect(f.town.age).toMatchObject({ node: 0, stage: 0, questions: 0 });
  });
});
