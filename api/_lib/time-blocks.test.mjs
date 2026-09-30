import { afterEach, describe, expect, it, vi } from "vitest";

const { createClient } = vi.hoisted(() => ({ createClient: vi.fn() }));
vi.mock("@supabase/supabase-js", () => ({ createClient }));

import { readTimeBlocks, timeBlocksPath } from "./time-blocks.mjs";

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
});
