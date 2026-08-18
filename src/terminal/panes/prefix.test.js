/**
 * prefix.js unit tests — GATE N1: prefix machine table-tested incl.
 * expiry + Esc; sticky resize; never-trap fall-throughs.
 */
import { describe, it, expect } from 'vitest';
import {
  createPrefixState,
  prefixStep,
  expire,
  indicator,
  isPrefixChord,
  PREFIX_EXPIRY_MS,
} from './prefix.js';
import { RESIZE_STEP } from './tree.js';

const key = (k, extra = {}) => ({ key: k, ctrlKey: false, metaKey: false, altKey: false, shiftKey: false, timeStamp: 1000, ...extra });
const ctrlG = (t = 1000) => key('g', { ctrlKey: true, timeStamp: t });
const cmdG = (t = 1000) => key('g', { metaKey: true, timeStamp: t });

const IDLE = createPrefixState();
const armed = (t = 1000) => prefixStep(IDLE, ctrlG(t)).state;
const resizing = (t = 1000) => prefixStep(armed(t), key('r', { timeStamp: t })).state;

describe('isPrefixChord', () => {
  it('accepts Ctrl+G and Cmd+G (case-insensitive), rejects the rest', () => {
    expect(isPrefixChord(ctrlG())).toBe(true);
    expect(isPrefixChord(cmdG())).toBe(true);
    expect(isPrefixChord(key('G', { ctrlKey: true, shiftKey: true }))).toBe(true);
    expect(isPrefixChord(key('g'))).toBe(false);
    expect(isPrefixChord(key('g', { altKey: true, ctrlKey: true }))).toBe(false);
    expect(isPrefixChord(key('k', { metaKey: true }))).toBe(false);
  });
});

describe('idle', () => {
  it('arms on the prefix chord (handled → core preventDefaults find-next)', () => {
    const r = prefixStep(IDLE, ctrlG(500));
    expect(r).toEqual({ state: { mode: 'prefix', since: 500 }, action: null, handled: true });
    expect(prefixStep(IDLE, cmdG(500)).state.mode).toBe('prefix');
  });

  it('ignores everything else untouched (never-trap)', () => {
    for (const e of [key('g'), key('v'), key('j'), key('Escape'), key('k', { metaKey: true }), key('Control', { ctrlKey: true })]) {
      expect(prefixStep(IDLE, e)).toEqual({ state: IDLE, action: null, handled: false });
    }
  });
});

describe('prefix (one-shot)', () => {
  it.each([
    ['v', { type: 'split', dir: 'right' }],
    ['-', { type: 'split', dir: 'down' }],
    ['x', { type: 'close' }],
    ['z', { type: 'zoom' }],
    ['h', { type: 'focus', dir: 'h' }],
    ['j', { type: 'focus', dir: 'j' }],
    ['k', { type: 'focus', dir: 'k' }],
    ['l', { type: 'focus', dir: 'l' }],
    ['Tab', { type: 'cycle' }],
    ['?', { type: 'help' }],
  ])('^G %s → %o, back to idle', (k, action) => {
    const r = prefixStep(armed(), key(k, { timeStamp: 1100, shiftKey: k === '?' }));
    expect(r.state.mode).toBe('idle');
    expect(r.action).toEqual(action);
    expect(r.handled).toBe(true);
  });

  it('^G r enters sticky resize with no action', () => {
    const r = prefixStep(armed(), key('r', { timeStamp: 1100 }));
    expect(r).toEqual({ state: { mode: 'resize', since: 1100 }, action: null, handled: true });
  });

  it('Esc cancels with no action', () => {
    expect(prefixStep(armed(), key('Escape', { timeStamp: 1100 }))).toEqual({
      state: { mode: 'idle', since: 0 },
      action: null,
      handled: true,
    });
  });

  it('unbound key is swallowed once and cancels (tmux one-shot)', () => {
    const r = prefixStep(armed(), key('q', { timeStamp: 1100 }));
    expect(r).toEqual({ state: { mode: 'idle', since: 0 }, action: null, handled: true });
    expect(prefixStep(armed(), key('V', { timeStamp: 1100, shiftKey: true })).action).toBe(null);
  });

  it('prefix chord again re-arms (fresh timer)', () => {
    const r = prefixStep(armed(1000), ctrlG(1800));
    expect(r).toEqual({ state: { mode: 'prefix', since: 1800 }, action: null, handled: true });
  });

  it('expires after 1.2s — late key handled as if idle', () => {
    const late = key('v', { timeStamp: 1000 + PREFIX_EXPIRY_MS + 1 });
    expect(prefixStep(armed(1000), late)).toEqual({ state: IDLE, action: null, handled: false });
    // a late prefix chord starts a fresh arm instead
    const r = prefixStep(armed(1000), ctrlG(1000 + PREFIX_EXPIRY_MS + 100));
    expect(r.state).toEqual({ mode: 'prefix', since: 1000 + PREFIX_EXPIRY_MS + 100 });
    // just inside the window still fires
    expect(prefixStep(armed(1000), key('v', { timeStamp: 1000 + PREFIX_EXPIRY_MS })).action).toEqual({ type: 'split', dir: 'right' });
  });

  it('bare modifier keydowns pass through without disarming (Ctrl of Ctrl+G)', () => {
    const s = armed(1000);
    const r = prefixStep(s, key('Control', { ctrlKey: true, timeStamp: 1100 }));
    expect(r).toEqual({ state: s, action: null, handled: false });
  });

  it('foreign chords (⌘K) cancel and fall through — never swallowed', () => {
    const r = prefixStep(armed(), key('k', { metaKey: true, timeStamp: 1100 }));
    expect(r).toEqual({ state: { mode: 'idle', since: 0 }, action: null, handled: false });
  });
});

