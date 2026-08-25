// Avatar — shadcn/ui (Radix Avatar), restyled to BRAND.md.
//
// BRAND.md §10 is explicit: the avatar is `oN` on --bg, SQUARE, 3px radius.
// The registry's circular avatar, ring, badge, group and group-count parts are
// deleted — this site has one avatar shape and no avatar stacks.
import * as React from "react";
import { Avatar as AvatarPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";
import "@/styles/components.css";

function Avatar({ className, size = "default", ...props }) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      data-size={size}
      className={cn("on-avatar", className)}
      {...props}
    />
  );
}

function AvatarImage({ className, ...props }) {
  return <AvatarPrimitive.Image data-slot="avatar-image" className={className} {...props} />;
}

function AvatarFallback({ className, ...props }) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn("on-avatar-fallback", className)}
      {...props}
    />
  );
}

export { Avatar, AvatarImage, AvatarFallback };
