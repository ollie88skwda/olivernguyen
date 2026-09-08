// Progress — shadcn/ui (Radix Progress), restyled to BRAND.md.
// A progress bar is a surface, so it is square (§4), 4px tall (§5 ladder), and
// the fill moves at the 140ms state duration (§6).
import * as React from "react";
import { Progress as ProgressPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";
import "@/styles/components.css";

const Progress = React.forwardRef(function Progress({ className, value = 0, ...props }, ref) {
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn("on-progress", className)}
      ref={ref}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className="on-progress-fill"
        style={{ transform: `translateX(-${100 - value}%)` }}
      />
    </ProgressPrimitive.Root>
  );
});

export { Progress };
