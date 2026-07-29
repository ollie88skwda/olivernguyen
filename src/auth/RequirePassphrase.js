import React, { useEffect } from 'react';
import usePassphraseStore from './passphrase/store';
import PassphraseGate from './passphrase/PassphraseGate';
import ApiMissing from './ApiMissing';
import '../styles/Gate.css';

export const RequirePassphrase = ({ label, route, children }) => {
  const checking = usePassphraseStore((s) => s.checking);
  const authed = usePassphraseStore((s) => s.authed);
  const apiMissing = usePassphraseStore((s) => s.apiMissing);
  const check = usePassphraseStore((s) => s.check);

  useEffect(() => {
    check();
  }, [check]);

  // Cream rather than a spinner: the gate and the page behind it share this
  // background, so a signed-in reload shows no flash of anything.
  if (checking) return <div style={{ minHeight: '100dvh', background: '#f1e9d4' }} />;
  if (apiMissing) return <ApiMissing route={route || label} />;
  if (!authed) return <PassphraseGate label={label} />;
  return children;
};

export default RequirePassphrase;
