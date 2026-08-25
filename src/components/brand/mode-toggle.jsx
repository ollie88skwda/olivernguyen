// ModeToggle — the TERM | GRAPH switch, promoted out of src/chrome/ (D-25).
//
// BRAND.md §4 names exactly two things allowed a 999px radius: status pills
// and THIS. StatusPill was already in the library; this is the other one, so
// after this file no consumer has a reason to draw a round corner by hand.
//
// It is deliberately not generic. §0 defines two interfaces over one content
// model — terminal and graph — and BRAND.md talks about "the mode toggle", one
// control with two known labels. An `options` prop would invite a third mode
// that the brand does not have.
//
// Controlled only: mode lives in src/mode/ModeProvider.jsx (it writes
// <html data-mode>), and a library component must not reach for that context
// or it stops being usable in the gallery.
//
// Motion: the thumb slide is an ordinary state change, so it takes §6's 140ms
// ease-out — not a camera move. Under prefers-reduced-motion it jumps, and the
// aria-pressed state carries the same information either way.
import * as React from "react";

import { cn } from "@/lib/utils";
import "@/styles/components.css";

// Order is fixed: terminal sits left because it is the console the site opens
// as, and the thumb's resting position is the left cell.
const MODES = [
  { value: "terminal", label: "TERM" },
  { value: "graph", label: "GRAPH" },
];

const ModeToggle = React.forwardRef(function ModeToggle(
  { mode = "terminal", onModeChange, label = "Site mode", className, ...props },
  ref,
) {
  return (
    <div
      data-slot="mode-toggle"
      data-mode={mode}
      role="group"
      aria-label={label}
      className={cn("on-mode-toggle", className)}
      ref={ref}
      {...props}
    >
      {/* One thumb sliding between two equal cells, rather than a background
          on the active button — a background swap cannot be animated, and §6
          spends its budget on state changes exactly like this one. */}
      <span className="on-mode-thumb" aria-hidden="true" />
      {MODES.map(({ value, label: text }) => (
        <button
          key={value}
          type="button"
          className="on-mode-btn"
          aria-pressed={mode === value}
          onClick={() => onModeChange?.(value)}
        >
          {text}
        </button>
      ))}
    </div>
  );
});

export { ModeToggle, MODES };
