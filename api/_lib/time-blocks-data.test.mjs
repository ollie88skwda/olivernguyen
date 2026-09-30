import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../_lib/auth.mjs", () => ({ requireOwnerSession: vi.fn() }));
vi.mock("../_lib/time-blocks.mjs", () => ({
  mutateTimeBlocks: vi.fn(),
  readTimeBlocks: vi.fn(),
}));

import { requireOwnerSession } from "./auth.mjs";
import { mutateTimeBlocks, readTimeBlocks } from "./time-blocks.mjs";
import handler from "../time-blocks.mjs";

function response() {
  return {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

beforeEach(() => vi.resetAllMocks());

describe("time-block API owner boundary", () => {
  it("rejects missing or non-owner access before reading or writing storage", async () => {
    requireOwnerSession.mockImplementation(async (_req, res) => {
      res.status(403).json({ error: "forbidden" });
      return false;
    });
    for (const method of ["GET", "POST"]) {
      const res = response();
      await handler({ method, body: { type: "start-run" } }, res);
      expect(res.statusCode).toBe(403);
    }
    expect(readTimeBlocks).not.toHaveBeenCalled();
    expect(mutateTimeBlocks).not.toHaveBeenCalled();
  });

  it("uses only the identity attached by the server authorization check", async () => {
    const timeBlocks = { version: 1, schedule: { startTime: "07:00", activities: [] }, run: null };
    requireOwnerSession.mockImplementation(async (req) => {
      req.userId = "user_owner";
      return true;
    });
    readTimeBlocks.mockResolvedValue(timeBlocks);
    mutateTimeBlocks.mockResolvedValue(timeBlocks);

    const getRes = response();
    await handler({ method: "GET", query: { userId: "user_attacker" } }, getRes);
    expect(readTimeBlocks).toHaveBeenCalledWith("user_owner");
    expect(getRes.body).toEqual({ timeBlocks });

    const action = { type: "start-run", userId: "user_attacker" };
    const postRes = response();
    await handler({ method: "POST", body: action }, postRes);
    expect(mutateTimeBlocks).toHaveBeenCalledWith("user_owner", action);
    expect(postRes.body).toEqual({ timeBlocks });
  });

  it("allows only GET and POST", async () => {
    const res = response();
    await handler({ method: "DELETE" }, res);
    expect(res.statusCode).toBe(405);
    expect(requireOwnerSession).not.toHaveBeenCalled();
  });
});
