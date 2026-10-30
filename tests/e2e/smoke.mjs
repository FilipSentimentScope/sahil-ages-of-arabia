/**
 * Smoke play-through at phone size (QA agent). Starts the built game, places a
 * well and a date grove, waits for production, collects, switches to Arabic and
 * saves screenshots to tests/e2e/screenshots. Fails on any console error.
 *
 * Usage: npm run build && npm run e2e
 */
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium, devices } = require('playwright');

const PORT = 4173;
const URL = `http://localhost:${PORT}/`;
const OUT = 'tests/e2e/screenshots';
mkdirSync(OUT, { recursive: true });

const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { stdio: 'ignore' });
const fail = (msg) => {
  console.error(`FAIL: ${msg}`);
  server.kill();
  process.exit(1);
};

async function waitForServer() {
  for (let i = 0; i < 50; i++) {
    try {
      const r = await fetch(URL);
      if (r.ok) return;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  fail('preview server did not start');
}

await waitForServer();
const browser = await chromium.launch();
const context = await browser.newContext({ ...devices['Pixel 5'] });
const page = await context.newPage();
const errors = [];
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
page.on('pageerror', (e) => errors.push(String(e)));

await page.goto(URL);
await page.waitForFunction(() => Boolean(window.__aoa));
await page.waitForTimeout(500);

/** Centre of grid cell (x, y) in page coordinates, mirroring TownView.layout. */
async function cellCentre(x, y) {
  const box = await page.locator('#stage').boundingBox();
  const pad = 12;
  const cell = Math.floor(Math.min((box.width - pad * 2) / 6, (box.height - pad * 2) / 6));
  const ox = Math.floor((box.width - cell * 6) / 2);
  const oy = Math.floor((box.height - cell * 6) / 2);
  return { x: box.x + ox + (x + 0.5) * cell, y: box.y + oy + (y + 0.5) * cell };
}

async function tapCell(x, y) {
  const p = await cellCentre(x, y);
  await page.mouse.click(p.x, p.y);
}

await page.screenshot({ path: `${OUT}/01-new-town.png` });

// Place a well, then a date grove beside it (water bonus).
await page.click('[data-building="well"]');
await page.screenshot({ path: `${OUT}/02-placing-well.png` });
await tapCell(1, 3);
await page.click('[data-building="date_grove"]');
await tapCell(2, 3);
await page.click('[data-building="date_grove"]'); // deselect
const placed = await page.evaluate(() => window.__aoa.town.buildings.map((b) => b.defId));
if (placed.join(',') !== 'well,date_grove') fail(`expected well,date_grove, got ${placed}`);

// Showcase time runs at 60x: 6 real seconds = 6 game minutes = 1.5 food at 15/h.
await page.waitForTimeout(6500);
await page.screenshot({ path: `${OUT}/03-producing.png` });
const stored = await page.evaluate(() => window.__aoa.town.buildings[1].stored);
if (!(stored > 1)) fail(`date grove should have stored more than 1 food, has ${stored}`);

await page.click('#btn-collect-all');
await page.waitForTimeout(200);
const food = await page.evaluate(() => window.__aoa.town.resources.food);
if (!(food >= 1)) fail(`collect should add food, food=${food}`);

// Open the building panel.
await tapCell(2, 3);
await page.waitForSelector('#panel:not([hidden])');
await page.screenshot({ path: `${OUT}/04-building-panel.png` });
await page.click('#btn-close');

// Arabic and right-to-left.
await page.click('#btn-lang');
await page.waitForTimeout(300);
const dir = await page.evaluate(() => document.documentElement.dir);
if (dir !== 'rtl') fail(`expected rtl after switching to Arabic, got ${dir}`);
await page.screenshot({ path: `${OUT}/05-arabic-rtl.png` });

// Reload: the save must bring the town back.
await page.reload();
await page.waitForFunction(() => Boolean(window.__aoa));
const afterReload = await page.evaluate(() => window.__aoa.town.buildings.length);
if (afterReload !== 2) fail(`save/load lost buildings: ${afterReload}`);

// Rough frame-rate sample on this machine (not a device test).
const fps = await page.evaluate(
  () =>
    new Promise((resolve) => {
      let n = 0;
      const t0 = performance.now();
      const step = () => {
        n++;
        if (performance.now() - t0 < 2000) requestAnimationFrame(step);
        else resolve(Math.round((n * 1000) / (performance.now() - t0)));
      };
      requestAnimationFrame(step);
    }),
);

await browser.close();
server.kill();
if (errors.length) fail(`console errors:\n${errors.join('\n')}`);
console.log(`PASS: smoke play-through (headless frame rate ~${fps} fps, screenshots in ${OUT})`);
