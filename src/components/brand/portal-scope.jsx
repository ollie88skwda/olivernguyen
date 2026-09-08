// PortalScope — hand-built, and the reason every overlay in this library still
// looks like the rest of the site.
//
// AGENTS.md §2 / BRAND.md §11.3: sakura tokens live under `.sakura` and never
// on :root. Radix portals its overlays to document.body, which is OUTSIDE that
// scope — so a portalled menu would inherit the legacy navy/gold :root tokens
// from src/styles/theme.css instead. Wrapping portal children in
// `.sakura .sakura-portal` re-establishes the token scope (and the z-index)
// without leaking anything to :root.
import * as React from "react";

import { cn } from "@/lib/utils";
import "@/styles/components.css";

const PortalScope = React.forwardRef(function PortalScope({ className, ...props }, ref) {
  return <div data-slot="portal-scope" className={cn("sakura sakura-portal", className)} ref={ref}
      {...props} />;
});

export { PortalScope };
