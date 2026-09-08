/**
 * src/graph/components/GraphList.jsx — dossier-list fallback (G-4.1, 05 §4.5).
 *
 * The same content model as the canvas, rendered as a clean vertical list
 * grouped under the five group headers. Serves two duties:
 *   - mobile / coarse-pointer rendering (canvas + d3 never imported — P6)
 *   - the visually-hidden screen-reader layer on desktop (G-4.3, 05 §8)
 * Pure DOM + content imports only. No d3, no canvas code.
 *
 * R-G1: each entry is the library's NodeCard — COMPONENTS.md documents that
 * component as existing precisely for this list ("the phone build renders
 * graph mode as a grouped LIST … and that list needs the same card without
 * React Flow"). Everything inside it is a brand piece too: MonoLabel,
 * StatusPill, Log/LogLine, StatRow/StatBlock, TechRow/TechToken, Wordmark,
 * Display and Button.
 *
 * F-C.2 (mobile leg): the non-srOnly list consumes a ?focus= deep-link by
 * scrolling to the target group header / entry — the canvas never mounts
 * here (P6), so the list is the deep-link's landing surface.
 */
import React, { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Display,
  Log,
  LogLine,
  MonoLabel,
  NodeCard,
  StatBlock,
  StatRow,
  StatusPill,
  TechRow,
  TechToken,
  Wordmark,
} from '@/components/brand';
import { allEntities, entityById, groups, KINDS, meta, formatBeat } from '../../content/site.js';
import { beatLine } from '../beats.js';
import { consumeFocusParam, resolveGraphIntent } from '../lib/focusIntent.js';

/**
 * The ?focus= target, held across React 18 StrictMode's dev double-invoke.
 *
 * consumeFocusParam() is one-shot by design (it strips the param), so the
 * mount → cleanup → mount cycle would consume it on the first pass and find
 * nothing on the second, leaving the alignment below torn down. Module scope
 * outlives that cycle; the 2s settle timer clears it, so a genuine later
 * remount does not re-hijack the reader's scroll position.
 */
let pendingFocusId = null;

function memberIdsOf(groupId) {
  // group's subtree in authored order, excluding the group node itself
  const ids = [];
  for (const e of allEntities) {
    if (e.id === groupId || e.kind === 'root') continue;
    let n = e;
    let guard = 0;
    while (n && n.graph.parent && guard < 100) {
      guard += 1;
      if (n.graph.parent === groupId) { ids.push(e.id); break; }
      n = entityById.get(n.graph.parent);
    }
  }
  return ids;
}

function ListEntry({ entity, heading: H = 'h3' }) {
  const kind = KINDS[entity.kind];
  const internal = entity.link && entity.link.href.startsWith('/');
  return (
    <NodeCard
      as="article"
      className="gl-entry"
      id={`gl-${entity.id}`}
      aria-label={entity.dTitle || entity.title}
      titleAs={H}
      titleClassName="gl-title"
      /* content mark, not a BRAND §8 glyph — see Dossier.jsx */
      kicker={`${kind.glyph} ${kind.label}`}
      title={entity.dTitle || entity.title}
    >
      {entity.status && (
        <StatusPill className="gl-status" dot={false}>{entity.status}</StatusPill>
      )}
      {entity.type && <div className="gl-type">{entity.type}</div>}
      {entity.blurb && <p className="gl-blurb">{entity.blurb}</p>}
      {entity.beats && (
        /* role is cleared: .on-log is a live region for the terminal, and 25
           static live regions on one page is noise for assistive tech */
        <Log className="gl-beats" role={undefined}>
          {entity.beats.map((b) => {
            const { time, glyph, body } = beatLine(b);
            return (
              <LogLine key={formatBeat(b)} time={time} glyph={glyph} state="dim">
                {body}
              </LogLine>
            );
          })}
        </Log>
      )}
      {entity.stats.length > 0 && (
        <StatRow className="gl-stats">
          {entity.stats.map((s) => (
            <StatBlock key={s.label} value={s.value} label={s.label} />
          ))}
        </StatRow>
      )}
      {entity.tech.length > 0 && (
        <TechRow className="gl-tech">
          {entity.tech.map((t) => <TechToken key={t}>{t}</TechToken>)}
        </TechRow>
      )}
      {entity.link && (
        <Button variant="link" className="gl-link" asChild>
          <a
            href={entity.link.href}
            target={internal ? undefined : '_blank'}
            rel={internal ? undefined : 'noreferrer'}
          >
            {entity.link.label}
          </a>
        </Button>
      )}
    </NodeCard>
  );
}

export default function GraphList({ srOnly = false }) {
  const root = entityById.get('oliver');
  const listRef = useRef(null);

  // ?focus= deep-link → scroll to the section/entry. Non-srOnly only: on
  // desktop the SR copy of this list must not steal the canvas's deep-link.
  useEffect(() => {
    if (srOnly) return;
    const detail = consumeFocusParam();
    if (detail) {
      const it = resolveGraphIntent(detail);
      pendingFocusId = it?.run?.type === 'node' ? it.run.id : null;
    }
    const id = pendingFocusId;
    if (!id) return undefined;
    const el =
      document.getElementById(`gl-h-${id}`) || document.getElementById(`gl-${id}`);
    if (!el) return undefined;

    // Align, then KEEP aligning while the list is still settling. These entries
    // are display-type heavy, so the fallback-to-webfont reflow grows the list
    // above the target by ~140px — align once on mount and the deep-link lands
    // in the middle of the previous section. Waiting on document.fonts.ready is
    // not enough on a warm cache: it resolves before the reflow is laid out.
    const align = () => el.scrollIntoView({ block: 'start' });
    align();

    const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(align) : null;
    if (ro && listRef.current) ro.observe(listRef.current);

    // Stop on a timer, and immediately if the reader takes over — re-aligning
    // under someone who is already scrolling would yank the page from them.
    const stop = () => {
      if (ro) ro.disconnect();
      window.removeEventListener('wheel', stop, true);
      window.removeEventListener('touchstart', stop, true);
      window.removeEventListener('keydown', stop, true);
    };
    window.addEventListener('wheel', stop, true);
    window.addEventListener('touchstart', stop, true);
    window.addEventListener('keydown', stop, true);
    const t = setTimeout(() => { pendingFocusId = null; stop(); }, 2000);

    return () => { clearTimeout(t); stop(); };
  }, [srOnly]);
  return (
    <div
      ref={listRef}
      className={srOnly ? 'g-list visually-hidden' : 'g-list'}
      aria-label="Site graph as a list"
    >
      <header className="gl-head">
        <div className="gl-brand">
          <Wordmark />
          <MonoLabel>graph mode</MonoLabel>
        </div>
        <Display className="gl-name">{meta.name}</Display>
        <p className="gl-tagline">{meta.tagline}</p>
      </header>
      <ListEntry entity={root} heading="h2" />
      {groups.map((g) => (
        <section key={g.id} aria-labelledby={`gl-h-${g.id}`}>
          <h2 id={`gl-h-${g.id}`} className="gl-group on-section-title">{g.title}</h2>
          {g.blurb && <p className="gl-group-sub">{g.blurb}</p>}
          {memberIdsOf(g.id).map((id) => (
            <ListEntry key={id} entity={entityById.get(id)} />
          ))}
        </section>
      ))}
      <footer className="gl-foot">© 2026 {meta.name} · <a href={`mailto:${meta.email}`}>{meta.email}</a></footer>
    </div>
  );
}
