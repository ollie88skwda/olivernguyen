// Shared fetch wrapper for the /api routes. `vite` does not serve
// api/* — it answers every path with index.html at 200 — so an HTML body is a hard
// error rather than an empty result, and callers can tell "no backend" apart from
// "not logged in".
export async function apiFetch(path, options = {}) {
  const res = await fetch(path, {
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (res.status === 401) {
    const err = new Error('unauthenticated');
    err.status = 401;
    throw err;
  }

  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const err = new Error(
      'The /api routes are not running. Start the site with `vercel dev` — `vite` cannot serve them.'
    );
    err.status = res.status;
    err.noApi = true;
    throw err;
  }

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(body.error || 'Request failed');
    err.status = res.status;
    throw err;
  }
  return body;
}

export default apiFetch;
