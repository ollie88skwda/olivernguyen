// Separator — shadcn/ui (Radix Separator), restyled to BRAND.md.
// This is §9's primary separation mechanism: a 1px hairline in --border.
import * as React from "react";
import { Separator as SeparatorPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";
import "@/styles/components.css";

function Separator({ className, orientation = "horizontal", decorative = true, ...props }) {
  return (
    <SeparatorPrimitive.Root
      data-slot="separator"
      decorative={decorative}
      orientation={orientation}
      className={cn("on-separator", className)}
      {...props}
    />
  );
}

export { Separator };
