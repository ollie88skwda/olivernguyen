// Button — shadcn/ui (style: radix-nova) restyled to BRAND.md.
//
// Registry output shipped 6 variants x 9 sizes on the shadcn token set with
// rounded-lg corners. This keeps the shadcn API shape (variant / size /
// asChild / data-slot) and drops everything the brand does not have:
//   variants  primary | ghost | link | danger      (BRAND.md §2 rationing)
//   sizes     default | sm | icon                  (§1 44px on coarse pointer)
// All visual values live in src/styles/components.css (.on-btn) — §11.1.
import * as React from "react";
import { Slot } from "radix-ui";

import { cn } from "@/lib/utils";
import "@/styles/components.css";

const Button = React.forwardRef(function Button({ className, variant = "primary", size = "default", asChild = false, ...props }, ref) {
  const Comp = asChild ? Slot.Root : "button";
  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn("on-btn", className)}
      ref={ref}
      {...props}
    />
  );
});

export { Button };
