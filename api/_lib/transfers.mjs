import { randomUUID } from "crypto";
import { createClient } from "@supabase/supabase-js";

// /transfer — a private clipboard that survives across machines and dies on a
// timer. One private Supabase Storage bucket, one object per transfer, named
// `${userId}/${uuid}` so ownership is structural: a caller can only ever name
// paths under their own prefix. Expiry is enforced at read time — expired
// objects are skipped and deleted lazily — because a serverless function has
// no cron. The bucket's object `created_at` is the authoritative clock; custom
// upload metadata is silently dropped by the hosted Storage backend, so nothing
// here depends on it.

export const TRANSFER_TTL_MS = 30 * 60 * 1000;
export const MAX_CONTENT_LENGTH = 100_000;

function transfers() {
  const url = process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Supabase storage is not configured (REACT_APP_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)");
  }
  return createClient(url, key).storage.from("transfers");
}

// Listed objects expose their server timestamps, so a read needs no extra
// round trip to know when an item is dead.
export function itemFromObject(obj) {
  return {
    id: String(obj.name).split("/").pop(),
    createdAt: obj.created_at || obj.last_modified_at,
  };
}

export function isExpired(item, now = Date.now()) {
  const expiry = new Date(item.createdAt).getTime() + TRANSFER_TTL_MS;
  return expiry <= now;
}

export async function listTransfers(userId) {
  const bucket = transfers();
  const prefix = `${userId}/`;
  const { data: objects, error } = await bucket.list(prefix, { limit: 200 });
  if (error) throw new Error(error.message);

  const now = Date.now();
  const stale = [];
  const active = [];

  for (const obj of objects || []) {
    const item = itemFromObject(obj);
    if (isExpired(item, now)) {
      stale.push(prefix + item.id);
    } else {
      active.push(item);
    }
  }

  if (stale.length > 0) {
    await bucket.remove(stale).catch(() => {});
  }

  // Downloads are the slow part (one round trip each), so run them together.
  // A failed download drops just that item; the rest of the list still loads.
  const items = await Promise.all(
    active.map(async (item) => {
      const { data: blob, error: readErr } = await bucket.download(prefix + item.id);
      if (readErr) return null;
      return {
        ...item,
        expiresAt: new Date(new Date(item.createdAt).getTime() + TRANSFER_TTL_MS).toISOString(),
        content: await blob.text(),
      };
    })
  );

  return items
    .filter(Boolean)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export async function createTransfer(userId, content) {
  const id = randomUUID();
  const name = `${userId}/${id}`;

  const { error } = await transfers().upload(name, content, { contentType: "text/plain" });
  if (error) throw new Error(error.message);

  const createdAt = new Date().toISOString();
  return { id, createdAt, expiresAt: new Date(Date.now() + TRANSFER_TTL_MS).toISOString(), content };
}

export async function removeTransfer(userId, id) {
  const { error } = await transfers().remove([`${userId}/${id}`]);
  if (error) throw new Error(error.message);
}
