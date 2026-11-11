/**
 * Phone play-through (QA agent), interface v2. Plays the first session the way a new player
 * would: follows the Rawi tutorial step by step, then checks selling, Arabic, the save, and a
 * 16:9 screen with mouse hover. Saves screenshots to tests/e2e/screenshots. Fails on any console
 * error or on a step that does not do what the player was told.
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
let browser;
const fail = async (msg) => {
  console.error(`FAIL: ${msg}`);
  try { await browser?.close(); } catch { /* ignore */ }
  server.kill();
  process.exit(1);
};
for (let i = 0; i < 50; i++) {
  try { if ((await fetch(URL)).ok) break; } catch { /* starting */ }
  await new Promise((r) => setTimeout(r, 200));
}

browser = await chromium.launch();
const context = await browser.newContext({ ...devices['Pixel 5'] });
const page = await context.newPage();
const errors = [];
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
page.on('pageerror', (e) => errors.push(String(e)));
const shot = (name) => page.screenshot({ path: `${OUT}/${name}.png` });
const state = (f) => page.evaluate(f);
const town = () => page.evaluate(() => window.__aoa.town);

/** Tap the centre of hex plot (x, y) through the town view's own camera. */
async function tapCell(x, y) {
  const box = await page.locator('#stage canvas').boundingBox();
  const p = await page.evaluate(([cx, cy]) => window.__aoa.cellPoint(cx, cy), [x, y]);
  await page.mouse.click(box.x + p.x, box.y + p.y);
  await page.waitForTimeout(150);
}

async function build(id, x, y) {
  await page.click('#btn-build');
  await page.waitForSelector(`[data-building="${id}"]`);
  await page.click(`[data-building="${id}"]`);
  await page.waitForSelector('#placebar:not([hidden])');
  await tapCell(x, y);
}

const expectGlow = async (sel, why) => {
  if (!(await page.locator(sel).first().evaluate((el) => el.classList.contains('tut-glow')))) await fail(`${why}: ${sel} should glow`);
};

await page.goto(URL);
await page.waitForFunction(() => Boolean(window.__aoa));
await page.waitForTimeout(600);

// 1. First screen: the Rawi greets the player.
await page.waitForSelector('#rawi:not([hidden])');
await shot('01-first-screen');
await page.click('#btn-tut-next');

// 2. Build a well: the Build button glows, then the Well card.
await page.waitForTimeout(400);
await expectGlow('#btn-build', 'well step');
await page.click('#btn-build');
await page.waitForSelector('[data-building="well"]');
await page.waitForTimeout(300);
await expectGlow('[data-building="well"]', 'well step');
await shot('02-build-sheet');
if ((await page.locator('[data-building="date_grove"] .prov i').count()) < 2) await fail('build cards should show what a building gives');
await page.click('[data-building="well"]');
await page.waitForSelector('#placebar:not([hidden])');
await shot('03-placing');
await tapCell(2, 5); // locked land: refused with a message
if ((await town()).buildings.length !== 0) await fail('a building was placed on locked land');
if (!(await page.locator('#toast').textContent()).includes('next age')) await fail('no locked-land message');
await tapCell(6, 5); // creek plot
if ((await town()).buildings[0]?.defId !== 'well') await fail('well was not placed');
await page.waitForSelector('#notice:not([hidden])');
await shot('04-built-notice');

// 3. Date grove beside the well.
await page.waitForTimeout(400);
await build('date_grove', 5, 5);
if ((await town()).buildings.length !== 2) await fail('date grove was not placed');

// 4. Collect once the grove has food (Showcase time: a few seconds).
await page.waitForFunction(() => window.__aoa.town.buildings[1].stored >= 1, null, { timeout: 15000 });
await page.waitForTimeout(400);
await expectGlow('#btn-collect-all', 'collect step');
await page.click('#btn-collect-all');
await page.waitForTimeout(300);
if (!((await town()).resources.food >= 1)) await fail('collect should add food');
await shot('05-collected');

// 5. Souq.
await page.waitForTimeout(400);
await build('souq', 4, 6);
if (!(await town()).buildings.some((b) => b.defId === 'souq')) await fail('souq was not placed');

// 6. Send the errand.
await page.waitForTimeout(400);
await page.click('#btn-routes');
await page.waitForSelector('[data-send="date_gardens"]');
if (!(await page.locator('[data-send="island_harbour"]').isDisabled())) await fail('sea route should need a jetty');
await shot('06-routes-sheet');
await page.click('[data-send="date_gardens"]');
await page.waitForSelector('.tracker');
await shot('07-route-sent');

