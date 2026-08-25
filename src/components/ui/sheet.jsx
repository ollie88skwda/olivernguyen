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

// D-24: DOM-rendering parts forward refs; `Sheet` is the context Root and
// renders nothing, so it stays a plain function.
function Sheet(props) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />;
}

const SheetTrigger = React.forwardRef(function SheetTrigger(props, ref) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" ref={ref} {...props} />;
});

const SheetClose = React.forwardRef(function SheetClose(props, ref) {
  return <SheetPrimitive.Close data-slot="sheet-close" ref={ref} {...props} />;
});

const SheetContent = React.forwardRef(function SheetContent({ className, children, side = "right", showClose = true, ...props }, ref) {
  return (
    <SheetPrimitive.Portal>
      <PortalScope>
        <SheetPrimitive.Overlay data-slot="sheet-overlay" className="on-overlay" />
        <SheetPrimitive.Content
          data-slot="sheet-content"
          data-side={side}
          className={cn("on-sheet", className)}
          ref={ref}
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
});

const SheetHeader = React.forwardRef(function SheetHeader({ className, ...props }, ref) {
  return (
    <div
      data-slot="sheet-header"
      className={cn("on-dialog-header", className)}
      ref={ref}
      {...props}
    />
  );
});

const SheetTitle = React.forwardRef(function SheetTitle({ className, ...props }, ref) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn("on-dialog-title", className)}
      ref={ref}
      {...props}
    />
  );
});

const SheetDescription = React.forwardRef(function SheetDescription({ className, ...props }, ref) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn("on-dialog-desc", className)}
      ref={ref}
      {...props}
    />
  );
});

const SheetFooter = React.forwardRef(function SheetFooter({ className, ...props }, ref) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn("on-dialog-footer", className)}
      ref={ref}
      {...props}
    />
  );
});

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
