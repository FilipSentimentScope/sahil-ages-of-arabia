/**
 * Lore book check (QA): opens The Book of Suhail on a phone and on a 16:9 screen, turns every page,
 * saves a screenshot of each, and checks that it closes at the end. Usage: npm run build && node tests/e2e/lore-check.mjs
 */
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium, devices } = require('playwright');
const PORT = 4174;
const URL = `http://localhost:${PORT}/?lore`;
const OUT = 'tests/e2e/screenshots/lore';
mkdirSync(OUT, { recursive: true });
const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { stdio: 'ignore' });
for (let i = 0; i < 50; i++) { try { if ((await fetch(URL)).ok) break; } catch { /* starting */ } await new Promise((r) => setTimeout(r, 200)); }
const browser = await chromium.launch();
const errors = [];
let bad = '';
for (const [name, opts] of [['phone', devices['Pixel 5']], ['wide', { viewport: { width: 1280, height: 720 } }]]) {
  const page = await (await browser.newContext(opts)).newPage();
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(URL);
  await page.waitForSelector('#lore .lore-text h2');
  for (let i = 0; i < 9; i++) {
    await page.waitForTimeout(550);
    await page.screenshot({ path: `${OUT}/${name}-${i + 1}.jpg`, type: 'jpeg', quality: 86 });
    const over = await page.evaluate(() => { const e = document.querySelector('.lore-text'); return e.scrollHeight - e.clientHeight; });
    if (over > 4) console.log(`note: ${name} page ${i + 1} text scrolls by ${over}px`);
    await page.click('#lore-next');
  }
  await page.waitForTimeout(700);
  if ((await page.locator('#lore').count()) !== 0) bad = `${name}: book should close after the last page`;
}
await browser.close();
server.kill();
if (bad || errors.length) { console.error(`FAIL: ${bad}\n${errors.join('\n')}`); process.exit(1); }
console.log(`PASS: lore book, 9 pages on phone and 16:9 (screenshots in ${OUT})`);
