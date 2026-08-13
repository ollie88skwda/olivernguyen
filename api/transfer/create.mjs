import { requireSession } from "../_lib/auth.mjs";
import { createTransfer, MAX_CONTENT_LENGTH } from "../_lib/transfers.mjs";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  if (!(await requireSession(req, res))) return;

  const { content } = req.body || {};
  if (typeof content !== "string" || !content.trim()) {
    res.status(400).json({ error: "Content is empty" });
    return;
  }
  if (content.length > MAX_CONTENT_LENGTH) {
    res.status(400).json({ error: `Content exceeds ${MAX_CONTENT_LENGTH} characters` });
    return;
  }

  try {
    const item = await createTransfer(req.userId, content);
    res.status(201).json({ item });
  } catch (err) {
    res.status(500).json({ error: err.message || "Create failed" });
  }
}
