import { requireGate } from "../_lib/passphrase.mjs";

// /major and /apply talk to Supabase straight from the browser, so they have no
// data endpoint to probe auth with. This is that probe.
export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  if (!(await requireGate(req, res))) return;
  res.status(200).json({ ok: true });
}
