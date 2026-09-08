// Dialog — shadcn/ui (Radix Dialog), restyled to BRAND.md.
//
// The registry ships a rounded, shadowed, scale-animated modal. All three go:
//   §4  a dialog is a surface → radius 0
//   §9  shadows exist on the open dossier and nowhere else → hairline + the
//       --overlay backdrop do the separating (confirmed in review, 2026-08-25)
//   §6  no scale/spring entrance; the backdrop and panel cross-fade at 140ms
// The close affordance is the §8 ✕ glyph.
import * as React from "react";
import { Dialog as DialogPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";
import { Glyph } from "@/components/brand/glyph";
import { PortalScope } from "@/components/brand/portal-scope";
import "@/styles/components.css";

// D-24: every part that renders DOM forwards its ref, so it can be an `asChild`
// child (a Tooltip trigger, most often). `Dialog` itself is Radix's context
// Root — it renders nothing, so there is no node to point a ref at.
function Dialog(props) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

const DialogTrigger = React.forwardRef(function DialogTrigger(props, ref) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" ref={ref} {...props} />;
});

const DialogClose = React.forwardRef(function DialogClose(props, ref) {
  return <DialogPrimitive.Close data-slot="dialog-close" ref={ref} {...props} />;
});

const DialogContent = React.forwardRef(function DialogContent({ className, children, showClose = true, ...props }, ref) {
  return (
    <DialogPrimitive.Portal>
      <PortalScope>
        <DialogPrimitive.Overlay data-slot="dialog-overlay" className="on-overlay" />
        <DialogPrimitive.Content
          data-slot="dialog-content"
          className={cn("on-panel on-dialog", className)}
          ref={ref}
          {...props}
        >
          {children}
          {showClose && (
            <DialogPrimitive.Close className="on-close" aria-label="Close">
              <Glyph name="close" />
            </DialogPrimitive.Close>
          )}
        </DialogPrimitive.Content>
      </PortalScope>
    </DialogPrimitive.Portal>
  );
});

const DialogHeader = React.forwardRef(function DialogHeader({ className, ...props }, ref) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("on-dialog-header", className)}
      ref={ref}
      {...props}
    />
  );
});

const DialogTitle = React.forwardRef(function DialogTitle({ className, ...props }, ref) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("on-dialog-title", className)}
      ref={ref}
      {...props}
    />
  );
});

const DialogDescription = React.forwardRef(function DialogDescription({ className, ...props }, ref) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("on-dialog-desc", className)}
      ref={ref}
      {...props}
    />
  );
});

const DialogFooter = React.forwardRef(function DialogFooter({ className, ...props }, ref) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn("on-dialog-footer", className)}
      ref={ref}
      {...props}
    />
  );
});

export {
  Dialog,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
};
