import { describe, expect, it } from 'vitest';
import encyclopedia from '../../content/encyclopedia/age5.json';
import { loadDefaultContent } from '../../src/core/content-pack';

const c = loadDefaultContent();
const sourceList = c.archive.sourceList as Record<string, string>;
const ids = new Set([
  ...encyclopedia.entries.map((e) => e.id),
  ...c.buildings.map((b) => `bld_${b.id}`),
  ...c.archive.pages.map((p) => p.id),
]);

describe('encyclopedia content', () => {
  it('has unique ids and every "see also" link leads somewhere', () => {
    expect(new Set(encyclopedia.entries.map((e) => e.id)).size).toBe(encyclopedia.entries.length);
    for (const e of encyclopedia.entries) for (const r of e.related) expect(ids.has(r), `${e.id} -> ${r}`).toBe(true);
  });

  it('every historical entry cites a source that exists (CLAUDE.md rule 4)', () => {
    for (const e of encyclopedia.entries) {
      if (e.category === 'howto') continue;
      expect(e.sources.length, e.id).toBeGreaterThan(0);
      for (const s of e.sources) expect(s.startsWith('GDD') || typeof sourceList[s] === 'string', `${e.id}: ${s}`).toBe(true);
    }
  });

  it('covers the six slice leaders', () => {
    const leaders = encyclopedia.entries.filter((e) => e.category === 'leaders').map((e) => e.title);
    expect(leaders).toHaveLength(6);
  });
});
