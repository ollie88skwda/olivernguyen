// Kbd — shadcn/ui, restyled to BRAND.md.
// §7 puts key hints in Martian Mono; §8 gives ⌘ as a glyph, so a key hint is
// always typographic, never an icon.
import * as React from "react";

import { cn } from "@/lib/utils";
import "@/styles/components.css";

const Kbd = React.forwardRef(function Kbd({ className, ...props }, ref) {
  return <kbd data-slot="kbd" className={cn("on-kbd", className)} ref={ref}
      {...props} />;
});

const KbdGroup = React.forwardRef(function KbdGroup({ className, ...props }, ref) {
  return <span data-slot="kbd-group" className={cn("on-kbd-group", className)} ref={ref}
      {...props} />;
});

export { Kbd, KbdGroup };
