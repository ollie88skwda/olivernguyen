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

// `titleAs` / `titleClassName` exist for the phone graph list (G-4.1): the
// list nests entries under real section headings, so the root entry has to be
// an <h2> where the rest are <h3> or axe flags a skipped heading level, and
// the surface keeps its own test hook. Neither changes a brand value — the
// title role stays .on-node-title (§7 display, --fs-title).
const NodeCard = React.forwardRef(function NodeCard({
  kicker,
  title,
  titleAs: TitleAs = "h3",
  titleClassName,
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
      <TitleAs className={cn("on-node-title", titleClassName)}>{title}</TitleAs>
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
