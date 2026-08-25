// Dialog — shadcn/ui (Radix Dialog), restyled to BRAND.md.
//
// The registry ships a rounded, shadowed, scale-animated modal. All three go:
//   §4  a dialog is a surface → radius 0
//   §9  shadows exist on the open dossier and nowhere else → hairline + the
//       --overlay backdrop do the separating (raised as OQ-7)
//   §6  no scale/spring entrance; the backdrop and panel cross-fade at 140ms
// The close affordance is the §8 ✕ glyph.
import * as React from "react";
import { Dialog as DialogPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";
import { Glyph } from "@/components/brand/glyph";
import { PortalScope } from "@/components/brand/portal-scope";
import "@/styles/components.css";

function Dialog(props) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

function DialogTrigger(props) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogClose(props) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

function DialogContent({ className, children, showClose = true, ...props }) {
  return (
    <DialogPrimitive.Portal>
      <PortalScope>
        <DialogPrimitive.Overlay data-slot="dialog-overlay" className="on-overlay" />
        <DialogPrimitive.Content
          data-slot="dialog-content"
          className={cn("on-panel on-dialog", className)}
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
}

function DialogHeader({ className, ...props }) {
  return <div data-slot="dialog-header" className={cn("on-dialog-header", className)} {...props} />;
}

function DialogTitle({ className, ...props }) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("on-dialog-title", className)}
      {...props}
    />
  );
}

function DialogDescription({ className, ...props }) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("on-dialog-desc", className)}
      {...props}
    />
  );
}

function DialogFooter({ className, ...props }) {
  return <div data-slot="dialog-footer" className={cn("on-dialog-footer", className)} {...props} />;
}

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
