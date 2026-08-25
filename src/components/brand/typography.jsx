// Typography roles — hand-built from BRAND.md §7. There is no registry
// component for "the uppercase Martian label", and it is the single most
// repeated piece of this brand.
//
//   MonoLabel   §7 mono-labels: uppercase Martian, tracking 0.08–0.16em.
//               Labels, chips, statusline, key hints, kickers, captions.
//   Display     §7 display: Familjen Grotesk 700 at -0.02em.
//   SectionHead kicker + display heading + optional §9 hairline rule.
import * as React from "react";

import { cn } from "@/lib/utils";
import "@/styles/components.css";

const MonoLabel = React.forwardRef(function MonoLabel({ className, tone, as: As = "span", ...props }, ref) {
  return <As data-slot="mono-label" data-tone={tone} className={cn("on-label", className)} ref={ref}
      {...props} />;
});

const Display = React.forwardRef(function Display({ className, as: As = "h1", ...props }, ref) {
  return <As data-slot="display" className={cn("on-display", className)} ref={ref}
      {...props} />;
});

const SectionHead = React.forwardRef(function SectionHead({ kicker, title, as: As = "h2", rule = true, className, children, ...props }, ref) {
  return (
    <header
      data-slot="section-head"
      data-rule={rule ? "true" : undefined}
      className={cn("on-section-head", className)}
      ref={ref}
      {...props}
    >
      {kicker && <MonoLabel>{kicker}</MonoLabel>}
      <As className="on-section-title">{title}</As>
      {children}
    </header>
  );
});

export { MonoLabel, Display, SectionHead };
