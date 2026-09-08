'use strict';
/* olivernguyen.com — terminal-mode prototype v2 (throwaway).
   You are INSIDE a terminal: the page never scrolls, content PRINTS into a
   scrollback buffer, one live prompt drives everything. No frameworks. */

const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => Array.from(el.querySelectorAll(sel));
const motionOK = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const EMAIL = 'oliverdnguyen@gmail.com';

const buffer = $('#buffer');
const promptline = $('#promptline');
const input = $('#prompt-input');
const pecho = $('#pecho');
const sbMode = $('#sb-mode');
const sbPos = $('#sb-pos');
const sbTime = $('#sb-time');
const helpEl = $('#help');
const paletteEl = $('#palette');
const paletteInput = $('#palette-input');
const paletteList = $('#palette-list');

const ROW = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--row')) || 21;

const WINDOWS = {
  1: { name: 'boot', cmd: 'operator --replay --day 3' },
  2: { name: 'agents', cmd: 'cat tools.txt' },
  3: { name: 'robotics', cmd: 'cat robotics.log' },
  4: { name: 'leadership', cmd: 'cat whoami.txt' },
  5: { name: 'contact', cmd: 'cat contact.txt' },
};
const FILES = {
  'tools.txt': { n: 2, tpl: 'tpl-2' },
  'robotics.log': { n: 3, tpl: 'tpl-3' },
  'whoami.txt': { n: 4, tpl: 'tpl-4' },
  'contact.txt': { n: 5, tpl: 'tpl-5' },
};

/* ============ clock + scroll position ============ */

function fmtTime() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
}
function tickClock() { sbTime.textContent = fmtTime(); }
tickClock();
setInterval(tickClock, 30000);

function updatePos() {
  const max = buffer.scrollHeight - buffer.clientHeight;
  sbPos.textContent = max <= 4 ? '100%' : Math.min(100, Math.round((buffer.scrollTop / max) * 100)) + '%';
}
buffer.addEventListener('scroll', updatePos);

/* ============ prompt rendering (block cursor = full-cell inverse) ============ */

function renderPrompt() {
  const v = input.value;
  const at = input.selectionStart == null ? v.length : input.selectionStart;
  pecho.textContent = '';
  pecho.append(document.createTextNode(v.slice(0, at)));
  const cur = document.createElement('span');
  cur.className = 'pcursor';
  cur.textContent = v.slice(at, at + 1) || '\u00a0';
  pecho.append(cur, document.createTextNode(v.slice(at + 1)));
  sbMode.textContent = v === '' ? '-- NORMAL --' : v.startsWith(':') ? '-- COMMAND --' : '-- INSERT --';
}
input.addEventListener('input', renderPrompt);
input.addEventListener('keyup', renderPrompt);
document.addEventListener('selectionchange', () => {
  if (document.activeElement === input) renderPrompt();
});
input.addEventListener('focus', () => promptline.classList.remove('blurred'));
input.addEventListener('blur', () => promptline.classList.add('blurred'));

/* ============ buffer printing ============ */

function pin() { buffer.scrollTop = buffer.scrollHeight; }

function mkLine(cls, parts) {
  const p = document.createElement('p');
  p.className = 'ln' + (cls ? ' ' + cls : '');
  for (const part of parts) {
    if (typeof part === 'string') {
      p.append(document.createTextNode(part));
    } else {
      const s = document.createElement('span');
      s.className = part.c;
      s.textContent = part.t;
      p.append(s);
    }
  }
  return p;
}

function echoLine(cmdText) {
  const p = document.createElement('p');
  p.className = 'ln echo';
  const s = document.createElement('span');
  s.className = 'psigil';
  s.textContent = 'oliver@on.c:~$ ';
  const c = document.createElement('span');
  c.className = 'cmdtext';
  c.textContent = cmdText;
  p.append(s, c);
  return p;
}

/* output prints line-at-a-time (real shells never type their output) */
async function printBlock(el, stagger = 34) {
  const kids = Array.from(el.children);
  if (motionOK) kids.forEach((k) => k.classList.add('pending'));
  buffer.append(el);
  pin();
  if (motionOK) {
    for (const k of kids) {
      await sleep(stagger + Math.random() * 40);
      k.classList.remove('pending');
      pin();
    }
  }
  updatePos();
}

