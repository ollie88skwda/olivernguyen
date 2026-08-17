import { describe, it, expect } from 'vitest';
import {
  TOUR_STOPS, TOUR_IDLE_AUTOSTART_MS, TOUR_STOP_DWELL_MS,
  stepTour, tourStepLabel,
} from './tour.js';
import { entityById } from '../../content/site.js';

describe('guided tour — stops (Gate G3 groundwork)', () => {
  it('8 stops, prototype order, every id a real entity', () => {
    expect(TOUR_STOPS.map((s) => s.id)).toEqual([
      'oliver', 'operator', 'day-4', 'mac-agent', 'mcp-tools',
      'scopecreep', 'techx', 'email',
    ]);
    for (const s of TOUR_STOPS) {
      expect(entityById.has(s.id), s.id).toBe(true);
      expect(s.cap.length, s.id).toBeGreaterThan(10);
    }
  });

  it('timings per 05 §4.1: 6s idle autostart, 4s dwell', () => {
    expect(TOUR_IDLE_AUTOSTART_MS).toBe(6000);
    expect(TOUR_STOP_DWELL_MS).toBe(4000);
  });
});

describe('guided tour — stepping (prototype semantics)', () => {
  it('back-step clamps at the first stop, tour keeps running', () => {
    expect(stepTour(0, -1)).toEqual({ i: 0, ended: false });
  });
  it('forward steps advance', () => {
    expect(stepTour(0, 1)).toEqual({ i: 1, ended: false });
    expect(stepTour(3, 1)).toEqual({ i: 4, ended: false });
    expect(stepTour(3, -1)).toEqual({ i: 2, ended: false });
  });
  it('stepping past the last stop ends the tour', () => {
    expect(stepTour(TOUR_STOPS.length - 1, 1)).toEqual({ i: TOUR_STOPS.length - 1, ended: true });
  });
  it('step label', () => {
    expect(tourStepLabel(0)).toBe('1/8');
    expect(tourStepLabel(7)).toBe('8/8');
  });
});
