/**
 * src/graph/components/FilterBar.jsx — `/` node filter (G-3.4).
 * Ranking is pure (lib/filter.js); this renders the bar and reports matches
 * up so the canvas can dim non-matches and Enter-fly to the top hit.
 */
import React, { useEffect, useRef } from 'react';
import { MonoLabel } from '@/components/brand';
import { filterCountLabel } from '../lib/filter.js';

export default function FilterBar({ open, query, matches, onQuery, onClose, onCommit }) {
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current && inputRef.current.focus(), 30);
      return () => clearTimeout(t);
    }
    // closed: release focus so the global Esc cascade keeps working
    if (inputRef.current && document.activeElement === inputRef.current) {
      inputRef.current.blur();
    }
    return undefined;
  }, [open]);

  return (
    <div className={`ui filterbar${open ? ' open' : ''}`}>
      <span className="slash">/</span>
      <input
        ref={inputRef}
        className="f-input"
        value={query}
        placeholder="filter nodes…"
        aria-label="Filter nodes"
        onChange={(e) => onQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') { e.currentTarget.blur(); onClose(); }
          else if (e.key === 'Enter' && matches.length) onCommit(matches[0]);
          e.stopPropagation();
        }}
      />
      <MonoLabel className="f-count">
        {query.trim() ? filterCountLabel(matches.length) : ''}
      </MonoLabel>
    </div>
  );
}
