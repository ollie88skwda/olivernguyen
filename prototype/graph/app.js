/* ============================================================
   graph mode — flagship prototype
   hand-rolled DOM+SVG world · d3-zoom camera · intent routing
   per docs/redesign-research/06-graph-research.md §4 + 05-v1-spec §4
   ============================================================ */
(() => {
'use strict';

if (!window.d3) {
  document.body.innerHTML =
    '<div style="font:15px/1.6 system-ui;padding:48px;color:#3a1e2b">' +
    'd3 failed to load — this prototype pulls d3 from a CDN and needs network once.</div>';
  return;
}

const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const STILL = new URLSearchParams(location.search).has('still');

/* ----------------------- content model (authored) ----------------------- */
/* ids + copy from 05-v1-spec §2.2; positions hand-tuned (world coords).    */

const KIND = {
  root:       { g: '●', label: 'root' },
  group:      { g: '○', label: 'cluster' },
  project:    { g: '◆', label: 'project' },
  day:        { g: '◔', label: 'day log' },
  role:       { g: '▣', label: 'role' },
  credential: { g: '✦', label: 'credential' },
  page:       { g: '▤', label: 'page' },
  channel:    { g: '✉', label: 'channel' },
};

const EMAIL = 'oliverdnguyen@gmail.com';

const NODES = [
  { id: 'oliver', kind: 'root', x: 0, y: 0,
    title: 'Oliver Nguyen',
    meta: 'I build LLM agents. One ran a project alone for a week.',
    status: 'CALIFORNIA · REV 2027',
    blurb: 'Agent builder. This canvas is the operator\u2019s desk: every node is something real \u2014 a shipped project, a day of an autonomous run, a role, a channel. Type into the prompt bar below, press \u2318K, or just click around.',
    stats: [{ v: '30', l: 'nodes, all real' }, { v: '7', l: 'days one ran alone' }, { v: '15+', l: 'students coached' }],
    tech: ['Claude Code', 'Python', 'React', 'MCP'],
    rel: ['operator', 'techx', 'email'] },

  /* -------- agents -------- */
  { id: 'agents', kind: 'group', parent: 'oliver', x: 500, y: -60,
    title: 'Agents', meta: '4 shipped projects',
    blurb: 'Agent systems built around Claude \u2014 an autonomous week-long loop, a macOS toolbelt, a notarizing extension, and a content pipeline.',
    stats: [{ v: '4', l: 'projects' }],
    rel: ['operator', 'mac-agent', 'scopecreep'] },

  { id: 'operator', kind: 'project', parent: 'agents', x: 900, y: -430,
    title: 'Voice / Operator', meta: 'Autonomous Claude Code loop', status: 'RAN 7 DAYS',
    blurb: 'A Claude Code loop that ran one real project alone for seven days \u2014 planning, coding, and shipping with no human at the keyboard. Every choice went into a decisions log; every morning it emailed a status report. The ring around this node is the week itself \u2014 open any day.',
    stats: [{ v: '257', l: 'decision entries' }, { v: '7', l: 'days autonomous' }, { v: '0', l: 'human commits' }],
    tech: ['Claude Code', 'Python', 'LaunchAgent'],
    rel: ['day-1', 'day-7', 'mac-agent'] },

  { id: 'mac-agent', kind: 'project', parent: 'agents', x: 1060, y: -30,
    title: 'Mac-Agent', meta: 'MCP toolbelt for macOS', status: 'ACTIVE',
    blurb: 'Gives Claude hands on this Mac: screenshots, window control, files, and app automation exposed as typed MCP tools. The operator loop ran on top of it.',
    stats: [{ v: '8', l: 'MCP tools' }, { v: '1', l: 'Mac, fully driven' }],
    tech: ['MCP', 'AppleScript', 'Python'],
    rel: ['mcp-tools', 'operator'] },

  { id: 'mcp-tools', kind: 'project', parent: 'mac-agent', x: 1330, y: -140,
    title: 'MCP Toolbelt', meta: 'the 8 registered tools', status: 'REGISTRY',
    blurb: 'The tool registry Mac-Agent exposes to Claude. Each one is typed, sandboxed where it can be, and logged when it fires. This is what \u201chands on a Mac\u201d actually means.',
    tech: ['screenshot', 'window.list', 'window.focus', 'fs.read', 'fs.write', 'app.open', 'shell.run', 'clipboard'],
    rel: ['mac-agent', 'operator'] },

  { id: 'scopecreep', kind: 'project', parent: 'agents', x: 880, y: 200,
    title: 'ScopeCreep Notary', meta: 'Chrome extension \u00b7 0 LLM calls', status: 'SHIPPED',
    blurb: 'Flags scope creep in client threads as you read them. A pure lexicon pass highlights creep phrases in place \u2014 no model in the loop, nothing leaves the tab.',
    stats: [{ v: '0', l: 'LLM calls' }, { v: '~40', l: 'lexicon lines' }],
    tech: ['Chrome MV3', 'JavaScript'],
    rel: ['articlewriter', 'mac-agent'] },

  { id: 'articlewriter', kind: 'project', parent: 'agents', x: 650, y: 360,
    title: 'Articlewriter', meta: 'research \u2192 draft \u2192 composite', status: 'ARCHIVED',
    blurb: 'An end-to-end content pipeline: researches a topic, drafts the piece, and composites the final output image without hand-holding.',
    stats: [{ v: '1', l: 'pipeline, end to end' }],
    tech: ['Python', 'LLM pipeline'], stub: '/articlewriter',
    rel: ['scopecreep', 'pages'] },

  /* -------- the operator week ring (day-1..7 placed programmatically) -------- */

  /* -------- robotics -------- */
  { id: 'robotics', kind: 'group', parent: 'oliver', x: -500, y: -180,
    title: 'Robotics', meta: 'TechX \u00b7 mentor & coach',
    blurb: 'The hardware side: mentoring a competitive robotics program through build seasons and championships.',
    rel: ['techx', 'worlds'] },
  { id: 'techx', kind: 'role', parent: 'robotics', x: -880, y: -320,
    title: 'TechX Robotics', meta: 'mentor & coach \u00b7 2023 \u2192', status: 'NOW',
    blurb: 'Mentoring 15+ students through build seasons \u2014 design reviews, code, and competition strategy. Seventeen awards and four state qualifications so far.',
    stats: [{ v: '15+', l: 'students' }, { v: '17', l: 'awards' }, { v: '4\u00d7', l: 'states' }],
    rel: ['worlds', 'eagle-scout'] },
  { id: 'worlds', kind: 'credential', parent: 'robotics', x: -940, y: -80,
    title: 'Worlds Qualification', meta: 'team qualified to Worlds',
    blurb: 'A team I coach qualified for the world championship \u2014 the program\u2019s first.',
    stats: [{ v: '1', l: 'Worlds-qualified team' }],
    rel: ['techx', 'robotics'] },

  /* -------- leadership -------- */
  { id: 'leadership', kind: 'group', parent: 'oliver', x: -420, y: 240,
    title: 'Leadership', meta: 'roles & credentials',
    blurb: 'Roles and credentials from outside the terminal.',
    rel: ['virtual-enterprise', 'eagle-scout'] },
  { id: 'virtual-enterprise', kind: 'role', parent: 'leadership', x: -800, y: 200,
    title: 'Virtual Enterprise', meta: 'student-run company',
    blurb: 'Led a student-run company through the Virtual Enterprise program \u2014 product, pitch, and the P&L behind it.',
    rel: ['eagle-scout', 'techx'] },
  { id: 'eagle-scout', kind: 'credential', parent: 'leadership', x: -680, y: 430,
    title: 'Eagle Scout', meta: 'scouting\u2019s highest rank',
    blurb: 'Planned and led a community service project to completion \u2014 Eagle rank, the long way.',
    rel: ['virtual-enterprise', 'leadership'] },

  /* -------- pages -------- */
  { id: 'pages', kind: 'group', parent: 'oliver', x: 120, y: 460,
    title: 'Pages', meta: 'public utilities',
    blurb: 'The public utility pages that live on the site today. Each is a real route; here they\u2019re reachable nodes.',
    rel: ['pull', 'sat-resources'] },
  { id: 'pull', kind: 'page', parent: 'pages', x: -140, y: 640,
    title: 'Pull', meta: 'utility page',
    blurb: 'A small utility page that lives on the site today. In v1.2 it gets the man-page treatment; here it\u2019s just a node you can reach.',
    stub: '/pull', rel: ['pages', 'permit'] },
  { id: 'permit', kind: 'page', parent: 'pages', x: 160, y: 700,
    title: 'Driving Permit', meta: 'notes & checklist',
    blurb: 'Step-by-step notes for the California permit process. Cross-linked with the license guide \u2014 the edge between them is authored, not inferred.',
    stub: '/permit', rel: ['license', 'pages'] },
  { id: 'license', kind: 'page', parent: 'pages', x: 430, y: 760,
    title: 'Driver\u2019s License', meta: 'notes & checklist',
    blurb: 'The follow-on guide: booking the behind-the-wheel test and what to bring. See also: permit.',
    stub: '/license', rel: ['permit', 'sat-resources'] },
  { id: 'sat-resources', kind: 'page', parent: 'pages', x: 580, y: 560,
    title: 'SAT Resources', meta: 'curated list',
    blurb: 'The materials that actually helped \u2014 curated, not scraped. (1540, for what it\u2019s worth.)',
    stub: '/sat-resources', rel: ['license', 'pages'] },

  /* -------- contact -------- */
  { id: 'contact', kind: 'group', parent: 'oliver', x: -40, y: -380,
    title: 'Contact', meta: 'open channel',
    blurb: 'The open channel. Email is fastest; the rest rides along.',
    rel: ['email', 'resume'] },
  { id: 'email', kind: 'channel', parent: 'contact', x: 230, y: -540,
    title: 'Email', meta: EMAIL, status: 'FASTEST',
    blurb: 'The primary channel. Copy it, or click through \u2014 this one is real even in the prototype.',
    link: { href: 'mailto:' + EMAIL, label: EMAIL },
    rel: ['resume', 'github'] },
  { id: 'github', kind: 'channel', parent: 'contact', x: 10, y: -660,
    title: 'GitHub', meta: 'code & experiments',
    blurb: 'Where the agent projects live \u2014 the parts that are public, anyway.',
    stub: 'github \u2014 external on real site', rel: ['email', 'mac-agent'] },
  { id: 'linkedin', kind: 'channel', parent: 'contact', x: -250, y: -620,
    title: 'LinkedIn', meta: 'the formal record',
    blurb: 'The suit-and-tie mirror of this graph.',
    stub: 'linkedin \u2014 external on real site', rel: ['email', 'resume'] },
  { id: 'resume', kind: 'channel', parent: 'contact', x: -470, y: -470,
    title: 'Resume', meta: 'PDF \u00b7 one page',
    blurb: 'One page, current. The graph is better, but the PDF travels.',
    stub: '/resume.pdf', rel: ['email', 'linkedin'] },
];

/* the operator week — 7 day nodes in a ring (05-v1-spec §4.2) */
const DAY_BEATS = [
  ['06:04 \u2709 kickoff \u2014 scope confirmed, repo initialized',
   '10:22 \u25c6 decision #12 \u2014 static prototype before framework migration',
   '18:40 \u2192 41 tool calls \u00b7 first end-to-end pass'],
  ['07:00 \u2709 morning report \u2014 day 1 recap sent',
   '11:15 \u25c6 decision #48 \u2014 cut the sidebar, ship the log viewer',
   '21:03 \u2192 tests green on retry loop'],
  ['06:12 \u25c6 decision #141 \u2014 restructure email templates',
   '13:37 \u2192 refactor: split parser from renderer',
   '19:20 \u2709 progress email drafted + sent'],
  ['08:30 \u25c6 decision #163 \u2014 pin dependency, stop the flake',
   '12:02 \u2192 bulk rename migration \u00b7 220 files',
   '23:47 \u25c6 late fix \u2014 timezone bug in scheduler'],
  ['07:00 \u2709 morning report \u2014 halfway summary',
   '10:45 \u25c6 decision #201 \u2014 write docs before polish',
   '16:30 \u2192 screenshot diff pass \u00b7 3 regressions fixed'],
  ['09:12 \u25c6 decision #233 \u2014 freeze scope for ship',
   '14:58 \u2192 cleanup: dead code sweep',
   '20:10 \u2709 pre-ship checklist mailed'],
  ['06:50 \u25c6 decision #257 \u2014 final: ship it',
   '11:00 \u2192 tag v1.0 \u00b7 handoff notes written',
   '12:00 \u2709 final report \u2014 7 days, 0 human commits'],
];

(function addDays() {
  const cx = 900, cy = -430, r = 175;
  const opIdx = NODES.findIndex(n => n.id === 'operator');
  const days = [];
  for (let i = 0; i < 7; i++) {
    const a = (-90 + i * (360 / 7)) * Math.PI / 180;
    const n = i + 1;
    days.push({
      id: 'day-' + n, kind: 'day', parent: 'operator',
      x: Math.round(cx + r * Math.cos(a)), y: Math.round(cy + r * Math.sin(a)),
      title: 'DAY ' + n, dTitle: 'Day ' + n,
      meta: '2026-05-' + (20 + n), status: 'DAY ' + n + ' / 7',
      blurb: 'One day of the autonomous run, curated from the real decisions log.',
      beats: DAY_BEATS[i],
      rel: ['day-' + (n === 1 ? 7 : n - 1), 'day-' + (n === 7 ? 1 : n + 1), 'operator'],
    });
  }
  NODES.splice(opIdx + 1, 0, ...days);
})();

const EXTRA_EDGES = [['operator', 'mac-agent'], ['permit', 'license']];

const byId = new Map(NODES.map(n => [n.id, n]));
const ORDER = NODES.map(n => n.id);
const EDGES = NODES.filter(n => n.parent).map(n => [n.parent, n.id]).concat(EXTRA_EDGES);

const HALF = k =>
  k === 'root' ? [150, 72] :
  k === 'group' ? [92, 30] :
  k === 'day' ? [48, 20] : [106, 48];

/* ------------------------------ build DOM ------------------------------ */

const stage = document.getElementById('stage');
const world = document.getElementById('world');
const svgNS = 'http://www.w3.org/2000/svg';

const svg = document.createElementNS(svgNS, 'svg');
svg.id = 'edges';
svg.setAttribute('width', '5000');
svg.setAttribute('height', '5000');
svg.setAttribute('viewBox', '-2500 -2500 5000 5000');
world.appendChild(svg);

const adj = new Map();          // id -> Set(neighbor ids)
const edgeEls = new Map();      // id -> [path els]
const edgeByPair = new Map();   // 'a|b' (as drawn) -> path el
const push = (m, k, v) => { if (!m.has(k)) m.set(k, []); m.get(k).push(v); };

EDGES.forEach(([a, b], i) => {
  const na = byId.get(a), nb = byId.get(b);
  const dx = nb.x - na.x, dy = nb.y - na.y;
  const dist = Math.hypot(dx, dy) || 1;
  const mx = (na.x + nb.x) / 2 + (-dy / dist) * dist * 0.08;
  const my = (na.y + nb.y) / 2 + (dx / dist) * dist * 0.08;
  const p = document.createElementNS(svgNS, 'path');
  p.setAttribute('d', `M ${na.x} ${na.y} Q ${mx} ${my} ${nb.x} ${nb.y}`);
  p.setAttribute('pathLength', '1');
  p.setAttribute('class', 'edge');
  p.style.setProperty('--d', (0.45 + i * 0.02).toFixed(2) + 's');
  svg.appendChild(p);
  if (!adj.has(a)) adj.set(a, new Set());
  if (!adj.has(b)) adj.set(b, new Set());
  adj.get(a).add(b); adj.get(b).add(a);
  push(edgeEls, a, p); push(edgeEls, b, p);
  edgeByPair.set(a + '|' + b, p);
});

const els = new Map();          // id -> node el

NODES.forEach((n, i) => {
  const el = document.createElement('div');
  el.className = `node kind-${n.kind}` +
    (n.kind !== 'root' && n.kind !== 'group' ? ' leaf' : '');
  el.dataset.id = n.id;
  el.style.transform = `translate(${n.x}px, ${n.y}px)`;
  el.dataset.i = i;

  const drift = document.createElement('div');
  drift.className = 'drift';
  drift.style.animationDelay = (-Math.random() * 8).toFixed(2) + 's';
  drift.style.animationDuration = (6 + Math.random() * 3.5).toFixed(2) + 's';

  const card = document.createElement('div');
  card.className = 'card';
  card.setAttribute('role', 'button');

  if (n.kind === 'root') {
    card.innerHTML = `<div class="t"></div><div class="m"></div>`;
    card.querySelector('.t').textContent = n.title;
    card.querySelector('.m').textContent = n.meta;
  } else if (n.kind === 'group') {
    card.innerHTML = `<span class="g-dot"></span><span class="t"></span>`;
    card.querySelector('.t').textContent = n.title;
  } else if (n.kind === 'day') {
    card.innerHTML = `<div class="t"></div>`;
    card.querySelector('.t').textContent = n.title;
  } else {
    card.innerHTML = `<div class="k"></div><div class="t"></div><div class="m"></div>`;
    card.querySelector('.k').textContent = `${KIND[n.kind].g} ${KIND[n.kind].label}`;
    card.querySelector('.t').textContent = n.title;
    card.querySelector('.m').textContent = n.meta;
  }

  drift.appendChild(card);
  el.appendChild(drift);
  world.appendChild(el);
  els.set(n.id, el);

  el.addEventListener('pointerenter', () => setHover(n.id));
  el.addEventListener('pointerleave', clearHover);

  let down = null;
  el.addEventListener('pointerdown', e => { down = [e.clientX, e.clientY]; });
  el.addEventListener('click', e => {
    e.stopPropagation();
    if (down && Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 6) return;
    focusNode(n.id);
  });
});

function setHover(id) {
  stage.classList.add('hovering');
  els.get(id).classList.add('hot');
  (adj.get(id) || []).forEach(nb => els.get(nb).classList.add('hot'));
  (edgeEls.get(id) || []).forEach(p => p.classList.add('hot'));
}
function clearHover() {
  stage.classList.remove('hovering');
  els.forEach(el => el.classList.remove('hot'));
  svg.querySelectorAll('.edge.hot').forEach(p => p.classList.remove('hot'));
}

/* ------------------------------- camera ------------------------------- */

let cur = d3.zoomIdentity;
const stageSel = d3.select(stage);
const zLabel = document.getElementById('z-label');

function apply(t) {
  cur = t;
  world.style.transform = `translate(${t.x}px, ${t.y}px) scale(${t.k})`;
  stage.style.backgroundPosition = `${t.x}px ${t.y}px`;
  stage.style.backgroundSize = `${26 * t.k}px ${26 * t.k}px`;
  stage.classList.toggle('far', t.k < 0.45);
  zLabel.textContent = Math.round(t.k * 100) + '%';
}

/* inertia: sample pointer velocity during drag, decay on release */
let samples = [];
let iRAF = null;

function sample(ev) {
  const p = ev.touches ? ev.touches[0] : ev;
  if (!p) return;
  samples.push({ x: p.clientX, y: p.clientY, t: performance.now() });
  if (samples.length > 4) samples.shift();
}
function cancelInertia() { if (iRAF) { cancelAnimationFrame(iRAF); iRAF = null; } samples = []; }
function maybeInertia() {
  if (RM || samples.length < 2) return;
  const a = samples[samples.length - 2], b = samples[samples.length - 1];
  const now = performance.now();
  const dt = b.t - a.t;
  if (now - b.t > 100 || dt <= 0) { samples = []; return; }
  let vx = (b.x - a.x) / dt, vy = (b.y - a.y) / dt;   /* px/ms, screen space */
  samples = [];
  if (Math.hypot(vx, vy) < 0.12) return;
  let last = performance.now();
  const step = nowT => {
    const d = Math.min(40, nowT - last); last = nowT;
    zoom.translateBy(stageSel, vx * d / cur.k, vy * d / cur.k);
    const f = Math.exp(-d / 240);
    vx *= f; vy *= f;
    iRAF = Math.hypot(vx, vy) > 0.015 ? requestAnimationFrame(step) : null;
  };
  iRAF = requestAnimationFrame(step);
}

function worldBBox(nodes) {
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  nodes.forEach(n => {
    const [hw, hh] = HALF(n.kind);
    x0 = Math.min(x0, n.x - hw); x1 = Math.max(x1, n.x + hw);
    y0 = Math.min(y0, n.y - hh); y1 = Math.max(y1, n.y + hh);
  });
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}
const BB = worldBBox(NODES);

const zoom = d3.zoom()
  .scaleExtent([0.35, 2.2])
  .translateExtent([[BB.x - 700, BB.y - 600], [BB.x + BB.w + 700, BB.y + BB.h + 600]])
  .on('start', e => {
    if (e.sourceEvent) {
      cancelInertia();
      const t = e.sourceEvent.type;
      if (t === 'mousedown' || t === 'touchstart' || t === 'pointerdown') stage.classList.add('grabbing');
    }
  })
  .on('zoom', e => {
    apply(e.transform);
    if (e.sourceEvent && /move$/.test(e.sourceEvent.type)) sample(e.sourceEvent);
  })
  .on('end', e => {
    stage.classList.remove('grabbing');
    if (e.sourceEvent) maybeInertia();
  });

stageSel.call(zoom).on('dblclick.zoom', null);

/* fly-to via van Wijk smooth zoom (d3.interpolateZoom drives the pacing) */
function viewOf(t) {
  return [(innerWidth / 2 - t.x) / t.k, (innerHeight / 2 - t.y) / t.k, innerWidth / t.k];
}
function flyTransform(t) {
  cancelInertia();
  let dur = 0;
  if (!RM) {
    const i = d3.interpolateZoom(viewOf(cur), viewOf(t));
    dur = Math.max(380, Math.min(1050, i.duration * 0.9));
  }
  stageSel.transition('cam').duration(dur).call(zoom.transform, t);
}

function boundsTransform(bb, pad, kMax, bottomInset = 0) {
  const vh = innerHeight - bottomInset;          /* keep clear of bottom chrome */
  const k = Math.max(0.35, Math.min(kMax,
    Math.min(innerWidth / (bb.w + pad * 2), vh / (bb.h + pad * 2))));
  const cx = bb.x + bb.w / 2, cy = bb.y + bb.h / 2;
  return d3.zoomIdentity
    .translate(innerWidth / 2 - k * cx, vh / 2 - k * cy)
    .scale(k);
}
const fitTransform = () => boundsTransform(BB, 90, 1.1, 120);

function dossierWidth() { return Math.min(430, innerWidth * 0.34); }
function focusTransform(n) {
  const k = n.kind === 'root' ? 1 : n.kind === 'day' ? 1.3 : 1.15;
  const px = (innerWidth - dossierWidth()) / 2, py = innerHeight * 0.5;
  return d3.zoomIdentity.translate(px - k * n.x, py - k * n.y).scale(k);
}

/* --------------------------- focus + dossier --------------------------- */

const dBody = document.getElementById('d-body');
const S = { focused: null, pre: null };

function fillDossier(n) {
  const k = KIND[n.kind];
  let h = `<div class="d-kind">${k.g} ${k.label}` +
          (n.status ? `<span class="d-status">${n.status}</span>` : '') + `</div>`;
  h += `<h2 class="d-title">${n.dTitle || n.title}</h2>`;
  if (n.meta) h += `<div class="d-type">${n.meta}</div>`;
  if (n.blurb) h += `<p class="d-blurb">${n.blurb}</p>`;
  if (n.beats) h += `<div class="d-beats">` + n.beats.map(b => `<div>${b}</div>`).join('') + `</div>`;
  if (n.stats && n.stats.length) {
    h += `<div class="d-stats">` + n.stats.map(s =>
      `<div class="d-stat"><div class="v">${s.v}</div><div class="l">${s.l}</div></div>`).join('') + `</div>`;
  }
  if (n.tech && n.tech.length) {
    h += `<div class="d-tech">` + n.tech.map(t => `<span>${t}</span>`).join('') + `</div>`;
  }
  if (n.rel && n.rel.length) {
    h += `<div class="d-rel"><span class="d-rel-h">linked</span>` +
      n.rel.filter(id => byId.has(id)).map(id =>
        `<button data-goto="${id}">\u2192 ${byId.get(id).dTitle || byId.get(id).title}</button>`).join('') +
      `</div>`;
  }
  if (n.link) h += `<a class="d-link" href="${n.link.href}">${n.link.label}</a>`;
  else if (n.stub) h += `<div class="d-stub">\u2197 ${n.stub} \u00b7 stubbed in prototype</div>`;
  h += `<div class="d-esc">esc to close</div>`;
  dBody.innerHTML = h;
}

dBody.addEventListener('click', e => {
  const b = e.target.closest('[data-goto]');
  if (b) focusNode(b.dataset.goto);
});

function focusNode(id) {
  const n = byId.get(id);
  if (!n) return;
  if (!S.focused) S.pre = cur;                      /* remember where we came from */
  if (S.focused) els.get(S.focused).classList.remove('active');
  S.focused = id;
  els.get(id).classList.add('active');
  fillDossier(n);
  document.body.classList.add('dossier-open');
  document.getElementById('dossier').setAttribute('aria-hidden', 'false');
  flyTransform(focusTransform(n));
}

function closeDossier(flyBack = true) {
  if (S.focused) els.get(S.focused).classList.remove('active');
  const wasOpen = document.body.classList.contains('dossier-open');
  S.focused = null;
  document.body.classList.remove('dossier-open');
  document.getElementById('dossier').setAttribute('aria-hidden', 'true');
  if (flyBack && wasOpen && S.pre) flyTransform(S.pre);
  S.pre = null;
}

document.getElementById('d-close').addEventListener('click', () => closeDossier());

/* background click closes; double-click fits */
let stageDown = null;
stage.addEventListener('pointerdown', e => { stageDown = [e.clientX, e.clientY]; });
stage.addEventListener('click', e => {
  if (e.target.closest('.node')) return;
  if (stageDown && Math.hypot(e.clientX - stageDown[0], e.clientY - stageDown[1]) > 6) return;
  if (tour.on) return;
  if (document.body.classList.contains('dossier-open')) closeDossier();
});
stage.addEventListener('dblclick', e => {
  if (e.target.closest('.node')) return;
  closeDossier(false);
  flyTransform(fitTransform());
});

/* --------------------- pulse routing (root → target) ------------------- */

function pathFromRoot(id) {
  const chain = [];
  let n = byId.get(id);
  while (n) { chain.unshift(n.id); n = byId.get(n.parent); }
  return chain;                                     /* ['oliver', ..., id] */
}

function arrive(id) {
  const el = els.get(id);
  el.classList.add('arrived');
  setTimeout(() => el.classList.remove('arrived'), 700);
}

function runPulse(targetId, done) {
  const chain = pathFromRoot(targetId);
  if (RM || chain.length < 2) { done(); return; }
  const segs = [];
  for (let i = 0; i < chain.length - 1; i++) {
    const fwd = edgeByPair.get(chain[i] + '|' + chain[i + 1]);
    const rev = edgeByPair.get(chain[i + 1] + '|' + chain[i]);
    if (fwd || rev) segs.push({ p: fwd || rev, rev: !fwd });
  }
  if (!segs.length) { done(); return; }
  const bead = document.createElementNS(svgNS, 'circle');
  bead.setAttribute('r', '5');
  bead.setAttribute('class', 'bead');
  svg.appendChild(bead);
  let si = 0;
  const runSeg = () => {
    const s = segs[si];
    const L = s.p.getTotalLength();
    const dur = Math.max(180, Math.min(400, L * 0.5));
    const t0 = performance.now();
    s.p.classList.add('routing');
    const lastSeg = si === segs.length - 1;
    const tick = now => {
      let t = Math.min(1, (now - t0) / dur);
      const e = lastSeg ? t * (2 - t) : t;          /* ease out on arrival */
      const pt = s.p.getPointAtLength((s.rev ? 1 - e : e) * L);
      bead.setAttribute('cx', pt.x);
      bead.setAttribute('cy', pt.y);
      if (t < 1) { requestAnimationFrame(tick); return; }
      const seg = s;
      setTimeout(() => seg.p.classList.remove('routing'), 300);
      si++;
      if (si < segs.length) runSeg();
      else { bead.remove(); arrive(targetId); done(); }
    };
    requestAnimationFrame(tick);
  };
  runSeg();
}

/* ------------------------- intent registry ------------------------- */

const INTENTS = [
  { label: 'Replay the week-long loop', kind: 'node', ph: 'week loop operator replay autonomous seven days ran alone voice', run: { type: 'node', id: 'operator' } },
  { label: 'Open Mac-Agent', kind: 'node', ph: 'mac agent toolbelt hands macos automation', run: { type: 'node', id: 'mac-agent' } },
  { label: 'Show the MCP toolbelt', kind: 'node', ph: 'tools mcp registry screenshot shell what runs on this mac', run: { type: 'node', id: 'mcp-tools' } },
  { label: 'Open ScopeCreep Notary', kind: 'node', ph: 'scopecreep notary chrome extension lexicon zero llm', run: { type: 'node', id: 'scopecreep' } },
  { label: 'Open Articlewriter', kind: 'node', ph: 'articlewriter writing pipeline content draft', run: { type: 'node', id: 'articlewriter' } },
  { label: 'Show robotics', kind: 'node', ph: 'robotics techx mentor coach students worlds hardware', run: { type: 'node', id: 'robotics' } },
  { label: 'Show leadership', kind: 'node', ph: 'leadership eagle scout virtual enterprise roles credentials', run: { type: 'node', id: 'leadership' } },
  { label: 'Browse the pages', kind: 'node', ph: 'pages guides pull permit license sat utilities writing', run: { type: 'node', id: 'pages' } },
  { label: 'Contact \u2014 open channel', kind: 'node', ph: 'contact email say hi reach out channel talk', run: { type: 'node', id: 'email' } },
  { label: 'Copy my email', kind: 'action', ph: 'copy email clipboard address', run: { type: 'copy' } },
  { label: 'Open resume', kind: 'node', ph: 'resume cv pdf hire', run: { type: 'node', id: 'resume' } },
  { label: 'Start the guided tour', kind: 'action', ph: 'tour guide walkthrough show me around start intro', run: { type: 'tour' } },
  { label: 'Fit the whole graph', kind: 'action', ph: 'fit overview zoom out everything reset home center', run: { type: 'fit' } },
  { label: 'Switch to terminal mode', kind: 'action', ph: 'terminal term dark mode switch night', run: { type: 'term' } },
];

function matchIntents(q) {
  q = q.trim().toLowerCase();
  if (!q) return [];
  const out = [];
  const day = q.match(/day\s*([1-7])/);
  if (day) out.push({ label: 'Jump to day ' + day[1], kind: 'node', run: { type: 'node', id: 'day-' + day[1] }, score: 200 });
  INTENTS.forEach(it => {
    const hay = (it.label + ' ' + it.ph).toLowerCase();
    let score = -1;
    if (hay.includes(q)) score = 100 - hay.indexOf(q) * 0.05;
    else {
      const words = q.split(/\s+/);
      if (words.length > 1 && words.every(w => hay.includes(w))) score = 60;
    }
    if (score > 0) out.push(Object.assign({ score }, it));
  });
  return out.sort((a, b) => b.score - a.score);
}

function runIntent(it) {
  switch (it.run.type) {
    case 'node':
      runPulse(it.run.id, () => focusNode(it.run.id));
      break;
    case 'copy':
      (navigator.clipboard ? navigator.clipboard.writeText(EMAIL) : Promise.reject())
        .then(() => toast('copied \u2014 ' + EMAIL))
        .catch(() => toast(EMAIL));
      break;
    case 'tour': startTour(); break;
    case 'fit': closeDossier(false); flyTransform(fitTransform()); break;
    case 'term': toast('terminal mode lives at prototype/terminal \u2014 not wired up yet'); break;
  }
}

/* ------------------------------ prompt bar ------------------------------ */

const pInput = document.getElementById('p-input');
const pSuggest = document.getElementById('p-suggest');
let pMatches = [], pSel = 0;

function renderSuggest() {
  if (!pMatches.length) { pSuggest.classList.remove('open'); pSuggest.innerHTML = ''; return; }
  pSuggest.innerHTML = pMatches.slice(0, 4).map((m, i) =>
    `<div class="sug${i === pSel ? ' sel' : ''}" data-i="${i}">` +
    `<span class="sl">${m.label}</span><span class="sk">${m.kind}</span></div>`).join('');
  pSuggest.classList.add('open');
}
pSuggest.addEventListener('click', e => {
  const row = e.target.closest('.sug');
  if (!row) return;
  const it = pMatches[+row.dataset.i];
  clearPrompt();
  runIntent(it);
});

function clearPrompt() {
  pInput.value = '';
  pMatches = []; pSel = 0;
  renderSuggest();
  pInput.blur();
}

pInput.addEventListener('input', () => {
  pMatches = matchIntents(pInput.value);
  pSel = 0;
  renderSuggest();
});
pInput.addEventListener('keydown', e => {
  if (e.key === 'Escape') { clearPrompt(); }
  else if (e.key === 'ArrowDown') { e.preventDefault(); if (pMatches.length) { pSel = (pSel + 1) % Math.min(4, pMatches.length); renderSuggest(); } }
  else if (e.key === 'ArrowUp') { e.preventDefault(); if (pMatches.length) { pSel = (pSel + Math.min(4, pMatches.length) - 1) % Math.min(4, pMatches.length); renderSuggest(); } }
  else if (e.key === 'Enter') {
    if (pMatches.length) { const it = pMatches[pSel]; clearPrompt(); runIntent(it); }
    else if (pInput.value.trim()) toast('no match \u2014 try \u201cweek\u201d, \u201cday 4\u201d or \u201crobotics\u201d');
  }
  e.stopPropagation();
});

/* rotating typewriter placeholder */
const PHRASES = [
  'replay the week-long loop', 'show robotics', 'what runs on this mac?',
  'day 4', 'copy email', 'start the guided tour',
];
if (RM || STILL) {
  pInput.placeholder = 'try: \u201creplay the week-long loop\u201d';
} else {
  let phI = 0, chI = 0, hold = 0;
  setInterval(() => {
    if (document.activeElement === pInput || pInput.value) return;
    const s = PHRASES[phI];
    if (chI < s.length) { chI++; pInput.placeholder = 'try: \u201c' + s.slice(0, chI) + '\u201d'; }
    else if (++hold > 30) { hold = 0; chI = 0; phI = (phI + 1) % PHRASES.length; }
  }, 60);
}

/* ------------------------------ ⌘K palette ------------------------------ */

const palette = document.getElementById('palette');
const palInput = document.getElementById('pal-input');
const palList = document.getElementById('pal-list');
let palMatches = [], palSel = 0;

const palOpen = () => palette.classList.contains('open');

function renderPal() {
  if (!palMatches.length) {
    palList.innerHTML = `<li class="empty">no match \u2014 try \u201cweek\u201d, \u201cday 4\u201d or \u201ctour\u201d</li>`;
    return;
  }
  palList.innerHTML = palMatches.slice(0, 9).map((m, i) =>
    `<li class="${i === palSel ? 'sel' : ''}" data-i="${i}">` +
    `<span class="pl">${m.label}</span><span class="pk">${m.kind}</span></li>`).join('');
}
function openPalette() {
  palette.classList.add('open');
  palInput.value = '';
  palMatches = INTENTS.map(it => Object.assign({ score: 1 }, it));
  palSel = 0;
  renderPal();
  palInput.focus();
}
function closePalette() { palette.classList.remove('open'); palInput.blur(); }

palInput.addEventListener('input', () => {
  palMatches = palInput.value.trim()
    ? matchIntents(palInput.value)
    : INTENTS.map(it => Object.assign({ score: 1 }, it));
  palSel = 0;
  renderPal();
});
palInput.addEventListener('keydown', e => {
  const n = Math.min(9, palMatches.length);
  if (e.key === 'Escape') closePalette();
  else if (e.key === 'ArrowDown') { e.preventDefault(); if (n) { palSel = (palSel + 1) % n; renderPal(); } }
  else if (e.key === 'ArrowUp') { e.preventDefault(); if (n) { palSel = (palSel + n - 1) % n; renderPal(); } }
  else if (e.key === 'Enter' && n) { const it = palMatches[palSel]; closePalette(); runIntent(it); }
  e.stopPropagation();
});
palList.addEventListener('click', e => {
  const row = e.target.closest('li[data-i]');
  if (!row) return;
  const it = palMatches[+row.dataset.i];
  closePalette();
  runIntent(it);
});
document.getElementById('p-backdrop').addEventListener('click', closePalette);
document.getElementById('mk-cmdk').addEventListener('click', openPalette);

/* ------------------------------- / filter ------------------------------- */

const fBar = document.getElementById('filterbar');
const fInput = document.getElementById('f-input');
const fCount = document.getElementById('f-count');
let fMatches = [];

function openFilter() { fBar.classList.add('open'); fInput.value = ''; fInput.focus(); }
function closeFilter() {
  fBar.classList.remove('open');
  stage.classList.remove('filtering');
  els.forEach(el => el.classList.remove('match'));
  fMatches = [];
  fCount.textContent = '';
  fInput.blur();
}

fInput.addEventListener('input', () => {
  const q = fInput.value.trim().toLowerCase();
  els.forEach(el => el.classList.remove('match'));
  if (!q) { stage.classList.remove('filtering'); fMatches = []; fCount.textContent = ''; return; }
  const scored = [];
  NODES.forEach((n, i) => {
    const hay = [n.title, n.dTitle || '', n.meta, n.kind, n.parent || '', (n.tech || []).join(' ')].join(' ').toLowerCase();
    if (!hay.includes(q)) return;
    const t = (n.dTitle || n.title).toLowerCase();
    scored.push({ id: n.id, s: t.startsWith(q) ? 0 : t.includes(q) ? 1 : 2, i });
  });
  scored.sort((a, b) => a.s - b.s || a.i - b.i);
  fMatches = scored.map(m => m.id);
  stage.classList.add('filtering');
  fMatches.forEach(id => els.get(id).classList.add('match'));
  fCount.textContent = fMatches.length
    ? `${fMatches.length} match${fMatches.length === 1 ? '' : 'es'} \u00b7 \u21b5 fly`
    : 'no matches';
});
fInput.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeFilter();
  else if (e.key === 'Enter' && fMatches.length) {
    const top = fMatches[0];
    closeFilter();
    focusNode(top);
  }
  e.stopPropagation();
});

