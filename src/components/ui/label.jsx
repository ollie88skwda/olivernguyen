// Label — shadcn/ui (Radix Label), restyled to BRAND.md.
//
// Two roles, because the brand has two:
//   role="label" (default) → uppercase Martian Mono, the §7 label voice.
//   role="inline"          → sans body, for the text beside a checkbox/radio
//                            where an uppercase mono label would shout.
import * as React from "react";
import { Label as LabelPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";
import "@/styles/components.css";

function Label({ className, role = "label", ...props }) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn(role === "label" && "on-label", className)}
      {...props}
    />
  );
}

export { Label };