async function printLine(cls, text) {
  const blk = document.createElement('div');
  blk.className = 'blk';
  blk.append(mkLine(cls, [text]));
  await printBlock(blk);
}
const printErr = (t) => printLine('err', t);

/* ============ windows / tabs ============ */

function setActive(n) {
  $$('.tab').forEach((t) => t.classList.toggle('active', Number(t.dataset.n) === n));
  renderContext(n);
}

/* ============ context side pane (tmux vertical split) ============ */

const SP_COLS = 34; /* pane is 38ch − 2ch padding each side */
const T0 = Date.now();
const START_CLOCK = fmtTime();

const CONTEXT = {
  1: { title: '[1] boot', file: 'operator replay', lines: [['day', '3 of 7'], ['decisions', '257'], ['touched', '0 times'], ['emails', '7 mornings']] },
  2: { title: '[2] agents', file: 'tools.txt', lines: [['registered', '4'], ['llm calls', '0 (notary)'], ['archived', '1']] },
  3: { title: '[3] robotics', file: 'robotics.log', lines: [['students', '15+'], ['awards', '17'], ['states', '4\u00d7'], ['worlds', '1 slot']] },
  4: { title: '[4] leadership', file: 'whoami.txt', lines: [['rank', 'Eagle Scout'], ['sat', '1540'], ['gpa', '4.0 UW'], ['status', 'building']] },
  5: { title: '[5] contact', file: 'contact.txt', lines: [['channel', 'open'], ['email', 'ready to copy']] },
};

function spTop(t) {
  const s = `\u256d\u2500 ${t} `;
  return s + '\u2500'.repeat(Math.max(0, SP_COLS - s.length));
}
function spBot() { return '\u2570' + '\u2500'.repeat(SP_COLS - 1); }
function spKV(label, val, valCls = 'mut') {
  return mkLine('', [{ c: 'dim', t: '\u2502 ' }, { c: 'faint', t: label.padEnd(11) }, { c: valCls, t: val }]);
}

function renderContext(n) {
  const box = $('#sp-context');
  const c = CONTEXT[n];
  if (!box || !c) return;
  box.textContent = '';
  box.append(mkLine('dim', [spTop('context')]));
  box.append(spKV('viewing', c.title, 'acc'));
  box.append(spKV('file', c.file));
  c.lines.forEach(([k, v]) => box.append(spKV(k, v)));
  box.append(mkLine('dim', [spBot()]));
}

function renderSession() {
  const box = $('#sp-session');
  box.textContent = '';
  box.append(mkLine('dim', [spTop('session')]));
  box.append(spKV('host', 'oliver@on.c'));
  box.append(spKV('mode', 'terminal \u00b7 night plum'));
  box.append(spKV('started', START_CLOCK + ' PT'));
  const up = mkLine('', [{ c: 'dim', t: '\u2502 ' }, { c: 'faint', t: 'uptime'.padEnd(11) }]);
  const uv = document.createElement('span');
  uv.className = 'mut';
  uv.id = 'sp-uptime';
  uv.textContent = '00:00:00';
  up.append(uv);
  box.append(up);
  box.append(spKV('windows', '5'));
  box.append(mkLine('dim', [spBot()]));
}

function fmtUptime() {
  const s = Math.floor((Date.now() - T0) / 1000);
  const h = String(Math.floor(s / 3600)).padStart(2, '0');
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return `${h}:${m}:${ss}`;
}
setInterval(() => {
  const u = $('#sp-uptime');
  if (u) u.textContent = fmtUptime();
}, 1000);
const io = new IntersectionObserver(
  (entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) setActive(Number(en.target.dataset.n));
    });
  },
  { root: buffer, rootMargin: '-30% 0px -55% 0px' }
);

$$('.tab').forEach((t) =>
  t.addEventListener('click', () => run(WINDOWS[t.dataset.n].cmd, { autotype: true }))
);

/* ============ boot hero (output of `operator --replay`) ============ */

function obtn(label, o) {
  const b = document.createElement('button');
  b.className = 'obtn';
  b.textContent = label;
  if (o.cmd) b.dataset.cmd = o.cmd;
  if (o.act) b.dataset.act = o.act;
  return b;
}

