// Switch — shadcn/ui (Radix Switch), restyled to BRAND.md.
//
// The registry switch is a 999px pill. BRAND.md §4 reserves 999px for the mode
// toggle and status pills ONLY, so this is drawn as a 3px control track with a
// square thumb. The `size` prop is dropped — one switch size.
import * as React from "react";
import { Switch as SwitchPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";
import "@/styles/components.css";

const Switch = React.forwardRef(function Switch({ className, ...props }, ref) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn("on-switch", className)}
      ref={ref}
      {...props}
    >
      <SwitchPrimitive.Thumb data-slot="switch-thumb" className="on-switch-thumb" />
    </SwitchPrimitive.Root>
  );
});

export { Switch };
