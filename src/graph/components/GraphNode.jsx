/**
 * src/graph/components/GraphNode.jsx — one node card per kind (G-2.3).
 * DOM mirrors the prototype exactly (.node > .drift > .card) so graph.css
 * and the screenshot comparison apply 1:1.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
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

  // idle drift garnish: random phase/period, fixed per mount (prototype)
  const driftStyle = useMemo(() => {
    if (still) return { animation: 'none' };
    return {
      animationDelay: `${(-Math.random() * 8).toFixed(2)}s`,
      animationDuration: `${(6 + Math.random() * 3.5).toFixed(2)}s`,
    };
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
      <div className="drift" style={driftStyle}>
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
