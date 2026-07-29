import React from 'react';
import { SignIn } from '@clerk/react';
import { clerkKey, NotConfigured } from '../auth/RequireClerk';
import '../styles/Gate.css';

// Clerk's element keys, mapped onto the site's tokens. These are Clerk internals
// and can change across major versions; the failure mode is an unstyled card,
// not a broken sign-in.
const appearance = {
  variables: {
    colorPrimary: '#092441',
    colorBackground: '#f9f3e5',
    colorText: '#122231',
    colorTextSecondary: '#45576a',
    colorInputBackground: '#fcf8ee',
    borderRadius: '2px',
    fontFamily: '"Hanken Grotesk", -apple-system, sans-serif',
  },
  elements: {
    card: { border: '1px solid rgba(18,34,49,.16)', boxShadow: 'none' },
    headerTitle: {
      fontFamily: '"Big Shoulders", sans-serif',
      textTransform: 'uppercase',
      fontWeight: 900,
      letterSpacing: '.01em',
    },
    // There is no /sign-up route by design, so hide the link that offers one.
    footer: { display: 'none' },
  },
};

export const SignInPage = () => {
  const redirect = new URLSearchParams(window.location.search).get('redirect') || '/studio';

  // <SignIn> throws outside a ClerkProvider, and ClerkBridge only mounts one when
  // a key exists. Without this the route white-screens instead of explaining itself.
  if (!clerkKey()) return <NotConfigured route="/sign-in" />;

  return (
    <main className="gate">
      <div className="grain" aria-hidden="true" />
      <SignIn routing="path" path="/sign-in" forceRedirectUrl={redirect} appearance={appearance} />
    </main>
  );
};

export default SignInPage;
