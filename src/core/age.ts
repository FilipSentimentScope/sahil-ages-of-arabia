/**
 * The age's three goals [GDD section 4, "How an age ends"]: an age ends when the player has
 * learned enough (finished the research trunk), built enough (raised the landmark) and remembered
 * enough (completed the Chronicle chapter), in any order, except that the last trunk node unlocks
 * the landmark [GDD section 8].
 *
 * Slice sizes [ADJUSTED, docs/GAME_DESIGN.md item 7]: 3 trunk nodes, the Great Fort in 3 stages,
 * an 8-question chapter. Costs and times are in content/age5-goals.json [ASSUMPTION values].
 * Research takes real time and one node runs at a time [GDD section 8].
 * Branches, the age change itself and the question bank come later (P4-06, P3-07).
 */
import type { LoadedContent } from './content';
import { tick, type Result, type TownState } from './settlement';
import type { QuestionDef } from './types';

export function trunkLearned(s: TownState, c: LoadedContent, now: number): boolean {
  return s.age.node >= c.ageGoals.research.trunk.length && s.age.researchDoneAt <= now;
}

export function researchBusy(s: TownState, now: number): boolean {
  return s.age.researchDoneAt > now;
}

export interface AgeProgress {
  research: { done: number; of: number; busyUntil: number | null };
  landmark: { done: number; of: number; unlocked: boolean };
  chronicle: { done: number; of: number };
  complete: boolean;
}

export function ageProgress(s: TownState, c: LoadedContent, now: number): AgeProgress {
  const g = c.ageGoals;
  const learned = researchBusy(s, now) ? s.age.node - 1 : s.age.node;
  const trunk = trunkLearned(s, c, now);
  const research = { done: learned, of: g.research.trunk.length, busyUntil: researchBusy(s, now) ? s.age.researchDoneAt : null };
  const landmark = { done: s.age.stage, of: g.landmark.stages.length, unlocked: trunk };
  const chronicle = { done: Math.min(s.age.questions, g.chronicle.questions), of: g.chronicle.questions };
  return {
    research,
    landmark,
    chronicle,
    complete: trunk && landmark.done >= landmark.of && chronicle.done >= chronicle.of,
  };
}

/** Pay for and start the next trunk node. */
export function startResearch(s: TownState, c: LoadedContent, now: number): Result<{ doneAt: number }> {
  tick(s, c, now);
  const node = c.ageGoals.research.trunk[s.age.node];
  if (!node) return { ok: false, error: 'research_done' };
  if (researchBusy(s, now)) return { ok: false, error: 'research_busy' };
  if (s.resources.knowledge < node.knowledge) return { ok: false, error: 'not_enough_knowledge' };
  if (s.resources.coin < node.coin) return { ok: false, error: 'not_enough_coin' };
  s.resources.knowledge -= node.knowledge;
  s.resources.coin -= node.coin;
  s.age.node += 1;
  s.age.researchDoneAt = now + node.minutes * 60_000;
  return { ok: true, doneAt: s.age.researchDoneAt };
}

/** Pay for the next landmark stage. Locked until the trunk is learned [GDD section 8]. */
export function buildLandmarkStage(s: TownState, c: LoadedContent, now: number): Result<{ stage: number }> {
  tick(s, c, now);
  const cost = c.ageGoals.landmark.stages[s.age.stage];
  if (cost === undefined) return { ok: false, error: 'landmark_done' };
  if (!trunkLearned(s, c, now)) return { ok: false, error: 'landmark_locked' };
  if (s.resources.coin < cost) return { ok: false, error: 'not_enough_coin' };
  s.resources.coin -= cost;
  s.age.stage += 1;
  return { ok: true, stage: s.age.stage };
}

/**
 * Record a history question answered correctly: knowledge, and progress on the Chronicle.
 * The question bank and the answer check arrive with P3-07; this is the rule they will call.
 */
export function recordCorrectAnswer(s: TownState, c: LoadedContent, now: number): Result<{ knowledge: number }> {
  tick(s, c, now);
  const k = c.ageGoals.question.knowledge;
  s.resources.knowledge += k;
  s.age.questions += 1;
  return { ok: true, knowledge: k };
}

// ---------------------------------------------------------------------------
// History questions for the Chronicle [GDD section 18]: no timer and no penalty. A right answer
// gives knowledge, counts for the Chronicle and opens the question's Archive page. A wrong answer
// earns nothing, shows the explanation, and the question comes back later. At most dailyCap a day.

const DAY_MS = 24 * 60 * 60 * 1000;

/** The town's own day number: day 0 is the day it was founded. Questions are counted per day. */
export function questionDay(s: TownState, now: number): number {
  return Math.floor(Math.max(0, now - s.foundedAt) / DAY_MS);
}

export function questionsLeftToday(s: TownState, c: LoadedContent, now: number): number {
  const used = s.age.questionsToday.day === questionDay(s, now) ? s.age.questionsToday.count : 0;
  return Math.max(0, c.questions.dailyCap - used);
}

/** The next question to ask: new ones first, in order; then missed ones, oldest miss first. */
export function nextQuestion(s: TownState, c: LoadedContent): QuestionDef | undefined {
  const done = new Set(s.age.answered);
  const missed = new Set(s.age.missed);
  const fresh = c.questions.questions.find((q) => !done.has(q.id) && !missed.has(q.id));
  if (fresh) return fresh;
  const again = s.age.missed.find((id) => !done.has(id));
  return again ? c.questions.questions.find((q) => q.id === again) : undefined;
}

/** Archive pages opened by right answers, in question order, without repeats. */
export function unlockedArchive(s: TownState, c: LoadedContent): string[] {
  const done = new Set(s.age.answered);
  const out: string[] = [];
  for (const q of c.questions.questions) if (done.has(q.id) && !out.includes(q.archive)) out.push(q.archive);
  return out;
}

export function answerQuestion(
  s: TownState,
  c: LoadedContent,
  questionId: string,
  choice: number,
  now: number,
): Result<{ correct: boolean; knowledge: number; archive: string; newPage: boolean }> {
  tick(s, c, now);
  const q = c.questions.questions.find((x) => x.id === questionId);
  if (!q) return { ok: false, error: 'unknown_question' };
  if (s.age.answered.includes(q.id)) return { ok: false, error: 'already_answered' };
  if (questionsLeftToday(s, c, now) <= 0) return { ok: false, error: 'question_cap' };
  const day = questionDay(s, now);
  if (s.age.questionsToday.day !== day) s.age.questionsToday = { day, count: 0 };
  s.age.questionsToday.count += 1;
  s.age.missed = s.age.missed.filter((id) => id !== q.id);
  if (choice !== q.answer) {
    s.age.missed.push(q.id); // asked again later, after the others
    return { ok: true, correct: false, knowledge: 0, archive: q.archive, newPage: false };
  }
  const before = unlockedArchive(s, c).includes(q.archive);
  s.age.answered.push(q.id);
  const k = c.ageGoals.question.knowledge;
  s.resources.knowledge += k;
  s.age.questions += 1;
  return { ok: true, correct: true, knowledge: k, archive: q.archive, newPage: !before };
}
