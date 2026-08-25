// Sheet (drawer) — shadcn/ui (Radix Dialog), restyled to BRAND.md.
//
// Same rules as Dialog: square, hairline on the entering edge only, no shadow.
// It slides in at the graph-camera duration (§6 signature 2, 640ms
// cubic-bezier(.16,1,.3,1)) because a sheet is a camera move over the page,
// not a state change — and it holds still under prefers-reduced-motion.
import * as React from "react";
import { Dialog as SheetPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";
import { Glyph } from "@/components/brand/glyph";
import { PortalScope } from "@/components/brand/portal-scope";
import "@/styles/components.css";

function Sheet(props) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />;
}

function SheetTrigger(props) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />;
}

function SheetClose(props) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />;
}

function SheetContent({ className, children, side = "right", showClose = true, ...props }) {
  return (
    <SheetPrimitive.Portal>
      <PortalScope>
        <SheetPrimitive.Overlay data-slot="sheet-overlay" className="on-overlay" />
        <SheetPrimitive.Content
          data-slot="sheet-content"
          data-side={side}
          className={cn("on-sheet", className)}
          {...props}
        >
          {children}
          {showClose && (
            <SheetPrimitive.Close className="on-close" aria-label="Close">
              <Glyph name="close" />
            </SheetPrimitive.Close>
          )}
        </SheetPrimitive.Content>
      </PortalScope>
    </SheetPrimitive.Portal>
  );
}

function SheetHeader({ className, ...props }) {
  return <div data-slot="sheet-header" className={cn("on-dialog-header", className)} {...props} />;
}

function SheetTitle({ className, ...props }) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn("on-dialog-title", className)}
      {...props}
    />
  );
}

function SheetDescription({ className, ...props }) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn("on-dialog-desc", className)}
      {...props}
    />
  );
}

function SheetFooter({ className, ...props }) {
  return <div data-slot="sheet-footer" className={cn("on-dialog-footer", className)} {...props} />;
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
};
