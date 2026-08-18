/**
 * src/terminal/Prompt.jsx — the one live prompt (C-0.2 shell; full echo/
 * cursor/history/completion behavior lands at C-1.1).
 *
 * The visible prompt is a text echo + full-cell inverse block cursor; the
 * real <input> is visually offscreen (prototype pattern). Nothing here binds
 * window listeners — TerminalHome owns THE ONE window keydown (P3).
 */
import React from 'react';
import { SIGIL } from './Buffer.jsx';

export default function Prompt() {
  return (
    <div className="promptline" data-testid="term-promptline">
      <span className="psigil">{SIGIL}</span>
      <span className="pecho">
        <span className="pcursor">{'\u00a0'}</span>
      </span>
      <label className="sr-only" htmlFor="term-prompt-input">
        Terminal prompt
      </label>
      <input
        id="term-prompt-input"
        type="text"
        autoComplete="off"
        autoCapitalize="off"
        spellCheck={false}
      />
    </div>
  );
}
