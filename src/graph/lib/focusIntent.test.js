// F-C.2 — inbound graph intent surface: resolution order, event contract,
// deep-link consumption. jsdom provides window/history.
import { describe, it, expect, vi, afterEach } from 'vitest';
import { INTENTS } from '../../intents/registry.js';
import {
  GRAPH_INTENT_EVENT,
  FOCUS_PARAM,
  bindGraphIntents,
  consumeFocusParam,
  dispatchGraphIntent,
  resolveGraphIntent,
} from './focusIntent.js';

afterEach(() => {
  window.history.replaceState(null, '', '/');
});

describe('resolveGraphIntent()', () => {
  it('exact registry intent id wins', () => {
    const it2 = resolveGraphIntent('contact');
    expect(it2).toBe(INTENTS.find((i) => i.id === 'contact'));
    expect(it2.run).toEqual({ type: 'node', id: 'email' });
  });

  it('entity ids synthesize node intents (clusters + root + days)', () => {
    expect(resolveGraphIntent('agents').run).toEqual({ type: 'node', id: 'agents' });
    expect(resolveGraphIntent('oliver').run).toEqual({ type: 'node', id: 'oliver' });
    expect(resolveGraphIntent('day-4').run).toEqual({ type: 'node', id: 'day-4' });
    // entity id beats fuzzy: 'robotics' is a group node, not show-robotics
    expect(resolveGraphIntent('robotics').run).toEqual({ type: 'node', id: 'robotics' });
  });

  it('falls back to the shared fuzzy matcher, null when hopeless', () => {
    expect(resolveGraphIntent('day 4').run).toEqual({ type: 'node', id: 'day-4' });
    expect(resolveGraphIntent('mac agent toolbelt').run.id).toBe('mac-agent');
    expect(resolveGraphIntent('zzznothing')).toBeNull();
    expect(resolveGraphIntent('')).toBeNull();
    expect(resolveGraphIntent(null)).toBeNull();
  });
});

describe('dispatch + bind (the cancelable-event contract)', () => {
  it('bound: handler resolves, runs, preventDefaults → dispatch returns true', () => {
    const onRun = vi.fn();
    const unbind = bindGraphIntents(onRun);
    expect(dispatchGraphIntent('agents')).toBe(true);
    expect(onRun).toHaveBeenCalledTimes(1);
    expect(onRun.mock.calls[0][0].run).toEqual({ type: 'node', id: 'agents' });
    unbind();
  });

  it('unresolvable details are NOT swallowed (no preventDefault)', () => {
    const onRun = vi.fn();
    const unbind = bindGraphIntents(onRun);
    expect(dispatchGraphIntent('zzznothing')).toBe(false);
    expect(onRun).not.toHaveBeenCalled();
    unbind();
  });

  it('unbound: dispatch returns false (chrome falls back to navigation)', () => {
    expect(dispatchGraphIntent('agents')).toBe(false);
  });

  it('unbind detaches the listener', () => {
    const onRun = vi.fn();
    const unbind = bindGraphIntents(onRun);
    unbind();
    expect(dispatchGraphIntent('agents')).toBe(false);
    expect(onRun).not.toHaveBeenCalled();
  });
});

describe('?focus= deep-link', () => {
  it('consumeFocusParam reads once and strips the param', () => {
    window.history.replaceState(null, '', `/?a=1&${FOCUS_PARAM}=agents`);
    expect(consumeFocusParam()).toBe('agents');
    expect(window.location.search).toBe('?a=1');
    expect(consumeFocusParam()).toBeNull();
  });

  it('bindGraphIntents consumes a pending deep-link one macrotask after bind', async () => {
    window.history.replaceState(null, '', `/?${FOCUS_PARAM}=contact`);
    const onRun = vi.fn();
    const unbind = bindGraphIntents(onRun);
    expect(onRun).not.toHaveBeenCalled(); // deferred — StrictMode safety
    await new Promise((r) => setTimeout(r, 5));
    expect(onRun).toHaveBeenCalledTimes(1);
    expect(onRun.mock.calls[0][0].id).toBe('contact');
    expect(window.location.search).toBe('');
    unbind();
  });

  it('unbinding before the macrotask cancels the deep-link (fake-mount case)\n     and leaves the param for the surviving bind', async () => {
    window.history.replaceState(null, '', `/?${FOCUS_PARAM}=contact`);
    const first = vi.fn();
    bindGraphIntents(first)(); // bind + immediate unbind (StrictMode fake mount)
    const second = vi.fn();
    const unbind = bindGraphIntents(second);
    await new Promise((r) => setTimeout(r, 5));
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
    unbind();
  });

  it('no param → no run on bind', async () => {
    const onRun = vi.fn();
    const unbind = bindGraphIntents(onRun);
    await new Promise((r) => setTimeout(r, 5));
    expect(onRun).not.toHaveBeenCalled();
    unbind();
  });
});

describe('event name stability (chrome ↔ graph contract)', () => {
  it('constants are the documented strings', () => {
    expect(GRAPH_INTENT_EVENT).toBe('on:graph-intent');
    expect(FOCUS_PARAM).toBe('focus');
  });
});
