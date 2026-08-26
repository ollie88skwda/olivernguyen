/**
 * src/graph/components/GraphCanvas.jsx — the desktop canvas.
 *
 * G2: stage/world/camera, per-kind nodes, §3.2 edge underlay, hover 1-hop,
 * far-fade, grid sync. G3: dossier + fly-back, jade pulse routing, prompt
 * bar, ⌘K palette, `/` filter, guided tour (6s-idle autostart), entry
 * animation, keyboard model with never-trap rules (05 §5.4.2).
 * All decisions delegated to pure lib/ modules (unit-tested).
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Kbd } from '@/components/ui/kbd';
import { Glyph, MonoLabel, Wordmark } from '@/components/brand';
import { allEntities, entityById, groups, meta } from '../../content/site.js';
import { POSITIONS, worldBBox } from '../lib/layout.js';
import {
  buildEdges, buildAdjacency, buildIndex, clusterMembers, pathFromRoot,
} from '../lib/structure.js';
import { resolveEdgeStyle } from '../lib/edges.js';
import { edgeKeySet, ARRIVED_FLASH_MS } from '../lib/pulse.js';
import { filterEntities } from '../lib/filter.js';
import { TOUR_STOPS, TOUR_IDLE_AUTOSTART_MS, TOUR_STOP_DWELL_MS, stepTour } from '../lib/tour.js';
import { escAction, isTypingTarget, isModifierChord, isPaletteCombo, cycleId } from '../lib/keys.js';
import useCamera from '../useCamera.js';
import runPulse from '../runPulse.js';
import startDrift from '../drift.js';
import GraphNode from './GraphNode.jsx';
import GraphEdges from './GraphEdges.jsx';
import Dossier from './Dossier.jsx';
import PromptBar from './PromptBar.jsx';
import Palette from './Palette.jsx';
import FilterBar from './FilterBar.jsx';
import TourHud from './TourHud.jsx';
import Toast from './Toast.jsx';

/**
 * F-P.1 — TERM↔GRAPH state-lift. Module-level store: survives the mode-flip
 * unmount (the lazy chunk stays loaded), dies on reload. Only a session that
 * DIVERGED from the entry state is saved (camera moved / node focused /
 * dossier open) — an untouched graph round-trips to a fresh entry, which
 * also keeps StrictMode's dev fake-remount from tainting first-visit
 * behavior (its cleanup runs before any divergence).
 */
const SAVED = { view: null };