/* ------------------------------ guided tour ----------------------------- */

const TOUR = [
  { id: 'oliver', cap: 'One site, drawn as a graph \u2014 every node is real.' },
  { id: 'operator', cap: 'The flagship: a Claude loop that ran a project alone for 7 days.' },
  { id: 'day-4', cap: 'Each day logged decisions, tool calls, and a morning email.' },
  { id: 'mac-agent', cap: 'The toolbelt that gives Claude hands on a Mac.' },
  { id: 'mcp-tools', cap: 'Eight typed tools \u2014 this is what \u201chands\u201d means.' },
  { id: 'scopecreep', cap: 'Small honest tools too: zero LLM calls in this one.' },
  { id: 'techx', cap: 'Off-screen: 15+ robotics students, a Worlds-qualified team.' },
  { id: 'email', cap: 'The open channel. Say hi.' },
];

const tour = { on: false, i: 0 };
const tourHud = document.getElementById('tourhud');
const tStep = document.getElementById('t-step');
const tCap = document.getElementById('t-cap');

function applyStop() {
  const s = TOUR[tour.i];
  tStep.textContent = (tour.i + 1) + '/' + TOUR.length;
  tCap.textContent = s.cap;
  focusNode(s.id);
}
function startTour() {
  closeFilter(); closePalette();
  tour.on = true; tour.i = 0;
  tourHud.classList.add('on');
  applyStop();
}
function tourStep(dir) {
  tour.i += dir;
  if (tour.i < 0) { tour.i = 0; return; }
  if (tour.i >= TOUR.length) { endTour(); return; }
  applyStop();
}
function endTour() {
  tour.on = false;
  tourHud.classList.remove('on');
  closeDossier(false);
  flyTransform(fitTransform());
}

