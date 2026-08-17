import { describe, it, expect } from 'vitest';
import { escAction, isTypingTarget, isModifierChord, isPaletteCombo, cycleId } from './keys.js';
import { allEntities } from '../../content/site.js';

describe('keyboard — Esc cascade (USAGE table order)', () => {
  it('palette → filter → tour → dossier → fit', () => {
    const all = { paletteOpen: true, filterOpen: true, tourOn: true, dossierOpen: true };
    expect(escAction(all)).toBe('close-palette');
    expect(escAction({ ...all, paletteOpen: false })).toBe('close-filter');
    expect(escAction({ ...all, paletteOpen: false, filterOpen: false })).toBe('end-tour');
    expect(escAction({ dossierOpen: true })).toBe('close-dossier');
    expect(escAction({})).toBe('fit');
  });
});

describe('keyboard — never-trap guards (05 §5.4.2)', () => {
  it('typing targets are ignored', () => {
    expect(isTypingTarget({ tagName: 'INPUT' })).toBe(true);
    expect(isTypingTarget({ tagName: 'TEXTAREA' })).toBe(true);
    expect(isTypingTarget({ tagName: 'SELECT' })).toBe(true);
    expect(isTypingTarget({ tagName: 'DIV', isContentEditable: true })).toBe(true);
    expect(isTypingTarget({ tagName: 'DIV' })).toBe(false);
    expect(isTypingTarget(null)).toBe(false);
  });

  it('modifier chords are never hijacked (shift excepted — Shift+Tab cycles)', () => {
    expect(isModifierChord({ metaKey: true })).toBe(true);
    expect(isModifierChord({ ctrlKey: true })).toBe(true);
    expect(isModifierChord({ altKey: true })).toBe(true);
    expect(isModifierChord({ shiftKey: true })).toBe(false);
    expect(isModifierChord({})).toBe(false);
  });

  it('⌘K / Ctrl+K is the one allowed chord', () => {
    expect(isPaletteCombo({ metaKey: true, key: 'k' })).toBe(true);
    expect(isPaletteCombo({ ctrlKey: true, key: 'K' })).toBe(true);
    expect(isPaletteCombo({ key: 'k' })).toBe(false);
    expect(isPaletteCombo({ metaKey: true, key: 'j' })).toBe(false);
  });
});

describe('keyboard — node cycling', () => {
  const order = ['a', 'b', 'c'];

  it('wraps both directions; forward from nothing starts at the first node', () => {
    expect(cycleId(null, 1, order)).toBe('a');
    expect(cycleId('c', 1, order)).toBe('a');
    expect(cycleId('a', -1, order)).toBe('c');
    expect(cycleId('b', 1, order)).toBe('c');
  });

  it('cycles the real 30-node order (Tab crawl reaches everything once)', () => {
    const ids = allEntities.map((e) => e.id);
    const seen = new Set();
    let cur = null;
    for (let i = 0; i < ids.length; i++) {
      cur = cycleId(cur, 1, ids);
      seen.add(cur);
    }
    expect(seen.size).toBe(30);
  });
});
