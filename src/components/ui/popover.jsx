// Popover — shadcn/ui (Radix Popover), restyled to BRAND.md.
// Surface radius 0, one hairline, no shadow (§4/§9). Portalled through
// PortalScope so it keeps the sakura tokens.
import * as React from "react";
import { Popover as PopoverPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";
import { PortalScope } from "@/components/brand/portal-scope";
import "@/styles/components.css";

function Popover(props) {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />;
}

function PopoverTrigger(props) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />;
}

function PopoverAnchor(props) {
  return <PopoverPrimitive.Anchor data-slot="popover-anchor" {...props} />;
}

function PopoverContent({ className, align = "center", sideOffset = 4, ...props }) {
  return (
    <PopoverPrimitive.Portal>
      <PortalScope>
        <PopoverPrimitive.Content
          data-slot="popover-content"
          align={align}
          sideOffset={sideOffset}
          className={cn("on-panel on-popover", className)}
          {...props}
        />
      </PortalScope>
    </PopoverPrimitive.Portal>
  );
}

const PopoverTitle = React.forwardRef(function PopoverTitle({ className, ...props }, ref) {
  return <p data-slot="popover-title" className={cn("on-popover-title", className)} ref={ref}
      {...props} />;
});

const PopoverDescription = React.forwardRef(function PopoverDescription({ className, ...props }, ref) {
  return <p data-slot="popover-description" className={cn("on-card-desc", className)} ref={ref}
      {...props} />;
});

export { Popover, PopoverTrigger, PopoverAnchor, PopoverContent, PopoverTitle, PopoverDescription };
