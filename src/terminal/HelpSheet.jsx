/**
 * src/terminal/HelpSheet.jsx — the `?` keyboard help overlay (C-2.2).
 * Dialog semantics + focus on close button + focus return handled by
 * TerminalHome (Esc cascade closes it). Pane grammar (09 §C) joined at X-1.
 */
import React, { useEffect, useRef } from 'react';

const KEYS = [
  ['j / k', 'scroll the buffer'],
  ['1–5', 'open window (prints its file)'],
  ['gg / G', 'scrollback top / bottom'],
  ['Tab', 'complete command'],
  ['↑ / ↓', 'command history'],
  ['⌘K / Ctrl+K', 'command palette'],
  ['?', 'this help'],
  ['Esc', 'clear prompt / close'],
];

const PANES = [
  ['^G v / ^G -', 'split pane right / down'],
  ['^G h j k l', 'move focus between panes'],
  ['^G z / ^G x', 'zoom / close pane (main refuses)'],
  ['^G r', 'resize mode — h/j/k/l nudge, Esc exits'],
  ['^G Tab', 'cycle panes'],
];

const CMDS = [
  ['ls', 'list files'],
  ['cat FILE', 'print a file (tools.txt, whoami.txt, …)'],
  ['day N', 'replay day N of the operator week'],
  ['open NODE', 'dossier for any node (Tab completes)'],
  ['mode graph', 'switch to graph mode'],
  ['email · clear · help', 'what they say'],
];

function KeyTable({ rows }) {
  return (
    <table>
      <tbody>
        {rows.map(([k, v]) => (
          <tr key={k}>
            <td className="key">{k}</td>
            <td>{v}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function HelpSheet({ open, onClose }) {
  const closeRef = useRef(null);

  useEffect(() => {
    if (open) closeRef.current?.focus();
  }, [open]);

  if (!open) return null;

  return (
    <div className="term-overlay" data-testid="term-help">
      {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events */}
      <div className="backdrop" onClick={onClose} />
      <div
        className="panel help-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Keyboard help"
      >
        <h2>keys</h2>
        <KeyTable rows={KEYS} />
        <h2>panes</h2>
        <KeyTable rows={PANES} />
        <h2>commands</h2>
        <KeyTable rows={CMDS} />
        <button ref={closeRef} type="button" className="obtn" onClick={onClose}>
          [ close ]
        </button>
      </div>
    </div>
  );
}
