// Badge — shadcn/ui, restyled to BRAND.md.
//
// The registry shipped 6 colour variants on a 999px pill. Here a badge is a
// CONTROL (3px, §4) set in the label mono (§7), and its tones are limited to
// the states the palette actually rations (§2): neutral, accent, success,
// warning, danger. Round status pills are a different component — see
// components/brand/statusline (§4 allows 999px there and on the mode toggle).
import * as React from "react";
import { Slot } from "radix-ui";

import { cn } from "@/lib/utils";
import "@/styles/components.css";

const Badge = React.forwardRef(function Badge({ className, tone = "neutral", solid = false, asChild = false, ...props }, ref) {
  const Comp = asChild ? Slot.Root : "span";
  return (
    <Comp
      data-slot="badge"
      data-tone={tone}
      data-solid={solid ? "true" : undefined}
      className={cn("on-badge", className)}
      ref={ref}
      {...props}
    />
  );
});

export { Badge };
