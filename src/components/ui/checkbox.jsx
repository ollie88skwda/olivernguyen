// Checkbox — shadcn/ui (Radix Checkbox), restyled to BRAND.md.
// The registry version drew the tick with a lucide CheckIcon; BRAND.md §8 /
// D-09 put typographic marks first, so the indicator is a mono glyph.
import * as React from "react";
import { Checkbox as CheckboxPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";
import { Glyph } from "@/components/brand/glyph";
import "@/styles/components.css";

function Checkbox({ className, ...props }) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn("on-check", className)}
      {...props}
    >
      <CheckboxPrimitive.Indicator data-slot="checkbox-indicator" className="on-check-glyph">
        <Glyph name="check" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
