/**
 * src/graph/components/Dossier.jsx — node detail panel (G-3.1).
 *
 * R-G1: composed from the component library. Every leaf piece is a brand
 * component — MonoLabel (§7 kicker/label role), StatusPill (§4's one 999px
 * licence), Log/LogLine (§5 density + §8 glyph marks), StatBlock/StatRow,
 * TechRow/TechToken, Button, Glyph. The panel shell itself stays graph-owned
 * because it is a full-height slide-in pinned to the canvas edge, but it reads
 * the same tokens the library's .on-dossier does (--dossier-border,
 * --shadow-dossier, --pad-card) — see src/graph/graph.css.
 *
 * Dialog semantics with a light focus trap (focus enters on open, Tab cycles
 * inside, returns to the node card on close — 05 §4.3).
 */
import React, { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Glyph,
  Log,
  LogLine,
  MonoLabel,
  StatBlock,
  StatRow,
  StatusPill,
  TechRow,
  TechToken,
} from '@/components/brand';
import { KINDS, formatBeat, entityById } from '../../content/site.js';
import { beatLine } from '../beats.js';

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
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="d-close"
        aria-label="Close"
        onClick={onClose}
      >
        <Glyph name="close" />
      </Button>
      <div className="d-kind">
        {/* KINDS[].glyph is a CONTENT mark (● ○ ◆ ◔ ▣ ✦ ▤ ✉), not the BRAND §8
            control set, so it stays part of the label text rather than a
            <Glyph> — glyph.jsx deliberately throws on names it has not
            ratified. */}
        <MonoLabel>{`${kind.glyph} ${kind.label}`}</MonoLabel>
        {entity.status && (
          <StatusPill className="d-status" dot={false}>{entity.status}</StatusPill>
        )}
      </div>
      <h2 className="d-title">{entity.dTitle || entity.title}</h2>
      {entity.type && <div className="d-type">{entity.type}</div>}
      {entity.blurb && <p className="d-blurb">{entity.blurb}</p>}
      {entity.beats && (
        <Log className="d-beats">
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
        <StatRow className="d-stats">
          {entity.stats.map((s) => (
            <StatBlock className="d-stat" key={s.label} value={s.value} label={s.label} />
          ))}
        </StatRow>
      )}
      {entity.tech.length > 0 && (
        <TechRow className="d-tech">
          {entity.tech.map((t) => <TechToken key={t}>{t}</TechToken>)}
        </TechRow>
      )}
      {rel.length > 0 && (
        <div className="d-rel">
          <MonoLabel className="d-rel-h">linked</MonoLabel>
          {rel.map((id) => (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              key={id}
              onClick={() => onGoto(id)}
            >
              <Glyph name="call" />
              {entityById.get(id).dTitle || entityById.get(id).title}
            </Button>
          ))}
        </div>
      )}
      {entity.link && (
        <Button variant="link" className="d-link" asChild>
          <a
            href={entity.link.href}
            target={internal ? undefined : '_blank'}
            rel={internal ? undefined : 'noreferrer'}
          >
            {entity.link.label}
          </a>
        </Button>
      )}
      <MonoLabel className="d-esc">esc to close</MonoLabel>
    </aside>
  );
}
