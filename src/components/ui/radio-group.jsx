// RadioGroup — shadcn/ui (Radix RadioGroup), restyled to BRAND.md.
// The dot indicator is a shape, not a glyph — a radio is the one control the
// brand's radius rule does not cover; it is §4's third named exception (D-12).
import * as React from "react";
import { RadioGroup as RadioGroupPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";
import "@/styles/components.css";

const RadioGroup = React.forwardRef(function RadioGroup({ className, ...props }, ref) {
  return (
    <RadioGroupPrimitive.Root
      data-slot="radio-group"
      className={cn("on-field-row", className)}
      ref={ref}
      {...props}
    />
  );
});

const RadioGroupItem = React.forwardRef(function RadioGroupItem({ className, ...props }, ref) {
  return (
    <RadioGroupPrimitive.Item
      data-slot="radio-group-item"
      className={cn("on-check on-radio", className)}
      ref={ref}
      {...props}
    >
      <RadioGroupPrimitive.Indicator
        data-slot="radio-group-indicator"
        className="on-radio-dot"
      />
    </RadioGroupPrimitive.Item>
  );
});

export { RadioGroup, RadioGroupItem };
