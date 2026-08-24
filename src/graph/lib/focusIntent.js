/**
 * src/graph/lib/focusIntent.js — the graph's INBOUND intent surface (F-C.2,
 * the doc-10 "graph focus-intent API + top-bar link restore" follow-up).
 *
 * Mirrors the 'on:set-mode' contract shape: a cancelable CustomEvent
 * ('on:graph-intent', detail = registry intent id | entity id | free text).
 * Whoever can execute intents (PromptBar binds this next to the canvas's
 * runIntent) resolves the detail against the ONE registry and
 * preventDefaults; the dispatcher (chrome) falls back to a real navigation
 * (`/?focus=<detail>`) when nobody handled it — mobile list, legacy routes.
 * The ?focus= deep-link is consumed once (URL param stripped via
 * replaceState) by the first mounted consumer: the canvas (via PromptBar's
 * bind) on desktop, the list on mobile.
 *
 * Never-trap stays inviolate: no key handling here, listeners bind/unbind
 * with their component, and an unhandled dispatch does nothing in-page.
 */
import { INTENTS, matchIntents } from '../../intents/registry.js';
import { entityById } from '../../content/site.js';

export const GRAPH_INTENT_EVENT = 'on:graph-intent';
export const FOCUS_PARAM = 'focus';

/**
 * detail → executable registry-shaped intent:
 *   1. exact registry intent id ('contact', 'show-robotics', …)
 *   2. entity id → synthesized node intent ('agents', 'oliver', 'day-4', …)
 *   3. fuzzy fallback through the shared matcher ('day 4', 'robotics', …)
 * → intent | null
 */
export function resolveGraphIntent(detail) {
  const q = String(detail ?? '').trim();
  if (!q) return null;
  const byId = INTENTS.find((it) => it.id === q);
  if (byId) return byId;
  if (entityById.has(q)) {
    return {
      id: `focus-${q}`,
      label: `Focus ${entityById.get(q).title}`,
      kind: 'node',
      run: { type: 'node', id: q },
    };
  }
  const m = matchIntents(q);
  return m.length ? m[0] : null;
}

/** Chrome-side dispatch. → true when an in-page consumer handled it. */
export function dispatchGraphIntent(detail) {
  const ev = new CustomEvent(GRAPH_INTENT_EVENT, { detail, cancelable: true });
  window.dispatchEvent(ev);
  return ev.defaultPrevented;
}

/** Read AND strip the ?focus= deep-link param. One-shot. → detail | null */
export function consumeFocusParam() {
  try {
    const url = new URL(window.location.href);
    const detail = url.searchParams.get(FOCUS_PARAM);
    if (!detail) return null;
    url.searchParams.delete(FOCUS_PARAM);
    window.history.replaceState(window.history.state, '', url);
    return detail;
  } catch {
    return null;
  }
}

/**
 * Consumer-side bind (PromptBar, next to the canvas's intent executor):
 * listens for dispatches AND consumes a pending ?focus= deep-link once.
 * The deep-link runs on a macrotask that the unbind cancels — under React
 * StrictMode the first (fake) mount would otherwise consume the param and
 * start a pulse the fake unmount immediately cancels, eating the deep-link.
 * → unbind (component cleanup).
 */
export function bindGraphIntents(onRun) {
  const handler = (ev) => {
    const it = resolveGraphIntent(ev.detail);
    if (!it) return;
    ev.preventDefault();
    onRun(it);
  };
  window.addEventListener(GRAPH_INTENT_EVENT, handler);
  const t = setTimeout(() => {
    const pending = consumeFocusParam();
    if (pending) {
      const it = resolveGraphIntent(pending);
      if (it) onRun(it);
    }
  }, 0);
  return () => {
    clearTimeout(t);
    window.removeEventListener(GRAPH_INTENT_EVENT, handler);
  };
}
