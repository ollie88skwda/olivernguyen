import { describe, it, expect } from 'vitest';
import { filterEntities, filterCountLabel } from './filter.js';
import { allEntities } from '../../content/site.js';

describe('/ filter — prototype ranking', () => {
  it('empty / whitespace query → no matches', () => {
    expect(filterEntities('', allEntities)).toEqual([]);
    expect(filterEntities('   ', allEntities)).toEqual([]);
    expect(filterEntities(undefined, allEntities)).toEqual([]);
  });

  it('"day" ranks the seven day nodes first, in ring order', () => {
    const out = filterEntities('day', allEntities);
    expect(out.slice(0, 7)).toEqual(['day-1', 'day-2', 'day-3', 'day-4', 'day-5', 'day-6', 'day-7']);
  });

  it('title starts-with beats title-includes beats elsewhere-in-hay', () => {
    const out = filterEntities('mac', allEntities);
    expect(out[0]).toBe('mac-agent');       // title startsWith
    expect(out).toContain('mcp-tools');      // parent id 'mac-agent' in hay
    expect(out.indexOf('mcp-tools')).toBeGreaterThan(0);
  });

  it('matches tech tokens (hay includes tech)', () => {
    expect(filterEntities('python', allEntities)).toEqual([
      'oliver', 'operator', 'mac-agent', 'articlewriter',
    ]);
  });

  it('prefix search on titles, ties broken by entity order', () => {
    const out = filterEntities('driv', allEntities);
    expect(out).toEqual(['permit', 'license']); // 'Driving…' then 'Driver’s…'
  });

  it('matches kind names ("credential" finds the credentials + their group)', () => {
    const out = filterEntities('credential', allEntities);
    // leadership matches via its type line "roles & credentials"
    expect(out.sort()).toEqual(['eagle-scout', 'leadership', 'worlds']);
  });

  it('no match for gibberish', () => {
    expect(filterEntities('zzzqx', allEntities)).toEqual([]);
  });

  it('count label copy', () => {
    expect(filterCountLabel(0)).toBe('no matches');
    expect(filterCountLabel(1)).toBe('1 match · ↵ fly');
    expect(filterCountLabel(3)).toBe('3 matches · ↵ fly');
  });
});
