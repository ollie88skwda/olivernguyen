import { readFile, writeFile, mkdir } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

// /verifier dashboard data. The Verifier loop (github.com/ollie88skwda/the-verifier)
// runs on Oliver's Mac and writes snapshot.json. On the Workshop this reads that
// file directly (VERIFIER_DIR). On Vercel it reads the same file from the private
// Supabase bucket "verifier", which the loop uploads when publishing is enabled.
// Actions (approve/reject/label) are queued as inbox files the loop applies, so
// the website never edits agent config itself.

const ACTIONS = new Set(["approve", "reject", "revert", "label"]);

function bucket() {
  const url = process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Verifier storage is not configured (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)");
  return createClient(url, key).storage.from("verifier");
}

export async function readSnapshot() {
  const dir = process.env.VERIFIER_DIR;
  if (dir) return JSON.parse(await readFile(`${dir}/data/snapshot.json`, "utf8"));
  const { data, error } = await bucket().download("snapshot.json");
  if (error) throw new Error(`Snapshot unavailable: ${error.message}`);
  return JSON.parse(await data.text());
}

export function validateAction(body) {
  const { action, id, agree, note } = body || {};
  if (!ACTIONS.has(action)) return "Unknown action";
  if (typeof id !== "string" || !/^[\w:.-]{3,120}$/.test(id)) return "Bad id";
  if (note != null && (typeof note !== "string" || note.length > 2000)) return "Note too long";
  if (action === "label" && typeof agree !== "boolean") return "Label needs agree: true|false";
  return null;
}

export async function queueAction(body, userId) {
  const item = { ...body, by: userId, at: new Date().toISOString(), uid: randomUUID() };
  const name = `${item.at.replace(/[:.]/g, "-")}-${item.uid}.json`;
  const dir = process.env.VERIFIER_DIR;
  if (dir) {
    await mkdir(`${dir}/data/inbox`, { recursive: true });
    await writeFile(`${dir}/data/inbox/${name}`, JSON.stringify(item));
  } else {
    const { error } = await bucket().upload(`inbox/${name}`, JSON.stringify(item), { contentType: "application/json" });
    if (error) throw new Error(`Queue failed: ${error.message}`);
  }
  return item;
}
