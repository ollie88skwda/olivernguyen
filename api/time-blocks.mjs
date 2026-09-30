import { requireOwnerSession } from "./_lib/auth.mjs";
import { mutateTimeBlocks, readTimeBlocks } from "./_lib/time-blocks.mjs";

function sendError(res, error) {
  res.status(Number.isInteger(error?.status) ? error.status : 500)
    .json({ error: error?.message || "The time-block request failed." });
}

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  if (!(await requireOwnerSession(req, res))) return;

  try {
    if (req.method === "GET") {
      res.status(200).json({ timeBlocks: await readTimeBlocks(req.userId) });
      return;
    }
    res.status(200).json({ timeBlocks: await mutateTimeBlocks(req.userId, req.body) });
  } catch (error) {
    sendError(res, error);
  }
}