function buildBoot() {
  const blk = document.createElement('div');
  blk.className = 'blk';
  blk.dataset.n = '1';
  blk.append(
    mkLine('dim', ['\u256d\u2500 operator \u00b7 replay \u00b7 day 3/7']),
    mkLine('k-log', [{ c: 'dim', t: '\u2502 [06:12] ' }, '\u25c6 decision #141 \u00b7 re-prioritize: ship export fix before docs']),
    mkLine('k-log', [{ c: 'dim', t: '\u2502 [06:14] ' }, '\u2192 tool: bash \u00b7 pytest -q \u00b7 42 passed \u00b7 0 failed']),
    mkLine('k-log', [{ c: 'dim', t: '\u2502 [06:31] ' }, '\u2192 tool: edit \u00b7 export/render.py \u00b7 +18 \u22124']),
    mkLine('k-log', [{ c: 'dim', t: '\u2502 [07:02] ' }, '\u2709 morning email \u00b7 "day 3: export fixed, tests green, docs next"']),
    mkLine('k-log', [{ c: 'dim', t: '\u2502 [07:02] ' }, '\u25c6 decision #142 \u00b7 logged \u00b7 loop continues unattended']),
    mkLine('k-ok', ['\u2570\u2500 replay ok \u00b7 257 decisions \u00b7 7 days \u00b7 0 interventions']),
    mkLine('', [])
  );
  const name = document.createElement(document.querySelector('h1') ? 'div' : 'h1');
  name.className = 'ln name';
  name.textContent = 'Oliver Nguyen';
  name.setAttribute('aria-label', 'Oliver Nguyen');
  blk.append(name);
  blk.append(mkLine('tagline', ['I build LLM agents. One ran a project alone for a week.']));
  blk.append(mkLine('', []));
  const cta = document.createElement('p');
  cta.className = 'ln';
  cta.append(
    obtn('[ view the agents \u2193 ]', { cmd: 'cat tools.txt' }),
    document.createTextNode('  '),
    obtn('[ \u2318K ]', { act: 'palette' }),
    document.createTextNode('  '),
    obtn('[ switch to graph mode ]', { cmd: 'mode graph' })
  );
  blk.append(cta);
  return { blk, name };
}

function scramble(el) {
  return new Promise((resolve) => {
    const finalText = 'Oliver Nguyen';
    if (!motionOK) { el.textContent = finalText; resolve(); return; }
    const glyphs = '!<>-_\\/[]{}\u2014=+*^?#\u2591\u2592\u2593';
    let frame = 0;
    const iv = setInterval(() => {
      frame++;
      const lock = Math.floor((frame * finalText.length) / 16);
      el.textContent = finalText
        .split('')
        .map((ch, i) => (ch === ' ' ? ' ' : i < lock ? ch : glyphs[(Math.random() * glyphs.length) | 0]))
        .join('');
      if (lock >= finalText.length) {
        clearInterval(iv);
        el.textContent = finalText;
        resolve();
      }
    }, 40);
  });
}

async function printBoot() {
  const { blk, name } = buildBoot();
  io.observe(blk);
  await printBlock(blk, 70);
  setActive(1);
  await scramble(name);
  document.body.dataset.bootDone = '1';
}

/* ============ command execution ============ */

async function printFile(fname) {
  const f = FILES[fname];
  const blk = document.createElement('div');
  blk.className = 'blk';
  blk.dataset.n = String(f.n);
  blk.append(document.getElementById(f.tpl).content.cloneNode(true));
  io.observe(blk);
  await printBlock(blk);
  setActive(f.n);
}

async function printLs() {
  const rows = [
    ['tools.txt      ', '4 registered agents'],
    ['robotics.log   ', 'timeline 2022-2024'],
    ['whoami.txt     ', 'operator bio + stats'],
    ['contact.txt    ', 'open channel'],
  ];
  const blk = document.createElement('div');
  blk.className = 'blk';
  rows.forEach(([n, d]) => blk.append(mkLine('', [{ c: 'acc', t: n }, { c: 'faint', t: d }])));
  await printBlock(blk);
}

