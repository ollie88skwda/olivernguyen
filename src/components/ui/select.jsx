// Select — shadcn/ui (Radix Select), restyled to BRAND.md.
//
// Trigger is a field control (3px, §4); the popover is a surface (0, §9 no
// shadow). The registry's lucide chevrons and check are replaced with §8
// glyphs. Scroll buttons are dropped — the list is capped and scrolls.
import * as React from "react";
import { Select as SelectPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";
import { Glyph } from "@/components/brand/glyph";
import { Icon } from "@/components/brand/icon";
import { PortalScope } from "@/components/brand/portal-scope";
import "@/styles/components.css";

// D-24: DOM-rendering parts forward refs; `Select` is the context Root and
// renders nothing, so it stays a plain function.
function Select(props) {
  return <SelectPrimitive.Root data-slot="select" {...props} />;
}

const SelectGroup = React.forwardRef(function SelectGroup(props, ref) {
  return <SelectPrimitive.Group data-slot="select-group" ref={ref} {...props} />;
});

const SelectValue = React.forwardRef(function SelectValue(props, ref) {
  return <SelectPrimitive.Value data-slot="select-value" ref={ref} {...props} />;
});

const SelectTrigger = React.forwardRef(function SelectTrigger({ className, children, ...props }, ref) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      className={cn("on-field on-select-trigger", className)}
      ref={ref}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <Glyph name="down" className="on-select-glyph" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
});

const SelectContent = React.forwardRef(function SelectContent({ className, children, position = "popper", ...props }, ref) {
  return (
    <SelectPrimitive.Portal>
      <PortalScope>
        <SelectPrimitive.Content
          data-slot="select-content"
          position={position}
          sideOffset={4}
          className={cn("on-panel on-menu", className)}
          ref={ref}
          {...props}
        >
          <SelectPrimitive.Viewport>{children}</SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </PortalScope>
    </SelectPrimitive.Portal>
  );
});

const SelectLabel = React.forwardRef(function SelectLabel({ className, ...props }, ref) {
  return (
    <SelectPrimitive.Label
      data-slot="select-label"
      className={cn("on-menu-label", className)}
      ref={ref}
      {...props}
    />
  );
});

const SelectItem = React.forwardRef(function SelectItem({ className, children, ...props }, ref) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn("on-menu-item", className)}
      ref={ref}
      {...props}
    >
      {/* the glyph column is always reserved so selecting never shifts text */}
      <span className="on-menu-glyph">
        <SelectPrimitive.ItemIndicator>
          <Icon name="check" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
});

const SelectSeparator = React.forwardRef(function SelectSeparator({ className, ...props }, ref) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={cn("on-menu-sep", className)}
      ref={ref}
      {...props}
    />
  );
});

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
};
