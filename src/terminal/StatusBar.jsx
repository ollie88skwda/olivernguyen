/**
 * src/terminal/StatusBar.jsx — tmux statusbar (C-0.2 shell: session, mode,
 * %, clock; window tabs land at C-1.5, pane props {paneCount, zoomed, prefix}
 * arrive from panes at X-1).
 */
import React, { useEffect, useState } from 'react';

const fmtTime = () =>
  new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

export default function StatusBar({ api, mode = '-- NORMAL --' }) {
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
      <span className="sb-right">
        <span className="sb-mode" data-testid="sb-mode">
          {mode}
        </span>
        <span className="sb-dim">·</span>
        <span className="sb-pos" data-testid="sb-pos">
          {pos}%
        </span>
        <span className="sb-dim">·</span>
        <span className="sb-time">{time}</span>
      </span>
    </div>
  );
}
