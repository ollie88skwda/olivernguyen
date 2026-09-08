/**
 * src/content/site.js — the single content model (05-v1-spec §2.2, seeded from
 * prototype/graph per build-plan P5).
 *
 * Both modes render from this module. Nothing in either mode hardcodes copy.
 * Positions live in src/graph/lib/layout.js (build-plan §4) — entities here are
 * position-free.
 *
 * Entity schema:
 *   {
 *     id,            // stable slug, used by intents & URLs
 *     kind,          // root | group | project | day | role | credential | page | channel
 *     title,         // node label
 *     dTitle?,       // dossier title override (day nodes: "Day 4")
 *     type,          // the one-line wh-type / meta line
 *     status?,       // status chip text
 *     blurb,         // 2-3 sentences
 *     stats,         // [{ value, label }] — display strings
 *     tech,          // string tokens
 *     link,          // { href, label } | null  (href starting with '/' = internal route)
 *     media,         // null | { kind, src, alt, poster }
 *     beats?,        // day nodes only — [{ t, kind: decision|tool|email, n?, text }]
 *     graph: {
 *       parent,      // parent node id (null for root) — defines the tree edge
 *       edges,       // extra drawn edges beyond parent→node (authored cross-links)
 *       rel,         // dossier "linked" chips (navigation, not drawn edges)
 *     },
 *   }
 *
 * NOTE (P5/L6): week beats are the prototype's curated-fiction set, in the real
 * log's format, until Oliver supplies real redacted beats. Data-only swap.
 */

export const KINDS = {
  root: { glyph: '●', label: 'root' },
  group: { glyph: '○', label: 'cluster' },
  project: { glyph: '◆', label: 'project' },
  day: { glyph: '◔', label: 'day log' },
  role: { glyph: '▣', label: 'role' },
  credential: { glyph: '✦', label: 'credential' },
  page: { glyph: '▤', label: 'page' },
  channel: { glyph: '✉', label: 'channel' },
};

const EMAIL = 'oliverdnguyen@gmail.com';

export const meta = {
  name: 'Oliver Nguyen',
  email: EMAIL,
  tagline: 'I build LLM agents. One ran a project alone for a week.',
  location: 'California',
  links: {
    github: 'https://github.com/ollie88skwda',
    linkedin: 'https://www.linkedin.com/in/oliver-nguyen-988b2a2a3/',
    resume: '/resume.pdf',
  },
};

/* ------------------------- authored entities (23) ------------------------- */

