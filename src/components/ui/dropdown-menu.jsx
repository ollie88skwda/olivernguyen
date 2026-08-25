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
import { PortalScope } from "@/components/brand/portal-scope";
import "@/styles/components.css";

function DropdownMenu(props) {
  return <DropdownMenuPrimitive.Root data-slot="dropdown-menu" {...props} />;
}

function DropdownMenuTrigger(props) {
  return <DropdownMenuPrimitive.Trigger data-slot="dropdown-menu-trigger" {...props} />;
}

function DropdownMenuContent({ className, sideOffset = 4, ...props }) {
  return (
    <DropdownMenuPrimitive.Portal>
      <PortalScope>
        <DropdownMenuPrimitive.Content
          data-slot="dropdown-menu-content"
          sideOffset={sideOffset}
          className={cn("on-panel on-menu", className)}
          {...props}
        />
      </PortalScope>
    </DropdownMenuPrimitive.Portal>
  );
}

function DropdownMenuGroup(props) {
  return <DropdownMenuPrimitive.Group data-slot="dropdown-menu-group" {...props} />;
}

function DropdownMenuItem({ className, tone, ...props }) {
  return (
    <DropdownMenuPrimitive.Item
      data-slot="dropdown-menu-item"
      data-tone={tone}
      className={cn("on-menu-item", className)}
      {...props}
    />
  );
}

function DropdownMenuCheckboxItem({ className, children, ...props }) {
  return (
    <DropdownMenuPrimitive.CheckboxItem
      data-slot="dropdown-menu-checkbox-item"
      className={cn("on-menu-item", className)}
      {...props}
    >
      <span className="on-menu-glyph">
        <DropdownMenuPrimitive.ItemIndicator>
          <Glyph name="check" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.CheckboxItem>
  );
}

function DropdownMenuRadioGroup(props) {
  return <DropdownMenuPrimitive.RadioGroup data-slot="dropdown-menu-radio-group" {...props} />;
}

function DropdownMenuRadioItem({ className, children, ...props }) {
  return (
    <DropdownMenuPrimitive.RadioItem
      data-slot="dropdown-menu-radio-item"
      className={cn("on-menu-item", className)}
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
}

function DropdownMenuLabel({ className, ...props }) {
  return (
    <DropdownMenuPrimitive.Label
      data-slot="dropdown-menu-label"
      className={cn("on-menu-label", className)}
      {...props}
    />
  );
}

function DropdownMenuSeparator({ className, ...props }) {
  return (
    <DropdownMenuPrimitive.Separator
      data-slot="dropdown-menu-separator"
      className={cn("on-menu-sep", className)}
      {...props}
    />
  );
}

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

function DropdownMenuSubTrigger({ className, children, ...props }) {
  return (
    <DropdownMenuPrimitive.SubTrigger
      data-slot="dropdown-menu-sub-trigger"
      className={cn("on-menu-item", className)}
      {...props}
    >
      {children}
      <Glyph name="right" className="on-menu-shortcut" />
    </DropdownMenuPrimitive.SubTrigger>
  );
}

function DropdownMenuSubContent({ className, ...props }) {
  return (
    <DropdownMenuPrimitive.Portal>
      <PortalScope>
        <DropdownMenuPrimitive.SubContent
          data-slot="dropdown-menu-sub-content"
          className={cn("on-panel on-menu", className)}
          {...props}
        />
      </PortalScope>
    </DropdownMenuPrimitive.Portal>
  );
}

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
