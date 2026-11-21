import React from 'react';
import { SignIn } from '@clerk/react';
import { clerkKey, NotConfigured } from '../auth/RequireClerk';
import '../styles/sakura.css';
import '../styles/Gate.css';
import '../styles/SignIn.css';

// Clerk's element keys, mapped onto the site's tokens. These are Clerk internals
// and can change across major versions; the failure mode is an unstyled card,
// not a broken sign-in.
const appearance = {
  variables: {
    // Clerk v6 names (colorText/colorInputBackground are gone; with them the
    // card kept its default dark ink on the night background).
    colorPrimary: 'var(--primary)',
    colorPrimaryForeground: 'var(--on-primary)',
    colorBackground: 'var(--surface)',
    colorForeground: 'var(--text)',
    colorMutedForeground: 'var(--text-muted)',
    colorNeutral: 'var(--text)',
    colorBorder: 'var(--border)',
    colorInput: 'var(--bg)',
    colorInputForeground: 'var(--text)',
    colorRing: 'var(--accent)',
    borderRadius: '8px',
    fontFamily: 'var(--font-sans)',
  },
  elements: {
    // v6 wraps `card` in `cardBox`, and the shadow lives on the wrapper — setting
    // it on `card` alone leaves the drop shadow visible.
    cardBox: { border: '1px solid var(--border)', boxShadow: 'none', borderRadius: '12px' },
    card: { boxShadow: 'none' },
    headerTitle: {
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      letterSpacing: '-0.02em',
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
    <main className="sakura gate signin-page">
      <SignIn routing="path" path="/sign-in" forceRedirectUrl={redirect} appearance={appearance} />
    </main>
  );
};

export default SignInPage;
