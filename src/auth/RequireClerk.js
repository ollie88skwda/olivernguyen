import React from 'react';
import { Redirect, useLocation } from 'react-router-dom';
import { useAuth } from '@clerk/react';
import '../styles/Gate.css';

// Read through a function rather than a module-level constant. webpack inlines
// process.env.REACT_APP_* wherever it appears, so this is identical at runtime,
// but it lets tests vary the key without resetting the module registry — which
// would hand this file a different React and react-router instance than the test.
export const clerkKey = () => process.env.REACT_APP_CLERK_PUBLISHABLE_KEY;

// Exported because /sign-in needs it too: Clerk's <SignIn> throws outside a
// ClerkProvider, and without a key no provider is mounted, so that route would
// white-screen exactly like the studio would.
export const NotConfigured = ({ route = '/studio' }) => (
  <main className="gate">
    <div className="grain" aria-hidden="true" />
    <div className="gate-card">
      <p className="gate-eyebrow">Route {route} · unavailable</p>
      <h1 className="gate-title">Not Configured</h1>
      <p className="gate-hint">
        <code>REACT_APP_CLERK_PUBLISHABLE_KEY</code> is not set, so sign-in cannot load. The
        rest of the site is unaffected.
      </p>
    </div>
  </main>
);

// Split in two on purpose: useAuth throws when no ClerkProvider is mounted, and
// hooks cannot be called conditionally, so the key check has to live one level up.
const ClerkGate = ({ children }) => {
  const location = useLocation();
  const { isLoaded, isSignedIn } = useAuth();

  // Cream rather than a spinner: the sign-in page and the studio share this
  // background, so an already-signed-in reload shows no flash of anything.
  if (!isLoaded) return <div style={{ minHeight: '100dvh', background: '#f1e9d4' }} />;
  if (!isSignedIn) {
    return <Redirect to={`/sign-in?redirect=${encodeURIComponent(location.pathname)}`} />;
  }
  return children;
};

export const RequireClerk = ({ children }) => {
  if (!clerkKey()) return <NotConfigured />;
  return <ClerkGate>{children}</ClerkGate>;
};

export default RequireClerk;
