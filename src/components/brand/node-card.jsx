// NodeCard — hand-built. The graph canvas's unit, reusable outside the canvas
// (the phone build renders graph mode as a grouped LIST — BRAND.md §1 / D-01 —
// and that list needs the same card without React Flow).
//
// §4  a node card is a surface → radius 0.
// §7  title in the display face; kicker and tech tokens in Martian.
// §9  one hairline, no shadow. Hover moves the border to --node-border-active.
//     It reads --node-* when the graph tokens are present and falls back to the
//     shared ladder in terminal mode.
import * as React from "react";

import { cn } from "@/lib/utils";
import { MonoLabel } from "@/components/brand/typography";
import "@/styles/components.css";

const TechToken = React.forwardRef(function TechToken({ className, ...props }, ref) {
  return <span data-slot="tech-token" className={cn("on-tech", className)} ref={ref}
      {...props} />;
});

const TechRow = React.forwardRef(function TechRow({ className, ...props }, ref) {
  return <div data-slot="tech-row" className={cn("on-tech-row", className)} ref={ref}
      {...props} />;
});

const NodeCard = React.forwardRef(function NodeCard({
  kicker,
  title,
  description,
  tech = [],
  active = false,
  as: As = "div",
  className,
  children,
  ...props
}, ref) {
  return (
    <As
      data-slot="node-card"
      data-active={active ? "true" : undefined}
      className={cn("on-node", className)}
      ref={ref}
      {...props}
    >
      {kicker && <MonoLabel>{kicker}</MonoLabel>}
      <h3 className="on-node-title">{title}</h3>
      {description && <p className="on-node-desc">{description}</p>}
      {tech.length > 0 && (
        <TechRow>
          {tech.map((item) => (
            <TechToken key={item}>{item}</TechToken>
          ))}
        </TechRow>
      )}
      {children}
    </As>
  );
});

export { NodeCard, TechToken, TechRow };
