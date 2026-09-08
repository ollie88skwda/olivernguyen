/**
 * src/graph/lib/tour.js — guided tour data + stepping (build-plan G-3.5
 * groundwork). Stops ported verbatim from the prototype; autostart timing per
 * 05-v1-spec §4.1 (idle-only, any input cancels — the component enforces it).
 */

export const TOUR_STOPS = [
  { id: 'oliver', cap: 'One site, drawn as a graph — every node is real.' },
  { id: 'operator', cap: 'The flagship: a Claude loop that ran a project alone for 7 days.' },
  { id: 'day-4', cap: 'Each day logged decisions, tool calls, and a morning email.' },
  { id: 'mac-agent', cap: 'The toolbelt that gives Claude hands on a Mac.' },
  { id: 'mcp-tools', cap: 'Eight typed tools — this is what “hands” means.' },
  { id: 'scopecreep', cap: 'Small honest tools too: zero LLM calls in this one.' },
  { id: 'techx', cap: 'Off-screen: 15+ robotics students, a Worlds-qualified team.' },
  { id: 'email', cap: 'The open channel. Say hi.' },
];

/** Autostart only if the visitor hasn't interacted within 6s of load. */
export const TOUR_IDLE_AUTOSTART_MS = 6000;
/** Dossier dwell per stop when the tour auto-advances (05 §4.1). */
export const TOUR_STOP_DWELL_MS = 4000;

/** Step label "3/8". */
export function tourStepLabel(i, len = TOUR_STOPS.length) {
  return `${i + 1}/${len}`;
}

/**
 * Prototype stepping semantics: back-stepping clamps at the first stop
 * (stays running), stepping past the last stop ends the tour.
 * @returns {{ i: number, ended: boolean }}
 */
export function stepTour(i, dir, len = TOUR_STOPS.length) {
  const next = i + dir;
  if (next < 0) return { i: 0, ended: false };
  if (next >= len) return { i, ended: true };
  return { i: next, ended: false };
}
