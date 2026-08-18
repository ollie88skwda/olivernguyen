/**
 * src/graph/runPulse.js — imperative pulse bead engine (G-3.2).
 * Drives a jade bead along the real drawn edge <path>s (works on any §3.2
 * geometry via getTotalLength/getPointAtLength). Planning + pacing math is
 * pure in lib/pulse.js. Returns a cancel function.
 */
import {
  planPulseSegments, segDuration, beadProgress, beadPathFraction,
  ROUTING_LINGER_MS,
} from './lib/pulse.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

/**
 * @param {SVGSVGElement} svg the edges underlay
 * @param {string[]} chain root→target ids (structure.pathFromRoot)
 * @param {Set<string>} keys drawn-edge key set (pulse.edgeKeySet)
 * @param {{ reducedMotion?: boolean, onDone: () => void }} opts
 */
export default function runPulse(svg, chain, keys, { reducedMotion, onDone }) {
  const segs = planPulseSegments(chain, keys);
  if (reducedMotion || segs.length === 0 || !svg) {
    // reduced motion: no traveling bead — instant static highlight of the
    // whole route instead (05 §4.4), then proceed
    if (reducedMotion && segs.length && svg) {
      const els = segs
        .map((s) => svg.querySelector(`[data-edge="${s.from}|${s.to}"]`))
        .filter(Boolean);
      els.forEach((el) => el.classList.add('routing'));
      setTimeout(() => els.forEach((el) => el.classList.remove('routing')), 600);
    }
    onDone();
    return () => {};
  }

  let cancelled = false;
  let raf = null;
  const timers = [];
  const bead = document.createElementNS(SVG_NS, 'circle');
  bead.setAttribute('r', '5');
  bead.setAttribute('class', 'bead');
  svg.appendChild(bead);

  const cleanup = () => {
    cancelled = true;
    if (raf) cancelAnimationFrame(raf);
    timers.forEach(clearTimeout);
    bead.remove();
    svg.querySelectorAll('.edge.routing').forEach((p) => p.classList.remove('routing'));
  };

  let si = 0;
  const runSeg = () => {
    if (cancelled) return;
    const s = segs[si];
    const pathEl = svg.querySelector(`[data-edge="${s.from}|${s.to}"]`);
    if (!pathEl) { si += 1; (si < segs.length ? runSeg : finish)(); return; }
    const L = pathEl.getTotalLength();
    const dur = segDuration(L);
    const t0 = performance.now();
    const last = si === segs.length - 1;
    pathEl.classList.add('routing');
    const tick = (now) => {
      if (cancelled) return;
      const t = Math.min(1, (now - t0) / dur);
      const e = beadProgress(t, last);
      const pt = pathEl.getPointAtLength(beadPathFraction(e, s.rev) * L);
      bead.setAttribute('cx', pt.x);
      bead.setAttribute('cy', pt.y);
      if (t < 1) { raf = requestAnimationFrame(tick); return; }
      timers.push(setTimeout(() => pathEl.classList.remove('routing'), ROUTING_LINGER_MS));
      si += 1;
      if (si < segs.length) runSeg();
      else finish();
    };
    raf = requestAnimationFrame(tick);
  };

  const finish = () => {
    if (cancelled) return;
    bead.remove();
    onDone();
  };

  runSeg();
  return cleanup;
}
