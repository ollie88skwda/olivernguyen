/**
 * src/terminal/StatusBar.jsx — tmux statusbar (C-1.5): `[oN.c]` + window tabs
 * (click = run that window's command) + ⌘K chip (P9: the palette's tappable
 * entry point — the only palette affordance on touch) + mode indicator +
 * pos% + clock. Pane props ({paneCount, zoomed, prefix}) stubbed until X-1.
 */
import React, { useEffect, useState } from 'react';

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
}) {
  const [pos, setPos] = useState(100);
  const [time, setTime] = useState(fmtTime);

  useEffect(() => api.onPos(setPos), [api]);

  useEffect(() => {
    const iv = setInterval(() => setTime(fmtTime()), 30_000);
    return () => clearInterval(iv);
  }, []);

  return (
    <div className="term-statusbar" data-testid="term-statusbar">
      <span className="sb-sess">[oN.c]</span>
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
          ⌘K
        </button>
      )}
      <span className="sb-right">
        {paneCount > 1 && <span className="sb-panes">{paneCount} panes</span>}
        {zoomed && <span className="sb-zoom">[Z]</span>}
        {prefix && (
          <span className="sb-prefix" data-testid="sb-prefix">
            {prefix}
          </span>
        )}
        <span className="sb-mode" data-testid="sb-mode">
          {mode}
        </span>
        <span className="sb-dim">· ? help · ⌘K ·</span>
        <span className="sb-pos" data-testid="sb-pos">
          {pos}%
        </span>
        <span className="sb-dim">·</span>
        <span className="sb-time">{time}</span>
      </span>
    </div>
  );
}
