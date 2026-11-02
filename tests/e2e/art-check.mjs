/**
 * Art check (QA/Creative): places one of each building on valid plots of the Pearl Coast map,
 * reloads from the save and takes phone-size screenshots, so new art can be judged on the board.
 * Test-only: it edits the saved town directly; it is not a gameplay path.
 *
 * Usage: npm run build && node tests/e2e/art-check.mjs
 */
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium, devices } = require('playwright');
const PORT = 4174;
const URL = `http://localhost:${PORT}/`;
const OUT = 'tests/e2e/screenshots';
mkdirSync(OUT, { recursive: true });

// Plots inside the open 6 by 6 block of the 12 by 12 hex map (columns 3 to 8, rows 4 to 9).
const LAYOUT = [
  ['barasti_house', 3, 4], ['well', 6, 4], ['storehouse', 8, 4],
  ['barasti_house', 4, 5], ['date_grove', 6, 5], ['date_grove', 7, 5],
  ['watchtower', 3, 6], ['souq', 5, 6], ['scribe_house', 8, 6],
  ['majlis', 4, 7], ['treasury', 7, 7],
  ['pearl_merchant', 5, 8], ['well', 7, 8],
  ['jetty', 4, 9], ['fish_trap', 5, 9], ['fish_trap', 8, 9],
];

const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { stdio: 'ignore' });
for (let i = 0; i < 50; i++) {
  try { if ((await fetch(URL)).ok) break; } catch { /* starting */ }
  await new Promise((r) => setTimeout(r, 200));
}
const browser = await chromium.launch();
const page = await (await browser.newContext({ ...devices['Pixel 5'] })).newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
// Skip the tutorial and sound so the board is unobstructed.
await page.addInitScript(() => localStorage.setItem('aoa.slice.prefs.v1', JSON.stringify({ lang: 'en', mode: 'showcase', voice: false, music: false, tutorial: -1 })));
await page.goto(URL);
await page.waitForFunction(() => Boolean(window.__aoa));
await page.evaluate((layout) => {
  const town = window.__aoa.town;
  town.buildings = layout.map(([defId, x, y], i) => ({ uid: i + 1, defId, level: 1 + (i % 4), x, y, stored: 0 }));
  town.nextUid = layout.length + 1;
}, LAYOUT);
await page.waitForTimeout(5600); // autosave runs every 5 s
await page.reload();
await page.waitForFunction(() => Boolean(window.__aoa) && window.__aoa.town.buildings.length > 5);
await page.waitForTimeout(1500);
await page.screenshot({ path: `${OUT}/art-01-town.png` });
const box = await page.locator('#stage').boundingBox();
await page.screenshot({ path: `${OUT}/art-02-board-closeup.png`, clip: box });
// Zoomed out with the mouse wheel: the whole 12 by 12 map with the locked land around the town.
await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
for (let i = 0; i < 8; i++) { await page.mouse.wheel(0, 200); await page.waitForTimeout(60); }
await page.waitForTimeout(400);
await page.screenshot({ path: `${OUT}/art-03-whole-map.png`, clip: box });
await browser.close();
server.kill();
if (errors.length) { console.error('FAIL:', errors.join('\n')); process.exit(1); }
console.log('PASS: art check screenshots saved');