describe('resize (sticky)', () => {
  it.each([
    ['h', 'x', -RESIZE_STEP],
    ['l', 'x', +RESIZE_STEP],
    ['k', 'y', -RESIZE_STEP],
    ['j', 'y', +RESIZE_STEP],
    ['ArrowLeft', 'x', -RESIZE_STEP],
    ['ArrowRight', 'x', +RESIZE_STEP],
    ['ArrowUp', 'y', -RESIZE_STEP],
    ['ArrowDown', 'y', +RESIZE_STEP],
  ])('%s nudges {axis:%s, delta:%d} and STAYS in resize', (k, axis, delta) => {
    const s = resizing();
    const r = prefixStep(s, key(k, { timeStamp: 2000 }));
    expect(r.state).toBe(s);
    expect(r.action).toEqual({ type: 'resize', axis, delta });
    expect(r.handled).toBe(true);
  });

  it('does not expire (sticky until Esc)', () => {
    const r = prefixStep(resizing(1000), key('l', { timeStamp: 1000 + PREFIX_EXPIRY_MS * 10 }));
    expect(r.action).toEqual({ type: 'resize', axis: 'x', delta: +RESIZE_STEP });
  });

  it('Esc exits to idle', () => {
    expect(prefixStep(resizing(), key('Escape', { timeStamp: 2000 }))).toEqual({
      state: { mode: 'idle', since: 0 },
      action: null,
      handled: true,
    });
  });

  it('unbound key exits and falls through (never-trap)', () => {
    expect(prefixStep(resizing(), key('q', { timeStamp: 2000 }))).toEqual({
      state: { mode: 'idle', since: 0 },
      action: null,
      handled: false,
    });
  });

  it('prefix chord re-arms prefix from resize', () => {
    const r = prefixStep(resizing(), ctrlG(2000));
    expect(r.state).toEqual({ mode: 'prefix', since: 2000 });
  });

  it('bare modifiers pass through; foreign chords exit + fall through', () => {
    const s = resizing();
    expect(prefixStep(s, key('Shift', { shiftKey: true, timeStamp: 2000 })).state).toBe(s);
    expect(prefixStep(s, key('k', { metaKey: true, timeStamp: 2000 }))).toEqual({
      state: { mode: 'idle', since: 0 },
      action: null,
      handled: false,
    });
  });
});

describe('expire (timer feed)', () => {
  it('clears a stale prefix, leaves everything else alone', () => {
    const s = armed(1000);
    expect(expire(s, 1000 + PREFIX_EXPIRY_MS + 1)).toEqual({ mode: 'idle', since: 0 });
    expect(expire(s, 1000 + PREFIX_EXPIRY_MS)).toBe(s);
    const rs = resizing(1000);
    expect(expire(rs, 99999)).toBe(rs);
    expect(expire(IDLE, 99999)).toBe(IDLE);
  });
});

describe('indicator', () => {
  it('renders the statusbar strings per §5', () => {
    expect(indicator(IDLE)).toBe('');
    expect(indicator(armed())).toBe('^G\u2025');
    expect(indicator(resizing())).toBe('-- RESIZE --');
  });
});
