import { requireOwnerSession } from "../_lib/auth.mjs";
import { queueAction, readSnapshot, validateAction } from "../_lib/verifier.mjs";

// One function for /api/verifier/snapshot and /api/verifier/action: the Vercel plan
// caps serverless functions at 12 (same pattern as api/transfer/[action].mjs).
export default async function handler(req, res) {
  const action = req.query?.action;
  if (action === "snapshot") {
    if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
    if (!(await requireOwnerSession(req, res))) return;
    try {
      res.setHeader("Cache-Control", "no-store");
      return res.status(200).json(await readSnapshot());
    } catch (err) {
      return res.status(503).json({ error: err.message || "Snapshot unavailable" });
    }
  }
  if (action === "action") {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
    if (!(await requireOwnerSession(req, res))) return;
    const bad = validateAction(req.body);
    if (bad) return res.status(400).json({ error: bad });
    try {
      return res.status(202).json({ queued: await queueAction(req.body, req.userId) });
    } catch (err) {
      return res.status(500).json({ error: err.message || "Queue failed" });
    }
  }
  return res.status(404).json({ error: "Not found" });
}