document.getElementById('tourbtn').addEventListener('click', startTour);

/* ------------------------------- keyboard ------------------------------- */

function cycle(dir) {
  const idx = S.focused ? ORDER.indexOf(S.focused) : -1;
  focusNode(ORDER[(idx + dir + ORDER.length) % ORDER.length]);
}

window.addEventListener('keydown', e => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    palOpen() ? closePalette() : openPalette();
    return;
  }
  if (palOpen()) { if (e.key === 'Escape') closePalette(); return; }
  const t = e.target;
  if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
  if (e.metaKey || e.ctrlKey || e.altKey) return;

  if (tour.on) {
    switch (e.key) {
      case 'ArrowRight': case 'ArrowDown': case 'Tab': e.preventDefault(); tourStep(1); return;
      case 'ArrowLeft': case 'ArrowUp': e.preventDefault(); tourStep(-1); return;
      case 'Escape': endTour(); return;
    }
  }

  switch (e.key) {
    case '/': e.preventDefault(); openFilter(); break;
    case 'Escape':
      if (fBar.classList.contains('open')) closeFilter();
      else if (document.body.classList.contains('dossier-open')) closeDossier();
      else flyTransform(fitTransform());
      break;
    case 'Tab': e.preventDefault(); cycle(e.shiftKey ? -1 : 1); break;
    case 'ArrowRight': case 'ArrowDown': e.preventDefault(); cycle(1); break;
    case 'ArrowLeft': case 'ArrowUp': e.preventDefault(); cycle(-1); break;
    case 'f': flyTransform(fitTransform()); break;
  }
});

