/**
 * src/graph/components/GraphCanvas.jsx — the desktop canvas (G-2.2..G-2.5).
 *
 * World-div + SVG-underlay architecture ported from the prototype (P1).
 * This file owns: stage, camera wiring, hover 1-hop model, node focus fly,
 * legend cluster fly, zoom controls, far-fade class, ?edges= switch, ?still.
 * Dossier/prompt/⌘K/filter/tour arrive in Phase G3 on top of this canvas.
 */
import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { allEntities, entityById, groups } from '../../content/site.js';
import { POSITIONS, worldBBox } from '../lib/layout.js';
import { buildEdges, buildAdjacency, buildIndex, clusterMembers } from '../lib/structure.js';
import { resolveEdgeStyle } from '../lib/edges.js';
import useCamera from '../useCamera.js';
import GraphNode from './GraphNode.jsx';
import GraphEdges from './GraphEdges.jsx';

const EDGES = buildEdges(allEntities);
const ADJ = buildAdjacency(EDGES);
const BY_ID = buildIndex(allEntities);
const BBOX = worldBBox(allEntities);

function useReducedMotion() {
  const [rm, setRm] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const fn = (e) => setRm(e.matches);
    mq.addEventListener('change', fn);
    return () => mq.removeEventListener('change', fn);
  }, []);
  return rm;
}

export default function GraphCanvas() {
  const stageRef = useRef(null);
  const worldRef = useRef(null);
  const edgesRef = useRef(null);
  const zoomLabelRef = useRef(null);
  const stageDown = useRef(null);

  const reducedMotion = useReducedMotion();
  const still = useMemo(
    () => reducedMotion || new URLSearchParams(window.location.search).has('still'),
    [reducedMotion],
  );
  const edgeStyle = useMemo(
    () => resolveEdgeStyle(window.location.search),
    [],
  );

  const [hoverId, setHoverId] = useState(null);
  const [focusId, setFocusId] = useState(null);
  const [far, setFar] = useState(false);
  const [grabbing, setGrabbing] = useState(false);
  const [ready, setReady] = useState(false);

  const camera = useCamera({
    stageRef, worldRef, zoomLabelRef,
    bbox: BBOX, reducedMotion,
    onGrabChange: setGrabbing, onFarChange: setFar,
  });

  // edge draw-in after mount (skipped when still)
  useEffect(() => {
    if (still) return undefined;
    const raf = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(raf);
  }, [still]);

  const hotIds = useMemo(() => {
    if (!hoverId) return null;
    const s = new Set([hoverId]);
    for (const nb of ADJ.get(hoverId) || []) s.add(nb);
    return s;
  }, [hoverId]);

  const focusNode = useCallback((id) => {
    const n = entityById.get(id);
    if (!n) return;
    setFocusId(id);
    camera.flyToNode(n, POSITIONS[id]);
  }, [camera]);

  const flyToCluster = useCallback((groupId) => {
    setFocusId(null);
    camera.flyToBounds(worldBBox(clusterMembers(allEntities, BY_ID, groupId)));
  }, [camera]);

  const onStagePointerDown = (e) => { stageDown.current = [e.clientX, e.clientY]; };
  const onStageClick = (e) => {
    if (e.target.closest('.node')) return;
    const d = stageDown.current;
    if (d && Math.hypot(e.clientX - d[0], e.clientY - d[1]) > 6) return;
    setFocusId(null);
  };
  const onStageDblClick = (e) => {
    if (e.target.closest('.node')) return;
    setFocusId(null);
    camera.fitView();
  };

  const stageCls = [
    'g-stage',
    grabbing ? 'grabbing' : '',
    hoverId ? 'hovering' : '',
    far ? 'far' : '',
    ready ? 'ready' : '',
  ].filter(Boolean).join(' ');

  return (
    <>
      <div
        ref={stageRef}
        className={stageCls}
        onPointerDown={onStagePointerDown}
        onClick={onStageClick}
        onDoubleClick={onStageDblClick}
      >
        <div ref={worldRef} className="g-world">
          <GraphEdges
            ref={edgesRef}
            edges={EDGES}
            positions={POSITIONS}
            style={edgeStyle}
            hoverId={hoverId}
          />
          {allEntities.map((e) => (
            <GraphNode
              key={e.id}
              entity={e}
              pos={POSITIONS[e.id]}
              still={still}
              hot={hotIds ? hotIds.has(e.id) : false}
              active={focusId === e.id}
              match={false}
              onHover={setHoverId}
              onHoverEnd={() => setHoverId(null)}
              onActivate={focusNode}
            />
          ))}
        </div>
      </div>

      {/* legend / mini-index */}
      <div className="ui legend">
        <div className="brand">
          <span className="logo">oN.c</span>
          <span className="mode-label">GRAPH MODE</span>
        </div>
        <div className="legend-sub">30 nodes · all real</div>
        <div className="chips">
          {groups.map((g) => (
            <button
              key={g.id}
              type="button"
              className="chip"
              onClick={() => flyToCluster(g.id)}
            >
              {g.title}
            </button>
          ))}
        </div>
      </div>

      {/* zoom control */}
      <div className="ui zoomctl">
        <button type="button" aria-label="Zoom out" onClick={() => camera.zoomBy(1 / 1.35)}>−</button>
        <span ref={zoomLabelRef} className="z-label">100%</span>
        <button type="button" aria-label="Zoom in" onClick={() => camera.zoomBy(1.35)}>+</button>
        <button type="button" aria-label="Fit view" onClick={() => { setFocusId(null); camera.fitView(); }}>⛶</button>
      </div>

      {/* hint bar */}
      <div className="ui hintbar">
        <b>click</b> any node · <b>drag</b> pan · <b>scroll</b> zoom · <b>double-click</b> fit
      </div>
    </>
  );
}
