/**
 * src/graph/components/GraphNode.jsx — one node card per kind (G-2.3).
 * DOM is .node > .drift > .card so graph.css applies 1:1.
 *
 * R-G1: the ±2px idle drift garnish was REMOVED. BRAND.md §6 bans infinite
 * loops and D-18 ratifies exactly two (the terminal cursor blink and the
 * 1800ms skeleton pulse); a third needs a decision, and this was a third.
 * The `.drift` wrapper stays as the card's positioning element so the entry
 * transform and the DOM contract are unchanged.
 */
import React, { useEffect, useRef, useState } from 'react';
import { KINDS } from '../../content/site.js';

export default function GraphNode({
  entity, pos, still, entryDelay = 0, hot, active, arrived, match,
  onHover, onHoverEnd, onActivate,
}) {
  const down = useRef(null);
  const isLeaf = entity.kind !== 'root' && entity.kind !== 'group';

  // entry: assemble outward from the center (prototype), skipped when still
  const [entered, setEntered] = useState(still);
  useEffect(() => {
    if (still) { setEntered(true); return undefined; }
    let r2 = null;
    const r1 = requestAnimationFrame(() => {
      r2 = requestAnimationFrame(() => setEntered(true));
    });
    return () => { cancelAnimationFrame(r1); if (r2) cancelAnimationFrame(r2); };
  }, [still]);

  const cls = [
    'node',
    `kind-${entity.kind}`,
    isLeaf ? 'leaf' : '',
    hot ? 'hot' : '',
    active ? 'active' : '',
    arrived ? 'arrived' : '',
    match ? 'match' : '',
  ].filter(Boolean).join(' ');

  const kind = KINDS[entity.kind];

  const nodeStyle = entered
    ? {
        transform: `translate(${pos.x}px, ${pos.y}px)`,
        opacity: 1,
        transition: still
          ? 'none'
          : `transform .85s cubic-bezier(.22,.9,.3,1) ${entryDelay}ms, opacity .45s ease ${entryDelay}ms`,
      }
    : {
        transform: `translate(${pos.x * 0.12}px, ${pos.y * 0.12}px)`,
        opacity: 0,
      };

  return (
    <div
      className={cls}
      style={nodeStyle}
      data-id={entity.id}
      onPointerEnter={() => onHover(entity.id)}
      onPointerLeave={onHoverEnd}
    >
      <div className="drift">
        <div
          className="card"
          role="button"
          tabIndex={-1}
          aria-label={`${entity.dTitle || entity.title} — ${kind.label}`}
          onPointerDown={(e) => { down.current = [e.clientX, e.clientY]; }}
          onClick={(e) => {
            e.stopPropagation();
            const d = down.current;
            if (d && Math.hypot(e.clientX - d[0], e.clientY - d[1]) > 6) return;
            onActivate(entity.id);
          }}
        >
          {entity.kind === 'root' && (
            <>
              <div className="t">{entity.title}</div>
              <div className="m">{entity.type}</div>
            </>
          )}
          {entity.kind === 'group' && (
            <>
              <span className="g-dot" />
              <span className="t">{entity.title}</span>
            </>
          )}
          {entity.kind === 'day' && <div className="t">{entity.title}</div>}
          {isLeaf && entity.kind !== 'day' && (
            <>
              <div className="k">{`${kind.glyph} ${kind.label}`}</div>
              <div className="t">{entity.title}</div>
              <div className="m">{entity.type}</div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