export const entities = [
  {
    id: 'oliver', kind: 'root',
    title: 'Oliver Nguyen',
    type: 'I build LLM agents. One ran a project alone for a week.',
    status: 'CALIFORNIA · REV 2027',
    blurb: 'Agent builder. This canvas is the operator’s desk: every node is something real — a shipped project, a day of an autonomous run, a role, a channel. Type into the prompt bar below, press ⌘K, or just click around.',
    stats: [
      { value: '30', label: 'nodes, all real' },
      { value: '7', label: 'days one ran alone' },
      { value: '15+', label: 'students coached' },
    ],
    tech: ['Claude Code', 'Python', 'React', 'MCP'],
    link: null, media: null,
    graph: { parent: null, edges: [], rel: ['operator', 'techx', 'email'] },
  },

  /* -------- agents -------- */
  {
    id: 'agents', kind: 'group',
    title: 'Agents', type: '4 shipped projects',
    blurb: 'Agent systems built around Claude — an autonomous week-long loop, a macOS toolbelt, a notarizing extension, and a content pipeline.',
    stats: [{ value: '4', label: 'projects' }],
    tech: [], link: null, media: null,
    graph: { parent: 'oliver', edges: [], rel: ['operator', 'mac-agent', 'scopecreep'] },
  },
  {
    id: 'operator', kind: 'project',
    title: 'Voice / Operator', type: 'Autonomous Claude Code loop', status: 'RAN 7 DAYS',
    blurb: 'A Claude Code loop that ran one real project alone for seven days — planning, coding, and shipping with no human at the keyboard. Every choice went into a decisions log; every morning it emailed a status report. The ring around this node is the week itself — open any day.',
    stats: [
      { value: '257', label: 'decision entries' },
      { value: '7', label: 'days autonomous' },
      { value: '0', label: 'human commits' },
    ],
    tech: ['Claude Code', 'Python', 'LaunchAgent'],
    link: null, media: null,
    graph: { parent: 'agents', edges: ['mac-agent'], rel: ['day-1', 'day-7', 'mac-agent'] },
  },
  {
    id: 'mac-agent', kind: 'project',
    title: 'Mac-Agent', type: 'MCP toolbelt for macOS', status: 'ACTIVE',
    blurb: 'Gives Claude hands on this Mac: screenshots, window control, files, and app automation exposed as typed MCP tools. The operator loop ran on top of it.',
    stats: [
      { value: '8', label: 'MCP tools' },
      { value: '1', label: 'Mac, fully driven' },
    ],
    tech: ['MCP', 'AppleScript', 'Python'],
    link: null, media: null,
    graph: { parent: 'agents', edges: [], rel: ['mcp-tools', 'operator'] },
  },
  {
    id: 'mcp-tools', kind: 'project',
    title: 'MCP Toolbelt', type: 'the 8 registered tools', status: 'REGISTRY',
    blurb: 'The tool registry Mac-Agent exposes to Claude. Each one is typed, sandboxed where it can be, and logged when it fires. This is what “hands on a Mac” actually means.',
    stats: [],
    tech: ['screenshot', 'window.list', 'window.focus', 'fs.read', 'fs.write', 'app.open', 'shell.run', 'clipboard'],
    link: null, media: null,
    graph: { parent: 'mac-agent', edges: [], rel: ['mac-agent', 'operator'] },
  },
  {
    id: 'scopecreep', kind: 'project',
    title: 'ScopeCreep Notary', type: 'Chrome extension · 0 LLM calls', status: 'SHIPPED',
    blurb: 'Flags scope creep in client threads as you read them. A pure lexicon pass highlights creep phrases in place — no model in the loop, nothing leaves the tab.',
    stats: [
      { value: '0', label: 'LLM calls' },
      { value: '~40', label: 'lexicon lines' },
    ],
    tech: ['Chrome MV3', 'JavaScript'],
    link: { href: 'https://github.com/ollie88skwda/scopecreep', label: 'github.com/ollie88skwda/scopecreep' },
    media: null,
    graph: { parent: 'agents', edges: [], rel: ['articlewriter', 'mac-agent'] },
  },
  {
    id: 'articlewriter', kind: 'project',
    title: 'Articlewriter', type: 'research → draft → composite', status: 'ARCHIVED',
    blurb: 'An end-to-end content pipeline: researches a topic, drafts the piece, and composites the final output image without hand-holding.',
    stats: [{ value: '1', label: 'pipeline, end to end' }],
    tech: ['Python', 'LLM pipeline'],
    link: { href: '/articlewriter', label: '/articlewriter' },
    media: null,
    graph: { parent: 'agents', edges: [], rel: ['scopecreep', 'pages'] },
  },

  /* -------- robotics -------- */
  {
    id: 'robotics', kind: 'group',
    title: 'Robotics', type: 'TechX · mentor & coach',
    blurb: 'The hardware side: mentoring a competitive robotics program through build seasons and championships.',
    stats: [], tech: [], link: null, media: null,
    graph: { parent: 'oliver', edges: [], rel: ['techx', 'worlds'] },
  },
  {
    id: 'techx', kind: 'role',
    title: 'TechX Robotics', type: 'mentor & coach · 2023 →', status: 'NOW',
    blurb: 'Mentoring 15+ students through build seasons — design reviews, code, and competition strategy. Seventeen awards and four state qualifications so far.',
    stats: [
      { value: '15+', label: 'students' },
      { value: '17', label: 'awards' },
      { value: '4×', label: 'states' },
    ],
    tech: [], link: null, media: null,
    graph: { parent: 'robotics', edges: [], rel: ['worlds', 'eagle-scout'] },
  },
  {
    id: 'worlds', kind: 'credential',
    title: 'Worlds Qualification', type: 'team qualified to Worlds',
    blurb: 'A team I coach qualified for the world championship — the program’s first.',
    stats: [{ value: '1', label: 'Worlds-qualified team' }],
    tech: [], link: null, media: null,
    graph: { parent: 'robotics', edges: [], rel: ['techx', 'robotics'] },
  },

  /* -------- leadership -------- */
  {
    id: 'leadership', kind: 'group',
    title: 'Leadership', type: 'roles & credentials',
    blurb: 'Roles and credentials from outside the terminal.',
    stats: [], tech: [], link: null, media: null,
    graph: { parent: 'oliver', edges: [], rel: ['virtual-enterprise', 'eagle-scout'] },
  },
  {
    id: 'virtual-enterprise', kind: 'role',
    title: 'Virtual Enterprise', type: 'student-run company',
    blurb: 'Led a student-run company through the Virtual Enterprise program — product, pitch, and the P&L behind it.',
    stats: [], tech: [], link: null, media: null,
    graph: { parent: 'leadership', edges: [], rel: ['eagle-scout', 'techx'] },
  },
  {
    id: 'eagle-scout', kind: 'credential',
    title: 'Eagle Scout', type: 'scouting’s highest rank',
    blurb: 'Planned and led a community service project to completion — Eagle rank, the long way.',
    stats: [], tech: [], link: null, media: null,
    graph: { parent: 'leadership', edges: [], rel: ['virtual-enterprise', 'leadership'] },
  },

  /* -------- pages -------- */
  {
    id: 'pages', kind: 'group',
    title: 'Pages', type: 'public utilities',
    blurb: 'The public utility pages that live on the site today. Each is a real route; here they’re reachable nodes.',
    stats: [], tech: [], link: null, media: null,
    graph: { parent: 'oliver', edges: [], rel: ['pull', 'sat-resources'] },
  },
  {
    id: 'pull', kind: 'page',
    title: 'Pull', type: 'utility page',
    blurb: 'A small utility page that lives on the site today. In v1.2 it gets the man-page treatment; here it’s just a node you can reach.',
    stats: [], tech: [],
    link: { href: '/pull', label: '/pull' }, media: null,
    graph: { parent: 'pages', edges: [], rel: ['pages', 'permit'] },
  },
  {
    id: 'permit', kind: 'page',
    title: 'Driving Permit', type: 'notes & checklist',
    blurb: 'Step-by-step notes for the California permit process. Cross-linked with the license guide — the edge between them is authored, not inferred.',
    stats: [], tech: [],
    link: { href: '/permit', label: '/permit' }, media: null,
    graph: { parent: 'pages', edges: ['license'], rel: ['license', 'pages'] },
  },
  {
    id: 'license', kind: 'page',
    title: 'Driver’s License', type: 'notes & checklist',
    blurb: 'The follow-on guide: booking the behind-the-wheel test and what to bring. See also: permit.',
    stats: [], tech: [],
    link: { href: '/license', label: '/license' }, media: null,
    graph: { parent: 'pages', edges: [], rel: ['permit', 'sat-resources'] },
  },
  {
    id: 'sat-resources', kind: 'page',
    title: 'SAT Resources', type: 'curated list',
    blurb: 'The materials that actually helped — curated, not scraped. (1540, for what it’s worth.)',
    stats: [], tech: [],
    link: { href: '/sat-resources', label: '/sat-resources' }, media: null,
    graph: { parent: 'pages', edges: [], rel: ['license', 'pages'] },
  },

  /* -------- contact -------- */
  {
    id: 'contact', kind: 'group',
    title: 'Contact', type: 'open channel',
    blurb: 'The open channel. Email is fastest; the rest rides along.',
    stats: [], tech: [], link: null, media: null,
    graph: { parent: 'oliver', edges: [], rel: ['email', 'resume'] },
  },
  {
    id: 'email', kind: 'channel',
    title: 'Email', type: EMAIL, status: 'FASTEST',
    blurb: 'The primary channel. Copy it, or click through — it goes straight to me.',
    stats: [], tech: [],
    link: { href: 'mailto:' + EMAIL, label: EMAIL }, media: null,
    graph: { parent: 'contact', edges: [], rel: ['resume', 'github'] },
  },
  {
    id: 'github', kind: 'channel',
    title: 'GitHub', type: 'code & experiments',
    blurb: 'Where the agent projects live — the parts that are public, anyway.',
    stats: [], tech: [],
    link: { href: meta.links.github, label: 'github.com/ollie88skwda' }, media: null,
    graph: { parent: 'contact', edges: [], rel: ['email', 'mac-agent'] },
  },
  {
    id: 'linkedin', kind: 'channel',
    title: 'LinkedIn', type: 'the formal record',
    blurb: 'The suit-and-tie mirror of this graph.',
    stats: [], tech: [],
    link: { href: meta.links.linkedin, label: 'linkedin.com/in/oliver-nguyen' }, media: null,
    graph: { parent: 'contact', edges: [], rel: ['email', 'resume'] },
  },
  {
    id: 'resume', kind: 'channel',
    title: 'Resume', type: 'PDF · one page',
    blurb: 'One page, current. The graph is better, but the PDF travels.',
    stats: [], tech: [],
    link: { href: meta.links.resume, label: 'resume.pdf' }, media: null,
    graph: { parent: 'contact', edges: [], rel: ['email', 'linkedin'] },
  },
];