// 7. Answer the choice from the route timer on the left.
await page.waitForSelector('.tracker.pending', { timeout: 10000 });
await page.click('.tracker.pending');
await page.waitForSelector('#card:not([hidden]) [data-choose]');
await shot('08-choice-card');
await page.click('[data-choose$=":b"]');
await page.waitForTimeout(300);
const answered = (await town()).routes[0]?.choices[0];
if (!answered || answered.option !== 'b' || answered.auto) await fail(`choice not recorded: ${JSON.stringify(answered)}`);

// 8. Unload when it is home (any second choice is answered too, if it comes up first).
for (let i = 0; i < 40; i++) {
  if ((await page.locator('#card:not([hidden]) [data-choose]').count()) > 0) await page.click('[data-choose$=":a"]');
  if ((await page.locator('.tracker.pending').count()) > 0) await page.click('.tracker.pending');
  if ((await page.locator('.tracker.home').count()) > 0) break;
  await page.waitForTimeout(400);
}
const coinBefore = (await town()).resources.coin;
await page.click('.tracker.home');
await page.waitForTimeout(400);
const afterUnload = await town();
if (afterUnload.routes.length !== 0 || !(afterUnload.resources.coin > coinBefore)) await fail('unloading should pay coin and free the route');

// 9. Upgrade the grove from its info sheet.
await page.waitForTimeout(400);
// A tap on a building with a ready bubble collects; the next tap opens its sheet.
for (let i = 0; i < 3 && (await page.locator('#btn-upgrade').count()) === 0; i++) { await tapCell(5, 5); await page.waitForTimeout(300); }
await page.waitForSelector('#btn-upgrade');
await shot('09-building-sheet');
await page.click('#btn-upgrade');
await page.waitForTimeout(300);
if (!((await town()).buildings.some((b) => b.level >= 2))) await fail('upgrade did not happen');
await page.click('#btn-close');

// 10. Goals.
await page.waitForTimeout(400);
await expectGlow('#btn-goals', 'goals step');
await page.click('#btn-goals');
await page.waitForSelector('#btn-question');
if (!(await page.locator('#btn-research').isDisabled())) await fail('research should need knowledge first');
await shot('10-goals');
// A real history question: first a wrong answer (nothing earned, explanation shown), then a right one.
await page.click('#btn-question');
await page.waitForSelector('#card:not([hidden]) [data-answer]');
await shot('10b-question');
const q0 = await state(() => window.__aoa.content.questions.questions[0]);
await page.click(`[data-answer="${(q0.answer + 1) % q0.en.options.length}"]`);
await page.waitForSelector('#btn-q-next');
if ((await town()).age.questions !== 0) await fail('a wrong answer should not count');
await shot('10c-question-wrong');
await page.click('#btn-q-next');
await page.waitForSelector('#card:not([hidden]) [data-answer]');
const q1 = await state(() => window.__aoa.content.questions.questions[1]);
await page.click(`[data-answer="${q1.answer}"]`);
await page.waitForSelector('[data-read]');
if ((await town()).age.questions !== 1) await fail('a right answer should count for the Chronicle');
await shot('10d-question-right');
await page.click('[data-read]');
await page.waitForSelector('#btn-archive-back');
await shot('10e-archive-page');
await page.click('#btn-q-close');
await page.click('#btn-age-close');

// 11. The tutorial ends; the next-step bar takes over.
await page.waitForSelector('#btn-tut-next');
await page.click('#btn-tut-next');
await page.waitForTimeout(400);
if (!(await page.locator('#rawi').isHidden())) await fail('tutorial should be over');
if (await page.locator('#taskbar').isHidden()) await fail('next-step bar should show after the tutorial');
await shot('11-after-tutorial');

// 11a. Tasks: claim a finished task; the reward arrives and the rank shows.
await page.click('#btn-tasks');
await page.waitForSelector('[data-claim="first_well"]');
await shot('11a-tasks');
const coinT = (await town()).resources.coin;
await page.click('[data-claim="first_well"]');
await page.waitForTimeout(300);
if ((await town()).resources.coin !== coinT + 30) await fail('claiming a task should pay its reward');
await page.click('#btn-close');

// 11a2. A sea gift: appears on the map, a tap collects it.
await state(() => { window.__aoa.town.progress.nextGiftAt = 0; });
await page.waitForFunction(() => window.__aoa.town.progress.gift !== null, null, { timeout: 5000 });
const gift = (await town()).progress.gift;
await page.waitForTimeout(300);
await shot('11a2-gift');
await tapCell(gift.x, gift.y);
if ((await town()).progress.stats.gifts !== 1) await fail('tapping the sea gift should collect it');

