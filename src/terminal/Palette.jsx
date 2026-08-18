/**
 * src/terminal/Palette.jsx — ⌘K command palette (C-2.2) over lib/intents.js.
 * Fuzzy via the shared matcher; empty query → suggestions. Enter/click runs
 * the intent (TerminalHome closes + executes). No window listeners here —
 * the ⌘K chord lives in TerminalHome's ONE window keydown (P3).
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { matchTerminalIntents, suggestedIntents } from './lib/intents.js';

export default function Palette({ open, onClose, onRun }) {
  const inputRef = useRef(null);
  const [query, setQuery] = useState('');
  const [sel, setSel] = useState(0);

  const items = useMemo(
    () => (query.trim() ? matchTerminalIntents(query) : suggestedIntents()),
    [query],
  );

  useEffect(() => {
    if (open) {
      setQuery('');
      setSel(0);
      inputRef.current?.focus();
    }
  }, [open]);

  if (!open) return null;

  const move = (d) => {
    if (!items.length) return;
    setSel((s) => (s + d + items.length) % items.length);
  };

  const onKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation(); // window cascade must not double-handle
      onClose();
    } else if (e.key === 'ArrowDown' || (e.ctrlKey && e.key === 'n')) {
      e.preventDefault();
      move(1);
    } else if (e.key === 'ArrowUp' || (e.ctrlKey && e.key === 'p')) {
      e.preventDefault();
      move(-1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (items[sel]) onRun(items[sel]);
    }
  };

  return (
    <div className="term-overlay" data-testid="term-palette">
      {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events */}
      <div className="backdrop" onClick={onClose} />
      <div
        className="panel palette-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
      >
        <div className="prow">
          <span className="psigil">›</span>
          <input
            ref={inputRef}
            className="palette-input"
            type="text"
            value={query}
            placeholder="type a command… try: replay the week"
            autoComplete="off"
            spellCheck={false}
            aria-label="Search commands"
            onChange={(e) => {
              setQuery(e.target.value);
              setSel(0);
            }}
            onKeyDown={onKeyDown}
          />
        </div>
        <ul className="palette-list" role="listbox" aria-label="Commands">
          {items.length === 0 && <li className="empty">no matching commands</li>}
          {items.map((it, i) => (
            /* eslint-disable-next-line jsx-a11y/click-events-have-key-events */
            <li
              key={it.id}
              role="option"
              aria-selected={i === sel}
              className={i === sel ? 'sel' : ''}
              onClick={() => onRun(it)}
              onMouseMove={() => setSel(i)}
            >
              <span>{it.label}</span>
              <span className="hint">{it.cmd || '?'}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
