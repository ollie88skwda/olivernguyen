// Checkbox — shadcn/ui (Radix Checkbox), restyled to BRAND.md.
//
// The tick is the one ratified §8 icon exception (D-13). It went glyph → icon
// after review: the mono ✓ read thin and lopsided at 18px. It is drawn through
// components/brand/icon.jsx so the 1.5 stroke and 18px grid are enforced once.
import * as React from "react";
import { Checkbox as CheckboxPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";
import { Icon } from "@/components/brand/icon";
import "@/styles/components.css";

function Checkbox({ className, ...props }) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn("on-check", className)}
      {...props}
    >
      <CheckboxPrimitive.Indicator data-slot="checkbox-indicator" className="on-check-glyph">
        <Icon name="check" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
