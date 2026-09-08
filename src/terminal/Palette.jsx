/**
 * src/terminal/Palette.jsx — ⌘K command palette (C-2.2) over lib/intents.js.
 * Fuzzy via the shared matcher; empty query → suggestions. Enter/click runs
 * the intent (TerminalHome closes + executes). No window listeners here —
 * the ⌘K chord lives in TerminalHome's ONE window keydown (P3).
 *
 * R-T1: the SURFACE is the library's (docs/COMPONENTS.md) — `.on-overlay`
 * backdrop, `.on-panel` (§4 radius 0, §9 hairline and NO shadow; the old panel
 * was 6px with a 24/64 drop shadow, a straight brand violation) and the
 * `.on-command-*` row / input / list values the shipped <Command> primitive
 * uses. Rows are `.on-menu-item`, so selection is the library's
 * `data-selected` wash rather than a bespoke `.sel` colour. The prompt sigil
 * is <Glyph name="prompt"> — §8's ▸, replacing a `›` that was never in the
 * ratified set.
 *
 * It is NOT the <CommandDialog> primitive: cmdk owns filtering, selection and
 * focus, and this palette's keyboard model (Ctrl-n/p, the Esc cascade handoff
 * to TerminalHome, intents-driven matching) is gate-asserted in
 * e2e/terminal.spec.js. The library's VALUES port; its state machine does not.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Glyph } from '@/components/brand';
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
      <div className="backdrop on-overlay" onClick={onClose} />
      <div
        className="panel palette-panel on-panel on-command"
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
      >
        <div className="prow on-command-row">
          <Glyph name="prompt" className="psigil on-command-sigil" label="" />
          <input
            ref={inputRef}
            className="palette-input on-command-input"
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
        <ul className="palette-list on-command-list" role="listbox" aria-label="Commands">
          {items.length === 0 && (
            <li className="empty on-command-empty">no matching commands</li>
          )}
          {items.map((it, i) => (
            /* eslint-disable-next-line jsx-a11y/click-events-have-key-events */
            <li
              key={it.id}
              role="option"
              aria-selected={i === sel}
              data-selected={i === sel ? 'true' : undefined}
              className={'on-menu-item on-command-item' + (i === sel ? ' sel' : '')}
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
