import { requireOwnerSession } from "../_lib/auth.mjs";
import { queueAction, validateAction } from "../_lib/verifier.mjs";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!(await requireOwnerSession(req, res))) return;
  const bad = validateAction(req.body);
  if (bad) return res.status(400).json({ error: bad });
  try {
    res.status(202).json({ queued: await queueAction(req.body, req.userId) });
  } catch (err) {
    res.status(500).json({ error: err.message || "Queue failed" });
  }
}
