/**
 * src/graph/components/Palette.jsx — ⌘K command palette (G-3.4).
 * Same intent registry as the prompt bar; empty query lists everything.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { INTENTS, matchIntents } from '../../intents/registry.js';

export default function Palette({ open, onClose, onRun }) {
  const inputRef = useRef(null);
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(0);

  const matches = useMemo(
    () => (q.trim() ? matchIntents(q) : INTENTS.map((it) => ({ ...it, score: 1 }))),
    [q],
  );

  useEffect(() => {
    if (open) {
      setQ(''); setSel(0);
      const t = setTimeout(() => inputRef.current && inputRef.current.focus(), 30);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [open]);

  if (!open) return null;

  const run = (it) => { onClose(); onRun(it); };

  const onKeyDown = (e) => {
    const n = Math.min(9, matches.length);
    if (e.key === 'Escape') onClose();
    else if (e.key === 'ArrowDown') { e.preventDefault(); if (n) setSel((s) => (s + 1) % n); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); if (n) setSel((s) => (s + n - 1) % n); }
    else if (e.key === 'Enter' && n) run(matches[sel]);
    e.stopPropagation();
  };

  return (
    <div className="palette open" role="dialog" aria-modal="true" aria-label="Command palette">
      <div className="p-backdrop" onClick={onClose} />
      <div className="p-panel">
        <input
          ref={inputRef}
          className="pal-input"
          value={q}
          placeholder="type an intent — “week”, “day 4”, “robotics”…"
          aria-label="Search intents"
          onChange={(e) => { setQ(e.target.value); setSel(0); }}
          onKeyDown={onKeyDown}
        />
        <ul className="pal-list">
          {matches.length === 0 && (
            <li className="empty">no match — try “week”, “day 4” or “tour”</li>
          )}
          {matches.slice(0, 9).map((m, i) => (
            <li
              key={m.id}
              className={i === sel ? 'sel' : ''}
              onClick={() => run(m)}
            >
              <span className="pl">{m.label}</span>
              <span className="pk">{m.kind}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
