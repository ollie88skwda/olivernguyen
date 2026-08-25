/**
 * src/terminal/StatusBar.jsx — tmux statusbar (C-1.5): `[oN.c]` + window tabs
 * (click = run that window's command) + ⌘K chip (P9: the palette's tappable
 * entry point — the only palette affordance on touch) + mode indicator +
 * pos% + clock + pane state.
 *
 * R-T1: this is the library's <Statusline> (docs/COMPONENTS.md). BRAND.md §5
 * licenses density inside the statusline and §7 puts it in Martian Mono — both
 * now come from `.on-statusline` rather than being restated here.
 * <StatuslineSpacer> is the right-hand push, the two transient pane states are
 * <StatusPill> (§4's pill exception, §2's "real states only"), and the `·`
 * separators and `⌘` key mark are <Glyph> per §8 — they used to be literal
 * characters in the JSX.
 *
 * terminal.css only re-does the geometry the library cannot know: the bar is
 * the bottom row of a 100dvh grid, so it is square and borderless except on
 * top. Everything else is the library rule.
 */
import React, { useEffect, useState } from 'react';
import {
  Glyph,
  MonoLabel,
  Statusline,
  StatuslineSpacer,
  StatusPill,
} from '@/components/brand';

const fmtTime = () =>
  new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

export default function StatusBar({
  api,
  windows = [],
  active = 1,
  onWindow,
  onPalette,
  mode = '-- NORMAL --',
  paneCount = 1,
  zoomed = false,
  prefix = '',
  err = '',
}) {
  const [pos, setPos] = useState(100);
  const [time, setTime] = useState(fmtTime);

  useEffect(() => api.onPos(setPos), [api]);

  useEffect(() => {
    const iv = setInterval(() => setTime(fmtTime()), 30_000);
    return () => clearInterval(iv);
  }, []);

  return (
    <Statusline className="term-statusbar" data-testid="term-statusbar">
      <MonoLabel className="sb-sess">[oN.c]</MonoLabel>
      {windows.length > 0 && (
        <nav className="sb-tabs" aria-label="Windows">
          {windows.map((w) => (
            <button
              key={w.n}
              type="button"
              className={'tab' + (w.n === active ? ' active' : '')}
              aria-current={w.n === active ? 'true' : undefined}
              onClick={() => onWindow?.(w.n)}
            >
              {w.n}:{w.name}
            </button>
          ))}
        </nav>
      )}
      {onPalette && (
        <button
          type="button"
          className="sb-cmdk"
          data-testid="sb-cmdk"
          aria-label="Open command palette"
          onClick={onPalette}
        >
          <Glyph name="key" label="" />K
        </button>
      )}
      <StatuslineSpacer />
      <span className="sb-right">
        {err && (
          <StatusPill
            status="error"
            dot={false}
            className="sb-err"
            data-testid="sb-err"
            role="status"
          >
            {err}
          </StatusPill>
        )}
        {paneCount > 1 && (
          <span className="sb-panes" data-testid="sb-panes">
            {paneCount} panes
          </span>
        )}
        {zoomed && (
          <StatusPill status="warning" dot={false} className="sb-zoom" data-testid="sb-zoom">
            [Z]
          </StatusPill>
        )}
        {prefix && (
          <StatusPill
            status="warning"
            dot={false}
            className="sb-prefix"
            data-testid="sb-prefix"
          >
            {prefix}
          </StatusPill>
        )}
        <span className="sb-mode" data-testid="sb-mode">
          {mode}
        </span>
        <span className="sb-dim">
          <Glyph name="sep" /> ? help <Glyph name="sep" /> <Glyph name="key" label="" />K{' '}
          <Glyph name="sep" />
        </span>
        <span className="sb-pos" data-testid="sb-pos">
          {pos}%
        </span>
        <Glyph name="sep" className="sb-dim" />
        <span className="sb-time">{time}</span>
      </span>
    </Statusline>
  );
}
