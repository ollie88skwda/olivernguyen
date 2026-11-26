// Shared chrome: the top bar on every page except "/". Matches the portfolio
// top bar (slash logo + "oliver nguyen", same height and blur). Graph mode is
// retired (D-40), so the mode toggle and Work/About/Contact links are gone.
// Chrome motion is CSS, never framer-motion (X-3, entry-chunk size).
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useAuth, useClerk, useUser } from "@clerk/react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon, Wordmark } from "@/components/brand";

import { useTheme } from "../theme/ThemeProvider";
import { useOwnerAccess } from "../auth/useOwnerAccess";
import "../styles/sakura.css";
import "./chrome.css";

const SCROLL_TOP_THRESHOLD = 25;

export const AccountMenuItems = ({ status, name, onAccount, onSignOut }) => {
  if (status === "loading") {
    return <DropdownMenuItem disabled>Checking account…</DropdownMenuItem>;
  }
  if (status !== "signed-in") {
    return (
      <DropdownMenuItem asChild>
        <a href="/sign-in">Sign in</a>
      </DropdownMenuItem>
    );
  }

  return (
    <>
      <DropdownMenuLabel>{name ? `Signed in as ${name}` : "Signed in"}</DropdownMenuLabel>
      <DropdownMenuItem onSelect={onAccount}>Account</DropdownMenuItem>
      <DropdownMenuItem onSelect={onSignOut}>Sign out</DropdownMenuItem>
    </>
  );
};

const AccountAuthItems = () => {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const { openUserProfile, signOut } = useClerk();
  return (
    <AccountMenuItems
      status={!isLoaded ? "loading" : isSignedIn ? "signed-in" : "signed-out"}
      name={user?.firstName}
      onAccount={() => openUserProfile()}
      onSignOut={() => signOut({ redirectUrl: "/" })}
    />
  );
};

export const TrackerMenuItem = () => (
  <>
    <DropdownMenuSeparator />
    <DropdownMenuLabel>Private</DropdownMenuLabel>
    <DropdownMenuItem asChild>
      <a href="/me">All my pages</a>
    </DropdownMenuItem>
    <DropdownMenuItem asChild>
      <a href="/verifier">The Verifier</a>
    </DropdownMenuItem>
    <DropdownMenuItem asChild>
      <a href="/tracker">Life tracker</a>
    </DropdownMenuItem>
    <DropdownMenuItem asChild>
      <a href="/time-blocks">Time blocks</a>
    </DropdownMenuItem>
  </>
);

const OwnerTrackerItem = () => {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const access = useOwnerAccess(isLoaded && isSignedIn, userId);
  return access.status === "authorized" ? <TrackerMenuItem /> : null;
};

// Pages menu: the old sidebar content minus dead /debt (05 §6.4).
const MENU = [
  { label: "Home", href: "/" },
  { label: "PULL", href: "/pull" },
  { label: "Transfer", href: "/transfer" },
  { group: "College", items: [
    { label: "Major", href: "/major" },
    { label: "Apply", href: "/apply" },
    { label: "Studio", href: "/studio" },
  ] },
  { group: "Driving", items: [
    { label: "Permit", href: "/permit" },
    { label: "License", href: "/license" },
  ] },
  { group: "SAT", items: [
    { label: "Resources", href: "/sat-resources" },
    { label: "Sign Up", href: "/sat-signup" },
  ] },
];

export const SiteChrome = ({ clerkEnabled = false, accountState = null }) => {
  const { theme, setTheme } = useTheme();
  const [visible, setVisible] = useState(true);
  const lastY = useRef(0);

  const onScroll = useCallback(() => {
    const y = window.pageYOffset || document.documentElement.scrollTop;
    setVisible(y <= SCROLL_TOP_THRESHOLD || y < lastY.current);
    lastY.current = y;
  }, []);

  useEffect(() => {
    let ticking = false;
    const handler = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        onScroll();
        ticking = false;
      });
    };
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, [onScroll]);

  const dark = theme === "dark";

  return (
    <div className="site-chrome">
      <header className={`site-chrome-bar sakura${visible ? "" : " sc-hidden"}`}>
        <Wordmark as="a" href="/" />

        <div className="sc-right">
          <Button
            variant="ghost"
            size="icon"
            className="sc-theme-btn"
            aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
            onClick={() => setTheme(dark ? "light" : "dark")}
          >
            {dark ? <Sun size={18} strokeWidth={1.75} /> : <Moon size={18} strokeWidth={1.75} />}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open pages menu">
                <Icon name="menu" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="sc-menu">
              {MENU.map((entry, i) =>
                entry.group ? (
                  <React.Fragment key={entry.group}>
                    {i > 0 && <DropdownMenuSeparator />}
                    <DropdownMenuLabel>{entry.group}</DropdownMenuLabel>
                    {entry.items.map((it) => (
                      <DropdownMenuItem key={it.href} asChild>
                        <a href={it.href}>{it.label}</a>
                      </DropdownMenuItem>
                    ))}
                  </React.Fragment>
                ) : (
                  <DropdownMenuItem key={entry.href} asChild>
                    <a href={entry.href}>{entry.label}</a>
                  </DropdownMenuItem>
                ),
              )}
              <DropdownMenuSeparator />
              {accountState ? (
                <AccountMenuItems {...accountState} />
              ) : clerkEnabled ? (
                <AccountAuthItems />
              ) : (
                <AccountMenuItems status="signed-out" />
              )}
              {accountState?.ownerAuthorized ? (
                <TrackerMenuItem />
              ) : clerkEnabled && !accountState ? (
                <OwnerTrackerItem />
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
    </div>
  );
};

export default SiteChrome;
