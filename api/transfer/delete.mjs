import { requireSession } from "../_lib/auth.mjs";
import { removeTransfer } from "../_lib/transfers.mjs";

export default async function handler(req, res) {
  if (req.method !== "DELETE") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  if (!(await requireSession(req, res))) return;

  const { id } = req.query || {};
  if (!id) {
    res.status(400).json({ error: "Missing id" });
    return;
  }

  try {
    await removeTransfer(req.userId, String(id));
    res.status(200).json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message || "Delete failed" });
  }
}