/* ------------------------ the operator week (7 days) ----------------------- */
/* Structured beats; formatBeat() reproduces the prototype's display strings.  */

export const week = [
  {
    day: 1, date: '2026-05-21',
    beats: [
      { t: '06:04', kind: 'email', text: 'kickoff — scope confirmed, repo initialized' },
      { t: '10:22', kind: 'decision', n: 12, text: 'static prototype before framework migration' },
      { t: '18:40', kind: 'tool', text: '41 tool calls · first end-to-end pass' },
    ],
  },
  {
    day: 2, date: '2026-05-22',
    beats: [
      { t: '07:00', kind: 'email', text: 'morning report — day 1 recap sent' },
      { t: '11:15', kind: 'decision', n: 48, text: 'cut the sidebar, ship the log viewer' },
      { t: '21:03', kind: 'tool', text: 'tests green on retry loop' },
    ],
  },
  {
    day: 3, date: '2026-05-23',
    beats: [
      { t: '06:12', kind: 'decision', n: 141, text: 'restructure email templates' },
      { t: '13:37', kind: 'tool', text: 'refactor: split parser from renderer' },
      { t: '19:20', kind: 'email', text: 'progress email drafted + sent' },
    ],
  },
  {
    day: 4, date: '2026-05-24',
    beats: [
      { t: '08:30', kind: 'decision', n: 163, text: 'pin dependency, stop the flake' },
      { t: '12:02', kind: 'tool', text: 'bulk rename migration · 220 files' },
      { t: '23:47', kind: 'decision', text: 'late fix — timezone bug in scheduler' },
    ],
  },
  {
    day: 5, date: '2026-05-25',
    beats: [
      { t: '07:00', kind: 'email', text: 'morning report — halfway summary' },
      { t: '10:45', kind: 'decision', n: 201, text: 'write docs before polish' },
      { t: '16:30', kind: 'tool', text: 'screenshot diff pass · 3 regressions fixed' },
    ],
  },
  {
    day: 6, date: '2026-05-26',
    beats: [
      { t: '09:12', kind: 'decision', n: 233, text: 'freeze scope for ship' },
      { t: '14:58', kind: 'tool', text: 'cleanup: dead code sweep' },
      { t: '20:10', kind: 'email', text: 'pre-ship checklist mailed' },
    ],
  },
  {
    day: 7, date: '2026-05-27',
    beats: [
      { t: '06:50', kind: 'decision', n: 257, text: 'final: ship it' },
      { t: '11:00', kind: 'tool', text: 'tag v1.0 · handoff notes written' },
      { t: '12:00', kind: 'email', text: 'final report — 7 days, 0 human commits' },
    ],
  },
];

