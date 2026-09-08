import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@clerk/backend", () => ({ verifyToken: vi.fn() }));

import { verifyToken } from "@clerk/backend";
import { requireOwnerSession, requireSession } from "./auth.mjs";

function response() {
  return {
    code: null,
    body: null,
    status(code) {
      this.code = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

const request = () => ({ headers: { cookie: "__session=valid-token" } });

const original = {
  secret: process.env.CLERK_SECRET_KEY,
  allowed: process.env.CLERK_ALLOWED_USER_IDS,
  owner: process.env.CLERK_OWNER_USER_ID,
};

beforeEach(() => {
  process.env.CLERK_SECRET_KEY = "sk_test";
  process.env.CLERK_ALLOWED_USER_IDS = "user_owner";
  delete process.env.CLERK_OWNER_USER_ID;
  verifyToken.mockReset();
});

afterEach(() => {
  for (const [key, value] of Object.entries({
    CLERK_SECRET_KEY: original.secret,
    CLERK_ALLOWED_USER_IDS: original.allowed,
    CLERK_OWNER_USER_ID: original.owner,
  })) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

describe("owner authorization", () => {
  it("allows the configured owner and binds storage identity to the verified token", async () => {
    verifyToken.mockResolvedValue({ sub: "user_owner" });
    const req = request();
    const res = response();

    expect(await requireOwnerSession(req, res)).toBe(true);
    expect(req.userId).toBe("user_owner");
    expect(res.code).toBeNull();
  });

  it("denies another valid Clerk account even when the general allowlist includes it", async () => {
    process.env.CLERK_OWNER_USER_ID = "user_owner";
    process.env.CLERK_ALLOWED_USER_IDS = "user_owner,user_collaborator";
    verifyToken.mockResolvedValue({ sub: "user_collaborator" });
    const req = request();
    const res = response();

    expect(await requireOwnerSession(req, res)).toBe(false);
    expect(req.userId).toBeUndefined();
    expect(res.code).toBe(403);
  });

  it("fails closed when the owner is ambiguous", async () => {
    process.env.CLERK_ALLOWED_USER_IDS = "user_one,user_two";
    verifyToken.mockResolvedValue({ sub: "user_one" });
    const req = request();
    const res = response();

    expect(await requireOwnerSession(req, res)).toBe(false);
    expect(res.code).toBe(500);
    expect(res.body.error).toMatch(/exactly one tracker owner/i);
  });

  it("keeps the existing general allowlist behavior", async () => {
    verifyToken.mockResolvedValue({ sub: "user_owner" });
    const req = request();
    const res = response();

    expect(await requireSession(req, res)).toBe(true);
    expect(req.userId).toBe("user_owner");
  });
});
