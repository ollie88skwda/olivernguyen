// Brand components — the pieces BRAND.md defines that no registry ships.
// See docs/COMPONENTS.md for the inventory and the brand rule each one encodes.
export { Glyph, GLYPHS } from "./glyph.jsx";
// §8's narrow lucide exception. Exported so consumers follow the documented
// `@/components/brand` import path; the allow-list in icon.jsx still gates it.
export { Icon, ICONS } from "./icon.jsx";
export { MonoLabel, Display, SectionHead } from "./typography.jsx";
// D-25: the two brand marks the chrome used to draw by hand — §10's wordmark
// and §4's mode toggle (the only 999px component besides StatusPill).
export { Wordmark } from "./wordmark.jsx";
export { ModeToggle, MODES } from "./mode-toggle.jsx";
export { Log, LogLine, CodeBlock } from "./log.jsx";
export { Statusline, StatuslineSpacer, StatusPill } from "./statusline.jsx";
export { PromptBar } from "./prompt-bar.jsx";
export { NodeCard, TechToken, TechRow } from "./node-card.jsx";
export { Dossier, DossierHeader, StatBlock, StatRow } from "./dossier.jsx";
export { PortalScope } from "./portal-scope.jsx";
