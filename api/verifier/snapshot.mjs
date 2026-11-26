import { requireOwnerSession } from "../_lib/auth.mjs";
import { readSnapshot } from "../_lib/verifier.mjs";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  if (!(await requireOwnerSession(req, res))) return;
  try {
    res.setHeader("Cache-Control", "no-store");
    res.status(200).json(await readSnapshot());
  } catch (err) {
    res.status(503).json({ error: err.message || "Snapshot unavailable" });
  }
}
