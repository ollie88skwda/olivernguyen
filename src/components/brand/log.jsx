// Log line and log/code block — hand-built. This is the site's signature
// surface and no registry has an equivalent.
//
// BRAND.md rules encoded here:
//   §5  density is permitted INSIDE the log and the statusline, and nowhere
//       else; the log content column caps at ~880px.
//   §7  the line body is JetBrains Mono (D-08: read forty of these at once);
//       the timestamp is Martian, because a timestamp is a label.
//   §8  the leading mark is a Glyph, never an icon.
//   §1  readable at 12px on a 375px screen — the line is 13px/1.7 and wraps.
//
// STATES: dim | default | active | success | error. In terminal-dark these use
// the --term-* ladder; the light terminal theme is still "to derive"
// (BRAND.md §3), so each one falls back to a shared-ladder token — see OQ-1.
import * as React from "react";

import { cn } from "@/lib/utils";
import { Glyph } from "@/components/brand/glyph";
import "@/styles/components.css";

const LogLine = React.forwardRef(function LogLine({ time, glyph = "call", state = "default", className, children, ...props }, ref) {
  return (
    <div
      data-slot="log-line"
      data-state={state}
      className={cn("on-log-line", className)}
      ref={ref}
      {...props}
    >
      <span className="on-log-time">{time}</span>
      <Glyph name={glyph} />
      <span>{children}</span>
    </div>
  );
});

const Log = React.forwardRef(function Log({ className, ...props }, ref) {
  return <div data-slot="log" role="log" className={cn("on-log", className)} ref={ref}
      {...props} />;
});

// A code / transcript block. `title` renders the §9 hairline header strip.
const CodeBlock = React.forwardRef(function CodeBlock({ title, meta, className, children, ...props }, ref) {
  return (
    <div data-slot="code-block">
      {title && (
        <div className="on-code-head">
          <span className="on-label" data-tone="muted">
            {title}
          </span>
          {meta && <span className="on-label">{meta}</span>}
        </div>
      )}
      <pre className={cn("on-code", className)} ref={ref}
      {...props}>
        {children}
      </pre>
    </div>
  );
});

export { Log, LogLine, CodeBlock };
