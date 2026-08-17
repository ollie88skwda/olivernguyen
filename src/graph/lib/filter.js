/**
 * src/graph/lib/filter.js — `/` filter matching (pure port of the prototype's
 * filter-input logic; build-plan G-3.4 groundwork).
 *
 * Live dimming + Enter-flies-to-top-match happen in the component; this module
 * only ranks. Prototype semantics preserved exactly:
 *   - haystack = title, dossier title, type line, kind, parent id, tech tokens
 *   - rank: title starts-with (0) < title includes (1) < anywhere else (2),
 *     ties broken by entity order
 */

/** @returns {string[]} matching entity ids, best first. Empty query → []. */
export function filterEntities(query, ents) {
  const q = (query || '').trim().toLowerCase();
  if (!q) return [];
  const scored = [];
  ents.forEach((e, i) => {
    const hay = [
      e.title,
      e.dTitle || '',
      e.type || '',
      e.kind,
      (e.graph && e.graph.parent) || '',
      (e.tech || []).join(' '),
    ].join(' ').toLowerCase();
    if (!hay.includes(q)) return;
    const t = (e.dTitle || e.title).toLowerCase();
    scored.push({ id: e.id, s: t.startsWith(q) ? 0 : t.includes(q) ? 1 : 2, i });
  });
  scored.sort((a, b) => a.s - b.s || a.i - b.i);
  return scored.map((m) => m.id);
}

/** Prototype count-line copy: "3 matches · ↵ fly" / "no matches". */
export function filterCountLabel(n) {
  return n ? `${n} match${n === 1 ? '' : 'es'} · ↵ fly` : 'no matches';
}
