// C-1.2 — terminalModel selectors must mirror site.js exactly (zero
// hardcoded copy: every assertion here reads the expected value FROM site.js).
import { describe, it, expect } from 'vitest';
import {
  allEntities,
  entityById,
  meta,
  week,
  formatBeat,
} from '../../content/site.js';
import {
  BOOT_DAY,
  DAY_COUNT,
  EMAIL,
  FILES,
  FILE_NAMES,
  NAME,
  TAGLINE,
  WINDOWS,
  windowByN,
  artifact,
  bootData,
  contactSection,
  dayInfo,
  entityIds,
  lsEntries,
  roboticsSection,
  sectionByFile,
  toolsSection,
  whoamiSection,
} from './terminalModel.js';

describe('meta passthrough', () => {
  it('email / name / tagline come from site.meta', () => {
    expect(EMAIL).toBe(meta.email);
    expect(NAME).toBe(meta.name);
    expect(TAGLINE).toBe(meta.tagline);
    expect(DAY_COUNT).toBe(week.length);
  });
});

describe('WINDOWS / FILES (§3.1.6 tabs)', () => {
  it('five windows: boot + the four section files', () => {
    expect(WINDOWS.map((w) => w.n)).toEqual([1, 2, 3, 4, 5]);
    expect(WINDOWS[0]).toEqual({
      n: 1,
      name: 'boot',
      cmd: `operator --replay --day ${BOOT_DAY}`,
    });
    expect(FILE_NAMES).toEqual([
      'tools.txt',
      'robotics.log',
      'whoami.txt',
      'contact.txt',
    ]);
  });

  it('window names derive from group entity titles', () => {
    expect(windowByN(2).name).toBe(entityById.get('agents').title.toLowerCase());
    expect(windowByN(3).name).toBe(
      entityById.get('robotics').title.toLowerCase(),
    );
    expect(windowByN(4).name).toBe(
      entityById.get('leadership').title.toLowerCase(),
    );
    expect(windowByN(5).name).toBe(
      entityById.get('contact').title.toLowerCase(),
    );
    expect(windowByN(9)).toBeNull();
  });
});

describe('sections mirror the entity tree', () => {
  it('tools.txt = the agents group children, in authored order', () => {
    const s = toolsSection();
    const expected = allEntities
      .filter((e) => e.graph.parent === 'agents')
      .map((e) => e.id);
    expect(s.items.map((i) => i.id)).toEqual(expected);
    expect(expected).toContain('operator');
    expect(s.heading).toBe(`tools/ · ${expected.length} registered`);
    const op = s.items.find((i) => i.id === 'operator');
    expect(op.title).toBe(entityById.get('operator').title);
    expect(op.status).toBe(entityById.get('operator').status);
    expect(op.blurb).toBe(entityById.get('operator').blurb);
    expect(op.tech).toEqual(entityById.get('operator').tech);
  });

  it('robotics.log strip concatenates member stats from site.js', () => {
    const s = roboticsSection();
    expect(s.items.map((i) => i.id)).toEqual(
      allEntities.filter((e) => e.graph.parent === 'robotics').map((e) => e.id),
    );
    const techx = entityById.get('techx');
    for (const st of techx.stats) {
      expect(s.strip).toContain(`${st.value} ${st.label}`);
    }
  });

  it('whoami.txt = root bio + leadership children + root stats strip', () => {
    const s = whoamiSection();
    const root = entityById.get('oliver');
    expect(s.bio).toBe(root.blurb);
    expect(s.items.map((i) => i.id)).toEqual(
      allEntities
        .filter((e) => e.graph.parent === 'leadership')
        .map((e) => e.id),
    );
    for (const st of root.stats) {
      expect(s.strip).toContain(`${st.value} ${st.label}`);
    }
  });

  it('contact.txt channels carry the real links from site.js', () => {
    const s = contactSection();
    const kids = allEntities.filter((e) => e.graph.parent === 'contact');
    expect(s.channels.map((c) => c.id)).toEqual(kids.map((e) => e.id));
    const gh = s.channels.find((c) => c.id === 'github');
    expect(gh.link.href).toBe(meta.links.github);
    const em = s.channels.find((c) => c.id === 'email');
    expect(em.link.href).toBe('mailto:' + meta.email);
    expect(s.big).toBe(`${entityById.get('contact').type}.`.toUpperCase());
  });

  it('sectionByFile dispatches all four files, null otherwise', () => {
    for (const f of FILE_NAMES) expect(sectionByFile(f).file).toBe(f);
    expect(sectionByFile('nosuch.txt')).toBeNull();
  });
});

describe('ls / day / boot / artifact', () => {
  it('lsEntries describe each file with its source-group type', () => {
    const rows = lsEntries();
    expect(rows.map((r) => r.name)).toEqual(FILE_NAMES);
    expect(rows[0].desc).toBe(entityById.get('agents').type);
  });

  it('dayInfo reproduces formatBeat exactly for every day', () => {
    for (const w of week) {
      const info = dayInfo(w.day);
      expect(info.date).toBe(w.date);
      info.beats.forEach((b, i) => {
        expect(`${b.t} ${b.glyph} ${b.body}`).toBe(formatBeat(w.beats[i]));
      });
    }
    expect(dayInfo(0)).toBeNull();
    expect(dayInfo(8)).toBeNull();
  });

  it('bootData carries day-3 beats + operator stats summary + meta hero', () => {
    const b = bootData();
    expect(b.cmd).toBe(`operator --replay --day ${BOOT_DAY}`);
    expect(b.frameTitle).toContain(`day ${BOOT_DAY}/${week.length}`);
    expect(b.beats).toEqual(dayInfo(BOOT_DAY).beats);
    for (const st of entityById.get('operator').stats) {
      expect(b.summary).toContain(`${st.value} ${st.label}`);
    }
    expect(b.name).toBe(meta.name);
    expect(b.tagline).toBe(meta.tagline);
  });

  it('artifact(id) mirrors any entity incl. day beats; null for unknown', () => {
    const a = artifact('mac-agent');
    const e = entityById.get('mac-agent');
    expect(a.title).toBe(e.title);
    expect(a.statLine).toBe(e.stats.map((s) => `${s.value} ${s.label}`).join(' · '));
    expect(a.tech).toEqual(e.tech);
    expect(a.linked).toEqual(e.graph.rel);
    const day4 = artifact('day-4');
    expect(day4.dTitle).toBe('Day 4');
    expect(day4.beats.length).toBe(week[3].beats.length);
    expect(artifact('nope')).toBeNull();
  });

  it('entityIds covers all 30 nodes', () => {
    expect(entityIds()).toEqual(allEntities.map((e) => e.id));
    expect(entityIds().length).toBe(30);
  });
});
