/* Quick headless smoke for the terminal-mode prototype v2 (buffer model).
   Run: node smoke.mjs  (Playwright installed globally) */
import { execSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const globalRoot = execSync('npm root -g').toString().trim();
const { chromium } = await import(pathToFileURL(join(globalRoot, 'playwright', 'index.mjs')).href);

const here = dirname(fileURLToPath(import.meta.url));
const url = pathToFileURL(join(here, 'index.html')).href;

const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
};

const consoleErrors = [];
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
page.on('pageerror', (err) => consoleErrors.push(String(err)));

await page.goto(url);

// boot: auto-typed command finished, hero printed
await page.waitForSelector('body[data-boot-done="1"]', { timeout: 20000 });
check('boot prints hero into buffer', (await page.locator('.blk[data-n="1"]').count()) === 1);
check('page itself cannot scroll', await page.evaluate(
  () => getComputedStyle(document.body).overflow === 'hidden' && window.scrollY === 0
));

const st = () => page.evaluate(() => document.getElementById('buffer').scrollTop);

// 3 = print robotics.log into the buffer (typed command + output)
await page.keyboard.press('3');
await page.waitForTimeout(2500);
check('3 prints robotics block', (await page.locator('.blk[data-n="3"]').count()) >= 1);
check('tab 3 active', await page.locator('#tabs .tab[data-n="3"]').evaluate((el) => el.classList.contains('active')));

// build enough scrollback to overflow the screen, then test j/k
await page.keyboard.press('2');
await page.waitForTimeout(2500);
await page.keyboard.press('4');
await page.waitForTimeout(2500);
check('scrollback overflows screen', await page.evaluate(() => {
  const b = document.getElementById('buffer');
  return b.scrollHeight > b.clientHeight;
}));

// k / j drive buffer.scrollTop (buffer is pinned to bottom, so k first)
const s0 = await st();
await page.keyboard.press('k');
await page.keyboard.press('k');
await page.keyboard.press('k');
const s1 = await st();
check('k scrolls buffer up', s1 < s0, `${s0} -> ${s1}`);
await page.keyboard.press('j');
const s2 = await st();
check('j scrolls buffer down', s2 > s1, `${s1} -> ${s2}`);

// gg / G on the buffer
await page.keyboard.press('g');
await page.keyboard.press('g');
check('gg jumps to scrollback top', (await st()) === 0);
await page.keyboard.press('G');
const atBottom = await page.evaluate(() => {
  const b = document.getElementById('buffer');
  return b.scrollTop + b.clientHeight >= b.scrollHeight - 4;
});
check('G jumps to bottom', atBottom);

// ? help overlay
await page.keyboard.press('?');
check('? opens help', await page.locator('#help').isVisible());
await page.keyboard.press('Escape');
await page.waitForTimeout(100);
check('Esc closes help', !(await page.locator('#help').isVisible()));

// cmd-k palette runs a command through the buffer
await page.keyboard.press('Control+k');
check('ctrl/cmd-k opens palette', await page.locator('#palette').isVisible());
await page.keyboard.type('contact');
await page.keyboard.press('Enter');
await page.waitForTimeout(2500);
check('palette prints contact block', (await page.locator('.blk[data-n="5"]').count()) >= 1);

// never-trap: once typing, j is text; prompt works as a real prompt
const sBefore = await st();
await page.keyboard.type('xjjj');
check('j while typing stays text', (await page.locator('#prompt-input').inputValue()) === 'xjjj');
check('typing does not scroll buffer', (await st()) === sBefore);
await page.keyboard.press('Escape');
await page.keyboard.type('ls');
await page.keyboard.press('Enter');
await page.waitForTimeout(800);
const bufText = await page.locator('#buffer').textContent();
check('typed ls prints file list', bufText.includes('robotics.log'));

check('zero console errors', consoleErrors.length === 0, consoleErrors.join(' | '));

await browser.close();

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
