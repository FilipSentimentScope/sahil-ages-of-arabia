import { describe, expect, it } from 'vitest';
import { areNeighbours, hexAtPoint, hexCentre, hexNeighbours } from '../../src/core/hex';
import { canPlace, createTown, growTown, isOpen, neighbourBonusPct, openArea, place, type TownState } from '../../src/core';
import { loadDefaultContent } from '../../src/core/content-pack';
import { loadContent } from '../../src/core/content';

describe('hex geometry (pointy-top, odd rows shifted right)', () => {
  it('gives six neighbours that differ between even and odd rows', () => {
    expect(hexNeighbours(2, 2)).toEqual([
      { x: 3, y: 2 }, { x: 2, y: 1 }, { x: 1, y: 1 }, { x: 1, y: 2 }, { x: 1, y: 3 }, { x: 2, y: 3 },
    ]);
    expect(hexNeighbours(2, 3)).toEqual([
      { x: 3, y: 3 }, { x: 3, y: 2 }, { x: 2, y: 2 }, { x: 1, y: 3 }, { x: 2, y: 4 }, { x: 3, y: 4 },
    ]);
  });

  it('is symmetric: if A touches B then B touches A', () => {
    for (let y = 0; y < 6; y++) {
      for (let x = 0; x < 6; x++) {
        for (const n of hexNeighbours(x, y)) expect(areNeighbours(n, { x, y })).toBe(true);
      }
    }
  });

  it('finds the plot under a tap, including near the corners', () => {
    const size = 30;
    for (let y = 0; y < 12; y++) {
      for (let x = 0; x < 12; x++) {
        const { px, py } = hexCentre(x, y, size);
        expect(hexAtPoint(px, py, size)).toEqual({ x, y });
        // A point 80% of the way to each corner still belongs to this plot.
        for (let i = 0; i < 6; i++) {
          const a = (Math.PI / 180) * (60 * i - 90);
          expect(hexAtPoint(px + 0.8 * size * Math.cos(a), py + 0.8 * size * Math.sin(a), size)).toEqual({ x, y });
        }
      }
    }
  });
});

describe('open and locked land [GDD section 15: one row and one column per age]', () => {
  const content = loadDefaultContent();

  it('starts with the 6 by 6 block open and the rest of the 12 by 12 map locked', () => {
    const s = createTown(content, 0);
    expect(openArea(s)).toEqual({ x: 3, y: 4, size: 6 });
    expect(isOpen(s, 3, 4)).toBe(true);
    expect(isOpen(s, 2, 4)).toBe(false);
    expect(canPlace(s, content, 'well', 2, 5)).toEqual({ ok: false, error: 'tile_locked' });
  });

  it('grows by one row and one column per age, stays on the map and stops at 12 by 12', () => {
    const s = createTown(content, 0);
    const opened = growTown(s);
    expect(openArea(s)).toEqual({ x: 2, y: 3, size: 7 });
    expect(opened).toHaveLength(7 * 7 - 6 * 6);
    for (let i = 0; i < 10; i++) growTown(s);
    expect(openArea(s)).toEqual({ x: 0, y: 0, size: 12 });
    expect(growTown(s)).toHaveLength(0);
  });

  it('counts up to four of the six touching buildings for the bonus [GDD cap of four]', () => {
    const c = loadContent({
      ...content,
      map: { ...content.map, width: 3, height: 3, rows: ['...', '...', '...'], openArea: { x: 0, y: 0, size: 3 } },
      balance: { ...content.balance, startingResources: { ...content.balance.startingResources, coin: 100000 } },
    });
    const s: TownState = createTown(c, 0);
    // (1, 1) is an odd row: its six neighbours are (2,1) (2,0) (1,0) (0,1) (1,2) (2,2).
    for (const [x, y] of [[0, 0], [2, 0], [0, 2]] as const) expect(place(s, c, 'well', x, y, 0).ok).toBe(true);
    const grove = place(s, c, 'date_grove', 1, 1, 0);
    if (!grove.ok) throw new Error(grove.error);
    for (const [x, y] of [[2, 1], [1, 0], [0, 1], [1, 2], [2, 2]] as const) expect(place(s, c, 'well', x, y, 0).ok).toBe(true);
    // Six wells touch it (2,0 counts; 0,0 and 0,2 do not touch an odd-row hex at x 1), capped at four.
    const pct = c.building('date_grove').neighbourBonuses[0]!.pct;
    expect(neighbourBonusPct(s, c, grove.building)).toBe(4 * pct);
  });
});
