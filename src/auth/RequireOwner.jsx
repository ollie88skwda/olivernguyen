import React from "react";
import { Redirect, useLocation } from "react-router-dom";
import { useAuth } from "@clerk/react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MonoLabel } from "@/components/brand";
import { clerkKey, NotConfigured } from "./RequireClerk";
import { useOwnerAccess } from "./useOwnerAccess";
import "../pages/tracker/tracker.css";

const AccessState = ({ title, children, action }) => (
  <main className="tracker-access sakura">
    <Card className="tracker-access-card">
      <CardHeader>
        <MonoLabel>Life tracker · private</MonoLabel>
        <CardTitle as="h1">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="tracker-access-copy">{children}</p>
        {action}
      </CardContent>
    </Card>
  </main>
);

const OwnerGate = ({ children }) => {
  const location = useLocation();
  const { isLoaded, isSignedIn } = useAuth();
  const access = useOwnerAccess(isLoaded && isSignedIn);

  if (!isLoaded || (isSignedIn && access.status === "loading")) {
    return (
      <main className="tracker-access sakura" aria-busy="true" aria-label="Checking tracker access">
        <div className="tracker-access-card tracker-access-loading">
          <Skeleton shape="text" />
          <Skeleton shape="surface" />
        </div>
      </main>
    );
  }
  if (!isSignedIn) {
    return <Redirect to={`/sign-in?redirect=${encodeURIComponent(location.pathname)}`} />;
  }
  if (access.status === "unauthorized") {
    return (
      <AccessState title="Private tracker">
        This account is signed in, but it is not the configured owner.
      </AccessState>
    );
  }
  if (access.status === "error") {
    return (
      <AccessState
        title="Access check failed"
        action={<Button type="button" variant="ghost" onClick={() => window.location.reload()}>Try again</Button>}
      >
        {access.error || "The tracker could not verify this account."}
      </AccessState>
    );
  }
  if (access.status !== "authorized") return null;
  return children;
};

export const RequireOwner = ({ children }) => {
  if (!clerkKey()) return <NotConfigured route="/tracker" />;
  return <OwnerGate>{children}</OwnerGate>;
};

export default RequireOwner;
