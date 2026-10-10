import { requireSession } from "../_lib/auth.mjs";
import {
  createTransfer,
  listTransfers,
  MAX_CONTENT_LENGTH,
  removeTransfer,
} from "../_lib/transfers.mjs";

function methodNotAllowed(res) {
  res.status(405).json({ error: "Method not allowed" });
}

export default async function handler(req, res) {
  const action = req.query?.action;

  if (
    (action === "list" && req.method !== "GET") ||
    (action === "create" && req.method !== "POST") ||
    (action === "delete" && req.method !== "DELETE")
  ) {
    methodNotAllowed(res);
    return;
  }
  if (action !== "list" && action !== "create" && action !== "delete") {
    res.status(404).json({ error: "Not found" });
    return;
  }
  if (!(await requireSession(req, res))) return;

  if (action === "list") {
    try {
      const items = await listTransfers(req.userId);
      res.status(200).json({ items });
    } catch (err) {
      res.status(500).json({ error: err.message || "List failed" });
    }
    return;
  }

  if (action === "create") {
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
    return;
  }

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