async function printHelp() {
  const rows = [
    ['keys      ', 'j/k scroll \u00b7 1-5 windows \u00b7 gg/G top/bottom \u00b7 ? help sheet \u00b7 \u2318K palette'],
    ['commands  ', 'ls \u00b7 cat FILE \u00b7 day N \u00b7 mode graph \u00b7 email \u00b7 clear \u00b7 help'],
    ['prompt    ', 'Tab completes \u00b7 \u2191/\u2193 history \u00b7 Esc clears'],
  ];
  const blk = document.createElement('div');
  blk.className = 'blk';
  rows.forEach(([n, d]) => blk.append(mkLine('', [{ c: 'dim', t: n }, { c: 'mut', t: d }])));
  await printBlock(blk);
}

async function copyEmail() {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try { await navigator.clipboard.writeText(EMAIL); } catch { /* file:// may deny; still print */ }
  }
  await printLine('ok', `copied ${EMAIL} \u2713`);
}

async function execute(raw) {
  let cmd = raw.trim();
  const colon = cmd.startsWith(':');
  if (colon) cmd = cmd.slice(1).trim();
  if (!cmd) return;
  let m;
  if (cmd === 'clear' || cmd === 'cls') { buffer.innerHTML = ''; updatePos(); return; }
  if ((m = cmd.match(/^cat\s+(\S+)$/))) {
    if (!FILES[m[1]]) return printErr(`cat: ${m[1]}: No such file`);
    return printFile(m[1]);
  }
  if (/^operator\b/.test(cmd)) return printBoot();
  if (cmd === 'ls' || cmd === 'ls -la') return printLs();
  if ((m = cmd.match(/^day\s+(\d+)$/))) {
    const n = Number(m[1]);
    if (n >= 1 && n <= 7) return printLine('mut', `day ${n} \u00b7 replay scrub stub \u2014 coming in v1`);
    return printErr('day: expected 1-7');
  }
  if (cmd === 'mode graph') return printLine('mut', 'graph mode: coming soon');
  if (cmd === 'mode term' || cmd === 'mode terminal') return printLine('mut', 'already in terminal mode');
  if (cmd === 'email') return copyEmail();
  if (cmd === 'help') return printHelp();
  if (cmd === 'whoami') return printFile('whoami.txt');
  if (cmd === 'contact') return printFile('contact.txt');
  if ((m = cmd.match(/^([1-5])$/))) return execute(WINDOWS[m[1]].cmd);
  if (cmd === 'q' || cmd === 'quit' || cmd === 'exit') {
    return printLine('mut', 'this is a website. you live here now.');
  }
  return printErr(colon ? `E492: not a command: ${cmd}` : `command not found: ${cmd.split(/\s+/)[0]}`);
}

/* ============ run queue (commands never interleave) ============ */

let chain = Promise.resolve();
function enqueue(fn) { chain = chain.then(fn); return chain; }

/* commands the site runs for you are visibly TYPED; output only prints */
async function typeIntoPrompt(cmd) {
  input.value = '';
  renderPrompt();
  for (const ch of cmd) {
    input.value += ch;
    input.setSelectionRange(input.value.length, input.value.length);
    renderPrompt();
    if (motionOK) await sleep(26 + Math.random() * 26);
  }
  if (motionOK) await sleep(150);
}

let HIST = [];
let histIdx = 0;

function run(cmdText, opts = {}) {
  return enqueue(async () => {
    if (opts.autotype) await typeIntoPrompt(cmdText);
    input.value = '';
    renderPrompt();
    buffer.append(echoLine(cmdText));
    pin();
    HIST.push(cmdText);
    histIdx = HIST.length;
    await execute(cmdText);
    pin();
    updatePos();
  });
}

/* ============ history + completion ============ */

function histNav(d) {
  if (!HIST.length) return;
  histIdx = Math.max(0, Math.min(HIST.length, histIdx + d));
  input.value = histIdx === HIST.length ? '' : HIST[histIdx];
  input.setSelectionRange(input.value.length, input.value.length);
  renderPrompt();
}

const CMDS = ['help', 'ls', 'cat ', 'clear', 'day ', 'mode graph', 'mode terminal',
  'email', 'whoami', 'contact', 'operator --replay --day 3', 'quit'];

