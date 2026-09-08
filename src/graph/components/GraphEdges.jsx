/**
 * src/graph/components/GraphEdges.jsx — SVG edge underlay (G-2.4).
 * One <path> per edge, parent→child, pathLength="1" (draw-in + pulse bead
 * depend on it). Geometry from lib/edges.js (§3.2 rework), style switchable
 * via ?edges= — resolved by the owner and passed down.
 */
import React, { forwardRef, useMemo } from 'react';
import { edgePath } from '../lib/edges.js';

const GraphEdges = forwardRef(function GraphEdges(
  { edges, positions, style, hoverId },
  ref,
) {
  const paths = useMemo(
    () => edges.map(([a, b]) => ({
      key: `${a}|${b}`,
      a,
      b,
      d: edgePath(positions[a], positions[b], style),
    })),
    [edges, positions, style],
  );

  return (
    <svg
      ref={ref}
      className="g-edges"
      width="5000"
      height="5000"
      viewBox="-2500 -2500 5000 5000"
      aria-hidden="true"
    >
      {paths.map((p, i) => (
        <path
          key={p.key}
          data-edge={p.key}
          d={p.d}
          pathLength="1"
          className={`edge${hoverId && (p.a === hoverId || p.b === hoverId) ? ' hot' : ''}`}
          style={{ '--d': `${(0.45 + i * 0.02).toFixed(2)}s` }}
        />
      ))}
    </svg>
  );
});

export default GraphEdges;
