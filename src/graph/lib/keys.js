/**
 * src/graph/lib/keys.js — keyboard model decisions (build-plan G-3.6
 * groundwork). Pure: the component owns the single window keydown listener
 * and defers decisions here.
 *
 * Never-trap rules (05 §5.4.2): the listener must return early — no
 * preventDefault — for typing targets and modifier chords (⌘K excepted,
 * handled before anything else).
 */

/** Esc cascade priority — per prototype USAGE table:
 *  palette → filter → tour → dossier (flies back) → fit view. */
export function escAction(state) {
  if (state.paletteOpen) return 'close-palette';
  if (state.filterOpen) return 'close-filter';
  if (state.tourOn) return 'end-tour';
  if (state.dossierOpen) return 'close-dossier';
  return 'fit';
}

/**
 * True when a keydown must be ignored by the graph keymap (the user is
 * typing). Pass the event's target element.
 */
export function isTypingTarget(el) {
  if (!el) return false;
  const tag = el.tagName;
  return (
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT' ||
    el.isContentEditable === true
  );
}

/** True when a site chrome menu owns the event target. */
export function isChromeMenuTarget(el) {
  return Boolean(
    el?.closest?.(
      '[data-slot="dropdown-menu-trigger"], [data-slot="dropdown-menu-content"]',
    ),
  );
}

/** True when the event is a modifier chord the keymap must not hijack. */
export function isModifierChord(e) {
  return Boolean(e.metaKey || e.ctrlKey || e.altKey);
}

/** True for the ⌘K / Ctrl+K palette combo (the one allowed chord). */
export function isPaletteCombo(e) {
  return Boolean((e.metaKey || e.ctrlKey) && String(e.key).toLowerCase() === 'k');
}

/**
 * Tab/arrow node cycling (prototype): from no focus, forward starts at the
 * first node; indices wrap in both directions.
 * @param {string|null} currentId
 * @param {1|-1} dir
 * @param {string[]} order entity ids in authored order
 */
export function cycleId(currentId, dir, order) {
  const idx = currentId ? order.indexOf(currentId) : -1;
  return order[(idx + dir + order.length) % order.length];
}
