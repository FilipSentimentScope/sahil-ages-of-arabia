/**
 * The Book of Suhail: an illustrated lore book (Filip, 11 Nov). Nine pages, one star: an opening,
 * one page per age, and a closing page that hands the story to the player. English text with Arabic
 * subtitles. Shown once to a first-time player between the title screen and Rawi's tutorial, and
 * always available from the menu. Presentation only: no game rules here.
 *
 * The illustrations are drawn in code (SVG) so the book ships without waiting for painted art.
 * They are listed in docs/ASSET_INVENTORY.md as code-drawn stand-ins for painted pages.
 * All text is draft and carries its sources (content/lore/book.json).
 */
import book from '../../content/lore/book.json';
import { rawiAvatar } from './icons';
import { t } from './i18n';

interface Page {
  id: string;
  scene: string;
  kicker: { en: string; ar: string };
  title: { en: string; ar: string };
  body: string;
  subtitle: string;
  game: string;
  sources: string[];
}

const PAGES = book.pages as Page[];
const SOURCES = book.sources as Record<string, string>;

/* ---------- drawing helpers (viewBox 400 x 300) ---------- */

/** Small repeatable random numbers, so the same stars appear every time. */
function rand(seed: number): () => number {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) / 2147483647);
}

function sky(id: string, stops: [number, string][], h = 300): string {
  return `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">${stops
    .map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`)
    .join('')}</linearGradient></defs><rect width="400" height="${h}" fill="url(#${id})"/>`;
}

function stars(seed: number, n: number, maxY: number, op = 0.9): string {
  const r = rand(seed);
  let out = '';
  for (let i = 0; i < n; i++) {
    const x = (r() * 400).toFixed(1);
    const y = (r() * maxY).toFixed(1);
    out += `<circle cx="${x}" cy="${y}" r="${(0.4 + r() * 0.9).toFixed(2)}" fill="#fff" opacity="${(op * (0.35 + r() * 0.65)).toFixed(2)}"/>`;
  }
  return out;
}

/** The star itself: a soft halo and a four-point flare. It is on every page. */
function suhail(id: string, x: number, y: number, s = 1, tint = '#ffe2a0'): string {
  const a = 15 * s;
  const b = 2.2 * s;
  return `<defs><radialGradient id="${id}"><stop offset="0" stop-color="#fff" stop-opacity="0.95"/><stop offset="0.18" stop-color="${tint}" stop-opacity="0.6"/><stop offset="1" stop-color="${tint}" stop-opacity="0"/></radialGradient></defs>
  <g class="suhail" style="transform-origin:${x}px ${y}px"><circle cx="${x}" cy="${y}" r="${34 * s}" fill="url(#${id})"/>
  <path d="M${x} ${y - a} L${x + b} ${y - b} L${x + a} ${y} L${x + b} ${y + b} L${x} ${y + a} L${x - b} ${y + b} L${x - a} ${y} L${x - b} ${y - b}Z" fill="#fff"/>
  <path d="M${x - a * 1.9} ${y}H${x + a * 1.9}M${x} ${y - a * 1.5}V${y + a * 1.5}" stroke="#fff" stroke-width="${0.5 * s}" opacity="0.7"/></g>`;
}

function palm(x: number, y: number, s: number, fill: string, lean = 0): string {
  const top = y - 46 * s;
  const tx = x + lean * s;
  let fronds = '';
  for (const [dx, dy] of [[-26, 6], [-22, -10], [-8, -20], [10, -19], [23, -8], [26, 8], [-14, 14], [15, 15]] as const) {
    fronds += `<path d="M${tx} ${top} Q${tx + dx * 0.5 * s} ${top + (dy - 10) * s} ${tx + dx * s} ${top + dy * s} Q${tx + dx * 0.45 * s} ${top + (dy - 2) * s} ${tx} ${top}Z"/>`;
  }
  return `<g fill="${fill}"><path d="M${x - 2.4 * s} ${y} Q${x + lean * 0.4 * s} ${y - 24 * s} ${tx - 1.4 * s} ${top} L${tx + 1.6 * s} ${top} Q${x + lean * 0.5 * s + 3 * s} ${y - 22 * s} ${x + 2.6 * s} ${y}Z"/>${fronds}</g>`;
}

/** A standing figure in a long robe and headcloth, as a silhouette. */
function person(x: number, y: number, s: number, fill: string): string {
  return `<g fill="${fill}"><circle cx="${x}" cy="${y - 21 * s}" r="${3 * s}"/><path d="M${x - 3.6 * s} ${y - 19 * s} Q${x} ${y - 16 * s} ${x + 3.6 * s} ${y - 19 * s} L${x + 5 * s} ${y - 8 * s} L${x + 4.4 * s} ${y} H${x - 4.4 * s} L${x - 5 * s} ${y - 8 * s}Z"/></g>`;
}

/** A dhow: curved hull, raked mast, one lateen sail. */
function dhow(x: number, y: number, s: number, hull: string, sail: string, dir = 1): string {
  const d = dir * s;
  return `<g><path d="M${x - 34 * d} ${y - 7 * s} Q${x - 20 * d} ${y + 5 * s} ${x + 12 * d} ${y + 4 * s} Q${x + 30 * d} ${y + 2 * s} ${x + 42 * d} ${y - 13 * s} L${x + 26 * d} ${y - 6 * s} H${x - 24 * d}Z" fill="${hull}"/>
  <path d="M${x - 4 * d} ${y - 6 * s} L${x + 6 * d} ${y - 58 * s}" stroke="${hull}" stroke-width="${1.6 * s}"/>
  <path d="M${x - 30 * d} ${y - 20 * s} Q${x - 2 * d} ${y - 30 * s} ${x + 22 * d} ${y - 66 * s} Q${x + 20 * d} ${y - 34 * s} ${x + 24 * d} ${y - 12 * s} Q${x - 4 * d} ${y - 22 * s} ${x - 30 * d} ${y - 20 * s}Z" fill="${sail}"/></g>`;
}

function house(x: number, y: number, w: number, h: number, fill: string, lit = ''): string {
  const win = lit ? `<rect x="${x + w * 0.38}" y="${y - h * 0.62}" width="${w * 0.2}" height="${h * 0.3}" rx="${w * 0.1}" fill="${lit}"/>` : '';
  return `<rect x="${x}" y="${y - h}" width="${w}" height="${h}" fill="${fill}"/><rect x="${x - 1}" y="${y - h - 2}" width="${w + 2}" height="3" fill="${fill}"/>${win}`;
}

/** A wind tower house (barjeel), the Gulf's own skyline. */
function windTower(x: number, y: number, s: number, fill: string, slot: string): string {
  return `${house(x, y, 30 * s, 18 * s, fill)}<rect x="${x + 16 * s}" y="${y - 40 * s}" width="${11 * s}" height="${24 * s}" fill="${fill}"/><rect x="${x + 15 * s}" y="${y - 42 * s}" width="${13 * s}" height="${3 * s}" fill="${fill}"/>
  <path d="M${x + 18.5 * s} ${y - 37 * s}v${12 * s}M${x + 21.5 * s} ${y - 37 * s}v${12 * s}M${x + 24.5 * s} ${y - 37 * s}v${12 * s}" stroke="${slot}" stroke-width="${1.3 * s}"/>`;
}

/* ---------- the nine scenes ---------- */

const SCENES: Record<string, () => string> = {
  // Opening: a traveller and his camel on a ridge, the star just clear of the horizon.
  star: () => `${sky('lk0', [[0, '#070d24'], [0.5, '#16224a'], [0.74, '#4a3566'], [0.9, '#b0603f'], [1, '#e8a55a']], 230)}
    ${stars(7, 90, 170)}${suhail('ls0', 200, 150, 1.5)}
    <path d="M0 214 Q70 186 150 206 T300 196 T400 208 V300 H0Z" fill="#5a3a3c"/>
    <path d="M0 238 Q90 204 190 228 Q270 246 400 214 V300 H0Z" fill="#3a2530"/>
    <g fill="#140d18"><path d="M0 262 Q110 226 230 250 Q320 266 400 244 V300 H0Z"/>
      <g transform="translate(84 208) scale(1.2)"><ellipse cx="18" cy="14" rx="15" ry="6.5"/><path d="M7 11 q11 -15 22 0Z"/><path d="M29 14 q8 -5 9 -19 l4.5 0 q0 17 -8 25Z"/><ellipse cx="44" cy="-6.5" rx="5.5" ry="2.6"/><path d="M40 -8 l1 -3.5 l1.6 3Z"/><rect x="6" y="17" width="2.2" height="19"/><rect x="10.5" y="18" width="2.2" height="18"/><rect x="25" y="18" width="2.2" height="18"/><rect x="29.5" y="17" width="2.2" height="19"/><path d="M3.5 12 q-3 4 -2 10 l1 0 q0 -5 2.5 -8Z"/></g>
    </g>${person(160, 252, 1.2, '#140d18')}<path d="M156 240 Q146 236 138 204" stroke="#140d18" stroke-width="0.7" fill="none"/>`,

  // Age I: mountains, a falaj carrying water into palm gardens, mud-brick houses, first light.
  oasis: () => `${sky('lk1', [[0, '#1c2a55'], [0.4, '#6a5a86'], [0.66, '#e09a78'], [0.8, '#f6d08c'], [1, '#f6e2b0']], 190)}
    ${stars(11, 30, 70, 0.6)}${suhail('ls1', 306, 58, 0.9)}
    <path d="M0 168 L38 120 L66 142 L104 96 L140 138 L176 110 L214 150 L262 118 L300 146 L346 124 L400 158 V200 H0Z" fill="#8a6a78"/>
    <path d="M0 180 L60 150 L110 166 L170 140 L240 170 L310 150 L400 176 V210 H0Z" fill="#a8806c"/>
    <path d="M0 186 Q200 170 400 190 V300 H0Z" fill="#d9b06e"/>
    <path d="M0 214 Q120 196 250 208 T400 206 V300 H0Z" fill="#c4954f"/>
    <g fill="#5d7c3a" opacity="0.9"><path d="M30 232 l70 -10 l10 12 l-74 12Z"/><path d="M250 226 l80 -4 l8 14 l-84 6Z"/></g>
    <g stroke="#3f5a28" stroke-width="0.8" opacity="0.6"><path d="M44 230l68 -9M40 236l70 -9M262 228l72 -3M258 235l78 -4"/></g>
    <path d="M190 172 Q196 198 176 220 Q150 248 172 300 H214 Q186 252 204 224 Q218 200 200 172Z" fill="#7a5a3a"/>
    <path d="M193 174 Q198 198 181 220 Q157 248 181 300 H205 Q180 252 199 224 Q211 200 197 174Z" fill="#6fc3d6"/>
    <path d="M195 190 Q197 204 187 220 M184 240 Q180 262 190 290" stroke="#e8fbff" stroke-width="1.2" fill="none" opacity="0.8"/>
    ${house(232, 214, 30, 20, '#a8743c', '#2a1a10')}${house(258, 216, 22, 14, '#96652f')}${house(108, 218, 26, 17, '#a8743c', '#2a1a10')}
    ${palm(84, 232, 0.9, '#2f4a24', -4)}${palm(140, 226, 0.75, '#3a5a2a', 5)}${palm(300, 232, 1, '#2f4a24', 6)}${palm(336, 226, 0.7, '#3a5a2a', -3)}
    ${palm(40, 262, 1.5, '#1c2e18', 8)}${palm(366, 268, 1.6, '#1c2e18', -10)}
    ${person(222, 236, 0.8, '#3a2416')}<path d="M226 222 l8 14" stroke="#3a2416" stroke-width="1.2"/>`,

  // Age II: a town at dusk with the mosque at its heart. Buildings only, no figures (GDD section 10).
  faith: () => `${sky('lk2', [[0, '#0d1b3e'], [0.45, '#274a78'], [0.72, '#7f6f9a'], [0.9, '#e0986a'], [1, '#f2c27a']], 220)}
    ${stars(23, 70, 130)}${suhail('ls2', 92, 96, 1.05)}
    <path d="M0 214 Q200 196 400 214 V300 H0Z" fill="#4a3550"/>
    <g fill="#1f1830">${house(20, 228, 44, 26, '#1f1830', '#f4b860')}${house(70, 230, 36, 20, '#1f1830', '#f4b860')}${house(296, 230, 40, 24, '#1f1830', '#f4b860')}${house(342, 228, 46, 30, '#1f1830', '#f4b860')}
      <rect x="128" y="176" width="130" height="56"/><path d="M158 176 a35 35 0 0 1 70 0Z"/><path d="M193 141 v-12" stroke="#1f1830" stroke-width="1.6"/>
      <rect x="268" y="112" width="14" height="120"/><rect x="264" y="146" width="22" height="4"/><rect x="264" y="118" width="22" height="4"/><path d="M268 112 l7 -22 l7 22Z"/>
    </g>
    <path d="M190.500 128 a4 4 0 1 0 5 0 a3.200 3.200 0 1 1 -5 0Z" fill="#f4d58a"/>
    <g fill="#f4b860"><path d="M140 232 v-26 a8 8 0 0 1 16 0 v26Z"/><path d="M164 232 v-26 a8 8 0 0 1 16 0 v26Z"/><path d="M206 232 v-26 a8 8 0 0 1 16 0 v26Z"/><path d="M230 232 v-26 a8 8 0 0 1 16 0 v26Z"/><path d="M185 232 v-32 a8 9 0 0 1 16 0 v32Z" fill="#ffd98a"/><rect x="272" y="126" width="6" height="10" rx="3"/></g>
    <path d="M0 232 H400 V300 H0Z" fill="#17122a"/>
    <path d="M150 232 L120 300 H270 L236 232Z" fill="#e0986a" opacity="0.16"/>
    ${palm(112, 234, 0.9, '#120e22', -5)}${palm(292, 236, 0.8, '#120e22', 6)}`,

  // Age III: a library. Shelves, a reading desk, an astrolabe, and the star through the arch.
  wisdom: () => {
    const r = rand(5);
    const cols = ['#8a2f2a', '#2f5a6a', '#b0862f', '#4a3a6a', '#6a7a3a', '#a85a2a'];
    let books = '';
    for (const sx of [14, 322]) for (let row = 0; row < 4; row++) {
      let x = sx;
      while (x < sx + 58) {
        const w = 4 + r() * 5;
        const h = 22 + r() * 9;
        books += `<rect x="${x.toFixed(1)}" y="${(78 + row * 42 + 34 - h).toFixed(1)}" width="${(w - 0.8).toFixed(1)}" height="${h.toFixed(1)}" fill="${cols[Math.floor(r() * cols.length)]}"/>`;
        x += w;
      }
      books += `<rect x="${sx - 4}" y="${78 + row * 42 + 34}" width="72" height="4" fill="#5a3a20"/>`;
    }
    return `<rect width="400" height="300" fill="#2a1c18"/>
    <defs><clipPath id="lc3"><path d="M110 250 V120 Q110 40 200 22 Q290 40 290 120 V250Z"/></clipPath><radialGradient id="lg3" cx="0.5" cy="0.3" r="0.8"><stop offset="0" stop-color="#f6c66a" stop-opacity="0.55"/><stop offset="1" stop-color="#f6c66a" stop-opacity="0"/></radialGradient></defs>
    <g clip-path="url(#lc3)">${sky('lk3', [[0, '#081030'], [0.6, '#1f2f66'], [1, '#5a4a7a']], 250)}${stars(31, 70, 230)}${suhail('ls3', 200, 108, 1.25)}
      <path d="M110 232 Q160 214 200 226 T290 220 V250 H110Z" fill="#1a1630"/><path d="M168 226 a16 16 0 0 1 32 0Z M204 228 h30 v-20 l-6 -12 l-6 12 v-4 h-18Z" fill="#1a1630"/></g>
    <path d="M110 250 V120 Q110 40 200 22 Q290 40 290 120 V250" fill="none" stroke="#c9a25a" stroke-width="5"/>
    <path d="M102 250 V118 Q102 30 200 12 Q298 30 298 118 V250" fill="none" stroke="#7a4a2a" stroke-width="9"/>
    <g fill="#c9a25a" opacity="0.85">${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => `<path d="M${6 + i * 40} 58 l14 -8 l14 8 l-14 8Z"/>`).join('')}</g>
    <rect x="0" y="46" width="400" height="3" fill="#7a4a2a"/><rect x="0" y="67" width="400" height="3" fill="#7a4a2a"/>
    <rect x="0" y="72" width="100" height="180" fill="#3a2418"/><rect x="300" y="72" width="100" height="180" fill="#3a2418"/>${books}
    <rect x="0" y="250" width="400" height="50" fill="#4a2f20"/><path d="M0 250 H400" stroke="#c9a25a" stroke-width="2"/>
    <path d="M200 0 V40" stroke="#c9a25a" stroke-width="1.5"/><path d="M190 40 h20 l5 16 q-15 10 -30 0Z" fill="#f6c66a"/><circle cx="200" cy="52" r="70" fill="url(#lg3)"/>
    <path d="M130 262 h140 l10 38 H120Z" fill="#6a4426"/><path d="M168 262 q16 -10 32 -2 q16 -8 32 2 v6 q-16 -8 -32 0 q-16 -8 -32 0Z" fill="#f2e3bf"/><path d="M200 260 v8" stroke="#a8875a"/>
    <g stroke="#3a2a1a" stroke-width="0.5" opacity="0.6"><path d="M174 261 q10 -5 22 -1M174 264 q10 -5 22 -1M204 260 q12 -4 22 1M204 263 q12 -4 22 1"/></g>
    <g fill="none" stroke="#e2b85c" stroke-width="2"><circle cx="252" cy="250" r="13"/><circle cx="252" cy="250" r="7" stroke-width="1"/><path d="M239 250 h26 M252 237 v26 M243 241 l18 18" stroke-width="1"/><circle cx="252" cy="234" r="2.5"/></g>
    <g fill="#1a110e"><path d="M70 300 q-4 -40 14 -46 q-8 -6 -2 -14 q8 -6 14 2 q4 8 -4 12 q22 8 20 46Z"/><path d="M318 300 q-2 -36 14 -44 q-6 -8 2 -14 q10 -4 13 5 q2 7 -5 10 q18 8 16 43Z"/></g>`;
  },

  // Age IV: dhows running before the monsoon, the star and its road of light on the water.
  sails: () => `${sky('lk4', [[0, '#0a1838'], [0.5, '#1d3d6e'], [0.8, '#3f7a96'], [1, '#9ad0c8']], 170)}
    ${stars(41, 80, 130)}${suhail('ls4', 286, 70, 1.3)}
    <defs><linearGradient id="lw4" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2c6f8a"/><stop offset="0.4" stop-color="#17486a"/><stop offset="1" stop-color="#0a2340"/></linearGradient></defs>
    <rect y="166" width="400" height="134" fill="url(#lw4)"/>
    <g fill="#fff3c8" opacity="0.5"><rect x="270" y="170" width="32" height="2" rx="1"/><rect x="262" y="178" width="46" height="2" rx="1"/><rect x="274" y="187" width="26" height="2" rx="1"/><rect x="256" y="198" width="56" height="2.5" rx="1"/><rect x="268" y="212" width="36" height="2.5" rx="1"/><rect x="250" y="230" width="64" height="3" rx="1.5"/></g>
    ${dhow(330, 172, 0.42, '#0d1c30', '#c9d6de', -1)}${dhow(60, 176, 0.55, '#0d1c30', '#d9dfdc')}
    <g stroke="#7fb8c8" stroke-width="1" fill="none" opacity="0.45"><path d="M0 196 q20 -5 40 0 t40 0 t40 0"/><path d="M220 204 q20 -5 40 0 t40 0 t40 0 t40 0"/><path d="M40 268 q24 -6 48 0 t48 0"/><path d="M250 276 q24 -6 48 0 t48 0 t48 0"/></g>
    ${dhow(176, 236, 1.75, '#1a0f0a', '#f2e3bf')}
    <path d="M124 196 Q172 180 214 122" stroke="#b89a66" stroke-width="1" fill="none" opacity="0.7"/><path d="M150 202 Q186 186 216 150" stroke="#b89a66" stroke-width="1" fill="none" opacity="0.5"/>
    <path d="M186 135 l22 -6 l-3 7Z" fill="#b0302a"/>
    ${person(150, 232, 0.8, '#1a0f0a')}${person(206, 232, 0.75, '#1a0f0a')}
    <path d="M96 240 q40 14 80 8 q50 -6 84 -24 l8 8 q-40 26 -100 30 q-50 2 -76 -16Z" fill="#e8fbff" opacity="0.28"/>`,

  // Age V: above, the boat and the hauler; below, the diver on his rope and a pearl in the shell.
  pearls: () => `${sky('lk5', [[0, '#16224a'], [0.5, '#6a5a86'], [0.8, '#e8a070'], [1, '#f6d08c']], 100)}
    ${stars(53, 30, 50, 0.7)}${suhail('ls5', 318, 46, 1)}
    <defs><linearGradient id="lw5" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#39a6b0"/><stop offset="0.35" stop-color="#1a7088"/><stop offset="1" stop-color="#072c44"/></linearGradient></defs>
    <rect y="98" width="400" height="202" fill="url(#lw5)"/>
    <g fill="#e8fbff" opacity="0.1"><path d="M90 98 L40 300 H110 L130 98Z"/><path d="M190 98 L180 300 H250 L226 98Z"/><path d="M300 98 L330 300 H390 L332 98Z"/></g>
    <path d="M0 98 q25 -5 50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 v4 H0Z" fill="#e8fbff" opacity="0.55"/>
    <path d="M70 88 Q110 112 190 110 Q232 108 258 82 L236 92 H96Z" fill="#2a180e"/><path d="M150 92 L158 20" stroke="#2a180e" stroke-width="2.2"/><path d="M110 78 Q150 66 196 28 Q190 60 194 84Z" fill="#f2e3bf" opacity="0.95"/>
    ${person(214, 92, 0.85, '#2a180e')}${person(120, 92, 0.8, '#2a180e')}
    <path d="M222 80 L226 100 Q232 180 222 236" stroke="#e8d7a8" stroke-width="1.2" fill="none"/>
    <g fill="#0c2030"><circle cx="214" cy="226" r="5"/><path d="M210 230 q-14 8 -30 2 l-1 -4 q16 4 28 -4Z"/><path d="M216 231 q4 14 -4 26 q-4 8 -14 12 l-2 -3 q10 -8 10 -18 q-2 -8 4 -17Z"/><path d="M212 236 q-10 16 -24 20 l-1 -3 q12 -8 18 -20Z"/><path d="M218 228 q10 -4 14 -14 l3 1 q-4 14 -15 18Z"/></g>
    <path d="M176 232 l-10 4 l-2 14 h14 l2 -14Z" fill="none" stroke="#e8d7a8" stroke-width="1"/>
    <g fill="#e8fbff" opacity="0.6"><circle cx="220" cy="210" r="1.6"/><circle cx="224" cy="196" r="2.2"/><circle cx="219" cy="180" r="1.4"/><circle cx="226" cy="162" r="2.6"/><circle cx="221" cy="140" r="1.8"/></g>
    <path d="M0 276 Q60 258 130 272 T260 268 T400 274 V300 H0Z" fill="#c9a86a"/><path d="M0 288 Q100 274 200 286 T400 284 V300 H0Z" fill="#a8864a"/>
    <g fill="#6a5a4a"><ellipse cx="60" cy="276" rx="12" ry="5"/><ellipse cx="330" cy="278" rx="13" ry="5"/><ellipse cx="256" cy="274" rx="9" ry="4"/></g>
    <defs><radialGradient id="lp5"><stop offset="0" stop-color="#fff"/><stop offset="0.3" stop-color="#fdf3dc" stop-opacity="0.8"/><stop offset="1" stop-color="#fdf3dc" stop-opacity="0"/></radialGradient></defs>
    <path d="M118 278 q20 -22 44 0Z" fill="#8a7a66"/><path d="M116 279 q22 13 48 0 q-24 5 -48 0Z" fill="#5a4a3a"/><path d="M120 277 q20 -15 40 0 q-20 5 -40 0Z" fill="#f2d9d0"/>
    <circle cx="140" cy="273" r="18" fill="url(#lp5)" class="suhail" style="transform-origin:140px 273px"/><circle cx="140" cy="274" r="4" fill="#fff"/>
    <g stroke="#2f6a4a" stroke-width="2.4" fill="none" stroke-linecap="round"><path d="M24 290 q-6 -20 4 -36"/><path d="M34 292 q6 -16 -2 -30"/><path d="M372 290 q8 -22 -2 -40"/><path d="M362 292 q-8 -14 0 -28"/></g>`,

  // Age VI: an old pearling boat left on the beach, and a rig burning its first flare out at sea.
  oil: () => `${sky('lk6', [[0, '#2a2450'], [0.35, '#7a4a6a'], [0.62, '#d9744a'], [0.82, '#f6b04a'], [1, '#fbe08a']], 190)}
    ${stars(61, 26, 60, 0.5)}${suhail('ls6', 76, 44, 0.9)}
    <defs><radialGradient id="lf6"><stop offset="0" stop-color="#fff6c8"/><stop offset="0.3" stop-color="#ffb347" stop-opacity="0.8"/><stop offset="1" stop-color="#ff7a2a" stop-opacity="0"/></radialGradient>
    <linearGradient id="lw6" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e89a4a"/><stop offset="0.3" stop-color="#8a5a5a"/><stop offset="1" stop-color="#2a2a4a"/></linearGradient></defs>
    <circle cx="250" cy="186" r="26" fill="#fff3c8" opacity="0.9"/>
    <rect y="186" width="400" height="60" fill="url(#lw6)"/>
    <g fill="#fbe08a" opacity="0.5"><rect x="232" y="192" width="36" height="2" rx="1"/><rect x="226" y="201" width="48" height="2" rx="1"/><rect x="236" y="212" width="28" height="2.5" rx="1"/></g>
    <g fill="#1c1420"><path d="M330 186 h60 l-4 -7 h-8 v-7 h-10 v7 h-34Z"/></g>
    <g stroke="#1c1420" fill="none" stroke-width="1.6"><path d="M150 206 V170 M190 206 V170 M150 178 H190 M150 178 L190 206 M190 178 L150 206"/>
      <path d="M160 170 L168 96 L176 170 M162 150 H174 M164 130 H172 M161 160 L175 140 M175 160 L163 132 M163 132 L171 114 M173 132 L165 114"/><path d="M190 172 L224 150"/></g>
    <rect x="144" y="166" width="52" height="6" fill="#1c1420"/>
    <circle cx="226" cy="140" r="30" fill="url(#lf6)" class="suhail" style="transform-origin:226px 140px"/><path d="M224 150 q-6 -10 2 -18 q0 6 5 8 q4 6 -3 11Z" fill="#fff6c8"/>
    <path d="M0 238 Q120 220 240 240 T400 232 V300 H0Z" fill="#b8864a"/><path d="M0 262 Q150 240 400 258 V300 H0Z" fill="#8a5f34"/>
    <g fill="#2a1a12"><path d="M30 262 Q60 286 130 282 Q168 280 190 250 L170 262 H52Z"/><path d="M96 264 L120 198" stroke="#2a1a12" stroke-width="2.4"/></g>
    <g stroke="#2a1a12" stroke-width="2" fill="none"><path d="M64 264 v14 M82 264 v17 M104 264 v18 M128 264 v16 M150 263 v12"/></g>
    <path d="M120 198 q-18 30 -40 44" stroke="#5a4030" stroke-width="0.8" fill="none"/>
    ${person(300, 262, 1.05, '#2a1a12')}${person(316, 264, 0.7, '#2a1a12')}`,

  // Age VII: 2 December 1971. One flag over a town of wind towers, and people gathered under it.
  union: () => `${sky('lk7', [[0, '#27407a'], [0.4, '#6f8fc0'], [0.7, '#f2c9a0'], [1, '#fbe6b8']], 220)}
    ${stars(71, 16, 50, 0.5)}${suhail('ls7', 320, 52, 1.05, '#fff3c8')}
    <path d="M0 196 Q200 182 400 198 V230 H0Z" fill="#7fb0c8"/><path d="M0 214 Q200 204 400 216 V300 H0Z" fill="#e0c28a"/>
    ${dhow(54, 200, 0.4, '#5a4a4a', '#f2e3bf')}${dhow(356, 202, 0.36, '#5a4a4a', '#f2e3bf', -1)}
    ${windTower(18, 236, 1, '#c9a070', '#5a3a20')}${windTower(62, 238, 0.8, '#b88f60', '#5a3a20')}${windTower(296, 238, 0.85, '#b88f60', '#5a3a20')}${windTower(338, 236, 1.1, '#c9a070', '#5a3a20')}
    ${palm(112, 240, 0.9, '#3a5a2a', -4)}${palm(284, 240, 0.8, '#3a5a2a', 5)}
    <path d="M0 238 Q200 228 400 240 V300 H0Z" fill="#c9a268"/>
    <rect x="198" y="48" width="3.4" height="200" fill="#4a3a2a"/><circle cx="199.7" cy="46" r="3" fill="#e2b85c"/>
    <g class="flag"><rect x="202" y="54" width="24" height="54" fill="#d0202e"/><path d="M226 54 q28 -6 56 0 t30 0 v18 q-15 5 -30 0 t-56 0Z" fill="#0a7a3c"/><path d="M226 72 q28 -6 56 0 t30 0 v18 q-15 5 -30 0 t-56 0Z" fill="#fff"/><path d="M226 90 q28 -6 56 0 t30 0 v18 q-15 5 -30 0 t-56 0Z" fill="#111"/></g>
    ${[130, 146, 160, 174, 222, 236, 250, 266].map((x, i) => person(x, 262 + (i % 3) * 3, 0.95 + (i % 2) * 0.12, '#2a1c18')).join('')}
    ${[100, 116, 290, 304, 322].map((x, i) => person(x, 272 + (i % 2) * 4, 1.2, '#1c120e')).join('')}
    <path d="M0 286 Q200 274 400 288 V300 H0Z" fill="#a8824a"/>`,

  // Closing: the player's own shore. One well, a few palm-frond huts, a boat on the sand, the star.
  town: () => `${sky('lk8', [[0, '#101c44'], [0.4, '#3f4f8a'], [0.68, '#c98a8a'], [0.86, '#f6c98a'], [1, '#fbe6b8']], 170)}
    ${stars(83, 50, 90, 0.8)}${suhail('ls8', 200, 78, 1.5)}
    <defs><linearGradient id="lw8" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6c98a"/><stop offset="0.25" stop-color="#6fb0b8"/><stop offset="1" stop-color="#2a6a86"/></linearGradient></defs>
    <rect y="166" width="400" height="60" fill="url(#lw8)"/>
    <g fill="#fff3c8" opacity="0.55"><rect x="184" y="170" width="32" height="2" rx="1"/><rect x="176" y="179" width="48" height="2" rx="1"/><rect x="188" y="189" width="24" height="2.5" rx="1"/><rect x="170" y="201" width="60" height="2.5" rx="1"/></g>
    <path d="M0 216 Q60 200 130 212 Q200 226 270 212 Q340 200 400 214 V300 H0Z" fill="#e6c88a"/>
    <path d="M0 240 Q120 222 240 240 T400 236 V300 H0Z" fill="#d2ad68"/>
    <path d="M130 213 Q200 228 270 213" stroke="#fff" stroke-width="2" fill="none" opacity="0.6"/>
    ${dhow(250, 226, 0.6, '#3a2416', '#f2e3bf')}
    <g fill="#8a6a3a"><path d="M70 250 l22 -22 l22 22Z"/><path d="M116 254 l18 -18 l18 18Z"/></g><g fill="#3a2416"><path d="M88 250 v-10 h8 v10Z"/><path d="M130 254 v-8 h7 v8Z"/></g>
    <g stroke="#6a4a26" stroke-width="0.8" opacity="0.7"><path d="M80 240 l12 -12 M86 246 l10 -14 M100 244 l-6 -14 M124 248 l10 -10 M142 248 l-8 -10"/></g>
    <ellipse cx="200" cy="262" rx="15" ry="6" fill="#8a7256"/><ellipse cx="200" cy="260" rx="11" ry="4" fill="#2a5a70"/><path d="M186 262 v-22 M214 262 v-22 M184 240 h32" stroke="#4a3220" stroke-width="2" fill="none"/><path d="M200 240 v12" stroke="#4a3220" stroke-width="0.8"/>
    ${palm(40, 256, 1.2, '#2a4020', 8)}${palm(330, 250, 1, '#2f4a24', -6)}${palm(364, 262, 1.4, '#1c2e18', -10)}
    ${person(226, 266, 1.1, '#2a1a12')}${person(160, 262, 0.9, '#2a1a12')}
    <path d="M0 280 Q200 266 400 282 V300 H0Z" fill="#b8905a"/>`,
};

/** One illustration, with a light paper grain so flat colour reads as paint. */
function illustration(scene: string): string {
  const draw = SCENES[scene] ?? SCENES.star!;
  return `<svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" role="img" aria-hidden="true">
    <defs><filter id="lgrain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="4"/><feColorMatrix values="0 0 0 0 0.35  0 0 0 0 0.25  0 0 0 0 0.15  0 0 0 0.5 -0.12"/></filter>
    <radialGradient id="lvig" cx="0.5" cy="0.5" r="0.75"><stop offset="0.6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#1a0e06" stop-opacity="0.5"/></radialGradient></defs>
    ${draw()}<rect width="400" height="300" filter="url(#lgrain)" opacity="0.55"/><rect width="400" height="300" fill="url(#lvig)"/></svg>`;
}

/* ---------- the book ---------- */

const esc = (s: string): string => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

/**
 * Open the book over everything else. `onClose` runs once, when the reader finishes or skips.
 * Arrow keys, the two buttons, the dots and a sideways swipe all turn the page.
 */
export function openLore(onClose?: () => void, startAt = 0): void {
  document.getElementById('lore')?.remove();
  const el = document.createElement('div');
  el.id = 'lore';
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-label', book.title.en);
  (document.getElementById('app') ?? document.body).appendChild(el);
  let at = Math.max(0, Math.min(PAGES.length - 1, startAt));

  const close = (): void => {
    window.removeEventListener('keydown', onKey);
    el.classList.add('out');
    window.setTimeout(() => el.remove(), 450);
    onClose?.();
  };
  const go = (to: number): void => {
    if (to < 0) return;
    if (to >= PAGES.length) return close();
    const dir = to > at ? 'fwd' : 'back';
    at = to;
    render(dir);
  };
  const onKey = (e: KeyboardEvent): void => {
    if (e.key === 'ArrowRight' || e.key === ' ') go(at + 1);
    else if (e.key === 'ArrowLeft') go(at - 1);
    else if (e.key === 'Escape') close();
  };
  window.addEventListener('keydown', onKey);

  let downX = 0;
  el.addEventListener('pointerdown', (e) => (downX = e.clientX));
  el.addEventListener('pointerup', (e) => {
    const dx = e.clientX - downX;
    if (Math.abs(dx) > 60) go(at + (dx < 0 ? 1 : -1));
  });

  function render(dir: 'fwd' | 'back' | 'first'): void {
    const p = PAGES[at]!;
    const last = at === PAGES.length - 1;
    const src = p.sources.map((k) => `<li><b>${k}</b> ${esc(SOURCES[k] ?? '')}</li>`).join('');
    // dir="ltr" on the book itself: it is an English book with Arabic subtitles in either interface language.
    el.innerHTML = `<div class="lore-book ${dir}" dir="ltr">
      <header><span class="lore-name">${esc(book.title.en)} · <span lang="ar" dir="rtl">${book.title.ar}</span></span>
        <button type="button" class="lore-skip" id="lore-skip">${last ? '✕' : `${t('ui.lore_skip')} ✕`}</button></header>
      <div class="lore-spread">
        <figure class="lore-art">${illustration(p.scene)}<span class="corner tl"></span><span class="corner tr"></span><span class="corner bl"></span><span class="corner br"></span></figure>
        <article class="lore-text">
          <p class="kicker">${esc(p.kicker.en)}</p>
          <h2>${esc(p.title.en)}</h2>
          <p class="ar-title" lang="ar" dir="rtl">${p.title.ar}</p>
          <p class="body">${esc(p.body)}</p>
          <p class="ar-sub" lang="ar" dir="rtl">${p.subtitle}</p>
          <div class="lore-game">${rawiAvatar()}<p>${esc(p.game)}</p></div>
          <details class="lore-src"><summary>${t('ui.lore_draft')}</summary><ul>${src}</ul></details>
        </article>
      </div>
      <footer><button type="button" class="btn lore-nav" id="lore-back" ${at === 0 ? 'disabled' : ''}>‹ ${t('ui.lore_back')}</button>
        <div class="lore-dots">${PAGES.map((_, i) => `<button type="button" class="${i === at ? 'on' : ''}" data-i="${i}" aria-label="${i + 1}"></button>`).join('')}</div>
        <button type="button" class="btn primary lore-nav" id="lore-next">${last ? t('ui.lore_begin') : `${t('ui.lore_next')} ›`}</button></footer>
    </div>`;
    el.querySelector('#lore-skip')!.addEventListener('click', close);
    el.querySelector('#lore-back')!.addEventListener('click', () => go(at - 1));
    el.querySelector('#lore-next')!.addEventListener('click', () => go(at + 1));
    el.querySelectorAll<HTMLButtonElement>('.lore-dots button').forEach((b) => b.addEventListener('click', () => go(Number(b.dataset.i))));
  }
  render('first');
}

export const LORE_PAGES = PAGES.length;
