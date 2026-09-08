/**
 * src/graph/components/Toast.jsx — one-line toast (prototype styling).
 */
import React from 'react';

export default function Toast({ msg }) {
  return (
    <div className={`ui toast${msg ? ' show' : ''}`} role="status" aria-live="polite">
      {msg || ''}
    </div>
  );
}
