/**
 * src/terminal/HelpSheet.jsx — the `?` keyboard help overlay (C-2.2).
 * Dialog semantics + focus on close button + focus return handled by
 * TerminalHome (Esc cascade closes it). Pane grammar (09 §C) joined at X-1.
 *
 * R-T1: ported onto the library (docs/COMPONENTS.md). The backdrop is
 * `.on-overlay`, the panel is `.on-panel` (§4 radius 0, §9 hairline, no
 * shadow), each section head is a <MonoLabel> (§7's label role, replacing a
 * bespoke accent <h2>), every key is a <Kbd> (§7: "key hints are Martian") and
 * the close control is the library <Button variant="ghost">.
 *
 * It is NOT the <Dialog> primitive: Radix would portal the panel out of
 * `.term-screen`, take over focus and own its own Esc — and TerminalHome owns
 * THE ONE window keydown and the Esc cascade (P3/§5), which is gate-asserted.
 * The library's VALUES port; its state machine does not.
 */
import React, { useEffect, useRef } from 'react';
import { Kbd } from '@/components/ui/kbd';
import { Button } from '@/components/ui/button';
import { MonoLabel } from '@/components/brand';

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
  ['guide', 'return to the readable tour'],
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
            <td className="key">
              <Kbd>{k}</Kbd>
            </td>
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
    // preventScroll: the panel is a scroll container now (the <Kbd> chips made
    // the key tables taller than 80vh), and focusing the close button at the
    // bottom would otherwise open the sheet already scrolled past "keys".
    if (open) closeRef.current?.focus({ preventScroll: true });
  }, [open]);

  if (!open) return null;

  return (
    <div className="term-overlay" data-testid="term-help">
      {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events */}
      <div className="backdrop on-overlay" onClick={onClose} />
      <div
        className="panel help-panel on-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Keyboard help"
      >
        <MonoLabel className="help-head" tone="accent">
          keys
        </MonoLabel>
        <KeyTable rows={KEYS} />
        <MonoLabel className="help-head" tone="accent">
          panes
        </MonoLabel>
        <KeyTable rows={PANES} />
        <MonoLabel className="help-head" tone="accent">
          commands
        </MonoLabel>
        <KeyTable rows={CMDS} />
        <Button
          ref={closeRef}
          type="button"
          variant="ghost"
          size="sm"
          className="help-close"
          onClick={onClose}
        >
          close
        </Button>
      </div>
    </div>
  );
}
