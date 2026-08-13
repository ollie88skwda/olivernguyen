import { requireSession } from "../_lib/auth.mjs";
import { listTransfers } from "../_lib/transfers.mjs";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  if (!(await requireSession(req, res))) return;

  try {
    const items = await listTransfers(req.userId);
    res.status(200).json({ items });
  } catch (err) {
    res.status(500).json({ error: err.message || "List failed" });
  }
}
