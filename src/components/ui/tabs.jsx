// Tabs — shadcn/ui (Radix Tabs), restyled to BRAND.md.
//
// The registry's pill/segmented list variants are dropped: 999px belongs to
// the mode toggle and status pills only (§4). Triggers are label-mono, and the
// active one is marked by an accent hairline on the §9 rail — no filled tab.
import * as React from "react";
import { Tabs as TabsPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";
import "@/styles/components.css";

function Tabs({ className, ...props }) {
  return <TabsPrimitive.Root data-slot="tabs" className={cn("on-tabs", className)} {...props} />;
}

function TabsList({ className, ...props }) {
  return (
    <TabsPrimitive.List data-slot="tabs-list" className={cn("on-tabs-list", className)} {...props} />
  );
}

function TabsTrigger({ className, ...props }) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn("on-tabs-trigger", className)}
      {...props}
    />
  );
}

function TabsContent({ className, ...props }) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("on-tabs-content", className)}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
