// PromptBar — hand-built. The graph mode's input affordance (05 §6) and the
// terminal's prompt share one shape: the §8 ▸ sigil, then a bare mono input.
//
// It is a CONTROL, so 3px (§4), and it focuses by moving its hairline to
// --accent at 140ms (§6). Submitting is the consumer's business — this is a
// controlled input with an onSubmit, not a form.
import * as React from "react";

import { cn } from "@/lib/utils";
import { Glyph } from "@/components/brand/glyph";
import "@/styles/components.css";

const PromptBar = React.forwardRef(function PromptBar({ className, placeholder = "ask anything", onSubmit, children, ...props }, ref) {
  const handleKeyDown = (event) => {
    if (event.key === "Enter" && onSubmit) onSubmit(event.currentTarget.value, event);
    props.onKeyDown?.(event);
  };

  return (
    <div data-slot="prompt-bar" className={cn("on-prompt", className)}>
      <Glyph name="prompt" tone="accent" />
      <input
        type="text"
        className="on-prompt-input"
        placeholder={placeholder}
        ref={ref}
      {...props}
        onKeyDown={handleKeyDown}
      />
      {children}
    </div>
  );
});

export { PromptBar };
