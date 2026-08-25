// Tabs — shadcn/ui (Radix Tabs), restyled to BRAND.md.
//
// The registry's pill/segmented list variants are dropped: 999px belongs to
// the mode toggle and status pills only (§4). Triggers are label-mono, and the
// active one is marked by an accent hairline on the §9 rail — no filled tab.
import * as React from "react";
import { Tabs as TabsPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";
import "@/styles/components.css";

const Tabs = React.forwardRef(function Tabs({ className, ...props }, ref) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("on-tabs", className)}
      ref={ref}
      {...props}
    />
  );
});

const TabsList = React.forwardRef(function TabsList({ className, ...props }, ref) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn("on-tabs-list", className)}
      ref={ref}
      {...props}
    />
  );
});

const TabsTrigger = React.forwardRef(function TabsTrigger({ className, ...props }, ref) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn("on-tabs-trigger", className)}
      ref={ref}
      {...props}
    />
  );
});

const TabsContent = React.forwardRef(function TabsContent({ className, ...props }, ref) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("on-tabs-content", className)}
      ref={ref}
      {...props}
    />
  );
});

export { Tabs, TabsList, TabsTrigger, TabsContent };
