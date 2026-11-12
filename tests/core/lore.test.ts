import { describe, expect, it } from 'vitest';
import book from '../../content/lore/book.json';

// Rule 4: every page of the lore book cites a source, and nothing leaves draft without review.
describe('lore book content', () => {
  it('has an opening, seven ages and a closing page', () => {
    expect(book.pages.map((p) => p.id)).toEqual(['prologue', 'age1', 'age2', 'age3', 'age4', 'age5', 'age6', 'age7', 'yours']);
  });
  it('gives every page English text, an Arabic subtitle and known sources', () => {
    for (const p of book.pages) {
      expect(p.body.length, p.id).toBeGreaterThan(120);
      expect(p.subtitle, p.id).toMatch(/[؀-ۿ]/);
      expect(p.title.ar, p.id).toMatch(/[؀-ۿ]/);
      expect(p.sources.length, p.id).toBeGreaterThan(0);
      for (const s of p.sources) expect(Object.keys(book.sources), `${p.id} -> ${s}`).toContain(s);
    }
  });
  it('stays draft until a historian and a native Arabic writer have reviewed it', () => {
    expect(book.status).toBe('draft');
  });
  it('names Suhail on the pages that carry the thread', () => {
    for (const id of ['prologue', 'age5', 'yours']) expect(book.pages.find((p) => p.id === id)?.body).toContain('Suhail');
  });
});
