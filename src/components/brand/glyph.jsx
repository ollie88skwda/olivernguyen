// Glyph — hand-built. BRAND.md §8 / DECISIONS D-09.
//
// "Glyphs, not icons." Typographic marks set in the mono carry ~90% of the
// work, so this is the single place the marks are named. It renders a <span>,
// never an SVG path (§8 is explicit: never hand-roll SVG paths).
//
// The RATIFIED set is BRAND.md §8 verbatim:
//   ◆ decision · → tool call · ✉ email · ▸ prompt · ✕ close · ⌘ key
//   ↓ scroll · · separator · ┌ │ └ tree/frame
//
// The marks below §8's list (check, chevron, bullet, arrows, ellipsis) are
// EXTENSIONS this library needed for controls §8 does not discuss — a checked
// checkbox, a select's open affordance, a menu's sub-arrow. They are the same
// mechanism (a mono character, not an icon), but they are not in the locked
// set, so they are raised as OQ-6 in docs/COMPONENTS.md rather than assumed.
import * as React from "react";

import { cn } from "@/lib/utils";
import "@/styles/components.css";

// name → [mark, default accessible name]
const GLYPHS = {
  // BRAND.md §8, ratified
  decision: ["◆", "decision"],
  call: ["→", "tool call"],
  email: ["✉", "email"],
  prompt: ["▸", "prompt"],
  close: ["✕", "close"],
  key: ["⌘", "command key"],
  scroll: ["↓", "scroll"],
  sep: ["·", null],
  treeTop: ["┌", null],
  treeBar: ["│", null],
  treeEnd: ["└", null],
  // extensions — see OQ-6
  check: ["✓", "checked"],
  down: ["▾", null],
  up: ["▴", null],
  right: ["▸", null],
  left: ["◂", null],
  dot: ["▪", null],
  more: ["…", "more"],
};

const Glyph = React.forwardRef(function Glyph({ name, tone, label, className, ...props }, ref) {
  const entry = GLYPHS[name];
  if (!entry) throw new Error(`<Glyph name="${name}"> is not in the BRAND.md §8 set`);
  const [mark, defaultLabel] = entry;
  const accessibleName = label ?? defaultLabel;
  return (
    <span
      data-slot="glyph"
      data-glyph={name}
      data-tone={tone}
      className={cn("on-glyph", className)}
      aria-hidden={accessibleName ? undefined : "true"}
      role={accessibleName ? "img" : undefined}
      aria-label={accessibleName || undefined}
      ref={ref}
      {...props}
    >
      {mark}
    </span>
  );
});

export { Glyph, GLYPHS };
