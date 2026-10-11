import { afterEach, describe, expect, it, vi } from "vitest";
import { applyTimeBlocksAction, emptyTimeBlocks } from "../../src/pages/time-blocks/model.mjs";

const { createClient } = vi.hoisted(() => ({ createClient: vi.fn() }));
vi.mock("@supabase/supabase-js", () => ({ createClient }));

import { mutateTimeBlocks, readTimeBlocks, timeBlocksPath } from "./time-blocks.mjs";

const scheduleAction = {
  type: "save-schedule",
  schedule: { startTime: "07:00", activities: [{ name: "School", hours: 1 }] },
};

function storageClient({ head = null, acquire = [{ fencing_token: 1 }], published = true, released = true, download } = {}) {
  const query = {
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
    maybeSingle: vi.fn(async () => ({ data: head, error: null })),
  };
  const bucket = {
    download: vi.fn(download || (async () => ({ data: null, error: { status: 404, message: "not found" } }))),
    upload: vi.fn(async () => ({ data: {}, error: null })),
  };
  const rpc = vi.fn(async (name) => {
    if (name === "time_blocks_acquire_lease") return { data: acquire, error: null };
    if (name === "time_blocks_publish_schedule") return { data: published, error: null };
    if (name === "time_blocks_release_lease") return { data: released, error: null };
    throw new Error(`unexpected RPC ${name}`);
  });
  const client = {
    rpc,
    from: vi.fn(() => query),
    storage: { from: vi.fn(() => bucket) },
  };
  createClient.mockReturnValue(client);
  return { client, bucket, query, rpc };
}

function configureStorage() {
  vi.stubEnv("SUPABASE_URL", "https://local.invalid");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-only-key");
  vi.stubEnv("TIME_BLOCKS_BUCKET", "private-test");
}

afterEach(() => {
  vi.unstubAllEnvs();
  createClient.mockReset();
});

describe("time-block private storage configuration", () => {
  it("fails closed until a dedicated bucket is explicitly configured", async () => {
    vi.stubEnv("SUPABASE_URL", "https://local.invalid");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-only-key");
    vi.stubEnv("TIME_BLOCKS_BUCKET", "");

    await expect(readTimeBlocks("user_owner")).rejects.toMatchObject({
      status: 500,
      message: "Private time-block storage is not configured on the server.",
    });
    expect(createClient).not.toHaveBeenCalled();
  });

  it("uses an immutable path derived from the server-owned user and lease", () => {
    expect(timeBlocksPath("user/owner", 12, "lease-token")).toBe(
      "_time-blocks/schedules/user%2Fowner/12-lease-token.json",
    );
  });

  it("reads only the schedule generation published for the owner", async () => {
    configureStorage();
    const expected = applyTimeBlocksAction(emptyTimeBlocks(), scheduleAction);
    const path = timeBlocksPath("user_owner", 4, "lease-token");
    const { bucket, query } = storageClient({
      head: { object_path: path },
      download: async () => ({ data: { text: async () => JSON.stringify(expected) }, error: null }),
    });

    await expect(readTimeBlocks("user_owner")).resolves.toEqual(expected);
    expect(query.maybeSingle).toHaveBeenCalledOnce();
    expect(bucket.download).toHaveBeenCalledWith(path);
  });

  it("publishes an immutable schedule only after acquiring a database lease", async () => {
    configureStorage();
    const { bucket, rpc, client } = storageClient({ acquire: [{ fencing_token: 9 }] });

    await mutateTimeBlocks("user_owner", scheduleAction, new Date("2026-09-30T12:00:00Z"));

    expect(rpc.mock.calls.map(([name]) => name)).toEqual([
      "time_blocks_acquire_lease",
      "time_blocks_publish_schedule",
      "time_blocks_release_lease",
    ]);
    expect(client.from).toHaveBeenCalledWith("time_blocks_schedule_heads");
    expect(bucket.upload).toHaveBeenCalledOnce();
    const [path, body, options] = bucket.upload.mock.calls[0];
    expect(path).toMatch(/^_time-blocks\/schedules\/user_owner\/9-[0-9a-f-]+\.json$/i);
    expect(JSON.parse(body)).toMatchObject({ schedule: { startTime: "07:00" } });
    expect(options).toEqual({ contentType: "application/json", upsert: false });
    expect(rpc.mock.calls[1][1]).toMatchObject({ p_fencing_token: 9, p_object_path: path });
  });

  it("rejects a concurrent timer tap before it can create or overwrite a timer", async () => {
    configureStorage();
    const { client, bucket, rpc } = storageClient({ acquire: [] });
    const timerTap = { type: "toggle-session", sessionId: "slot-1" };

    await expect(mutateTimeBlocks("user_owner", timerTap)).rejects.toMatchObject({ status: 409 });
    expect(client.from).not.toHaveBeenCalled();
    expect(bucket.download).not.toHaveBeenCalled();
    expect(bucket.upload).not.toHaveBeenCalled();
    expect(rpc).toHaveBeenCalledOnce();
  });

  it("does not publish a generation after its lease has been fenced out", async () => {
    configureStorage();
    const { bucket, rpc } = storageClient({ acquire: [{ fencing_token: 3 }], published: false, released: false });

    await expect(mutateTimeBlocks("user_owner", scheduleAction)).rejects.toMatchObject({ status: 409 });
    expect(bucket.upload).toHaveBeenCalledOnce();
    expect(rpc.mock.calls.map(([name]) => name)).toEqual([
      "time_blocks_acquire_lease",
      "time_blocks_publish_schedule",
      "time_blocks_release_lease",
    ]);
  });
});