function complete() {
  const v = input.value;
  if (!v) return;
  const colon = v.startsWith(':') ? ':' : '';
  const bare = colon ? v.slice(1) : v;
  let m;
  if ((m = bare.match(/^cat\s+(\S*)$/))) {
    const names = Object.keys(FILES).filter((f) => f.startsWith(m[1]));
    if (names.length) input.value = colon + 'cat ' + names[0];
  } else {
    const hits = CMDS.filter((c) => c.startsWith(bare));
    if (hits.length) input.value = colon + hits[0];
  }
  input.setSelectionRange(input.value.length, input.value.length);
  renderPrompt();
}

/* ============ keys: vim motions live in the empty prompt ============ */

function bufScroll(rows) { buffer.scrollBy({ top: rows * ROW, behavior: 'auto' }); }

let pendingG = 0;
function setPend(t) { if (t) { sbMode.textContent = t; } else { renderPrompt(); } }

input.addEventListener('keydown', (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey) return; /* \u2318K bubbles to window handler */
  if (e.key === 'Enter') {
    e.preventDefault();
    const v = input.value.trim();
    if (v) run(v);
    return;
  }
  if (e.key === 'Tab') { e.preventDefault(); complete(); return; }
  if (e.key === 'ArrowUp') { e.preventDefault(); histNav(-1); return; }
  if (e.key === 'ArrowDown') { e.preventDefault(); histNav(1); return; }
  if (e.key === 'Escape') { e.preventDefault(); input.value = ''; renderPrompt(); return; }

  /* never-trap: once you're typing a command, every key is just text */
  if (input.value !== '') return;

  switch (e.key) {
    case 'j': e.preventDefault(); bufScroll(2); break;
    case 'k': e.preventDefault(); bufScroll(-2); break;
    case 'G': e.preventDefault(); buffer.scrollTop = buffer.scrollHeight; break;
    case 'g':
      e.preventDefault();
      if (Date.now() - pendingG < 1200) {
        pendingG = 0;
        setPend('');
        buffer.scrollTop = 0;
      } else {
        pendingG = Date.now();
        setPend('g\u2025');
        setTimeout(() => {
          if (pendingG && Date.now() - pendingG >= 1150) { pendingG = 0; setPend(''); }
        }, 1250);
      }
      break;
    case '?': e.preventDefault(); openHelp(); break;
    default:
      if (/^[1-5]$/.test(e.key)) {
        e.preventDefault();
        run(WINDOWS[e.key].cmd, { autotype: true });
      }
  }
});

window.addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && !e.altKey && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    togglePalette();
    return;
  }
  if (e.key === 'Escape' && !helpEl.hidden) closeHelp();
});

/* the prompt is ALWAYS focused — clicking anywhere refocuses it */
document.addEventListener('click', (e) => {
  if (!helpEl.hidden || !paletteEl.hidden) return;
  if (window.getSelection && String(window.getSelection())) return;
  input.focus({ preventScroll: true });
});

/* clickable output: CTA buttons + printed [data-cmd] buttons */
buffer.addEventListener('click', (e) => {
  const a = e.target.closest('a[href="#"]');
  if (a) e.preventDefault();
  const b = e.target.closest('[data-cmd]');
  if (b) { run(b.dataset.cmd, { autotype: true }); return; }
  if (e.target.closest('[data-act="palette"]')) openPalette();
});

/* ============ help overlay ============ */

function openHelp() {
  closePalette();
  helpEl.hidden = false;
  $('#help-close').focus();
}
function closeHelp() {
  if (helpEl.hidden) return;
  helpEl.hidden = true;
  input.focus({ preventScroll: true });
}
$('#help-close').addEventListener('click', closeHelp);

$$('.backdrop').forEach((b) =>
  b.addEventListener('click', () => {
    if (b.dataset.close === 'help') closeHelp();
    if (b.dataset.close === 'palette') closePalette();
  })
);

/* ============ command palette (\u2318K) ============ */

