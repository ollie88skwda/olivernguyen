/**
 * src/terminal/lib/terminalModel.js — the terminal's view of site.js (C-1.2,
 * pure, P4: site.js is READ-ONLY and grows no terminal:{} hints).
 *
 * Every string the terminal prints as CONTENT comes from here, derived from
 * src/content/site.js (entities by kind/group + week). Section shape:
 * window 1 = boot (operator replay hero), 2–5 = the four groups that carry
 * narrative sections (agents/robotics/leadership/contact — the `pages` group
 * stays graph-only; its routes live in the chrome menu). Renderers live in
 * sections.jsx; this module is data only.
 */
import {
  allEntities,
  entityById,
  meta,
  week,
  BEAT_GLYPHS,
  KINDS,
} from '../../content/site.js';

export const EMAIL = meta.email;
export const NAME = meta.name;
export const TAGLINE = meta.tagline;
export const DAY_COUNT = week.length;
export const BOOT_DAY = 3; // §6 C1: boot auto-types `operator --replay --day 3`

const groupTitle = (id) => entityById.get(id).title.toLowerCase();

/** filename → window binding. Sections derive from entity kind/group (P4). */
export const FILES = {
  'tools.txt': { n: 2, section: 'tools', source: 'agents' },
  'robotics.log': { n: 3, section: 'robotics', source: 'robotics' },
  'whoami.txt': { n: 4, section: 'whoami', source: 'leadership' },
  'contact.txt': { n: 5, section: 'contact', source: 'contact' },
};

export const FILE_NAMES = Object.keys(FILES);

/** Internal route destinations are derived from the same linked graph nodes
 * that render clickable links in the dossier. */
export const ROUTE_DESTINATIONS = [
  { name: 'home', href: '/', entity: 'oliver' },
  ...allEntities
    .filter((e) => e.link?.href?.startsWith('/'))
    .map((e) => ({ name: e.link.href.slice(1), href: e.link.href, entity: e.id })),
];

export const routeDestination = (name) => {
  const normalized = name.replace(/^\/+/, '').replace(/\/$/, '') || 'home';
  return ROUTE_DESTINATIONS.find((d) => d.name === normalized) || null;
};

/** tmux window list (§3.1.6). Names come from the group entities. */
export const WINDOWS = [
  { n: 1, name: 'boot', cmd: `operator --replay --day ${BOOT_DAY}` },
  ...Object.entries(FILES).map(([file, f]) => ({
    n: f.n,
    name: f.n === 4 ? groupTitle('leadership') : groupTitle(f.source),
    cmd: `cat ${file}`,
  })),
];

export const windowByN = (n) => WINDOWS.find((w) => w.n === Number(n)) || null;

/* ------------------------------ selectors ------------------------------- */

const children = (parentId) =>
  allEntities.filter((e) => e.graph.parent === parentId);

const statLine = (stats) => stats.map((s) => `${s.value} ${s.label}`).join(' · ');

const pick = (e) => ({
  id: e.id,
  glyph: KINDS[e.kind].glyph,
  kind: e.kind,
  title: e.title,
  type: e.type,
  status: e.status || null,
  blurb: e.blurb,
  stats: e.stats,
  statLine: statLine(e.stats),
  tech: e.tech,
  link: e.link,
});

/** window 2 — the agents projects (tools.txt). */
export function toolsSection() {
  const items = children('agents').map(pick);
  return {
    file: 'tools.txt',
    heading: `tools/ · ${items.length} registered`,
    summary: entityById.get('agents').blurb,
    items,
  };
}

/** window 3 — robotics.log. */
export function roboticsSection() {
  const items = children('robotics').map(pick);
  return {
    file: 'robotics.log',
    heading: `robotics.log · ${items.length} entries`,
    summary: entityById.get('robotics').blurb,
    items,
    strip: items.map((i) => i.statLine).filter(Boolean).join(' · '),
  };
}

/** window 4 — whoami.txt: root bio + leadership roles/credentials. */
export function whoamiSection() {
  const root = entityById.get('oliver');
  return {
    file: 'whoami.txt',
    heading: `whoami.txt · ${root.title}`,
    summary: meta.tagline,
    bio: root.blurb,
    items: children('leadership').map(pick),
    strip: statLine(root.stats),
  };
}

/** window 5 — contact.txt: the open channel. */
export function contactSection() {
  const group = entityById.get('contact');
  const root = entityById.get('oliver');
  return {
    file: 'contact.txt',
    heading: `contact.txt · ${group.type}`,
    summary: group.blurb,
    big: `${group.type}.`.toUpperCase(),
    blurb: group.blurb,
    channels: children('contact').map(pick),
    footer: `${group.type} · ${root.title} · ${root.status.toLowerCase()}`,
  };
}

export function guideData() {
  const root = entityById.get('oliver');
  return {
    name: root.title,
    tagline: meta.tagline,
    stats: root.stats,
    agents: toolsSection(),
    robotics: roboticsSection(),
    leadership: whoamiSection(),
    contact: contactSection(),
  };
}

export const sectionByFile = (file) => {
  switch (file) {
    case 'tools.txt':
      return toolsSection();
    case 'robotics.log':
      return roboticsSection();
    case 'whoami.txt':
      return whoamiSection();
    case 'contact.txt':
      return contactSection();
    default:
      return null;
  }
};

/** `ls` — the four files with their source-group meta line. */
export function lsEntries() {
  return Object.entries(FILES).map(([name, f]) => ({
    name,
    desc: entityById.get(f.source).type,
  }));
}

/** `day N` / boot replay — structured beats of one day. */
export function dayInfo(n) {
  const d = week.find((w) => w.day === Number(n));
  if (!d) return null;
  return {
    day: d.day,
    date: d.date,
    beats: d.beats.map((b) => ({
      t: b.t,
      glyph: BEAT_GLYPHS[b.kind],
      kind: b.kind,
      body:
        b.kind === 'decision' && b.n != null
          ? `decision #${b.n} — ${b.text}`
          : b.text,
    })),
  };
}

/** boot = the output of `operator --replay --day N` (§3.1.4). */
export function bootData(day = BOOT_DAY) {
  const operator = entityById.get('operator');
  const info = dayInfo(day) || dayInfo(BOOT_DAY);
  return {
    cmd: `operator --replay --day ${info.day}`,
    frameTitle: `operator · replay · day ${info.day}/${DAY_COUNT}`,
    beats: info.beats,
    summary: `replay ok · ${statLine(operator.stats)}`,
    name: NAME,
    tagline: TAGLINE,
  };
}

/** `open <entity>` / panes' artifact program — dossier data for any node. */
export function artifact(id) {
  const e = entityById.get(id);
  if (!e) return null;
  return {
    ...pick(e),
    dTitle: e.dTitle || e.title,
    beats: e.beats
      ? e.beats.map((b) => ({
          t: b.t,
          glyph: BEAT_GLYPHS[b.kind],
          body:
            b.kind === 'decision' && b.n != null
              ? `decision #${b.n} — ${b.text}`
              : b.text,
        }))
      : null,
    linked: e.graph.rel,
  };
}

/** completion targets for `open ` (every node id). */
export const entityIds = () => allEntities.map((e) => e.id);
