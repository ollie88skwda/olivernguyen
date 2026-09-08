// DropdownMenu — shadcn/ui (Radix DropdownMenu), restyled to BRAND.md.
//
// Panel = surface (radius 0, hairline, no shadow — §4/§9).
// Item   = control (3px), highlighted with --selection + --accent-hi, which is
//          the treatment the terminal palette already uses.
// Indicators and the sub-menu arrow are §8 glyphs, not lucide icons.
// Registry parts kept: root, trigger, content, group, item, checkbox item,
// radio group/item, label, separator, shortcut, sub. Nothing else was needed.
import * as React from "react";
import { DropdownMenu as DropdownMenuPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";
import { Glyph } from "@/components/brand/glyph";
import { Icon } from "@/components/brand/icon";
import { PortalScope } from "@/components/brand/portal-scope";
import "@/styles/components.css";

// D-24: DOM-rendering parts forward refs; `DropdownMenu` and `DropdownMenuSub`
// are context Roots and render nothing, so they stay plain functions.
function DropdownMenu(props) {
  return <DropdownMenuPrimitive.Root data-slot="dropdown-menu" {...props} />;
}

const DropdownMenuTrigger = React.forwardRef(function DropdownMenuTrigger(props, ref) {
  return <DropdownMenuPrimitive.Trigger data-slot="dropdown-menu-trigger" ref={ref} {...props} />;
});

const DropdownMenuContent = React.forwardRef(function DropdownMenuContent({ className, sideOffset = 4, ...props }, ref) {
  return (
    <DropdownMenuPrimitive.Portal>
      <PortalScope>
        <DropdownMenuPrimitive.Content
          data-slot="dropdown-menu-content"
          sideOffset={sideOffset}
          className={cn("on-panel on-menu", className)}
          ref={ref}
          {...props}
        />
      </PortalScope>
    </DropdownMenuPrimitive.Portal>
  );
});

const DropdownMenuGroup = React.forwardRef(function DropdownMenuGroup(props, ref) {
  return <DropdownMenuPrimitive.Group data-slot="dropdown-menu-group" ref={ref} {...props} />;
});

const DropdownMenuItem = React.forwardRef(function DropdownMenuItem({ className, tone, ...props }, ref) {
  return (
    <DropdownMenuPrimitive.Item
      data-slot="dropdown-menu-item"
      data-tone={tone}
      className={cn("on-menu-item", className)}
      ref={ref}
      {...props}
    />
  );
});

const DropdownMenuCheckboxItem = React.forwardRef(function DropdownMenuCheckboxItem({ className, children, ...props }, ref) {
  return (
    <DropdownMenuPrimitive.CheckboxItem
      data-slot="dropdown-menu-checkbox-item"
      className={cn("on-menu-item", className)}
      ref={ref}
      {...props}
    >
      <span className="on-menu-glyph">
        <DropdownMenuPrimitive.ItemIndicator>
          <Icon name="check" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.CheckboxItem>
  );
});

const DropdownMenuRadioGroup = React.forwardRef(function DropdownMenuRadioGroup(props, ref) {
  return (
    <DropdownMenuPrimitive.RadioGroup
      data-slot="dropdown-menu-radio-group"
      ref={ref}
      {...props}
    />
  );
});

const DropdownMenuRadioItem = React.forwardRef(function DropdownMenuRadioItem({ className, children, ...props }, ref) {
  return (
    <DropdownMenuPrimitive.RadioItem
      data-slot="dropdown-menu-radio-item"
      className={cn("on-menu-item", className)}
      ref={ref}
      {...props}
    >
      <span className="on-menu-glyph">
        <DropdownMenuPrimitive.ItemIndicator>
          <Glyph name="dot" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.RadioItem>
  );
});

const DropdownMenuLabel = React.forwardRef(function DropdownMenuLabel({ className, ...props }, ref) {
  return (
    <DropdownMenuPrimitive.Label
      data-slot="dropdown-menu-label"
      className={cn("on-menu-label", className)}
      ref={ref}
      {...props}
    />
  );
});

const DropdownMenuSeparator = React.forwardRef(function DropdownMenuSeparator({ className, ...props }, ref) {
  return (
    <DropdownMenuPrimitive.Separator
      data-slot="dropdown-menu-separator"
      className={cn("on-menu-sep", className)}
      ref={ref}
      {...props}
    />
  );
});

const DropdownMenuShortcut = React.forwardRef(function DropdownMenuShortcut({ className, ...props }, ref) {
  return (
    <span
      data-slot="dropdown-menu-shortcut"
      className={cn("on-menu-shortcut", className)}
      ref={ref}
      {...props}
    />
  );
});

function DropdownMenuSub(props) {
  return <DropdownMenuPrimitive.Sub data-slot="dropdown-menu-sub" {...props} />;
}

const DropdownMenuSubTrigger = React.forwardRef(function DropdownMenuSubTrigger({ className, children, ...props }, ref) {
  return (
    <DropdownMenuPrimitive.SubTrigger
      data-slot="dropdown-menu-sub-trigger"
      className={cn("on-menu-item", className)}
      ref={ref}
      {...props}
    >
      {children}
      <Glyph name="right" className="on-menu-shortcut" />
    </DropdownMenuPrimitive.SubTrigger>
  );
});

const DropdownMenuSubContent = React.forwardRef(function DropdownMenuSubContent({ className, ...props }, ref) {
  return (
    <DropdownMenuPrimitive.Portal>
      <PortalScope>
        <DropdownMenuPrimitive.SubContent
          data-slot="dropdown-menu-sub-content"
          className={cn("on-panel on-menu", className)}
          ref={ref}
          {...props}
        />
      </PortalScope>
    </DropdownMenuPrimitive.Portal>
  );
});

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
};
