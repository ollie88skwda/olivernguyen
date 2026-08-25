// Icon — the narrow, deliberate exception to BRAND.md §8 / D-09.
//
// §8: "Glyphs, not icons... Real icons only where a glyph genuinely cannot
// work." A checkbox tick is one of those cases and was ratified as such on
// 2026-08-25 (DECISIONS D-13): the mono faces do not draw a usable tick, and
// the U+2713 character came out thin and lopsided at 18px.
//
// This wrapper exists so the §8 constraints are applied in ONE place and
// cannot drift per call site:
//   · one family only — lucide-react, already a dependency
//   · strokeWidth locked to 1.5
//   · size on an 18px grid
//   · currentColor only — no colour prop
//
// Adding an icon here is a brand decision, not an implementation detail. The
// allow-list below is the full set of cases where a glyph was ruled out; grow
// it only with a DECISIONS.md entry.
import * as React from "react";
import { Check, Moon, Sun } from "lucide-react";

import { cn } from "@/lib/utils";
import "@/styles/components.css";

// name → lucide component. Ratified exceptions only.
const ICONS = {
  check: Check, // D-13: checkbox / menu tick
  // D-23: the theme control. ☀ and ☾ are outside §8's ratified glyph set and
  // fail at control size the way the tick did, so the switch is drawn — at the
  // full 18px --icon grid, 1.5 stroke, currentColor, like every icon here.
  sun: Sun, // D-23: light ladder
  moon: Moon, // D-23: dark ladder
};

function Icon({ name, size = 18, className, ...props }) {
  const Cmp = ICONS[name];
  if (!Cmp) {
    throw new Error(
      `<Icon name="${name}"> is not a ratified §8 exception. Use <Glyph> or log a decision.`
    );
  }
  return (
    <Cmp
      data-slot="icon"
      data-icon={name}
      aria-hidden="true"
      width={size}
      height={size}
      strokeWidth={1.5}
      className={cn("on-icon", className)}
      {...props}
    />
  );
}

export { Icon, ICONS };
