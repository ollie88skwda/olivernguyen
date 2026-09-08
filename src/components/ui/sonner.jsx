// Toaster — shadcn/ui on sonner, restyled to BRAND.md.
//
// Two changes to the registry file:
//  1. It imported `useTheme` from next-themes. This is a Vite app; the ladder
//     is our own src/theme/ThemeProvider.jsx, keyed off <html data-theme>, and
//     that is what sonner's `theme` prop must follow. It read <html data-mode>
//     while terminal implied dark; D-19 split the two axes and THEMES.md §6.3
//     called this fix in.
//  2. Its colours came from the shadcn token set and its corners from
//     --radius. A toast is a surface: sakura tokens, radius 0, no shadow
//     (§4/§9). Icons are §8 glyphs, not lucide.
//
// MOUNTING: sonner renders in place, so <Toaster /> must sit INSIDE a .sakura
// element or its var(--surface)/var(--text) values have nothing to resolve
// against (AGENTS.md §2 — the tokens are never on :root).
import * as React from "react";
import { Toaster as Sonner } from "sonner";

import { Glyph } from "@/components/brand/glyph";
import { Icon } from "@/components/brand/icon";
import { useTheme } from "@/theme/ThemeProvider";
import "@/styles/components.css";

const Toaster = (props) => {
  const { theme } = useTheme();

  return (
    <Sonner
      theme={theme}
      className="on-toaster"
      icons={{
        success: <Icon name="check" />,
        info: <Glyph name="decision" tone="accent" />,
        warning: <Glyph name="decision" tone="warning" />,
        error: <Glyph name="close" tone="error" />,
        loading: <Glyph name="more" tone="faint" />,
      }}
      style={{
        "--normal-bg": "var(--surface)",
        "--normal-text": "var(--text)",
        "--normal-border": "var(--border)",
        "--success-bg": "var(--surface)",
        "--success-text": "var(--success)",
        "--success-border": "var(--success)",
        "--error-bg": "var(--surface)",
        "--error-text": "var(--danger-text)",
        "--error-border": "var(--error)",
        "--border-radius": "var(--r-surface)",
      }}
      {...props}
    />
  );
};

export { Toaster };
