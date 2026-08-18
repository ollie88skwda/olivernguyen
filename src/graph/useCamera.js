/**
 * src/graph/useCamera.js — the camera (build-plan G-2.2).
 *
 * Owns d3-zoom on the stage element, applies transforms imperatively to the
 * world div (no React render per frame), adds prototype release-inertia
 * (exp(-dt/240)) and van Wijk fly-to via d3.interpolateZoom with 380–1050ms
 * clamped pacing. All math lives in lib/camera.js (pure, unit-tested).
 *
 * Per-frame DOM writes: world transform, dot-grid background, zoom label.
 * Rare state callbacks: onGrabChange, onFarChange (React state in the owner).
 */
import { useEffect, useMemo, useRef } from 'react';
import { select } from 'd3-selection';
import { zoom as d3zoom, zoomIdentity } from 'd3-zoom';
import { interpolateZoom } from 'd3-interpolate';
import 'd3-transition';
import {
  SCALE_EXTENT, FAR_K, worldCss, gridCss, viewOf, translateExtent,
  fitTransform, boundsTransform, focusTransform, flyDuration,
  releaseVelocity, inertiaStep, CLUSTER_FIT,
} from './lib/camera.js';

export default function useCamera({
  stageRef, worldRef, zoomLabelRef, bbox, reducedMotion,
  onGrabChange, onFarChange,
}) {
  const cur = useRef({ k: 1, x: 0, y: 0 });
  const samples = useRef([]);
  const inertiaRAF = useRef(null);
  const zoomRef = useRef(null);
  const farRef = useRef(false);

  const api = useMemo(() => {
    const viewport = () => {
      const el = stageRef.current;
      return { w: el ? el.clientWidth : 1440, h: el ? el.clientHeight : 900 };
    };
    const cancelInertia = () => {
      if (inertiaRAF.current) cancelAnimationFrame(inertiaRAF.current);
      inertiaRAF.current = null;
      samples.current = [];
    };
    const toZoom = (t) => zoomIdentity.translate(t.x, t.y).scale(t.k);
    const flyTo = (t) => {
      cancelInertia();
      const vp = viewport();
      let dur = 0;
      if (!reducedMotion) {
        const i = interpolateZoom(viewOf(cur.current, vp), viewOf(t, vp));
        dur = flyDuration(i.duration);
      }
      select(stageRef.current)
        .transition('cam')
        .duration(dur)
        .call(zoomRef.current.transform, toZoom(t));
    };
    return {
      viewport,
      cancelInertia,
      flyTo,
      current: () => cur.current,
      fitView: () => flyTo(fitTransform(bbox, viewport())),
      flyToBounds: (bb) => flyTo(boundsTransform(bb, viewport(), CLUSTER_FIT)),
      flyToNode: (node, pos) => flyTo(focusTransform(node, pos, viewport())),
      zoomBy: (f) => {
        select(stageRef.current)
          .transition('cam')
          .duration(reducedMotion ? 0 : 240)
          .call(zoomRef.current.scaleBy, f);
      },
      setInstant: (t) => {
        select(stageRef.current).call(zoomRef.current.transform, toZoom(t));
      },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bbox, reducedMotion]);

  useEffect(() => {
    const stage = stageRef.current;
    const world = worldRef.current;
    if (!stage || !world) return undefined;

    const apply = (t) => {
      cur.current = t;
      world.style.transform = worldCss(t);
      const g = gridCss(t);
      stage.style.backgroundPosition = g.backgroundPosition;
      stage.style.backgroundSize = g.backgroundSize;
      if (zoomLabelRef && zoomLabelRef.current) {
        zoomLabelRef.current.textContent = `${Math.round(t.k * 100)}%`;
      }
      const far = t.k < FAR_K;
      if (far !== farRef.current) {
        farRef.current = far;
        if (onFarChange) onFarChange(far);
      }
    };

    const sample = (ev) => {
      const p = ev.touches ? ev.touches[0] : ev;
      if (!p) return;
      samples.current.push({ x: p.clientX, y: p.clientY, t: performance.now() });
      if (samples.current.length > 4) samples.current.shift();
    };

    const maybeInertia = () => {
      if (reducedMotion) return;
      const v = releaseVelocity(samples.current, performance.now());
      samples.current = [];
      if (!v) return;
      let vel = v;
      let last = performance.now();
      const step = (now) => {
        const s = inertiaStep(vel, now - last);
        last = now;
        zoomRef.current.translateBy(
          select(stage), s.dx / cur.current.k, s.dy / cur.current.k,
        );
        vel = s.next;
        inertiaRAF.current = vel ? requestAnimationFrame(step) : null;
      };
      inertiaRAF.current = requestAnimationFrame(step);
    };

    const zoom = d3zoom()
      .scaleExtent(SCALE_EXTENT)
      .translateExtent(translateExtent(bbox))
      .on('start', (e) => {
        if (e.sourceEvent) {
          api.cancelInertia();
          const t = e.sourceEvent.type;
          if (t === 'mousedown' || t === 'touchstart' || t === 'pointerdown') {
            if (onGrabChange) onGrabChange(true);
          }
        }
      })
      .on('zoom', (e) => {
        apply(e.transform);
        if (e.sourceEvent && /move$/.test(e.sourceEvent.type)) sample(e.sourceEvent);
      })
      .on('end', (e) => {
        if (onGrabChange) onGrabChange(false);
        if (e.sourceEvent) maybeInertia();
      });

    zoomRef.current = zoom;
    const sel = select(stage);
    sel.call(zoom).on('dblclick.zoom', null);

    // initial camera: fit, instantly
    api.setInstant(fitTransform(bbox, api.viewport()));

    return () => {
      api.cancelInertia();
      sel.on('.zoom', null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api]);

  return api;
}