// 11b. Encyclopedia: search, open an entry, follow a "see also" link, then back.
await page.click('#btn-encyclopedia');
await page.waitForSelector('#enc-search');
await shot('11b-encyclopedia');
await page.fill('#enc-search', 'kamal');
await page.waitForTimeout(200);
if ((await page.locator('.enc-item').count()) < 1) await fail('search should find the kamal');
await page.click('[data-entry="term_kamal"]');
await page.waitForSelector('#btn-enc-back');
await page.click('[data-entry="ldr_ibn_majid"]');
await page.waitForTimeout(200);
if (!(await page.locator('#sheet h2').textContent()).includes('ibn Majid')) await fail('see-also link should open Ibn Majid');
await shot('11c-encyclopedia-leader');
await page.click('#btn-enc-close');

// 12. Arabic, right to left, from the menu.
await page.click('#btn-menu');
await page.click('#btn-lang');
await page.waitForTimeout(300);
if ((await state(() => document.documentElement.dir)) !== 'rtl') await fail('Arabic should be right to left');
await page.click('#btn-close');
await shot('12-arabic');

// 13. Reload: the save brings the town back.
await page.reload();
await page.waitForFunction(() => Boolean(window.__aoa));
if ((await town()).buildings.length !== 3) await fail('save/load lost buildings');

const fps = await page.evaluate(() => new Promise((resolve) => {
  let n = 0;
  const t0 = performance.now();
  const step = () => { n++; if (performance.now() - t0 < 2000) requestAnimationFrame(step); else resolve(Math.round((n * 1000) / (performance.now() - t0))); };
  requestAnimationFrame(step);
}));

// 14. A 16:9 screen with a mouse: the map fills it, sheets sit at the side, hover shows a tooltip.
const wide = await browser.newContext({ viewport: { width: 1280, height: 720 } });
const wpage = await wide.newPage();
wpage.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
wpage.on('pageerror', (e) => errors.push(String(e)));
await wpage.goto(URL);
await wpage.waitForFunction(() => Boolean(window.__aoa));
await wpage.evaluate(() => {
  localStorage.setItem('aoa.slice.prefs.v1', JSON.stringify({ lang: 'en', mode: 'showcase', voice: false, music: false, tutorial: -1 }));
  const t = window.__aoa.town;
  t.buildings = [['well', 6, 4], ['date_grove', 6, 5], ['date_grove', 7, 5], ['souq', 5, 6], ['barasti_house', 4, 5], ['jetty', 4, 9], ['fish_trap', 5, 9], ['majlis', 4, 7], ['pearl_merchant', 5, 8]]
    .map(([defId, x, y], i) => ({ uid: i + 1, defId, level: 1 + (i % 3), x, y, stored: 0 }));
  t.nextUid = 20;
});
await wpage.waitForTimeout(5600);
await wpage.reload();
await wpage.waitForFunction(() => Boolean(window.__aoa) && window.__aoa.town.buildings.length > 5);
await wpage.waitForTimeout(800);
await wpage.screenshot({ path: `${OUT}/13-wide.png` });
const wbox = await wpage.locator('#stage canvas').boundingBox();
const gp = await wpage.evaluate(() => window.__aoa.cellPoint(6, 5));
await wpage.mouse.move(wbox.x + gp.x, wbox.y + gp.y - 8);
await wpage.waitForTimeout(300);
if (await wpage.locator('#tooltip').isHidden()) await fail('hovering a building should show its tooltip');
await wpage.screenshot({ path: `${OUT}/14-wide-hover.png` });
await wpage.click('#btn-routes');
await wpage.waitForTimeout(400);
await wpage.screenshot({ path: `${OUT}/15-wide-routes.png` });

// 16. Title screen (tests skip it unless asked) and a night view.
const tpage = await wide.newPage();
await tpage.goto(`${URL}?title`);
await tpage.waitForSelector('#title h1');
await tpage.waitForTimeout(700);
await tpage.screenshot({ path: `${OUT}/16-title.png` });
await tpage.click('#title');
await tpage.waitForTimeout(1200);
if ((await tpage.locator('#title').count()) !== 0) await fail('title screen should go away on tap');
await tpage.evaluate(() => { const t = window.__aoa.town; t.foundedAt = window.__aoa.clock().now() - 0.66 * 24 * 3600000; });
await tpage.waitForTimeout(600);
await tpage.screenshot({ path: `${OUT}/17-night.png` });

await browser.close();
server.kill();
if (errors.length) { console.error(`FAIL: console errors:\n${errors.join('\n')}`); process.exit(1); }
console.log(`PASS: play-through with tutorial, phone and 16:9 (headless frame rate ~${fps} fps, screenshots in ${OUT})`);
