import { describe, expect, it } from 'vitest';
import {
  HOUR_MS,
  SAVE_VERSION,
  ageProgress,
  answerQuestion,
  createTown,
  deserialize,
  nextQuestion,
  questionsLeftToday,
  unlockedArchive,
} from '../../src/core';
import { loadContent } from '../../src/core/content';
import { testContent } from './fixtures';

const c = testContent();
const T0 = 1_000_000;

describe('history questions for the Chronicle [GDD section 18]', () => {
  it('ships enough sourced questions to complete the chapter, each linked to an Archive page', () => {
    expect(c.questions.questions.length).toBeGreaterThanOrEqual(c.ageGoals.chronicle.questions);
    for (const q of c.questions.questions) {
      expect(q.sources.length).toBeGreaterThan(0);
      expect(c.archive.pages.some((p) => p.id === q.archive)).toBe(true);
    }
  });

  it('a right answer gives knowledge, counts for the Chronicle and opens the Archive page', () => {
    const s = createTown(c, T0);
    const q = nextQuestion(s, c)!;
    const r = answerQuestion(s, c, q.id, q.answer, T0);
    expect(r).toMatchObject({ ok: true, correct: true, knowledge: c.ageGoals.question.knowledge, archive: q.archive, newPage: true });
    expect(s.resources.knowledge).toBe(c.ageGoals.question.knowledge);
    expect(ageProgress(s, c, T0).chronicle.done).toBe(1);
    expect(unlockedArchive(s, c)).toEqual([q.archive]);
    expect(answerQuestion(s, c, q.id, q.answer, T0)).toEqual({ ok: false, error: 'already_answered' });
    expect(nextQuestion(s, c)!.id).not.toBe(q.id);
  });

  it('a wrong answer costs nothing, earns nothing, and the question comes back after the others', () => {
    const s = createTown(c, T0);
    const q = nextQuestion(s, c)!;
    const r = answerQuestion(s, c, q.id, (q.answer + 1) % q.en.options.length, T0);
    expect(r).toMatchObject({ ok: true, correct: false, knowledge: 0 });
    expect(s.resources.knowledge).toBe(0);
    expect(ageProgress(s, c, T0).chronicle.done).toBe(0);
    expect(nextQuestion(s, c)!.id).not.toBe(q.id);
    // Once every new question is answered, the missed one comes back.
    s.age.answered = c.questions.questions.filter((x) => x.id !== q.id).map((x) => x.id);
    expect(nextQuestion(s, c)!.id).toBe(q.id);
  });

  it('allows the daily cap of questions per game day, then waits for the next day', () => {
    const s = createTown(c, T0);
    for (let i = 0; i < c.questions.dailyCap; i++) {
      const q = nextQuestion(s, c)!;
      expect(answerQuestion(s, c, q.id, q.answer, T0).ok).toBe(true);
    }
    expect(questionsLeftToday(s, c, T0)).toBe(0);
    const q = nextQuestion(s, c)!;
    expect(answerQuestion(s, c, q.id, q.answer, T0)).toEqual({ ok: false, error: 'question_cap' });
    expect(questionsLeftToday(s, c, T0 + 24 * HOUR_MS)).toBe(c.questions.dailyCap);
  });

  it('refuses a question without a source (CLAUDE.md rule 4)', () => {
    const bad = { ...c.questions, questions: [{ ...c.questions.questions[0]!, sources: [] }] };
    expect(() => loadContent({ ...c, questions: bad })).toThrow(/cites a source/);
  });

  it('a version 5 save gains empty question lists', () => {
    const t = createTown(c, T0);
    const { answered: _a, missed: _m, questionsToday: _q, ...age5 } = t.age;
    const v5 = { version: 5, savedAtReal: 0, clock: { game: T0, real: 0, scale: 1 }, town: { ...t, age: age5, schema: 5 } };
    const f = deserialize(JSON.stringify(v5));
    expect(f.version).toBe(SAVE_VERSION);
    expect(f.town.age.answered).toEqual([]);
  });
});
