// C-2.2 — the intents wrapper must reshape the shared registry without
// touching it (P4) and resolve every row to something executable.
import { describe, it, expect } from 'vitest';
import { INTENTS } from '../../intents/registry.js';
import {
  TERMINAL_INTENTS,
  matchTerminalIntents,
  resolveIntent,
  suggestedIntents,
} from './intents.js';

describe('TERMINAL_INTENTS shape (P4 wrapper)', () => {
  it('drops mode-terminal, tour and fit; adds mode-graph, clear, help', () => {
    const ids = TERMINAL_INTENTS.map((i) => i.id);
    expect(ids).not.toContain('mode-terminal');
    expect(ids).not.toContain('tour');
    expect(ids).not.toContain('fit');
    expect(ids).toContain('mode-graph');
    expect(ids).toContain('clear');
    expect(ids).toContain('help');
  });

  it('does not mutate the shared registry', () => {
    expect(INTENTS.some((i) => i.id === 'mode-graph')).toBe(false);
    expect(INTENTS.some((i) => i.id === 'mode-terminal')).toBe(true);
  });

  it('every terminal intent resolves to a cmd or the help act', () => {
    for (const it2 of TERMINAL_INTENTS) {
      const r = resolveIntent(it2);
      expect(Boolean(r.cmd) || r.act === 'help').toBe(true);
    }
  });

  it('node intents map to real terminal commands', () => {
    const byId = Object.fromEntries(
      TERMINAL_INTENTS.map((i) => [i.id, resolveIntent(i)]),
    );
    expect(byId['show-robotics'].cmd).toBe('cat robotics.log');
    expect(byId['show-leadership'].cmd).toBe('cat whoami.txt');
    expect(byId['contact'].cmd).toBe('cat contact.txt');
    expect(byId['open-mac-agent'].cmd).toBe('open mac-agent');
    expect(byId['show-mcp-tools'].cmd).toBe('open mcp-tools');
    expect(byId['copy-email'].cmd).toBe('email');
    expect(byId['mode-graph'].cmd).toBe('mode graph');
    expect(byId['clear'].cmd).toBe('clear');
  });
});

describe('matchTerminalIntents()', () => {
  it('day N synthesizes a top-ranked `day N` command (matcher built-in)', () => {
    const res = matchTerminalIntents('day 4');
    expect(res[0].cmd).toBe('day 4');
  });

  it('fuzzy matches ride the shared matcher', () => {
    expect(matchTerminalIntents('robotics')[0].cmd).toBe('cat robotics.log');
    expect(matchTerminalIntents('graph')[0].cmd).toBe('mode graph');
    expect(matchTerminalIntents('zzznope')).toEqual([]);
  });
});

describe('suggestedIntents()', () => {
  it('non-empty, all executable, includes mode-graph and help', () => {
    const s = suggestedIntents();
    expect(s.length).toBeGreaterThanOrEqual(4);
    for (const r of s) expect(Boolean(r.cmd) || r.act === 'help').toBe(true);
    expect(s.some((r) => r.id === 'mode-graph')).toBe(true);
    expect(s.some((r) => r.act === 'help')).toBe(true);
  });
});
