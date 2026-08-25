// Dossier panel and stat block — hand-built.
//
// The dossier is BRAND.md §9's ONE exception: "Shadows: one exception only —
// the open graph dossier. Nothing else lifts." --shadow-dossier is used here
// and in no other component in this library.
//
// StatBlock is the dossier's figure row: value in the display face at
// --accent-hi, label in Martian at --text-faint.
import * as React from "react";

import { cn } from "@/lib/utils";
import { Glyph } from "@/components/brand/glyph";
import { MonoLabel } from "@/components/brand/typography";
import "@/styles/components.css";

const Dossier = React.forwardRef(function Dossier({ className, ...props }, ref) {
  return <div data-slot="dossier" className={cn("on-dossier", className)} ref={ref}
      {...props} />;
});

const DossierHeader = React.forwardRef(function DossierHeader({ kicker, title, meta, onClose, className, children, ...props }, ref) {
  return (
    <header data-slot="dossier-header" className={cn("on-dossier-header", className)} ref={ref}
      {...props}>
      {kicker && <MonoLabel>{kicker}</MonoLabel>}
      <h2 className="on-dossier-title">{title}</h2>
      {meta && <div className="on-dossier-meta">{meta}</div>}
      {onClose && (
        <button type="button" className="on-close" onClick={onClose} aria-label="Close dossier">
          <Glyph name="close" />
        </button>
      )}
      {children}
    </header>
  );
});

const StatBlock = React.forwardRef(function StatBlock({ value, label, className, ...props }, ref) {
  return (
    <div data-slot="stat" className={cn("on-stat", className)} ref={ref}
      {...props}>
      <span className="on-stat-value">{value}</span>
      <MonoLabel>{label}</MonoLabel>
    </div>
  );
});

const StatRow = React.forwardRef(function StatRow({ className, ...props }, ref) {
  return <div data-slot="stat-row" className={cn("on-stat-row", className)} ref={ref}
      {...props} />;
});

export { Dossier, DossierHeader, StatBlock, StatRow };
