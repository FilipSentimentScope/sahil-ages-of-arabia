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

/** The Rawi, the storyteller who advises the player: a drawn portrait (a fictional character). */
export function rawiAvatar(): string {
  return `<svg class="rawi-svg" viewBox="0 0 96 96" aria-hidden="true"><defs><radialGradient id="rw-bg" cx="50%" cy="32%" r="75%"><stop offset="0" stop-color="#3a5aa6"/><stop offset="1" stop-color="#14213d"/></radialGradient><clipPath id="rw-c"><circle cx="48" cy="48" r="44"/></clipPath></defs>
<circle cx="48" cy="48" r="47.5" fill="#c9962e"/><circle cx="48" cy="48" r="45.5" fill="#f6dc9a"/><circle cx="48" cy="48" r="44" fill="url(#rw-bg)"/>
<g clip-path="url(#rw-c)">
<path d="M6 100c2-22 18-31 42-31s40 9 42 31z" fill="#6b4a2b"/><path d="M39 68h18l-2 30H41z" fill="#f4efe2"/>
<path d="M33 71l7-2 2 29h-5zM63 71l-7-2-2 29h5z" fill="#d9a441"/>
<path d="M21 46c0-21 11-32 27-32s27 11 27 32c0 11 2 22 7 31H14c5-9 7-20 7-31z" fill="#f3eee2"/>
<path d="M21 46c0 11-2 22-7 31h12c2-9 2-20 1-30z" fill="#dcd5c4"/>
<ellipse cx="48" cy="47" rx="15.5" ry="18.5" fill="#c6946a"/><ellipse cx="38.5" cy="52" rx="3" ry="2" fill="#d98f6f" opacity=".45"/><ellipse cx="57.5" cy="52" rx="3" ry="2" fill="#d98f6f" opacity=".45"/>
<path d="M30 42c1-13 8-21 18-21s17 8 18 21c-5-7-11-9-18-9s-13 2-18 9z" fill="#fbf8f0"/>
<path d="M29.5 34.5c5-8 11-11.500 18.500-11.500s13.500 3.500 18.500 11.500" stroke="#1c1c1c" stroke-width="4.200" fill="none" stroke-linecap="round"/>
<path d="M30.500 37c5-6.500 11-9.500 17.500-9.500s12.500 3 17.500 9.500" stroke="#1c1c1c" stroke-width="2" fill="none" stroke-linecap="round" opacity=".7"/>
<path d="M37 43.500q4.500-3 9-1M50 42.500q4.500-2 9 1" stroke="#f3efe6" stroke-width="2.400" fill="none" stroke-linecap="round"/>
<ellipse cx="42" cy="47.500" rx="1.900" ry="1.600" fill="#2b1c0e"/><ellipse cx="54" cy="47.500" rx="1.900" ry="1.600" fill="#2b1c0e"/><circle cx="42.600" cy="47" r=".5" fill="#fff"/><circle cx="54.600" cy="47" r=".5" fill="#fff"/>
<path d="M38 50.500q4 1.500 7.500 0M50.500 50.500q3.500 1.500 7.500 0" stroke="#a97850" stroke-width=".8" fill="none"/>
<path d="M48 47v6.500q-2 2-3.500 1" stroke="#a37248" stroke-width="1.500" fill="none" stroke-linecap="round"/>
<path d="M32.500 51c1 17 7.500 26 15.500 26s14.500-9 15.500-26c-3 5.500-7 7.500-10.500 6.500-2-2-8-2-10 0-3.500 1-7.500-1-10.500-6.500z" fill="#f4f1ea"/>
<path d="M40 70q8 6 16 0M38 64q10 7 20 0" stroke="#d8d2c4" stroke-width="1" fill="none"/>
<path d="M42.500 60.500q5.500 3.500 11 0" stroke="#a8684e" stroke-width="1.600" fill="none" stroke-linecap="round"/>
<path d="M39 57.500q4.500-3.500 9-1 4.500-2.500 9 1-4.500 1.500-9 .2-4.500 1.300-9-.2z" fill="#fdfbf6"/>
</g></svg>`;
}
