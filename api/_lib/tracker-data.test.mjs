import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../_lib/auth.mjs", () => ({ requireOwnerSession: vi.fn() }));
vi.mock("../_lib/tracker.mjs", () => ({
  TrackerError: class TrackerError extends Error {},
  mutateTracker: vi.fn(),
  readTracker: vi.fn(),
}));

import { requireOwnerSession } from "./auth.mjs";
import { mutateTracker, readTracker } from "./tracker.mjs";
import handler from "../tracker/data.mjs";

function response() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe("tracker data boundary", () => {
  it("checks owner access without reading tracker storage", async () => {
    requireOwnerSession.mockImplementation(async (req) => {
      req.userId = "user_owner";
      return true;
    });
    readTracker.mockRejectedValue(new Error("storage unavailable"));

    const res = response();
    await handler({ method: "GET", headers: {}, query: { access: "1" } }, res);

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ authorized: true });
    expect(readTracker).not.toHaveBeenCalled();
    expect(mutateTracker).not.toHaveBeenCalled();
  });

  it("performs no read or write when owner authorization fails", async () => {
    requireOwnerSession.mockImplementation(async (_req, res) => {
      res.status(403).json({ error: "forbidden" });
      return false;
    });

    for (const method of ["GET", "POST"]) {
      const req = { method, headers: {}, body: { type: "create-class", name: "Private" } };
      const res = response();
      await handler(req, res);
      expect(res.statusCode).toBe(403);
    }
    expect(readTracker).not.toHaveBeenCalled();
    expect(mutateTracker).not.toHaveBeenCalled();
  });

  it("reads and mutates only the identity attached by owner authorization", async () => {
    const existing = { version: 1, classes: [] };
    const changed = { version: 1, classes: [{ id: "class-1", name: "Physics", notes: [] }] };
    requireOwnerSession.mockImplementation(async (req) => {
      req.userId = "user_owner";
      return true;
    });
    readTracker.mockResolvedValue(existing);
    mutateTracker.mockResolvedValue({ tracker: changed, selectedClassId: "class-1" });

    const getRes = response();
    await handler({ method: "GET", headers: {} }, getRes);
    expect(readTracker).toHaveBeenCalledWith("user_owner");
    expect(getRes.body).toEqual({ tracker: existing });

    const postRes = response();
    const action = { type: "create-class", name: "Physics" };
    await handler({ method: "POST", headers: {}, body: action }, postRes);
    expect(mutateTracker).toHaveBeenCalledWith("user_owner", action);
    expect(postRes.body).toMatchObject({ tracker: changed, selectedClassId: "class-1" });
  });
});
