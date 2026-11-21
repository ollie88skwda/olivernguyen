// Wordmark: the slash mark in accent pink, then "Oliver Nguyen" in 700 (D-40/D-41).
// The slash path is the same one src/portfolio/Portfolio.jsx draws. Values live
// in src/styles/components.css (.on-wordmark). `as` lets it be a link or text.
import * as React from "react";

import { cn } from "@/lib/utils";
import "@/styles/components.css";

const Wordmark = React.forwardRef(function Wordmark({ as: As = "span", className, ...props }, ref) {
  return (
    <As data-slot="wordmark" className={cn("on-wordmark", className)} ref={ref} {...props}>
      <svg className="on-wordmark-slash" viewBox="0 0 32 32" width="18" height="18" aria-hidden="true">
        <path d="M1 18.01L31 2.49L31 13.99L1 29.51Z" />
      </svg>
      Oliver Nguyen
    </As>
  );
});

export { Wordmark };
