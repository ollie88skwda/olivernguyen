/**
 * src/terminal/panes/prefix.js — prefix-key state machine (^G grammar).
 * Build-plan 11 §5 contract + P7 + 09 §C. PURE: no DOM, no listeners —
 * core owns THE window keydown listener (P3) and calls prefixStep first.
 *
 * States: { mode:'idle'|'prefix'|'resize', since:<ms timestamp> }
 *   idle   → Ctrl+G / Cmd+G arms one-shot prefix
 *   prefix → one bound key fires an action; expires after 1.2s; Esc cancels
 *   resize → sticky: h/j/k/l (or arrows) nudge ±5% until Esc / unbound key
 *
 * prefixStep(state, event) → { state, action, handled }
 *   event    = KeyboardEvent-shaped: { key, ctrlKey, metaKey, altKey,
 *              shiftKey, timeStamp } (plain objects fine in tests)
 *   action   = { type:'split', dir } | { type:'close' } | { type:'zoom' } |
 *              { type:'focus', dir:'h|j|k|l' } | { type:'cycle' } |
 *              { type:'resize', axis:'x|y', delta:±0.05 } |
 *              { type:'help' } | null
 *   handled  = true → core must preventDefault + skip its own key handling
 *              (extra field beyond the §5 contract; state/action are as
 *              specified — core may ignore it and infer, but shouldn't).
 *
 * Never-trap: modifier chords other than the prefix (e.g. ⌘K) are never
 * swallowed — they cancel prefix/resize and fall through (handled:false).
 * Bare modifier keydowns (Control/Meta/Shift/Alt) pass through untouched.
 */

import { RESIZE_STEP } from './tree.js';

export const PREFIX_EXPIRY_MS = 1200;

const IDLE = { mode: 'idle', since: 0 };

export function createPrefixState() {
  return IDLE;
}

/** Ctrl+G (Cmd+G also accepted — preventDefault-able find-next, 09 §B). */
export function isPrefixChord(e) {
  return Boolean((e.ctrlKey || e.metaKey) && !e.altKey && String(e.key).toLowerCase() === 'g');
}

/**
 * Timer-driven expiry (core sets a timeout to clear the '^G‥' indicator
 * even when no further key arrives). Pure: pass a timestamp.
 */
export function expire(state, now) {
  if (state.mode === 'prefix' && now - state.since > PREFIX_EXPIRY_MS) return IDLE;
  return state;
}

/** Statusbar indicator strings (§5: core renders these verbatim). */
export function indicator(state) {
  if (state.mode === 'prefix') return '^G\u2025';
  if (state.mode === 'resize') return '-- RESIZE --';
  return '';
}

/** The 8 bindings (09 §C) minus 'r' (mode switch, handled inline). */
const PREFIX_ACTIONS = {
  v: { type: 'split', dir: 'right' },
  '-': { type: 'split', dir: 'down' },
  x: { type: 'close' },
  z: { type: 'zoom' },
  h: { type: 'focus', dir: 'h' },
  j: { type: 'focus', dir: 'j' },
  k: { type: 'focus', dir: 'k' },
  l: { type: 'focus', dir: 'l' },
  Tab: { type: 'cycle' },
  '?': { type: 'help' },
};

const ARROW_TO_VIM = {
  ArrowLeft: 'h',
  ArrowDown: 'j',
  ArrowUp: 'k',
  ArrowRight: 'l',
};

/** Divider-motion semantics — matches tree.resizeStep (+ = right/down). */
const RESIZE_ACTIONS = {
  h: { type: 'resize', axis: 'x', delta: -RESIZE_STEP },
  l: { type: 'resize', axis: 'x', delta: +RESIZE_STEP },
  k: { type: 'resize', axis: 'y', delta: -RESIZE_STEP },
  j: { type: 'resize', axis: 'y', delta: +RESIZE_STEP },
};

const BARE_MODIFIERS = new Set(['Control', 'Meta', 'Shift', 'Alt']);

/** Non-prefix modifier chord (⌘K etc.) — never hijack (shift excluded). */
function isForeignChord(e) {
  return Boolean(e.ctrlKey || e.metaKey || e.altKey) && !isPrefixChord(e);
}

export function prefixStep(state, e) {
  const t = e.timeStamp ?? 0;

  if (state.mode === 'idle') {
    if (isPrefixChord(e)) return { state: { mode: 'prefix', since: t }, action: null, handled: true };
    return { state, action: null, handled: false };
  }

  if (state.mode === 'prefix') {
    if (t - state.since > PREFIX_EXPIRY_MS) return prefixStep(IDLE, e); // expired → treat as idle
    if (BARE_MODIFIERS.has(e.key)) return { state, action: null, handled: false };
    if (isPrefixChord(e)) return { state: { mode: 'prefix', since: t }, action: null, handled: true }; // re-arm
    if (isForeignChord(e)) return { state: IDLE, action: null, handled: false };
    if (e.key === 'Escape') return { state: IDLE, action: null, handled: true };
    if (e.key === 'r') return { state: { mode: 'resize', since: t }, action: null, handled: true };
    const action = PREFIX_ACTIONS[e.key] ?? null;
    return { state: IDLE, action, handled: true }; // one-shot; unbound key swallowed
  }

  // resize (sticky)
  if (BARE_MODIFIERS.has(e.key)) return { state, action: null, handled: false };
  if (isPrefixChord(e)) return { state: { mode: 'prefix', since: t }, action: null, handled: true };
  if (isForeignChord(e)) return { state: IDLE, action: null, handled: false };
  if (e.key === 'Escape') return { state: IDLE, action: null, handled: true };
  const action = RESIZE_ACTIONS[ARROW_TO_VIM[e.key] ?? e.key];
  if (action) return { state, action, handled: true };
  return { state: IDLE, action: null, handled: false }; // unbound exits, falls through (tmux-like)
}
