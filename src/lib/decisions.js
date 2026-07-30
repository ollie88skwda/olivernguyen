// Writes for major_decision / apply_decision go through our own API, not straight
// to Supabase. The browser only holds the anon key and Supabase has no notion of
// the passphrase, so a policy that let the real user write let anyone write. The
// server route holds the service-role key and sits behind the same gate as the pages.
//
// Reads and the realtime subscriptions still go direct — they only need anon
// SELECT, and this data already ships inside the JS bundle anyway.
export async function saveDecision({ table, id, doc, updatedAt }) {
  const res = await fetch('/api/decision/save', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ table, id, doc, updatedAt }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = new Error(body.error || `Save failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

export default saveDecision;
