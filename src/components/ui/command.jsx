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

// D-24: DOM-rendering parts forward refs. `CommandDialog` is a Dialog Root and
// renders no node of its own, so it stays plain. `CommandInput` forwards to the
// input element, not the prompt row — the input is what a caller wants to focus.
const Command = React.forwardRef(function Command({ className, ...props }, ref) {
  return (
    <CommandPrimitive
      data-slot="command"
      className={cn("on-command", className)}
      ref={ref}
      {...props}
    />
  );
});

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

const CommandInput = React.forwardRef(function CommandInput({ className, ...props }, ref) {
  return (
    <div data-slot="command-input-wrapper" className="on-command-row">
      <Glyph name="prompt" className="on-command-sigil" />
      <CommandPrimitive.Input
        data-slot="command-input"
        className={cn("on-command-input", className)}
        ref={ref}
        {...props}
      />
    </div>
  );
});

const CommandList = React.forwardRef(function CommandList({ className, ...props }, ref) {
  return (
    <CommandPrimitive.List
      data-slot="command-list"
      className={cn("on-command-list", className)}
      ref={ref}
      {...props}
    />
  );
});

const CommandEmpty = React.forwardRef(function CommandEmpty({ className, ...props }, ref) {
  return (
    <CommandPrimitive.Empty
      data-slot="command-empty"
      className={cn("on-command-empty", className)}
      ref={ref}
      {...props}
    />
  );
});

const CommandGroup = React.forwardRef(function CommandGroup({ className, ...props }, ref) {
  return (
    <CommandPrimitive.Group
      data-slot="command-group"
      className={className}
      ref={ref}
      {...props}
    />
  );
});

const CommandSeparator = React.forwardRef(function CommandSeparator({ className, ...props }, ref) {
  return (
    <CommandPrimitive.Separator
      data-slot="command-separator"
      className={cn("on-menu-sep", className)}
      ref={ref}
      {...props}
    />
  );
});

const CommandItem = React.forwardRef(function CommandItem({ className, ...props }, ref) {
  return (
    <CommandPrimitive.Item
      data-slot="command-item"
      className={cn("on-menu-item on-command-item", className)}
      ref={ref}
      {...props}
    />
  );
});

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
