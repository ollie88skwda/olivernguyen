/**
 * src/graph/components/PromptBar.jsx — the hero CTA (G-3.3).
 * cmdk-style inline intent input: fuzzy suggestions (top 4), ↑/↓/↵/Esc,
 * rotating typewriter placeholder (idle only; static under RM/?still).
 *
 * F-C.2: also the canvas's INBOUND intent socket — it holds the live onRun
 * (GraphCanvas.runIntent), so it binds lib/focusIntent here: chrome's
 * 'on:graph-intent' dispatches + ?focus= deep-links execute through the
 * same registry path as typed prompts. Unbinds with the canvas (never-trap).
 *
 * R-G1: the bar itself is the library's prompt bar (brand/prompt-bar.jsx) —
 * .on-prompt / .on-prompt-input, the §8 ▸ sigil as a <Glyph> and the key hint
 * as a <Kbd>. It is composed from those classes rather than mounted as
 * <PromptBar>, because the suggestion list needs the input's own class hook
 * (.p-input) and that component fixes its inner class names.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Kbd } from '@/components/ui/kbd';
import { Glyph } from '@/components/brand';
import { matchIntents, PROMPT_PLACEHOLDERS } from '../../intents/registry.js';
import { bindGraphIntents } from '../lib/focusIntent.js';

export default function PromptBar({ still, onRun, onNoMatch }) {
  useEffect(() => bindGraphIntents(onRun), [onRun]);
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
      <div className="promptbar on-prompt">
        <Glyph name="prompt" tone="accent" className="p-glyph" />
        <input
          ref={inputRef}
          className="p-input on-prompt-input"
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
        <Kbd className="p-hint">↵</Kbd>
      </div>
    </div>
  );
}
