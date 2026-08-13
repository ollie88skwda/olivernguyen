import React from 'react';

// Only reachable in local development: `react-scripts start` answers /api/* with
// index.html, so no gate can ever open. Say that plainly instead of showing a
// passphrase box that will never accept anything.
export const ApiMissing = ({ route }) => (
  <main className="gate">
    <div className="gate-card">
      <p className="gate-eyebrow">{route} · backend not running</p>
      <h1 className="gate-title">No API</h1>
      <p className="gate-hint">
        The <code>/api/*</code> routes are Vercel serverless functions.{' '}
        <code>react-scripts start</code> does not run them — it answers every path with{' '}
        <code>index.html</code>, so the gate can never open.
      </p>
      <p className="gate-hint">
        Start the site with <code>vercel dev</code> instead. It serves the same React app and
        runs <code>api/</code> alongside it, using the values already in <code>.env.local</code>.
      </p>
    </div>
  </main>
);

export default ApiMissing;
