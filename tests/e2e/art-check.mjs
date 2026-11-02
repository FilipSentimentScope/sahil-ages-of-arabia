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

const LAYOUT = [
  ['storehouse', 4, 0], ['watchtower', 5, 0], ['treasury', 3, 1], ['barasti_house', 0, 2],
  ['majlis', 3, 2], ['well', 1, 3], ['date_grove', 2, 3], ['scribe_house', 4, 3],
  ['pearl_merchant', 0, 4], ['souq', 1, 4], ['barasti_house', 2, 4], ['jetty', 0, 5], ['fish_trap', 2, 5],
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
await browser.close();
server.kill();
if (errors.length) { console.error('FAIL:', errors.join('\n')); process.exit(1); }
console.log('PASS: art check screenshots saved');
