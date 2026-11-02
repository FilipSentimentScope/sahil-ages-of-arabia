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

/** Centre of hex plot (x, y) in page coordinates, from the town view's own camera. */
async function cellCentre(x, y) {
  const box = await page.locator('#stage canvas').boundingBox();
  const p = await page.evaluate(([cx, cy]) => window.__aoa.cellPoint(cx, cy), [x, y]);
  return { x: box.x + p.x, y: box.y + p.y };
}

async function tapCell(x, y) {
  const p = await cellCentre(x, y);
  await page.mouse.click(p.x, p.y);
}

await page.screenshot({ path: `${OUT}/01-new-town.png` });

// Place a well, then a date grove beside it (water bonus).
// Locked land outside the open 6 by 6 block refuses a building.
await page.click('[data-building="well"]');
await tapCell(2, 5);
await page.waitForTimeout(200);
if ((await page.evaluate(() => window.__aoa.town.buildings.length)) !== 0) fail('a building was placed on locked land');
if (!(await page.locator('#toast').textContent()).includes('next age')) fail('no locked-land message');
await page.screenshot({ path: `${OUT}/02-placing-well.png` });
await tapCell(6, 5); // creek plot
await page.click('[data-building="date_grove"]');
await tapCell(5, 5); // touches the well
await page.click('[data-building="date_grove"]'); // deselect
const placed = await page.evaluate(() => window.__aoa.town.buildings.map((b) => b.defId));
if (placed.join(',') !== 'well,date_grove') fail(`expected well,date_grove, got ${placed}`);

// Showcase time runs at 60x: 1 real second = 1 game minute. Wait long enough to have food
// worth at least one coin at the market (about 3 food at 15 food per hour).
await page.waitForTimeout(16000);
await page.screenshot({ path: `${OUT}/03-producing.png` });
const stored = await page.evaluate(() => window.__aoa.town.buildings[1].stored);
if (!(stored > 1)) fail(`date grove should have stored more than 1 food, has ${stored}`);

await page.click('#btn-collect-all');
await page.waitForTimeout(200);
const food = await page.evaluate(() => window.__aoa.town.resources.food);
if (!(food >= 1)) fail(`collect should add food, food=${food}`);

// Sell the food at the market.
const coinBefore = await page.evaluate(() => window.__aoa.town.resources.coin);
await page.click('#btn-sell-food');
await page.waitForTimeout(200);
const after = await page.evaluate(() => ({ food: window.__aoa.town.resources.food, coin: window.__aoa.town.resources.coin }));
if (after.food !== 0) fail(`selling should empty food, food=${after.food}`);
if (!(after.coin > coinBefore)) fail(`selling should pay coin: ${coinBefore} -> ${after.coin}`);
await page.screenshot({ path: `${OUT}/03b-sold-food.png` });

// Open the building panel.
await tapCell(5, 5);
await page.waitForSelector('#panel:not([hidden])');
await page.screenshot({ path: `${OUT}/04-building-panel.png` });
await page.click('#btn-close');

// Routes: send the errand, answer its first decision, unload it when it is home.
// Showcase time runs 60x: the 8-minute errand takes 8 seconds, its first decision is due after about 3.
await page.click('#btn-routes');
await page.waitForSelector('[data-send="date_gardens"]');
if (!(await page.locator('[data-send="island_harbour"]').isDisabled())) fail('sea route should need a jetty');
await page.click('[data-send="date_gardens"]');
await page.waitForSelector('[data-choose]', { timeout: 6000 });
await page.screenshot({ path: `${OUT}/04b-route-decision.png` });
await page.click('[data-choose$=":b"]');
await page.waitForTimeout(300);
const answered = await page.evaluate(() => window.__aoa.town.routes[0]?.choices[0]);
if (!answered || answered.option !== 'b' || answered.auto) fail(`decision not recorded: ${JSON.stringify(answered)}`);
await page.waitForSelector('[data-unload]', { timeout: 9000 });
const coinBeforeRoute = await page.evaluate(() => window.__aoa.town.resources.coin);
await page.click('[data-unload]');
await page.waitForTimeout(300);
const route = await page.evaluate(() => ({ out: window.__aoa.town.routes.length, coin: window.__aoa.town.resources.coin }));
if (route.out !== 0 || !(route.coin > coinBeforeRoute)) fail(`unloading should pay coin and free the route: ${JSON.stringify(route)}`);
await page.screenshot({ path: `${OUT}/04c-routes-panel.png` });
await page.click('#btn-routes-close');

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
