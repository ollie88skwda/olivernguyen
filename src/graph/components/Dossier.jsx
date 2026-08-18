/**
 * src/graph/components/Dossier.jsx — node detail panel (G-3.1).
 * DOM mirrors the prototype dossier; dialog semantics with a light focus
 * trap (focus enters on open, Tab cycles inside, returns to the node card on
 * close — 05 §4.3).
 */
import React, { useEffect, useRef } from 'react';
import { KINDS, formatBeat, entityById } from '../../content/site.js';

export default function Dossier({ entity, open, onClose, onGoto }) {
  const panelRef = useRef(null);
  const returnTo = useRef(null);

  // focus enters the panel on open, returns to the node card on close
  useEffect(() => {
    if (open && entity) {
      returnTo.current = document.querySelector(`.node[data-id="${entity.id}"] .card`);
      const t = setTimeout(() => {
        if (panelRef.current) panelRef.current.focus();
      }, 60);
      return () => clearTimeout(t);
    }
    if (!open && returnTo.current) {
      returnTo.current.focus({ preventScroll: true });
      returnTo.current = null;
    }
    return undefined;
  }, [open, entity]);

  // light focus trap: Tab cycles within the panel while open
  const onKeyDown = (e) => {
    if (e.key !== 'Tab' || !panelRef.current) return;
    const items = panelRef.current.querySelectorAll(
      'button, a[href], [tabindex]:not([tabindex="-1"])',
    );
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  if (!entity) {
    return <aside className="dossier" aria-hidden="true" />;
  }

  const kind = KINDS[entity.kind];
  const rel = (entity.graph.rel || []).filter((id) => entityById.has(id));
  const internal = entity.link && entity.link.href.startsWith('/');

  return (
    <aside
      ref={panelRef}
      className="dossier"
      role="dialog"
      aria-modal="false"
      aria-label={`${entity.dTitle || entity.title} — details`}
      aria-hidden={open ? 'false' : 'true'}
      tabIndex={-1}
      onKeyDown={onKeyDown}
    >
      <button type="button" className="d-close" aria-label="Close" onClick={onClose}>×</button>
      <div className="d-kind">
        {`${kind.glyph} ${kind.label}`}
        {entity.status && <span className="d-status">{entity.status}</span>}
      </div>
      <h2 className="d-title">{entity.dTitle || entity.title}</h2>
      {entity.type && <div className="d-type">{entity.type}</div>}
      {entity.blurb && <p className="d-blurb">{entity.blurb}</p>}
      {entity.beats && (
        <div className="d-beats">
          {entity.beats.map((b) => <div key={b.t + b.text}>{formatBeat(b)}</div>)}
        </div>
      )}
      {entity.stats.length > 0 && (
        <div className="d-stats">
          {entity.stats.map((s) => (
            <div className="d-stat" key={s.label}>
              <div className="v">{s.value}</div>
              <div className="l">{s.label}</div>
            </div>
          ))}
        </div>
      )}
      {entity.tech.length > 0 && (
        <div className="d-tech">
          {entity.tech.map((t) => <span key={t}>{t}</span>)}
        </div>
      )}
      {rel.length > 0 && (
        <div className="d-rel">
          <span className="d-rel-h">linked</span>
          {rel.map((id) => (
            <button type="button" key={id} onClick={() => onGoto(id)}>
              {`→ ${entityById.get(id).dTitle || entityById.get(id).title}`}
            </button>
          ))}
        </div>
      )}
      {entity.link && (
        <a
          className="d-link"
          href={entity.link.href}
          target={internal ? undefined : '_blank'}
          rel={internal ? undefined : 'noreferrer'}
        >
          {entity.link.label}
        </a>
      )}
      <div className="d-esc">esc to close</div>
    </aside>
  );
}
