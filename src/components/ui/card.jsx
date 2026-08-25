// Card — shadcn/ui, restyled to BRAND.md.
//
// A card is a SURFACE: radius 0 (§4), a single 1px hairline and no shadow (§9),
// padded on the §5 card rung (28, 20 on phone). The registry's CardAction slot
// is dropped; the header takes children and lays them out itself.
import * as React from "react";

import { cn } from "@/lib/utils";
import "@/styles/components.css";

const Card = React.forwardRef(function Card({ className, interactive = false, ...props }, ref) {
  return (
    <div
      data-slot="card"
      data-interactive={interactive ? "true" : undefined}
      className={cn("on-card", className)}
      ref={ref}
      {...props}
    />
  );
});

const CardHeader = React.forwardRef(function CardHeader({ className, ...props }, ref) {
  return <div data-slot="card-header" className={cn("on-card-header", className)} ref={ref}
      {...props} />;
});

const CardTitle = React.forwardRef(function CardTitle({ className, as: As = "h3", ...props }, ref) {
  return <As data-slot="card-title" className={cn("on-card-title", className)} ref={ref}
      {...props} />;
});

const CardDescription = React.forwardRef(function CardDescription({ className, ...props }, ref) {
  return <p data-slot="card-description" className={cn("on-card-desc", className)} ref={ref}
      {...props} />;
});

const CardContent = React.forwardRef(function CardContent({ className, ...props }, ref) {
  return <div data-slot="card-content" className={cn("on-card-content", className)} ref={ref}
      {...props} />;
});

const CardFooter = React.forwardRef(function CardFooter({ className, ...props }, ref) {
  return <div data-slot="card-footer" className={cn("on-card-footer", className)} ref={ref}
      {...props} />;
});

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
