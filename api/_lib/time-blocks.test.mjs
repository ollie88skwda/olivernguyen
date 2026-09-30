import { afterEach, describe, expect, it, vi } from "vitest";

const { createClient } = vi.hoisted(() => ({ createClient: vi.fn() }));
vi.mock("@supabase/supabase-js", () => ({ createClient }));

import { mutateTimeBlocks, readTimeBlocks, timeBlocksPath } from "./time-blocks.mjs";

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

  it("keeps object paths derived from the server-owned user ID", () => {
    expect(timeBlocksPath("user/owner")).toBe("_time-blocks/user%2Fowner.json");
  });

  it("does not release a replacement lock after the original lease expires", async () => {
    const bucket = {
      upload: vi.fn(async () => ({ data: {}, error: null })),
      download: vi.fn(async (path) => path.endsWith(".json")
        ? { data: null, error: { status: 404, message: "not found" } }
        : { data: { text: async () => JSON.stringify({ ownerToken: "replacement", expiresAt: Date.now() + 1000 }) }, error: null }),
      remove: vi.fn(async () => ({ data: {}, error: null })),
    };
    createClient.mockReturnValue({ storage: { from: () => bucket } });
    vi.stubEnv("SUPABASE_URL", "https://local.invalid");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-only-key");
    vi.stubEnv("TIME_BLOCKS_BUCKET", "private-test");

    await mutateTimeBlocks("user_owner", {
      type: "save-schedule",
      schedule: { startTime: "07:00", activities: [{ name: "School", hours: 1 }] },
    });

    expect(bucket.remove).not.toHaveBeenCalled();
  });
});
