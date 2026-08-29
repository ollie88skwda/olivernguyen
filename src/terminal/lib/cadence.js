/**
 * src/terminal/lib/cadence.js — timing + sequencing primitives (C-0.4, pure).
 *
 * Plan §3.1.5: commands TYPE (~26–52ms/char); output PRINTS line-at-a-time
 * (34–74ms stagger). Keystrokes echo instantly. Reduced-motion: everything
 * is instant (motionOK() → false collapses every delay to zero in callers).
 *
 * The promise queue is the §5 contract's serializer: all prints per buffer
 * (and all commands in the runner) go through one queue — commands never
 * interleave. A rejected task is reported (warn, not error — the console
 * stays error-free per the gates) and never blocks the tasks behind it.
 */

export const TYPE_BASE_MS = 26;
export const TYPE_JITTER_MS = 26; // 26–52ms per typed char
export const PRINT_BASE_MS = 34;
export const PRINT_JITTER_MS = 40; // 34–74ms per printed line

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Per-character delay while the site auto-types a command. */
export const typeDelay = (rand = Math.random) =>
  TYPE_BASE_MS + rand() * TYPE_JITTER_MS;

/** Per-line delay while a block prints. `base` = §5 print({stagger}) knob. */
export const printDelay = (base = PRINT_BASE_MS, rand = Math.random) =>
  base + rand() * PRINT_JITTER_MS;

/** App-set still override (C-3.2/X-3): TerminalHome flips this on for
 * coarse-pointer devices — P9 touch-first; the guided opener is static, while
 * manual command replay keeps the typing theater on fine pointers. */
let stillOverride = false;
export const setStill = (v) => {
  stillOverride = Boolean(v);
};

/**
 * True when motion is allowed. False under prefers-reduced-motion, the
 * `?still` screenshot param (C-3.2), or the app-set still override —
 * callers then print/type instantly. Read live (not cached) so Playwright's
 * emulateMedia mid-page works.
 */
export function motionOK() {
  if (typeof window === 'undefined') return false;
  if (stillOverride) return false;
  try {
    if (new URLSearchParams(window.location.search).has('still')) return false;
  } catch {
    /* no usable location (tests) — fall through */
  }
  if (typeof window.matchMedia !== 'function') return true;
  return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** FIFO promise queue. enqueue() returns the task's OWN promise (result and
 * rejection observable by the caller); the internal chain swallows failures
 * so later tasks always run. */
export function createQueue() {
  let chain = Promise.resolve();
  let pending = 0;
  const enqueue = (task) => {
    pending++;
    const run = chain.then(task);
    chain = run
      .catch((err) => {
        console.warn('[terminal] queued task failed:', err);
      })
      .finally(() => {
        pending--;
      });
    return run;
  };
  return { enqueue, idle: () => pending === 0 };
}
