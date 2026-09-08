/**
 * src/graph/beats.js — beat → <LogLine> props.
 *
 * src/content/site.js already ships `formatBeat`, which flattens a beat into
 * one prototype-format string (`06:04 ✉ kickoff — …`). The library's log line
 * (brand/log.jsx) wants the three parts separately, because it sets the
 * timestamp in Martian and the mark as a §8 Glyph. This splits them without
 * touching the content model.
 *
 * BEAT_GLYPHS in site.js is `{ decision: '◆', tool: '→', email: '✉' }` — all
 * three are BRAND.md §8 marks, so each maps onto a ratified Glyph name.
 */

/** beat kind → brand/glyph.jsx name (§8). */
export const BEAT_GLYPH_NAME = {
  decision: 'decision',
  tool: 'call',
  email: 'email',
};

/** The beat's text WITHOUT its timestamp and mark (those are LogLine props). */
export function beatBody(b) {
  return b.kind === 'decision' && b.n != null ? `decision #${b.n} — ${b.text}` : b.text;
}

/** Props for <LogLine> from a structured beat. */
export function beatLine(b) {
  return {
    time: b.t,
    glyph: BEAT_GLYPH_NAME[b.kind] || 'call',
    body: beatBody(b),
  };
}
