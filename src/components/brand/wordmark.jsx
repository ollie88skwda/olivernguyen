// Wordmark — BRAND.md §10, promoted out of src/chrome/ into the library (D-25).
//
// §10 in full: "`oN.c` — set in Familjen Grotesk 700, with the dot in
// --accent. Reads as a domain and as initials at once; the dot is the same
// colour as the routing pulse."
//
// Two things this component exists to stop:
//   1. the mark being retyped as a plain string, which loses the accent dot —
//      the dot is the whole idea, not decoration;
//   2. the mark being re-sized ad hoc. §10 fixes nav at ~20px (--fs-wordmark)
//      and 12px as the legibility floor, so there is one size here and
//      shrinking it is a decision.
//
// It must also survive monochrome and 16px (§10), which is why the dot carries
// no shape or weight of its own — remove the colour and the mark still reads.
//
// `as` exists because the mark is a link in the chrome and plain text
// elsewhere; the visual is identical either way. Values live in
// src/styles/components.css (.on-wordmark) per §11.1.
import * as React from "react";

import { cn } from "@/lib/utils";
import "@/styles/components.css";

const Wordmark = React.forwardRef(function Wordmark({ as: As = "span", className, ...props }, ref) {
  return (
    <As data-slot="wordmark" className={cn("on-wordmark", className)} ref={ref} {...props}>
      {/* One text run, split only so the dot can take --accent. Not
          aria-hidden: assistive tech reads the three nodes as "oN.c", and
          hiding the dot would announce the mark as "oNc". */}
      oN
      <span className="on-wordmark-dot">.</span>
      c
    </As>
  );
});

export { Wordmark };
