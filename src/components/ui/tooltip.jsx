// Tooltip — shadcn/ui (Radix Tooltip), restyled to BRAND.md.
//
// Set in the label mono (§7) because a tooltip is a caption, not prose.
// No arrow: §9 wants hairlines, and an arrow needs either a shadow or a
// two-tone border seam to read. BRAND.md §1 also forbids anything depending on
// hover alone, so a tooltip may only ever repeat information available another
// way — it is never the sole carrier of a label.
import * as React from "react";
import { Tooltip as TooltipPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";
import { PortalScope } from "@/components/brand/portal-scope";
import "@/styles/components.css";

function TooltipProvider({ delayDuration = 200, ...props }) {
  return (
    <TooltipPrimitive.Provider
      data-slot="tooltip-provider"
      delayDuration={delayDuration}
      {...props}
    />
  );
}

function Tooltip(props) {
  return <TooltipPrimitive.Root data-slot="tooltip" {...props} />;
}

// D-24: `TooltipProvider` and `Tooltip` are context-only and render no DOM;
// the trigger and the content forward their refs.
const TooltipTrigger = React.forwardRef(function TooltipTrigger(props, ref) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" ref={ref} {...props} />;
});

const TooltipContent = React.forwardRef(function TooltipContent({ className, sideOffset = 6, ...props }, ref) {
  return (
    <TooltipPrimitive.Portal>
      <PortalScope>
        <TooltipPrimitive.Content
          data-slot="tooltip-content"
          sideOffset={sideOffset}
          className={cn("on-tooltip", className)}
          ref={ref}
          {...props}
        />
      </PortalScope>
    </TooltipPrimitive.Portal>
  );
});

export { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent };
