import React, { useState } from 'react';
import useStudioStore from './store';

export const AuthGate = () => {
  const login = useStudioStore((s) => s.login);
  const authError = useStudioStore((s) => s.authError);
  const [value, setValue] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    if (!value.trim() || submitting) return;
    setSubmitting(true);
    await login(value.trim());
    setSubmitting(false);
  };

  return (
    <main className="es-gate">
      <div className="grain" aria-hidden="true" />
      <form className={authError ? 'es-gate-card es-gate-wrong' : 'es-gate-card'} onSubmit={submit}>
        <p className="es-gate-eyebrow">Route /studio · private</p>
        <h1 className="es-gate-title">Passphrase</h1>
        <input
          className="es-gate-in"
          type="password"
          value={value}
          autoFocus
          autoComplete="off"
          aria-label="Passphrase"
          aria-invalid={!!authError}
          onChange={(event) => setValue(event.target.value)}
        />
        <button className="es-gate-go" type="submit" disabled={submitting}>
          {submitting ? 'Checking…' : 'Enter'}
        </button>
        <p className="es-gate-err" role="alert">
          {authError || ''}
        </p>
      </form>
    </main>
  );
};

export default AuthGate;
