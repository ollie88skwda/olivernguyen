import { requireOwnerSession } from "../_lib/auth.mjs";
import { mutateTracker, readTracker, TrackerError } from "../_lib/tracker.mjs";

function sendError(res, error) {
  const status = error instanceof TrackerError ? error.status : 500;
  res.status(status).json({ error: error.message || "Tracker request failed." });
}

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  if (!(await requireOwnerSession(req, res))) return;
  if (req.method === "GET" && req.query?.access === "1") {
    res.status(200).json({ authorized: true });
    return;
  }

  try {
    if (req.method === "GET") {
      res.status(200).json({ tracker: await readTracker(req.userId) });
      return;
    }

    const result = await mutateTracker(req.userId, req.body);
    res.status(200).json(result);
  } catch (error) {
    sendError(res, error);
  }
}