export const BEAT_GLYPHS = { decision: '◆', tool: '→', email: '✉' };

/** Render a structured beat as its one-line log string (prototype format). */
export function formatBeat(b) {
  const body = b.kind === 'decision' && b.n != null ? `decision #${b.n} — ${b.text}` : b.text;
  return `${b.t} ${BEAT_GLYPHS[b.kind]} ${body}`;
}

/** Week-ring generation: derive the 7 day entities from `week`. */
export function dayEntities(weekData = week) {
  const count = weekData.length;
  return weekData.map(({ day, date, beats }) => ({
    id: `day-${day}`, kind: 'day',
    title: `DAY ${day}`, dTitle: `Day ${day}`,
    type: date, status: `DAY ${day} / ${count}`,
    blurb: 'One day of the autonomous run, curated from the real decisions log.',
    stats: [], tech: [], link: null, media: null,
    beats,
    graph: {
      parent: 'operator', edges: [],
      rel: [`day-${day === 1 ? count : day - 1}`, `day-${day === count ? 1 : day + 1}`, 'operator'],
    },
  }));
}

/* --------------------------- derived collections --------------------------- */

/** All 30 nodes: authored entities with day nodes inserted right after operator
 *  (order drives entry-animation stagger + Tab cycling, as in the prototype). */
export const allEntities = (() => {
  const days = dayEntities();
  const i = entities.findIndex((e) => e.id === 'operator');
  return [...entities.slice(0, i + 1), ...days, ...entities.slice(i + 1)];
})();

export const entityById = new Map(allEntities.map((e) => [e.id, e]));

/** Legend order — group nodes in authored order. */
export const groups = allEntities.filter((e) => e.kind === 'group');

/** 05 §2.2 aggregate shape (intents live in src/intents/registry.js per plan §4). */
export const site = { meta, entities: allEntities, week };

export default site;
