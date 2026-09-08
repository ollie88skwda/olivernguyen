// Skeleton — shadcn/ui, restyled to BRAND.md.
//
// The registry version is Tailwind's `animate-pulse`. BRAND.md §6 bans infinite
// loops, and a slow opacity pulse was ratified as the second named exception on
// 2026-08-25 (DECISIONS D-18; the terminal cursor blink is the first). Opacity
// only — no shimmer sweep, no transform. Under prefers-reduced-motion it stops
// dead and aria-busy carries the state on its own.
import * as React from "react";

import { cn } from "@/lib/utils";
import "@/styles/components.css";

const Skeleton = React.forwardRef(function Skeleton({ className, shape = "surface", ...props }, ref) {
  return (
    <div
      data-slot="skeleton"
      data-shape={shape}
      aria-hidden="true"
      className={cn("on-skeleton", className)}
      ref={ref}
      {...props}
    />
  );
});

export { Skeleton };
