import { beforeEach, describe, expect, it, vi } from "vitest";

const objects = new Map();
const bucket = {
  async download(path) {
    if (!objects.has(path)) return { data: null, error: { status: 404, message: "Object not found" } };
    return { data: { text: async () => objects.get(path) }, error: null };
  },
  async upload(path, content, options = {}) {
    if (options.upsert === false && objects.has(path)) {
      return { error: { status: 409, message: "The resource already exists" } };
    }
    objects.set(path, content);
    return { error: null };
  },
  async remove(paths) {
    paths.forEach((path) => objects.delete(path));
    return { error: null };
  },
};

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({ storage: { from: () => bucket } })),
}));

import { mutateTracker, readTracker, writeTracker } from "./tracker.mjs";

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

  it("returns a recoverable conflict instead of allowing overlapping writes", async () => {
    let releaseRead;
    let readStarted;
    const readGate = new Promise((resolve) => { releaseRead = resolve; });
    const started = new Promise((resolve) => { readStarted = resolve; });
    const originalDownload = bucket.download;
    bucket.download = async (path) => {
      if (path === "_life-tracker/user_owner.json") {
        readStarted();
        await readGate;
      }
      return originalDownload.call(bucket, path);
    };

    try {
      const first = mutateTracker("user_owner", { type: "create-class", name: "Physics" });
      await started;
      const second = mutateTracker("user_owner", { type: "create-class", name: "Chemistry" });

      await expect(second).rejects.toMatchObject({ status: 409 });
      releaseRead();
      await first;

      const saved = await readTracker("user_owner");
      expect(saved.classes).toHaveLength(1);
      expect(saved.classes[0].name).toBe("Physics");
    } finally {
      bucket.download = originalDownload;
    }
  });
});
