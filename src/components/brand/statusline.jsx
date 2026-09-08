// Statusline and status pill — hand-built.
//
// BRAND.md §4 names exactly two things allowed to be 999px: the mode toggle
// and STATUS PILLS. StatusPill is that component, and it is the only export in
// this library that renders a fully round corner (the mode toggle already
// lives in src/chrome/SiteChrome.jsx).
//
// §5 licenses density inside the statusline; §7 puts it in Martian Mono.
import * as React from "react";

import { cn } from "@/lib/utils";
import "@/styles/components.css";

// status: neutral | live | routing | warning | error  (§2: jade is reserved
// for "it worked" / actively routing, gold and red for real states only)
const StatusPill = React.forwardRef(function StatusPill({ status = "neutral", dot = true, className, children, ...props }, ref) {
  return (
    <span
      data-slot="status-pill"
      data-status={status}
      className={cn("on-pill", className)}
      ref={ref}
      {...props}
    >
      {dot && <span className="on-pill-dot" aria-hidden="true" />}
      {children}
    </span>
  );
});

const Statusline = React.forwardRef(function Statusline({ className, ...props }, ref) {
  return <div data-slot="statusline" className={cn("on-statusline", className)} ref={ref}
      {...props} />;
});

// Pushes everything after it to the right edge of the statusline.
const StatuslineSpacer = React.forwardRef(function StatuslineSpacer(props, ref) {
  return <span data-slot="statusline-spacer" className="on-statusline-spacer" ref={ref}
      {...props} />;
});

export { Statusline, StatuslineSpacer, StatusPill };
