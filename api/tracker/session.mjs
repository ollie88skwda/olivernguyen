import { requireOwnerSession } from "../_lib/auth.mjs";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  if (!(await requireOwnerSession(req, res))) return;
  res.status(200).json({ authorized: true });
}
