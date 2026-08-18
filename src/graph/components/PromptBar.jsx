/**
 * src/graph/components/PromptBar.jsx — the hero CTA (G-3.3).
 * cmdk-style inline intent input: fuzzy suggestions (top 4), ↑/↓/↵/Esc,
 * rotating typewriter placeholder (idle only; static under RM/?still).
 */
import React, { useEffect, useRef, useState } from 'react';
import { matchIntents, PROMPT_PLACEHOLDERS } from '../../intents/registry.js';

export default function PromptBar({ still, onRun, onNoMatch }) {
  const inputRef = useRef(null);
  const [value, setValue] = useState('');
  const [matches, setMatches] = useState([]);
  const [sel, setSel] = useState(0);
  const [placeholder, setPlaceholder] = useState('try: “replay the week-long loop”');

  // rotating typewriter placeholder
  useEffect(() => {
    if (still) return undefined;
    let phI = 0; let chI = 0; let hold = 0;
    const iv = setInterval(() => {
      const el = inputRef.current;
      if (!el || document.activeElement === el || el.value) return;
      const s = PROMPT_PLACEHOLDERS[phI];
      if (chI < s.length) {
        chI += 1;
        setPlaceholder(`try: “${s.slice(0, chI)}”`);
      } else if ((hold += 1) > 30) {
        hold = 0; chI = 0; phI = (phI + 1) % PROMPT_PLACEHOLDERS.length;
      }
    }, 60);
    return () => clearInterval(iv);
  }, [still]);

  const clear = () => {
    setValue(''); setMatches([]); setSel(0);
    if (inputRef.current) inputRef.current.blur();
  };

  const run = (it) => { clear(); onRun(it); };

  const onKeyDown = (e) => {
    const n = Math.min(4, matches.length);
    if (e.key === 'Escape') clear();
    else if (e.key === 'ArrowDown') { e.preventDefault(); if (n) setSel((s) => (s + 1) % n); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); if (n) setSel((s) => (s + n - 1) % n); }
    else if (e.key === 'Enter') {
      if (n) run(matches[sel]);
      else if (value.trim()) onNoMatch();
    }
    e.stopPropagation();
  };

  return (
    <div className="ui promptwrap">
      {matches.length > 0 && (
        <div className="p-suggest open">
          {matches.slice(0, 4).map((m, i) => (
            <div
              key={m.id}
              className={`sug${i === sel ? ' sel' : ''}`}
              onClick={() => run(m)}
            >
              <span className="sl">{m.label}</span>
              <span className="sk">{m.kind}</span>
            </div>
          ))}
        </div>
      )}
      <div className="promptbar">
        <span className="p-glyph">▸</span>
        <input
          ref={inputRef}
          className="p-input"
          value={value}
          placeholder={placeholder}
          aria-label="Ask the graph"
          onChange={(e) => {
            setValue(e.target.value);
            setMatches(matchIntents(e.target.value));
            setSel(0);
          }}
          onKeyDown={onKeyDown}
        />
        <span className="p-hint">↵</span>
      </div>
    </div>
  );
}