const INTENTS = [
  { label: 'Replay boot sequence', hint: '1', phrases: 'boot hero replay operator week start', cmd: 'operator --replay --day 3' },
  { label: 'Go to agents', hint: '2', phrases: 'agents tools projects work', cmd: 'cat tools.txt' },
  { label: 'Go to robotics', hint: '3', phrases: 'robotics techx mentor coach worlds', cmd: 'cat robotics.log' },
  { label: 'Go to leadership', hint: '4', phrases: 'leadership whoami about bio eagle scout', cmd: 'cat whoami.txt' },
  { label: 'Go to contact', hint: '5', phrases: 'contact email reach hire', cmd: 'cat contact.txt' },
  { label: 'Replay the week', hint: ':day N', phrases: 'week loop replay day seven', cmd: 'day 3' },
  { label: 'Copy email', hint: 'email', phrases: 'email copy clipboard mail', cmd: 'email' },
  { label: 'Switch to graph mode', hint: ':mode graph', phrases: 'graph mode light canvas nodes', cmd: 'mode graph' },
  { label: 'Clear screen', hint: 'clear', phrases: 'clear cls wipe', cmd: 'clear' },
  { label: 'Keyboard help', hint: '?', phrases: 'help keys shortcuts vim bindings', fn: () => openHelp() },
];

let palItems = [];
let palSel = 0;

function fuzzyScore(q, s) {
  q = q.toLowerCase();
  s = s.toLowerCase();
  if (!q) return 1;
  const idx = s.indexOf(q);
  if (idx >= 0) return 100 - idx;
  let i = 0;
  for (const ch of s) {
    if (ch === q[i]) i++;
    if (i === q.length) break;
  }
  return i === q.length ? 10 : -1;
}

function paintSel() {
  $$('#palette-list li').forEach((li, i) => li.classList.toggle('sel', i === palSel));
}

function renderPalette() {
  const q = paletteInput.value.trim();
  palItems = INTENTS.map((it) => ({ it, score: fuzzyScore(q, it.label + ' ' + it.phrases) }))
    .filter((x) => x.score >= 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.it);
  palSel = 0;
  paletteList.innerHTML = '';
  if (palItems.length === 0) {
    const li = document.createElement('li');
    li.className = 'empty';
    li.textContent = 'no matching commands';
    paletteList.append(li);
    return;
  }
  palItems.forEach((it, i) => {
    const li = document.createElement('li');
    li.setAttribute('role', 'option');
    const lab = document.createElement('span');
    lab.textContent = it.label;
    const hint = document.createElement('span');
    hint.className = 'hint';
    hint.textContent = it.hint;
    li.append(lab, hint);
    if (i === palSel) li.classList.add('sel');
    li.addEventListener('click', () => runIntent(it));
    li.addEventListener('mousemove', () => { palSel = i; paintSel(); });
    paletteList.append(li);
  });
}

function moveSel(d) {
  if (palItems.length === 0) return;
  palSel = (palSel + d + palItems.length) % palItems.length;
  paintSel();
  const li = paletteList.children[palSel];
  if (li && li.scrollIntoView) li.scrollIntoView({ block: 'nearest' });
}

function runIntent(it) {
  closePalette();
  if (it.fn) it.fn();
  else run(it.cmd, { autotype: true });
}

function openPalette() {
  closeHelp();
  paletteEl.hidden = false;
  paletteInput.value = '';
  renderPalette();
  paletteInput.focus();
}
function closePalette() {
  if (paletteEl.hidden) return;
  paletteInput.blur();
  paletteEl.hidden = true;
  input.focus({ preventScroll: true });
}
function togglePalette() { paletteEl.hidden ? openPalette() : closePalette(); }

paletteInput.addEventListener('input', renderPalette);
paletteInput.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { e.preventDefault(); closePalette(); }
  else if (e.key === 'ArrowDown' || (e.ctrlKey && e.key === 'n')) { e.preventDefault(); moveSel(1); }
  else if (e.key === 'ArrowUp' || (e.ctrlKey && e.key === 'p')) { e.preventDefault(); moveSel(-1); }
  else if (e.key === 'Enter') {
    e.preventDefault();
    const it = palItems[palSel];
    if (it) runIntent(it);
  }
});

/* ============ boot ============ */

renderPrompt();
input.focus({ preventScroll: true });

renderSession();
renderContext(1);

/* motd, then the site runs its own first command (satnaing pattern) */
const motd = document.createElement('div');
motd.className = 'blk';
motd.append(mkLine('faint', [`Last login: ${new Date().toDateString()} ${fmtTime()} on ttys001`]));
buffer.append(motd);
updatePos();

run(WINDOWS[1].cmd, { autotype: true });
