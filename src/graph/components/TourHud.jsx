/**
 * src/graph/components/TourHud.jsx — guided-tour HUD (G-3.5).
 */
import React from 'react';
import { TOUR_STOPS, tourStepLabel } from '../lib/tour.js';

export default function TourHud({ on, index }) {
  if (!on) return null;
  return (
    <div className="ui tourhud on" role="status">
      <span className="t-step">{tourStepLabel(index)}</span>
      <span className="t-cap">{TOUR_STOPS[index].cap}</span>
      <span className="t-keys">←/→ step · esc end</span>
    </div>
  );
}
