/**
 * Hex grid geometry. Pointy-top hexes in "odd-r" offset layout: plots are stored by column x and
 * row y, as before, and every odd row sits half a hex to the right. This is the layout of the
 * Civilization maps Filip asked for (2 Nov 2026). [RECOMMENDATION accepted by Filip]
 *
 * Pure maths, no drawing: the client converts plots to pixels with hexCentre and taps back to
 * plots with hexAtPoint, using a hex "size" (centre to corner) of its choice.
 */

export interface Hex {
  x: number;
  y: number;
}

const EVEN_ROW: readonly (readonly [number, number])[] = [
  [1, 0], [0, -1], [-1, -1], [-1, 0], [-1, 1], [0, 1],
];
const ODD_ROW: readonly (readonly [number, number])[] = [
  [1, 0], [1, -1], [0, -1], [-1, 0], [0, 1], [1, 1],
];

/** The six plots touching (x, y), clockwise from the east. May include plots off the map. */
export function hexNeighbours(x: number, y: number): Hex[] {
  const dirs = (y & 1) === 0 ? EVEN_ROW : ODD_ROW;
  return dirs.map(([dx, dy]) => ({ x: x + dx, y: y + dy }));
}

export function areNeighbours(a: Hex, b: Hex): boolean {
  return hexNeighbours(a.x, a.y).some((n) => n.x === b.x && n.y === b.y);
}

const SQRT3 = Math.sqrt(3);

/** Centre of plot (x, y) in pixels, with plot (0, 0) centred on the origin. */
export function hexCentre(x: number, y: number, size: number): { px: number; py: number } {
  return { px: size * SQRT3 * (x + 0.5 * (y & 1)), py: size * 1.5 * y };
}

/** The six corners of a hex centred on (px, py), starting at the top and going clockwise. */
export function hexCorners(px: number, py: number, size: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 180) * (60 * i - 90);
    out.push(px + size * Math.cos(a), py + size * Math.sin(a));
  }
  return out;
}

/** The plot under a point (same origin as hexCentre). Exact at edges up to rounding. */
export function hexAtPoint(px: number, py: number, size: number): Hex {
  // Fractional axial coordinates, then cube rounding (keeps q + r + s = 0).
  const q = ((SQRT3 / 3) * px - (1 / 3) * py) / size;
  const r = ((2 / 3) * py) / size;
  const s = -q - r;
  let rq = Math.round(q);
  let rr = Math.round(r);
  const rs = Math.round(s);
  const dq = Math.abs(rq - q);
  const dr = Math.abs(rr - r);
  const ds = Math.abs(rs - s);
  if (dq > dr && dq > ds) rq = -rr - rs;
  else if (dr > ds) rr = -rq - rs;
  // "+ 0" turns a negative zero from rounding into a plain zero.
  return { x: rq + (rr - (rr & 1)) / 2 + 0, y: rr + 0 };
}
