// Input — shadcn/ui, restyled to BRAND.md (.on-field).
// `face="mono"` switches the JetBrains body face on for command/path fields
// (D-08); everything else is the sans body role.
import * as React from "react";

import { cn } from "@/lib/utils";
import "@/styles/components.css";

const Input = React.forwardRef(function Input({ className, type, face = "sans", ...props }, ref) {
  return (
    <input
      type={type}
      data-slot="input"
      data-face={face}
      className={cn("on-field", className)}
      ref={ref}
      {...props}
    />
  );
});

export { Input };
