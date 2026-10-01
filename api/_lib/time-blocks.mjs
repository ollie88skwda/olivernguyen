import { createClient } from "@supabase/supabase-js";
import { applyTimeBlocksAction, emptyTimeBlocks, normalizeTimeBlocks } from "../../src/pages/time-blocks/model.mjs";

const ROOT = "_time-blocks";
const LOCK_TTL_MS = 120_000;
const SCHEDULE_HEADS_TABLE = "time_blocks_schedule_heads";

export class TimeBlocksError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export function timeBlocksPath(userId, fencingToken, ownerToken) {
  return `${ROOT}/schedules/${encodeURIComponent(userId)}/${fencingToken}-${ownerToken}.json`;
}

function privateStorage() {
  const url = process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucketName = process.env.TIME_BLOCKS_BUCKET;
  if (!url || !key || !bucketName) {
    throw new TimeBlocksError(500, "Private time-block storage is not configured on the server.");
  }
  const client = createClient(url, key, { auth: { persistSession: false } });
  return { client, bucket: client.storage.from(bucketName) };
}

function conflict(error) {
  return error && (
    Number(error.status) === 409 || Number(error.statusCode) === 409 ||
    /already exists|already present|duplicate/i.test(error.message || "")
  );
}

function storageError(error, fallback) {
  if (conflict(error)) {
    return new TimeBlocksError(409, "Another schedule change is in progress. Try again.");
  }
  const message = error?.message || "";
  if (/fetch failed|network|enotfound|timeout|timed? out/i.test(message)) {
    return new TimeBlocksError(503, "Time-block storage is temporarily unavailable. Try again.");
  }
  return new TimeBlocksError(500, message || fallback);
}

async function requestStorage(request, fallback) {
  try {
    return await request();
  } catch (error) {
    if (error?.status) throw error;
    throw storageError(error, fallback);
  }
}

async function readTimeBlocksWithClient(client, bucket, userId) {
  const { data: head, error: headError } = await requestStorage(
    () => client
      .from(SCHEDULE_HEADS_TABLE)
      .select("object_path")
      .eq("user_id", userId)
      .maybeSingle(),
    "The schedule index could not be loaded.",
  );
  if (headError) throw storageError(headError, "The schedule index could not be loaded.");
  if (!head?.object_path) return emptyTimeBlocks();

  const { data, error } = await requestStorage(
    () => bucket.download(head.object_path),
    "The schedule could not be loaded.",
  );
  if (error) throw storageError(error, "The schedule could not be loaded.");
  try {
    return normalizeTimeBlocks(JSON.parse(await data.text()));
  } catch (error) {
    if (error.status) throw error;
    throw new TimeBlocksError(500, "Saved time-block data could not be read.");
  }
}

async function acquireLease(client, userId) {
  const ownerToken = crypto.randomUUID();
  const { data, error } = await requestStorage(
    () => client.rpc("time_blocks_acquire_lease", {
      p_user_id: userId,
      p_owner_token: ownerToken,
      p_ttl_ms: LOCK_TTL_MS,
    }),
    "The schedule could not be locked.",
  );
  if (error) throw storageError(error, "The schedule could not be locked.");

  const lease = Array.isArray(data) ? data[0] : data;
  if (!lease) {
    throw new TimeBlocksError(409, "Another schedule change is in progress. Try again.");
  }
  const fencingToken = Number(lease.fencing_token);
  if (!Number.isSafeInteger(fencingToken) || fencingToken < 1) {
    throw new TimeBlocksError(500, "The schedule lease could not be verified.");
  }
  return { ownerToken, fencingToken };
}

async function releaseLease(client, userId, lease) {
  const { error } = await requestStorage(
    () => client.rpc("time_blocks_release_lease", {
      p_user_id: userId,
      p_owner_token: lease.ownerToken,
      p_fencing_token: lease.fencingToken,
    }),
    "The schedule lease could not be released.",
  );
  if (error) throw storageError(error, "The schedule lease could not be released.");
}

export async function readTimeBlocks(userId) {
  const { client, bucket } = privateStorage();
  return readTimeBlocksWithClient(client, bucket, userId);
}

export async function mutateTimeBlocks(userId, action, now = new Date()) {
  const { client, bucket } = privateStorage();
  const lease = await acquireLease(client, userId);
  try {
    const current = await readTimeBlocksWithClient(client, bucket, userId);
    const next = applyTimeBlocksAction(current, action, now);
    const objectPath = timeBlocksPath(userId, lease.fencingToken, lease.ownerToken);
    const { error: uploadError } = await requestStorage(
      () => bucket.upload(objectPath, JSON.stringify(next), {
        contentType: "application/json",
        upsert: false,
      }),
      "The schedule could not be saved.",
    );
    if (uploadError) throw storageError(uploadError, "The schedule could not be saved.");

    const { data: published, error: publishError } = await requestStorage(
      () => client.rpc("time_blocks_publish_schedule", {
        p_user_id: userId,
        p_owner_token: lease.ownerToken,
        p_fencing_token: lease.fencingToken,
        p_object_path: objectPath,
      }),
      "The schedule could not be published.",
    );
    if (publishError) throw storageError(publishError, "The schedule could not be published.");
    if (published !== true) {
      throw new TimeBlocksError(409, "The schedule changed while saving. Please try again.");
    }
    return next;
  } finally {
    await releaseLease(client, userId, lease);
  }
}
