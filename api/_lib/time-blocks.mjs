import { createClient } from "@supabase/supabase-js";
import { applyTimeBlocksAction, emptyTimeBlocks, normalizeTimeBlocks } from "../../src/pages/time-blocks/model.mjs";

const ROOT = "_time-blocks";
const LOCK_ROOT = `${ROOT}/locks`;
const LOCK_TTL_MS = 120_000;

export class TimeBlocksError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export function timeBlocksPath(userId) {
  return `${ROOT}/${encodeURIComponent(userId)}.json`;
}

function lockPath(userId) {
  return `${LOCK_ROOT}/${encodeURIComponent(userId)}.lock`;
}

function storage() {
  const url = process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = process.env.TIME_BLOCKS_BUCKET;
  if (!url || !key || !bucket) {
    throw new TimeBlocksError(500, "Private time-block storage is not configured on the server.");
  }
  return createClient(url, key, { auth: { persistSession: false } }).storage.from(bucket);
}

function missing(error) {
  return error && (
    Number(error.status) === 404 || Number(error.statusCode) === 404 ||
    /not found|does not exist/i.test(error.message || "")
  );
}

function conflict(error) {
  return error && (
    Number(error.status) === 409 || Number(error.statusCode) === 409 ||
    /already exists|already present|duplicate/i.test(error.message || "")
  );
}

function storageError(error, fallback) {
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
    throw storageError(error, fallback);
  }
}

async function acquireLock(userId) {
  const bucket = storage();
  const path = lockPath(userId);
  const ownerToken = crypto.randomUUID();
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const { error } = await requestStorage(
      () => bucket.upload(path, JSON.stringify({ ownerToken, expiresAt: Date.now() + LOCK_TTL_MS }), {
        contentType: "application/json",
        upsert: false,
      }),
      "The schedule could not be locked.",
    );
    if (!error) {
      return async () => {
        const { data, error: readError } = await requestStorage(
          () => bucket.download(path),
          "The schedule lock could not be checked before release.",
        );
        if (readError) {
          if (missing(readError)) return;
          throw storageError(readError, "The schedule lock could not be checked before release.");
        }
        let lock;
        try {
          lock = JSON.parse(await data.text());
        } catch {
          return;
        }
        if (lock?.ownerToken !== ownerToken) return;
        const { error: releaseError } = await requestStorage(
          () => bucket.remove([path]),
          "The schedule lock could not be released.",
        );
        if (releaseError && !missing(releaseError)) {
          throw storageError(releaseError, "The schedule lock could not be released.");
        }
      };
    }
    if (!conflict(error)) throw storageError(error, "The schedule could not be locked.");

    const { data, error: readError } = await requestStorage(
      () => bucket.download(path),
      "The schedule lock could not be checked.",
    );
    if (readError) {
      if (missing(readError)) continue;
      throw storageError(readError, "The schedule lock could not be checked.");
    }
    let expiresAt;
    try {
      expiresAt = JSON.parse(await data.text()).expiresAt;
    } catch {
      expiresAt = null;
    }
    if (!Number.isFinite(expiresAt) || expiresAt > Date.now()) {
      throw new TimeBlocksError(409, "Another schedule change is in progress. Try again.");
    }
    const { error: removeError } = await requestStorage(
      () => bucket.remove([path]),
      "The expired schedule lock could not be cleared.",
    );
    if (removeError && !missing(removeError)) {
      throw storageError(removeError, "The expired schedule lock could not be cleared.");
    }
  }
  throw new TimeBlocksError(409, "Another schedule change is in progress. Try again.");
}

export async function readTimeBlocks(userId) {
  const { data, error } = await requestStorage(
    () => storage().download(timeBlocksPath(userId)),
    "The schedule could not be loaded.",
  );
  if (error) {
    if (missing(error)) return emptyTimeBlocks();
    throw storageError(error, "The schedule could not be loaded.");
  }
  try {
    return normalizeTimeBlocks(JSON.parse(await data.text()));
  } catch (error) {
    if (error.status) throw error;
    throw new TimeBlocksError(500, "Saved time-block data could not be read.");
  }
}

async function writeTimeBlocks(userId, timeBlocks) {
  const { error } = await requestStorage(
    () => storage().upload(
      timeBlocksPath(userId),
      JSON.stringify(timeBlocks),
      { contentType: "application/json", upsert: true },
    ),
    "The schedule could not be saved.",
  );
  if (error) throw storageError(error, "The schedule could not be saved.");
}

export async function mutateTimeBlocks(userId, action, now = new Date()) {
  const release = await acquireLock(userId);
  try {
    const current = await readTimeBlocks(userId);
    const next = applyTimeBlocksAction(current, action, now);
    await writeTimeBlocks(userId, next);
    return next;
  } finally {
    await release();
  }
}
