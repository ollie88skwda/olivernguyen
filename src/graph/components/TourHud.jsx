/**
 * src/graph/components/TourHud.jsx — guided-tour HUD (G-3.5).
 * R-G1: step counter and key hints are the library's label role (§7); the
 * caption is sans body. The HUD is a surface, so §4 makes it square — the
 * 999px pill it used to be is not one of §4's three exceptions.
 */
import React from 'react';
import { MonoLabel } from '@/components/brand';
import { TOUR_STOPS, tourStepLabel } from '../lib/tour.js';

export default function TourHud({ on, index }) {
  if (!on) return null;
  return (
    <div className="ui tourhud on" role="status">
      <MonoLabel className="t-step" tone="accent">{tourStepLabel(index)}</MonoLabel>
      <span className="t-cap">{TOUR_STOPS[index].cap}</span>
      <MonoLabel className="t-keys">←/→ step · esc end</MonoLabel>
    </div>
  );
}
