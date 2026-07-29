import React from 'react';

// The TopBar is deliberately not mounted on the tool pages: it renders its own
// fixed bar and its own .grain overlay, and /major and /apply already render a
// .grain. This is the minimal nav affordance instead.
export const BackLink = () => (
  <a className="back-link" href="/college">
    ← College
  </a>
);

export default BackLink;
