/**
 * src/graph/components/GraphNode.jsx — one node card per kind (G-2.3).
 * DOM mirrors the prototype exactly (.node > .drift > .card) so graph.css
 * and the screenshot comparison apply 1:1.
 */
import React, { useMemo, useRef } from 'react';
import { KINDS } from '../../content/site.js';

export default function GraphNode({
  entity, pos, still, hot, active, match,
  onHover, onHoverEnd, onActivate,
}) {
  const down = useRef(null);
  const isLeaf = entity.kind !== 'root' && entity.kind !== 'group';

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
    match ? 'match' : '',
  ].filter(Boolean).join(' ');

  const kind = KINDS[entity.kind];

  return (
    <div
      className={cls}
      style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }}
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
