import { beforeEach, describe, expect, it, vi } from "vitest";

const objects = new Map();
const bucket = {
  async download(path) {
    if (!objects.has(path)) return { data: null, error: { status: 404, message: "Object not found" } };
    return { data: { text: async () => objects.get(path) }, error: null };
  },
  async upload(path, content) {
    objects.set(path, content);
    return { error: null };
  },
};

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({ storage: { from: () => bucket } })),
}));

import { readTracker, writeTracker } from "./tracker.mjs";

beforeEach(() => {
  objects.clear();
  process.env.REACT_APP_SUPABASE_URL = "https://storage.example";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role";
});

describe("tracker persistence", () => {
  it("round-trips across fresh reads and keeps identities isolated", async () => {
    const ownerTracker = {
      version: 1,
      classes: [{ id: "physics", name: "Physics", notes: [] }],
    };
    await writeTracker("user_owner", ownerTracker);

    expect(await readTracker("user_owner")).toEqual(ownerTracker);
    expect(await readTracker("user_other")).toEqual({ version: 1, classes: [] });
  });
});
