/**
 * Painted-style medallion icons, drawn as SVG (interface v3, 11 Nov 2026). They replace emoji for
 * resources and the main actions. Any resource emoji that still reaches the page in a text (the
 * strings use them) is swapped for its medallion by installIconSwap().
 */
type IconName = 'coin' | 'water' | 'food' | 'knowledge' | 'reputation' | 'build' | 'routes' | 'collect' | 'book' | 'tasks' | 'menu' | 'target';

const DISC: Record<IconName, [string, string]> = {
  coin: ['#ffe9a6', '#c98a1e'], water: ['#bfeaf5', '#1f7fa8'], food: ['#d7e59a', '#5f8a2e'], knowledge: ['#d8cdf2', '#5b4a9c'],
  reputation: ['#ffc9b0', '#b3402a'], build: ['#f0c98a', '#8a5a2b'], routes: ['#aee3df', '#1f7a83'], collect: ['#f3d9a0', '#a8702a'],
  book: ['#c9d6f2', '#3a4f8f'], tasks: ['#ffe08a', '#c2781a'], menu: ['#6b5238', '#2b2118'], target: ['#6b5238', '#2b2118'],
};

const GLYPH: Record<IconName, string> = {
  coin: '<circle cx="16" cy="16" r="7.2" fill="none" stroke="#7a4f0c" stroke-width="1.3" opacity=".7"/><path d="M16 10.2l1.7 3.6 3.9.5-2.9 2.7.8 3.9-3.5-1.9-3.5 1.9.8-3.9-2.9-2.7 3.9-.5z" fill="#7a4f0c"/>',
  water: '<path d="M16 7.5c3.6 4.6 5.6 7.6 5.6 10.4a5.6 5.6 0 01-11.2 0c0-2.8 2-5.8 5.6-10.4z" fill="#fff"/><path d="M13 18.4a3 3 0 002.6 3" stroke="#1f7fa8" stroke-width="1.3" fill="none" stroke-linecap="round"/>',
  food: '<path d="M16 8v6" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/><ellipse cx="12.4" cy="17" rx="2.7" ry="3.8" fill="#7a3d14"/><ellipse cx="19.6" cy="17" rx="2.7" ry="3.8" fill="#7a3d14"/><ellipse cx="16" cy="19.6" rx="2.8" ry="4" fill="#9a5220"/><ellipse cx="15.1" cy="18.2" rx=".8" ry="1.4" fill="#fff" opacity=".45"/>',
  knowledge: '<rect x="10" y="9.5" width="12" height="13" rx="1.5" fill="#fff"/><path d="M12.5 13h7M12.5 16h7M12.5 19h4.5" stroke="#5b4a9c" stroke-width="1.3" stroke-linecap="round"/><circle cx="10" cy="9.5" r="1.8" fill="#fff"/><circle cx="22" cy="22.5" r="1.8" fill="#fff"/>',
  reputation: '<path d="M16 8l2.4 5.1 5.6.7-4.1 3.8 1.1 5.5-5-2.8-5 2.8 1.1-5.5-4.1-3.8 5.6-.7z" fill="#fff"/>',
  build: '<path d="M10 22l8.5-8.5" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/><path d="M15.5 9.5l7 7-2.2 2.2-7-7c.4-1.2 1.2-2 2.2-2.2z" fill="#fff"/>',
  routes: '<path d="M8.5 20.5h15l-2.2 3.2H10.7z" fill="#fff"/><path d="M15.2 8v11" stroke="#fff" stroke-width="1.4"/><path d="M16.4 8.6c4 2 6 5.4 6.2 9.8h-6.2z" fill="#fff"/><path d="M14 11c-2 1.6-3.4 4-3.6 7.4H14z" fill="#fff" opacity=".8"/>',
  collect: '<path d="M9 15h14l-1.6 8.2H10.6z" fill="#fff"/><path d="M11 15c0-4 2-6.5 5-6.5s5 2.5 5 6.5" stroke="#fff" stroke-width="1.6" fill="none"/><path d="M12 18.5h8M12.6 21h6.8" stroke="#a8702a" stroke-width="1"/>',
  book: '<path d="M8.5 10.5c2.8-.9 5.3-.6 7.5 1v11c-2.2-1.6-4.7-1.9-7.5-1z" fill="#fff"/><path d="M23.5 10.5c-2.8-.9-5.3-.6-7.5 1v11c2.2-1.6 4.7-1.9 7.5-1z" fill="#fff" opacity=".85"/>',
  tasks: '<path d="M11 9h10v5.5a5 5 0 01-10 0z" fill="#fff"/><path d="M11 10.5H8.2c0 2.6 1 4 2.9 4.3M21 10.5h2.8c0 2.6-1 4-2.9 4.3" stroke="#fff" stroke-width="1.3" fill="none"/><path d="M14.5 19.5h3v2.4h2v1.6h-7v-1.6h2z" fill="#fff"/>',
  menu: '<path d="M10 11.5h12M10 16h12M10 20.5h12" stroke="#ffe9a6" stroke-width="2" stroke-linecap="round"/>',
  target: '<circle cx="16" cy="16" r="6" fill="none" stroke="#ffe9a6" stroke-width="1.8"/><circle cx="16" cy="16" r="1.8" fill="#ffe9a6"/><path d="M16 7v3M16 22v3M7 16h3M22 16h3" stroke="#ffe9a6" stroke-width="1.8" stroke-linecap="round"/>',
};

/** An icon as inline SVG. */
export function icon(name: IconName, cls = 'ico'): string {
  const [a, b] = DISC[name];
  return `<svg class="${cls}" viewBox="0 0 32 32" aria-hidden="true"><defs><radialGradient id="g-${name}" cx="35%" cy="28%" r="80%"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></radialGradient></defs><circle cx="16" cy="16" r="15" fill="#f6dc9a"/><circle cx="16" cy="16" r="13.6" fill="url(#g-${name})" stroke="#7a5416" stroke-width=".8"/><ellipse cx="12.5" cy="9.5" rx="6" ry="3" fill="#fff" opacity=".28"/>${GLYPH[name]}</svg>`;
}

const SWAP: Record<string, IconName> = { '🪙': 'coin', '💧': 'water', '🍞': 'food', '📜': 'knowledge', '⭐': 'reputation' };
const SWAP_RE = /🪙|💧|🍞|📜|⭐/u;

function swapIn(root: Node): void {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const hits: Text[] = [];
  for (let n = walker.nextNode(); n; n = walker.nextNode()) if (SWAP_RE.test(n.nodeValue ?? '')) hits.push(n as Text);
  for (const node of hits) {
    const html = (node.nodeValue ?? '')
      .replace(/[&<>]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[ch] ?? ch)
      .replace(/🪙|💧|🍞|📜|⭐/gu, (m) => icon(SWAP[m]!, 'ico inline'));
    node.replaceWith(document.createRange().createContextualFragment(html));
  }
}

/** Swap resource emoji for medallions wherever they appear in the interface. */
export function installIconSwap(root: HTMLElement): void {
  swapIn(root);
  new MutationObserver((list) => {
    for (const m of list) {
      if (m.type === 'characterData') swapIn(m.target.parentNode ?? m.target);
      m.addedNodes.forEach((n) => swapIn(n));
    }
  }).observe(root, { childList: true, subtree: true, characterData: true });
}
