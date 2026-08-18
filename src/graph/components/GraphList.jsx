/**
 * src/graph/components/GraphList.jsx — dossier-list fallback (G-4.1, 05 §4.5).
 *
 * The same content model as the canvas, rendered as a clean vertical list
 * grouped under the five group headers. Serves two duties:
 *   - mobile / coarse-pointer rendering (canvas + d3 never imported — P6)
 *   - the visually-hidden screen-reader layer on desktop (G-4.3, 05 §8)
 * Pure DOM + content imports only. No d3, no canvas code.
 */
import React from 'react';
import { allEntities, entityById, groups, KINDS, meta, formatBeat } from '../../content/site.js';

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
    <article className="gl-entry" aria-label={entity.dTitle || entity.title}>
      <div className="gl-kind">
        {`${kind.glyph} ${kind.label}`}
        {entity.status ? <span className="gl-status">{entity.status}</span> : null}
      </div>
      <H className="gl-title">{entity.dTitle || entity.title}</H>
      {entity.type && <div className="gl-type">{entity.type}</div>}
      {entity.blurb && <p className="gl-blurb">{entity.blurb}</p>}
      {entity.beats && (
        <ul className="gl-beats">
          {entity.beats.map((b) => <li key={b.t + b.text}>{formatBeat(b)}</li>)}
        </ul>
      )}
      {entity.stats.length > 0 && (
        <ul className="gl-stats">
          {entity.stats.map((s) => (
            <li key={s.label}><b>{s.value}</b> {s.label}</li>
          ))}
        </ul>
      )}
      {entity.tech.length > 0 && (
        <div className="gl-tech">{entity.tech.join(' · ')}</div>
      )}
      {entity.link && (
        <a
          className="gl-link"
          href={entity.link.href}
          target={internal ? undefined : '_blank'}
          rel={internal ? undefined : 'noreferrer'}
        >
          {entity.link.label}
        </a>
      )}
    </article>
  );
}

export default function GraphList({ srOnly = false }) {
  const root = entityById.get('oliver');
  return (
    <div className={srOnly ? 'g-list visually-hidden' : 'g-list'} aria-label="Site graph as a list">
      <header className="gl-head">
        <div className="gl-brand">oN.c <span>graph mode</span></div>
        <h1 className="gl-name">{meta.name}</h1>
        <p className="gl-tagline">{meta.tagline}</p>
      </header>
      <ListEntry entity={root} heading="h2" />
      {groups.map((g) => (
        <section key={g.id} aria-labelledby={`gl-h-${g.id}`}>
          <h2 id={`gl-h-${g.id}`} className="gl-group">{g.title}</h2>
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
