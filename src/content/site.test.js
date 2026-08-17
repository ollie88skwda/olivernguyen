import { describe, it, expect } from 'vitest';
import {
  site, meta, entities, allEntities, entityById, groups, week,
  KINDS, dayEntities, formatBeat,
} from './site.js';

const VALID_KINDS = Object.keys(KINDS);

describe('content model — schema (Gate G1)', () => {
  it('has 23 authored + 7 day = 30 entities', () => {
    expect(entities).toHaveLength(23);
    expect(allEntities).toHaveLength(30);
  });

  it('all ids unique', () => {
    expect(new Set(allEntities.map((e) => e.id)).size).toBe(30);
  });

  it('every entity passes the 05 §2.2 shape', () => {
    for (const e of allEntities) {
      expect(e.id, e.id).toMatch(/^[a-z0-9-]+$/);
      expect(VALID_KINDS, e.id).toContain(e.kind);
      expect(e.title, e.id).toBeTruthy();
      expect(typeof e.type, e.id).toBe('string');
      expect(e.blurb.length, e.id).toBeGreaterThan(20);
      expect(Array.isArray(e.stats), e.id).toBe(true);
      for (const s of e.stats) {
        expect(s, e.id).toHaveProperty('value');
        expect(s, e.id).toHaveProperty('label');
      }
      expect(Array.isArray(e.tech), e.id).toBe(true);
      if (e.link) {
        expect(e.link.href, e.id).toBeTruthy();
        expect(e.link.label, e.id).toBeTruthy();
      }
      expect(e.graph, e.id).toBeTruthy();
      expect(Array.isArray(e.graph.edges), e.id).toBe(true);
      expect(Array.isArray(e.graph.rel), e.id).toBe(true);
    }
  });

  it('exactly one root, with null parent; everything else has a parent', () => {
    const roots = allEntities.filter((e) => e.kind === 'root');
    expect(roots.map((r) => r.id)).toEqual(['oliver']);
    expect(roots[0].graph.parent).toBeNull();
    for (const e of allEntities) {
      if (e.kind !== 'root') expect(entityById.has(e.graph.parent), e.id).toBe(true);
    }
  });

  it('all parent / rel / extra-edge references resolve', () => {
    for (const e of allEntities) {
      for (const id of [...e.graph.rel, ...e.graph.edges]) {
        expect(entityById.has(id), `${e.id} → ${id}`).toBe(true);
      }
    }
  });

  it('five groups in legend order', () => {
    expect(groups.map((g) => g.id)).toEqual(['agents', 'robotics', 'leadership', 'pages', 'contact']);
  });

  it('authored cross-edges from the prototype exist', () => {
    expect(entityById.get('operator').graph.edges).toContain('mac-agent');
    expect(entityById.get('permit').graph.edges).toContain('license');
  });

  it('meta is complete', () => {
    expect(meta.email).toBe('oliverdnguyen@gmail.com');
    expect(meta.name).toBe('Oliver Nguyen');
    expect(meta.links.github).toMatch(/^https:\/\/github\.com\//);
    expect(meta.links.linkedin).toMatch(/^https:\/\/www\.linkedin\.com\//);
    expect(meta.links.resume).toBe('/resume.pdf');
    expect(site.meta).toBe(meta);
  });
});

describe('content model — week + day ring', () => {
  it('7 days, consecutive dates 2026-05-21 → 27', () => {
    expect(week).toHaveLength(7);
    week.forEach((d, i) => {
      expect(d.day).toBe(i + 1);
      expect(d.date).toBe(`2026-05-${21 + i}`);
    });
  });

  it('every day has ≥ 3 well-formed beats', () => {
    for (const d of week) {
      expect(d.beats.length).toBeGreaterThanOrEqual(3);
      for (const b of d.beats) {
        expect(b.t).toMatch(/^\d{2}:\d{2}$/);
        expect(['decision', 'tool', 'email']).toContain(b.kind);
        expect(b.text).toBeTruthy();
        if (b.n != null) expect(b.kind).toBe('decision');
      }
    }
  });

  it('day entities generated from week: day-1..7 under operator, in order after it', () => {
    const days = dayEntities();
    expect(days.map((d) => d.id)).toEqual(['day-1', 'day-2', 'day-3', 'day-4', 'day-5', 'day-6', 'day-7']);
    for (const d of days) {
      expect(d.kind).toBe('day');
      expect(d.graph.parent).toBe('operator');
      expect(d.beats.length).toBeGreaterThanOrEqual(3);
    }
    const ids = allEntities.map((e) => e.id);
    expect(ids.indexOf('day-1')).toBe(ids.indexOf('operator') + 1);
    expect(entityById.get('day-4').dTitle).toBe('Day 4');
    expect(entityById.get('day-4').graph.rel).toEqual(['day-3', 'day-5', 'operator']);
    expect(entityById.get('day-1').graph.rel).toEqual(['day-7', 'day-2', 'operator']);
  });

  it('formatBeat reproduces the prototype log strings exactly', () => {
    expect(week[0].beats.map(formatBeat)).toEqual([
      '06:04 ✉ kickoff — scope confirmed, repo initialized',
      '10:22 ◆ decision #12 — static prototype before framework migration',
      '18:40 → 41 tool calls · first end-to-end pass',
    ]);
    expect(formatBeat(week[3].beats[2])).toBe('23:47 ◆ late fix — timezone bug in scheduler');
    expect(formatBeat(week[6].beats[0])).toBe('06:50 ◆ decision #257 — final: ship it');
    expect(formatBeat(week[6].beats[2])).toBe('12:00 ✉ final report — 7 days, 0 human commits');
  });
});
