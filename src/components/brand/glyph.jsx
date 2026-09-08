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
// RATIFIED EXTENSIONS (2026-08-25, DECISIONS D-13) — the chevrons, bullet and
// ellipsis controls need and §8's list does not carry. Same mechanism: a mono
// character, not an icon.
//
// The tick was DECLINED as a glyph FOR CONTROLS in the same review (D-13): no
// mono face draws a usable one at 18px in a checkbox. Controls use
// components/brand/icon.jsx, the single ratified lucide exception.
//
// It survives here for TEXT contexts only — a log line or a transcript, where
// the mark sits in a monospace character grid and an SVG would break the
// column. src/terminal/sections.jsx already ships one (`copied … ✓`). The split
// was ratified separately as D-14. Never use `checkText` inside a control.
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
  // ratified extensions — D-13
  // text-only tick (D-14) — named so a control cannot reach for it
  checkText: ["✓", "ok"],
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
