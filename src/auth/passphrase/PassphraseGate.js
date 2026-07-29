import React, { useState } from 'react';
import usePassphraseStore from './store';

export const PassphraseGate = ({ label }) => {
  const login = usePassphraseStore((s) => s.login);
  const error = usePassphraseStore((s) => s.error);
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
    <main className="gate">
      <div className="grain" aria-hidden="true" />
      <form className={error ? 'gate-card gate-wrong' : 'gate-card'} onSubmit={submit}>
        <p className="gate-eyebrow">{label}</p>
        <h1 className="gate-title">Passphrase</h1>
        <input
          className="gate-in"
          type="password"
          value={value}
          autoFocus
          autoComplete="off"
          aria-label="Passphrase"
          aria-invalid={!!error}
          onChange={(event) => setValue(event.target.value)}
        />
        <button className="gate-go" type="submit" disabled={submitting}>
          {submitting ? 'Checking…' : 'Enter'}
        </button>
        <p className="gate-err" role="alert">
          {error || ''}
        </p>
      </form>
    </main>
  );
};

export default PassphraseGate;
