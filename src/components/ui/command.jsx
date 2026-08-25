// Command palette — shadcn/ui on cmdk, restyled to BRAND.md.
//
// The registry version wraps its input in InputGroup and rounds everything to
// rounded-xl. Here the search row is the terminal prompt: the §8 ▸ sigil plus
// a bare JetBrains input, on a square surface (§4). That is also what the
// existing terminal palette (src/terminal/Palette.jsx) looks like, so the two
// ⌘K surfaces read as one thing.
//
// InputGroup came down as a dependency of the registry command; it is unused
// here and can be deleted once nothing else pulls it in.
import * as React from "react";
import { Command as CommandPrimitive } from "cmdk";
import { Dialog as DialogPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";
import { Glyph } from "@/components/brand/glyph";
import { PortalScope } from "@/components/brand/portal-scope";
import "@/styles/components.css";

function Command({ className, ...props }) {
  return <CommandPrimitive data-slot="command" className={cn("on-command", className)} {...props} />;
}

function CommandDialog({ title = "Command palette", description = "Run a command", children, className, ...props }) {
  return (
    <DialogPrimitive.Root {...props}>
      <DialogPrimitive.Portal>
        <PortalScope>
          <DialogPrimitive.Overlay className="on-overlay" />
          <DialogPrimitive.Content className={cn("on-panel on-command-dialog", className)}>
            <DialogPrimitive.Title className="sr-only">{title}</DialogPrimitive.Title>
            <DialogPrimitive.Description className="sr-only">{description}</DialogPrimitive.Description>
            {/* cmdk's Input/List/Item read a context the <Command> root provides.
                The registry's CommandDialog dropped children straight into the
                dialog, which throws the moment the dialog opens. */}
            <Command>{children}</Command>
          </DialogPrimitive.Content>
        </PortalScope>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

function CommandInput({ className, ...props }) {
  return (
    <div data-slot="command-input-wrapper" className="on-command-row">
      <Glyph name="prompt" className="on-command-sigil" />
      <CommandPrimitive.Input
        data-slot="command-input"
        className={cn("on-command-input", className)}
        {...props}
      />
    </div>
  );
}

function CommandList({ className, ...props }) {
  return (
    <CommandPrimitive.List
      data-slot="command-list"
      className={cn("on-command-list", className)}
      {...props}
    />
  );
}

function CommandEmpty({ className, ...props }) {
  return (
    <CommandPrimitive.Empty
      data-slot="command-empty"
      className={cn("on-command-empty", className)}
      {...props}
    />
  );
}

function CommandGroup({ className, ...props }) {
  return <CommandPrimitive.Group data-slot="command-group" className={className} {...props} />;
}

function CommandSeparator({ className, ...props }) {
  return (
    <CommandPrimitive.Separator
      data-slot="command-separator"
      className={cn("on-menu-sep", className)}
      {...props}
    />
  );
}

function CommandItem({ className, ...props }) {
  return (
    <CommandPrimitive.Item
      data-slot="command-item"
      className={cn("on-menu-item on-command-item", className)}
      {...props}
    />
  );
}

const CommandShortcut = React.forwardRef(function CommandShortcut({ className, ...props }, ref) {
  return (
    <span data-slot="command-shortcut" className={cn("on-menu-shortcut", className)} ref={ref}
      {...props} />
  );
});

export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
};
