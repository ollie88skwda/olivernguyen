// Popover — shadcn/ui (Radix Popover), restyled to BRAND.md.
// Surface radius 0, one hairline, no shadow (§4/§9). Portalled through
// PortalScope so it keeps the sakura tokens.
import * as React from "react";
import { Popover as PopoverPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";
import { PortalScope } from "@/components/brand/portal-scope";
import "@/styles/components.css";

// D-24: DOM-rendering parts forward refs; `Popover` is the context Root and
// renders nothing, so it stays a plain function.
function Popover(props) {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />;
}

const PopoverTrigger = React.forwardRef(function PopoverTrigger(props, ref) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" ref={ref} {...props} />;
});

const PopoverAnchor = React.forwardRef(function PopoverAnchor(props, ref) {
  return <PopoverPrimitive.Anchor data-slot="popover-anchor" ref={ref} {...props} />;
});

const PopoverContent = React.forwardRef(function PopoverContent({ className, align = "center", sideOffset = 4, ...props }, ref) {
  return (
    <PopoverPrimitive.Portal>
      <PortalScope>
        <PopoverPrimitive.Content
          data-slot="popover-content"
          align={align}
          sideOffset={sideOffset}
          className={cn("on-panel on-popover", className)}
          ref={ref}
          {...props}
        />
      </PortalScope>
    </PopoverPrimitive.Portal>
  );
});

const PopoverTitle = React.forwardRef(function PopoverTitle({ className, ...props }, ref) {
  return <p data-slot="popover-title" className={cn("on-popover-title", className)} ref={ref}
      {...props} />;
});

const PopoverDescription = React.forwardRef(function PopoverDescription({ className, ...props }, ref) {
  return <p data-slot="popover-description" className={cn("on-card-desc", className)} ref={ref}
      {...props} />;
});

export { Popover, PopoverTrigger, PopoverAnchor, PopoverContent, PopoverTitle, PopoverDescription };