const EDGES = buildEdges(allEntities);
const EDGE_KEYS = edgeKeySet(EDGES);
const ADJ = buildAdjacency(EDGES);
const BY_ID = buildIndex(allEntities);
const BBOX = worldBBox(allEntities);
const ORDER = allEntities.map((e) => e.id);

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
  const preFocus = useRef(null);
  const pulseCancel = useRef(null);
  const toastTimer = useRef(null);
  const arriveTimer = useRef(null);

  const reducedMotion = useReducedMotion();
  const still = useMemo(
    () => reducedMotion || new URLSearchParams(window.location.search).has('still'),
    [reducedMotion],
  );
  const edgeStyle = useMemo(() => resolveEdgeStyle(window.location.search), []);

  const [hoverId, setHoverId] = useState(null);
  const [focusId, setFocusId] = useState(null);
  const [dossierOpen, setDossierOpen] = useState(false);
  const [arrivedId, setArrivedId] = useState(null);
  const [far, setFar] = useState(false);
  const [grabbing, setGrabbing] = useState(false);
  const [ready, setReady] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterQ, setFilterQ] = useState('');
  const [tour, setTour] = useState({ on: false, i: 0, auto: false });
  const [toastMsg, setToastMsg] = useState('');

  const camera = useCamera({
    stageRef, worldRef, zoomLabelRef,
    bbox: BBOX, reducedMotion,
    onGrabChange: setGrabbing, onFarChange: setFar,
  });

  // F-P.1: render-time peek (real remounts only — StrictMode's fake remount
  // re-runs effects without re-rendering, and its save is always null).
  const restoredMount = useRef(SAVED.view != null);
  // Nodes mount "still" on a restored session (no entry re-assemble), then
  // release one frame later so the idle drift garnish resumes.
  const [justRestored, setJustRestored] = useState(() => SAVED.view != null);
  const liveView = useRef(null);

  /* ------------------------------- helpers ------------------------------- */

  const toast = useCallback((msg) => {
    setToastMsg(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(''), 2400);
  }, []);

  const focusNode = useCallback((id) => {
    const n = entityById.get(id);
    if (!n) return;
    setDossierOpen((open) => {
      if (!open) preFocus.current = camera.current();
      return true;
    });
    setFocusId(id);
    camera.flyToNode(n, POSITIONS[id]);
  }, [camera]);

  const closeDossier = useCallback((flyBack = true) => {
    setFocusId(null);
    setDossierOpen((open) => {
      if (flyBack && open && preFocus.current) camera.flyTo(preFocus.current);
      preFocus.current = null;
      return false;
    });
  }, [camera]);

  const closeFilter = useCallback(() => {
    setFilterOpen(false);
    setFilterQ('');
  }, []);

  const endTour = useCallback(() => {
    setTour({ on: false, i: 0, auto: false });
    closeDossier(false);
    camera.fitView();
  }, [camera, closeDossier]);

  const applyTourStop = useCallback((i) => {
    setTour((t) => ({ ...t, i }));
    focusNode(TOUR_STOPS[i].id);
  }, [focusNode]);

  const startTour = useCallback((auto = false) => {
    closeFilter();
    setPaletteOpen(false);
    setTour({ on: true, i: 0, auto });
    focusNode(TOUR_STOPS[0].id);
  }, [closeFilter, focusNode]);

  const tourStep = useCallback((dir, keepAuto = false) => {
    setTour((t) => {
      if (!t.on) return t;
      const { i, ended } = stepTour(t.i, dir);
      if (ended) {
        // end outside the reducer
        setTimeout(() => endTour(), 0);
        return t;
      }
      focusNode(TOUR_STOPS[i].id);
      return { ...t, i, auto: keepAuto && t.auto };
    });
  }, [endTour, focusNode]);

  const arrive = useCallback((id) => {
    setArrivedId(id);
    clearTimeout(arriveTimer.current);
    arriveTimer.current = setTimeout(() => setArrivedId(null), ARRIVED_FLASH_MS);
  }, []);

  const pulseTo = useCallback((id, then) => {
    if (pulseCancel.current) pulseCancel.current();
    const svg = edgesRef.current;
    pulseCancel.current = runPulse(svg, pathFromRoot(BY_ID, id), EDGE_KEYS, {
      reducedMotion,
      onDone: () => {
        pulseCancel.current = null;
        arrive(id);
        then();
      },
    });
  }, [reducedMotion, arrive]);

  const runIntent = useCallback((it) => {
    switch (it.run.type) {
      case 'node':
        pulseTo(it.run.id, () => focusNode(it.run.id));
        break;
      case 'copy-email':
        (navigator.clipboard
          ? navigator.clipboard.writeText(meta.email)
          : Promise.reject(new Error('no clipboard'))
        )
          .then(() => toast(`copied — ${meta.email}`))
          .catch(() => toast(meta.email));
        break;
      case 'tour':
        startTour(false);
        break;
      case 'fit':
        closeDossier(false);
        camera.fitView();
        break;
      case 'mode': {
        const ev = new CustomEvent('on:set-mode', { detail: it.run.mode, cancelable: true });
        window.dispatchEvent(ev);
        if (!ev.defaultPrevented) toast('terminal mode is a holding screen for now');
        break;
      }
      default:
        break;
    }
  }, [pulseTo, focusNode, toast, startTour, closeDossier, camera]);

  /* --------------------------- entry + autostart --------------------------- */

  useEffect(() => {
    // restored sessions skip the entry animation exactly like ?still: .ready
    // never lands (edge draw + stagger are entry-only; resting state is full)
    if (still || restoredMount.current) return undefined;
    const raf = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(raf);
  }, [still]);

  // guided-tour idle autostart: 6s, any input cancels (05 §4.1)
  const interacted = useRef(false);
  useEffect(() => {
    if (still) return undefined;
    const cancel = () => { interacted.current = true; };
    window.addEventListener('pointerdown', cancel, true);
    window.addEventListener('keydown', cancel, true);
    window.addEventListener('wheel', cancel, true);
    const t = setTimeout(() => {
      if (!interacted.current) startTour(true);
    }, TOUR_IDLE_AUTOSTART_MS);
    return () => {
      clearTimeout(t);
      window.removeEventListener('pointerdown', cancel, true);
      window.removeEventListener('keydown', cancel, true);
      window.removeEventListener('wheel', cancel, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [still]);

  // auto-advance while the tour runs in auto mode
  useEffect(() => {
    if (!tour.on || !tour.auto) return undefined;
    const t = setTimeout(() => tourStep(1, true), TOUR_STOP_DWELL_MS);
    return () => clearTimeout(t);
  }, [tour, tourStep]);

  /* ------------------------------- keyboard ------------------------------- */

  useEffect(() => {
    const onKey = (e) => {
      if (isPaletteCombo(e)) {
        e.preventDefault();
        setPaletteOpen((o) => !o);
        return;
      }
      if (paletteOpen) {
        if (e.key === 'Escape') setPaletteOpen(false);
        return;
      }
      if (isTypingTarget(e.target)) return;   // never-trap: inputs win
      if (isModifierChord(e)) return;         // never-trap: no chord hijack

      if (tour.on) {
        switch (e.key) {
          case 'ArrowRight': case 'ArrowDown': case 'Tab':
            e.preventDefault(); tourStep(1); return;
          case 'ArrowLeft': case 'ArrowUp':
            e.preventDefault(); tourStep(-1); return;
          case 'Escape':
            endTour(); return;
          default: break;
        }
      }

      switch (e.key) {
        case '/':
          e.preventDefault();
          setFilterOpen(true);
          break;
        case 'Escape': {
          const act = escAction({
            paletteOpen, filterOpen, tourOn: tour.on, dossierOpen,
          });
          if (act === 'close-filter') closeFilter();
          else if (act === 'end-tour') endTour();
          else if (act === 'close-dossier') closeDossier();
          else if (act === 'fit') camera.fitView();
          break;
        }
        case 'Tab':
          e.preventDefault();
          focusNode(cycleId(focusId, e.shiftKey ? -1 : 1, ORDER));
          break;
        case 'ArrowRight': case 'ArrowDown':
          e.preventDefault();
          focusNode(cycleId(focusId, 1, ORDER));
          break;
        case 'ArrowLeft': case 'ArrowUp':
          e.preventDefault();
          focusNode(cycleId(focusId, -1, ORDER));
          break;
        case 'f':
          camera.fitView();
          break;
        default:
          break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [
    paletteOpen, filterOpen, dossierOpen, tour.on, focusId,
    camera, focusNode, closeDossier, closeFilter, endTour, tourStep,
  ]);

  // idle shimmer (§6 / D-27) — one rAF loop for the whole field, never started
  // under reduced motion or ?still. Runs after the entry assemble so it does
  // not fight the entry transform.
  useEffect(() => {
    if (still) return undefined;
    const world = worldRef.current;
    if (!world) return undefined;
    let stop = null;
    const t = setTimeout(() => { stop = startDrift(world); }, 900);
    return () => {
      clearTimeout(t);
      if (stop) stop();
    };
  }, [still]);

  useEffect(() => () => {
    if (pulseCancel.current) pulseCancel.current();
    clearTimeout(toastTimer.current);
    clearTimeout(arriveTimer.current);
  }, []);

  /* ---------------------- TERM↔GRAPH state-lift (F-P.1) ---------------------- */

  // Live values for the unmount save — effect closures would go stale.
  liveView.current = { focusId, dossierOpen };

  useEffect(() => {
    let raf = null;
    const v = SAVED.view;
    if (v) {
      SAVED.view = null; // consume — restores are one-shot
      interacted.current = true; // a restored session never idle-autostarts the tour
      camera.setInstant(v.camera);
      preFocus.current = v.preFocus; // Esc after restore still flies back
      if (v.focusId) setFocusId(v.focusId);
      if (v.dossierOpen) setDossierOpen(true);
      raf = requestAnimationFrame(() => setJustRestored(false));
    }
    return () => {
      if (raf) cancelAnimationFrame(raf);
      // save on unmount — runs while the stage is still in the DOM. The
      // never-trap mechanism is untouched: every listener-binding effect
      // above still detaches on this same unmount.
      const { focusId: fid, dossierOpen: dopen } = liveView.current;
      const cam = camera.current();
      // chrome-aware resting transform (useCamera owns the inset)
      const fit = camera.fitTransform();
      const diverged =
        Boolean(fid) || dopen ||
        Math.abs(cam.k - fit.k) > 1e-3 ||
        Math.abs(cam.x - fit.x) > 0.5 ||
        Math.abs(cam.y - fit.y) > 0.5;
      SAVED.view = diverged
        ? { camera: cam, focusId: fid, dossierOpen: dopen, preFocus: preFocus.current }
        : null;
    };
    // mount/unmount only — live values arrive via refs
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ------------------------------- derived ------------------------------- */

  const hotIds = useMemo(() => {
    if (!hoverId) return null;
    const s = new Set([hoverId]);
    for (const nb of ADJ.get(hoverId) || []) s.add(nb);
    return s;
  }, [hoverId]);

  const filtering = filterOpen && Boolean(filterQ.trim());
  const filterMatches = useMemo(
    () => (filtering ? filterEntities(filterQ, allEntities) : []),
    [filtering, filterQ],
  );
  const matchSet = useMemo(() => new Set(filterMatches), [filterMatches]);

  const flyToCluster = useCallback((groupId) => {
    closeDossier(false);
    camera.flyToBounds(worldBBox(clusterMembers(allEntities, BY_ID, groupId)));
  }, [camera, closeDossier]);

  /* -------------------------------- stage -------------------------------- */

  const onStagePointerDown = (e) => { stageDown.current = [e.clientX, e.clientY]; };
  const onStageClick = (e) => {
    if (e.target.closest('.node')) return;
    const d = stageDown.current;
    if (d && Math.hypot(e.clientX - d[0], e.clientY - d[1]) > 6) return;
    if (tour.on) return;
    if (dossierOpen) closeDossier();
  };
  const onStageDblClick = (e) => {
    if (e.target.closest('.node')) return;
    closeDossier(false);
    camera.fitView();
  };

  const stageCls = [
    'g-stage',
    grabbing ? 'grabbing' : '',
    hoverId ? 'hovering' : '',
    far ? 'far' : '',
    ready ? 'ready' : '',
    filtering ? 'filtering' : '',
  ].filter(Boolean).join(' ');

  const focused = focusId ? entityById.get(focusId) : null;

  return (
    <div className={dossierOpen ? 'dossier-open' : ''} style={{ position: 'absolute', inset: 0 }}>
      <div
        ref={stageRef}
        className={stageCls}
        role="application"
        aria-label={`Interactive graph of ${meta.name}'s work — ${allEntities.length} nodes. A full text listing follows for screen readers.`}
        onPointerDown={onStagePointerDown}
        onClick={onStageClick}
        onDoubleClick={onStageDblClick}
      >
        {/* 05 §8: canvas content is invisible to AT — the visually-hidden
            entity list (GraphList srOnly) is the SR surface */}
        <div ref={worldRef} className="g-world" aria-hidden="true">
          <GraphEdges
            ref={edgesRef}
            edges={EDGES}
            positions={POSITIONS}
            style={edgeStyle}
            hoverId={hoverId}
          />
          {allEntities.map((e, i) => (
            <GraphNode
              key={e.id}
              entity={e}
              pos={POSITIONS[e.id]}
              still={still || justRestored}
              entryDelay={i * 18}
              hot={hotIds ? hotIds.has(e.id) : false}
              active={focusId === e.id}
              arrived={arrivedId === e.id}
              match={filtering && matchSet.has(e.id)}
              onHover={setHoverId}
              onHoverEnd={() => setHoverId(null)}
              onActivate={focusNode}
            />
          ))}
        </div>
      </div>

      {/* legend / mini-index — library pieces only (R-G1) */}
      <div className="ui legend">
        <div className="brand">
          <Wordmark className="logo" />
          <MonoLabel>graph mode</MonoLabel>
        </div>
        <MonoLabel className="legend-sub">{`${allEntities.length} nodes · all real`}</MonoLabel>
        <div className="chips">
          {groups.map((g) => (
            <Button
              key={g.id}
              type="button"
              variant="ghost"
              size="sm"
              className="chip"
              onClick={() => flyToCluster(g.id)}
            >
              {g.title}
            </Button>
          ))}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="chip tour"
            onClick={() => startTour(false)}
          >
            <Glyph name="prompt" />
            guided tour
          </Button>
        </div>
      </div>

      {/* zoom control */}
      <div className="ui zoomctl">
        <Button type="button" variant="ghost" size="icon" aria-label="Zoom out" onClick={() => camera.zoomBy(1 / 1.35)}>−</Button>
        <MonoLabel ref={zoomLabelRef} className="z-label">100%</MonoLabel>
        <Button type="button" variant="ghost" size="icon" aria-label="Zoom in" onClick={() => camera.zoomBy(1.35)}>+</Button>
        <Button type="button" variant="ghost" size="icon" aria-label="Fit view" onClick={() => { closeDossier(false); camera.fitView(); }}>⛶</Button>
      </div>

      <div className="ui hintbar">
        <Kbd>click</Kbd> any node
        <Glyph name="sep" />
        <Kbd>/</Kbd> filter
        <Glyph name="sep" />
        <Kbd><Glyph name="key" />K</Kbd> commands
        <Glyph name="sep" />
        <Kbd>⇥</Kbd> cycle
        <Glyph name="sep" />
        <Kbd>esc</Kbd> back
      </div>

      <FilterBar
        open={filterOpen}
        query={filterQ}
        matches={filterMatches}
        onQuery={setFilterQ}
        onClose={closeFilter}
        onCommit={(id) => { closeFilter(); focusNode(id); }}
      />
      <TourHud on={tour.on} index={tour.i} />
      <PromptBar
        still={still}
        onRun={runIntent}
        onNoMatch={() => toast('no match — try “week”, “day 4” or “robotics”')}
      />
      <Dossier
        entity={focused}
        open={dossierOpen}
        onClose={() => closeDossier()}
        onGoto={focusNode}
      />
      <Palette open={paletteOpen} onClose={() => setPaletteOpen(false)} onRun={runIntent} />
      <Toast msg={toastMsg} />
    </div>
  );
}
