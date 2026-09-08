import { describe, it, expect } from 'vitest';
import { INTENTS, matchIntents, PROMPT_PLACEHOLDERS } from './registry.js';
import { entityById } from '../content/site.js';

describe('intent registry — shape (Gate G1)', () => {
  it('14 intents, unique ids, valid run types', () => {
    expect(INTENTS).toHaveLength(14);
    expect(new Set(INTENTS.map((i) => i.id)).size).toBe(14);
    for (const it of INTENTS) {
      expect(it.label).toBeTruthy();
      expect(['node', 'action']).toContain(it.kind);
      expect(['node', 'copy-email', 'tour', 'fit', 'mode']).toContain(it.run.type);
    }
  });

  it('every node intent targets a real entity', () => {
    for (const it of INTENTS) {
      if (it.run.type === 'node') expect(entityById.has(it.run.id), it.id).toBe(true);
    }
  });

  it('≥ 4 suggestible intents for the ⌘K empty state', () => {
    expect(INTENTS.filter((i) => i.suggest).length).toBeGreaterThanOrEqual(4);
  });

  it('mode intent carries its target mode', () => {
    expect(INTENTS.find((i) => i.id === 'mode-terminal').run).toEqual({ type: 'mode', mode: 'terminal' });
  });
});

describe('intent matcher — prototype behavior (Gate G1)', () => {
  it('"day 4" synthesizes a top-ranked day jump (score 200)', () => {
    const out = matchIntents('day 4');
    expect(out[0].label).toBe('Jump to day 4');
    expect(out[0].run).toEqual({ type: 'node', id: 'day-4' });
    expect(out[0].score).toBe(200);
  });

  it('"day4" (no space) and embedded "replay day 7" also match', () => {
    expect(matchIntents('day4')[0].run.id).toBe('day-4');
    expect(matchIntents('replay day 7').some((m) => m.run.id === 'day-7')).toBe(true);
  });

  it('"day 9" is not a day jump', () => {
    expect(matchIntents('day 9').some((m) => m.id === 'day-jump')).toBe(false);
  });

  it('substring match ranks by earliest occurrence', () => {
    const out = matchIntents('week');
    expect(out[0].id).toBe('show-operator');
    expect(out[0].score).toBeGreaterThan(60);
  });

  it('multi-word AND matches non-contiguous words at flat 60', () => {
    const out = matchIntents('extension chrome'); // reversed → not a substring
    expect(out).toHaveLength(1);
    expect(out[0].id).toBe('open-scopecreep');
    expect(out[0].score).toBe(60);
  });

  it('contiguous substring outranks AND fallback', () => {
    const sub = matchIntents('chrome extension')[0];
    expect(sub.id).toBe('open-scopecreep');
    expect(sub.score).toBeGreaterThan(60);
  });

  it('results sorted by score descending', () => {
    const out = matchIntents('mac');
    expect(out.length).toBeGreaterThan(1);
    for (let i = 1; i < out.length; i++) {
      expect(out[i - 1].score).toBeGreaterThanOrEqual(out[i].score);
    }
    expect(out[0].id).toBe('open-mac-agent');
  });

  it('empty / whitespace / gibberish → []', () => {
    expect(matchIntents('')).toEqual([]);
    expect(matchIntents('   ')).toEqual([]);
    expect(matchIntents('zzzzqq')).toEqual([]);
    expect(matchIntents(undefined)).toEqual([]);
  });

  it('matcher does not mutate the registry', () => {
    matchIntents('week');
    expect(INTENTS.every((i) => !('score' in i))).toBe(true);
  });
});

describe('prompt placeholders', () => {
  it('every placeholder actually resolves to at least one intent', () => {
    for (const p of PROMPT_PLACEHOLDERS) {
      expect(matchIntents(p).length, p).toBeGreaterThan(0);
    }
  });
});
