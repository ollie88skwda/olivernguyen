import React, { useCallback, useEffect, useRef, useState } from 'react';
import { UserButton } from '@clerk/react';
import { apiFetch } from '../../auth/api';
import '../../styles/Transfer.css';

// /transfer — a private clipboard. Whatever is sent here appears on any other
// signed-in machine within one poll tick, and every item deletes itself 30
// minutes after it was sent (server-enforced; this page only stops drawing it).

const POLL_MS = 5000;
const TICK_MS = 1000;
const MAX_CONTENT = 100000;

function formatRemaining(ms) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
}

export const Transfer = () => {
  const [draft, setDraft] = useState('');
  const [items, setItems] = useState([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [syncedAt, setSyncedAt] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [now, setNow] = useState(Date.now());
  const inputRef = useRef(null);

  // Poll quietly after the first load: a stale list is better than a blinking
  // error when one request out of a hundred fails. The first failure, though,
  // has to be loud — "api routes not running" is exactly the case where the
  // studio shows its own message instead of pretending nothing happened.
  const refresh = useCallback(async (first = false) => {
    try {
      const { items: next } = await apiFetch('/api/transfer/list');
      setItems(next);
      setError(null);
      setSyncedAt(new Date());
      setLoaded(true);
    } catch (err) {
      if (first) {
        setError(err.message);
        setLoaded(true);
      }
    }
  }, []);

  useEffect(() => {
    refresh(true);
    const poll = setInterval(() => refresh(false), POLL_MS);
    const onFocus = () => refresh(false);
    window.addEventListener('focus', onFocus);
    return () => {
      clearInterval(poll);
      window.removeEventListener('focus', onFocus);
    };
  }, [refresh]);

  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => clearInterval(tick);
  }, []);

  const send = async () => {
    if (!draft.trim() || sending) return;
    const sent = draft;
    setSending(true);
    setError(null);
    try {
      await apiFetch('/api/transfer/create', {
        method: 'POST',
        body: JSON.stringify({ content: sent }),
      });
      // Created. Re-enable immediately; the list refresh runs in the background
      // so rapid consecutive pastes never queue behind a slow read. Only clear
      // the box if the user has not already typed something newer while the
      // request was in flight.
      setDraft((current) => (current === sent ? '' : current));
      setSending(false);
      refresh(false);
      inputRef.current && inputRef.current.focus();
    } catch (err) {
      setError(err.message);
      setSending(false);
    }
  };

  const copy = async (item) => {
    try {
      await navigator.clipboard.writeText(item.content);
      setCopiedId(item.id);
      setTimeout(() => setCopiedId((current) => (current === item.id ? null : current)), 1500);
    } catch {
      setError('Clipboard is blocked in this browser — select the text and copy manually.');
    }
  };

  const remove = async (id) => {
    try {
      await apiFetch(`/api/transfer/delete?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      setItems((current) => current.filter((item) => item.id !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  const visible = items.filter((item) => new Date(item.expiresAt).getTime() > now);

  return (
    <main className="tr-page">
      <div className="tr-user">
        <UserButton afterSignOutUrl="/college" />
      </div>

      <header className="tr-hero">
        <p className="tr-eyebrow">Route /transfer · private · auto-expires</p>
        <h1 className="tr-title">Transfer</h1>
        <div className="tr-rule" aria-hidden="true" />
        <p className="tr-sub">
          A private clipboard between your signed-in machines. Paste something here, pick it up on
          the other side — every item deletes itself 30 minutes after it is sent.
        </p>
      </header>

      <section className="tr-composer" aria-label="New transfer">
        <textarea
          ref={inputRef}
          className="tr-input"
          rows={6}
          maxLength={MAX_CONTENT}
          placeholder="Paste text, a link, a code snippet…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
              e.preventDefault();
              send();
            }
          }}
        />
        <div className="tr-composer-foot">
          <span className="tr-count">
            {draft.length.toLocaleString()} / {MAX_CONTENT.toLocaleString()}
          </span>
          <button className="tr-send" onClick={send} disabled={!draft.trim() || sending}>
            {sending ? 'Sending…' : 'Send'}
          </button>
        </div>
      </section>

      {error && <p className="tr-err">{error}</p>}

      <section className="tr-list" aria-label="Active transfers">
        {loaded && visible.length === 0 && !error ? (
          <p className="tr-empty">Nothing active. Whatever you send here will be waiting on your other machine within seconds.</p>
        ) : (
          visible.map((item) => (
            <article className="tr-item" key={item.id}>
              <pre className="tr-item-body">{item.content}</pre>
              <footer className="tr-item-foot">
                <span className={`tr-item-expires ${new Date(item.expiresAt).getTime() - now < 60 * 1000 ? 'soon' : ''}`}>
                  Expires in {formatRemaining(new Date(item.expiresAt).getTime() - now)}
                </span>
                <div className="tr-item-actions">
                  <button className="tr-copy" onClick={() => copy(item)}>
                    {copiedId === item.id ? 'Copied' : 'Copy'}
                  </button>
                  <button className="tr-del" onClick={() => remove(item.id)} aria-label="Delete transfer">
                    ×
                  </button>
                </div>
              </footer>
            </article>
          ))
        )}
      </section>

      <p className="tr-sync">{syncedAt ? `Synced ${syncedAt.toLocaleTimeString()}` : 'Syncing…'}</p>
    </main>
  );
};

export default Transfer;
