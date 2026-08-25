// Textarea — shadcn/ui, restyled to BRAND.md (.on-field).
import * as React from "react";

import { cn } from "@/lib/utils";
import "@/styles/components.css";

const Textarea = React.forwardRef(function Textarea({ className, face = "sans", ...props }, ref) {
  return (
    <textarea
      data-slot="textarea"
      data-face={face}
      className={cn("on-field", className)}
      ref={ref}
      {...props}
    />
  );
});

export { Textarea };
