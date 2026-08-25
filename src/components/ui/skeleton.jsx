// Skeleton — shadcn/ui, restyled to BRAND.md.
//
// The registry version is `animate-pulse`. BRAND.md §6 bans infinite loops
// (the terminal cursor blink is the only exception), so this is a flat surface
// block and the loading signal is carried by aria-busy / aria-hidden instead.
// Flagged as OQ-4 in docs/COMPONENTS.md.
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
