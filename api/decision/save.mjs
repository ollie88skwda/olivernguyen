import { createClient } from "@supabase/supabase-js";
import { requireGate } from "../_lib/passphrase.mjs";

// The browser can no longer write these tables directly. It only holds the anon
// key, and there is no Supabase identity to scope a policy to — the passphrase
// lives in our own cookie, which Supabase knows nothing about. So any policy
// permissive enough for the real user was permissive enough for everyone.
// Writes come through here instead, behind the same gate as the pages.
const TABLES = new Set(["major_decision", "apply_decision"]);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  if (!(await requireGate(req, res))) return;

  const { table, id, doc, updatedAt } = req.body || {};

  // Allowlisted rather than passed through: this client bypasses RLS entirely,
  // so an arbitrary table name here would be a write primitive on the whole DB.
  if (!TABLES.has(table)) {
    res.status(400).json({ error: "Unknown table" });
    return;
  }
  if (typeof id !== "string" || !id) {
    res.status(400).json({ error: "Missing row id" });
    return;
  }
  if (!doc || typeof doc !== "object") {
    res.status(400).json({ error: "Missing doc" });
    return;
  }
  // The client stamps this and uses it to recognise its own realtime echo, so it
  // has to be written verbatim rather than regenerated here.
  if (typeof updatedAt !== "string" || Number.isNaN(Date.parse(updatedAt))) {
    res.status(400).json({ error: "Missing or malformed updatedAt" });
    return;
  }

  // Checked after request validation so a malformed request still gets a 400 that
  // says what is wrong, rather than being masked by a config error.
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    res.status(500).json({ error: "SUPABASE_SERVICE_ROLE_KEY is missing on the server." });
    return;
  }

  const supabase = createClient(
    process.env.REACT_APP_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );

  const { error } = await supabase
    .from(table)
    .upsert({ id, doc, updated_at: updatedAt });

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.status(200).json({ ok: true, updatedAt });
}