/* ------------------------------- chrome -------------------------------- */

const toastEl = document.getElementById('toast');
let toastT = null;
function toast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastT);
  toastT = setTimeout(() => toastEl.classList.remove('show'), 2400);
}

document.querySelectorAll('.chip[data-group]').forEach(ch => {
  ch.addEventListener('click', () => {
    const g = ch.dataset.group;
    closeDossier(false);
    const members = NODES.filter(n => n.id === g || n.parent === g ||
      (byId.get(n.parent) && byId.get(n.parent).parent === g));
    flyTransform(boundsTransform(worldBBox(members), 130, 1.2, 120));
  });
});

document.getElementById('m-term').addEventListener('click', () =>
  toast('terminal mode lives at prototype/terminal \u2014 not wired up yet'));
document.getElementById('m-graph').addEventListener('click', () =>
  toast('already here \u2014 graph mode is the flagship'));

document.getElementById('z-in').addEventListener('click', () =>
  stageSel.transition('cam').duration(RM ? 0 : 240).call(zoom.scaleBy, 1.35));
document.getElementById('z-out').addEventListener('click', () =>
  stageSel.transition('cam').duration(RM ? 0 : 240).call(zoom.scaleBy, 1 / 1.35));
document.getElementById('z-fit').addEventListener('click', () => {
  closeDossier(false);
  flyTransform(fitTransform());
});

window.addEventListener('resize', () => {
  if (S.focused) flyTransform(focusTransform(byId.get(S.focused)));
});

/* --------------------------- entry + init --------------------------- */

stageSel.call(zoom.transform, fitTransform());

if (RM || STILL) {
  /* place directly, no assembly, no edge draw-in */
} else {
  stage.classList.add('ready');                     /* edges draw in */
  els.forEach((el, id) => {                         /* nodes assemble from center */
    const n = byId.get(id);
    el.style.opacity = '0';
    el.style.transform = `translate(${n.x * 0.12}px, ${n.y * 0.12}px)`;
  });
  requestAnimationFrame(() => requestAnimationFrame(() => {
    els.forEach((el, id) => {
      const n = byId.get(id);
      const d = (+el.dataset.i) * 18;
      el.style.transition =
        `transform .85s cubic-bezier(.22,.9,.3,1) ${d}ms, opacity .45s ease ${d}ms`;
      el.style.transform = `translate(${n.x}px, ${n.y}px)`;
      el.style.opacity = '1';
    });
    setTimeout(() => els.forEach(el => { el.style.transition = ''; }), 2200);
  }));
}

})();
