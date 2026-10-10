import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../api/_lib/auth.mjs", () => ({ requireSession: vi.fn() }));
vi.mock("../../../api/_lib/transfers.mjs", () => ({
  createTransfer: vi.fn(),
  listTransfers: vi.fn(),
  MAX_CONTENT_LENGTH: 100_000,
  removeTransfer: vi.fn(),
}));

import { requireSession } from "../../../api/_lib/auth.mjs";
import { createTransfer, listTransfers, removeTransfer } from "../../../api/_lib/transfers.mjs";
import handler from "../../../api/transfer/[action].mjs";

function response() {
  return {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

beforeEach(() => {
  vi.resetAllMocks();
  requireSession.mockImplementation(async (req) => {
    req.userId = "user_owner";
    return true;
  });
});

describe("transfer API routes", () => {
  it("preserves the list route response and scopes storage to the authenticated identity", async () => {
    const items = [{ id: "transfer-1", content: "private" }];
    listTransfers.mockResolvedValue(items);
    const res = response();

    await handler({ method: "GET", query: { action: "list", userId: "user_attacker" } }, res);

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ items });
    expect(listTransfers).toHaveBeenCalledWith("user_owner");
  });

  it("preserves the create route response and passes only the authenticated identity to storage", async () => {
    const item = { id: "transfer-1", content: "private" };
    createTransfer.mockResolvedValue(item);
    const res = response();

    await handler(
      { method: "POST", query: { action: "create" }, body: { content: "private", userId: "user_attacker" } },
      res,
    );

    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual({ item });
    expect(createTransfer).toHaveBeenCalledWith("user_owner", "private");
  });

  it("preserves the delete route response and scopes removal to the authenticated identity", async () => {
    const res = response();

    await handler({ method: "DELETE", query: { action: "delete", id: "transfer-1" } }, res);

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ ok: true });
    expect(removeTransfer).toHaveBeenCalledWith("user_owner", "transfer-1");
  });

  it("authenticates every route before accessing private storage", async () => {
    requireSession.mockImplementation(async (_req, res) => {
      res.status(403).json({ error: "forbidden" });
      return false;
    });

    for (const [action, method] of [["list", "GET"], ["create", "POST"], ["delete", "DELETE"]]) {
      const res = response();
      await handler({ method, query: { action, id: "transfer-1" }, body: { content: "private" } }, res);
      expect(res.statusCode).toBe(403);
    }

    expect(requireSession).toHaveBeenCalledTimes(3);
    expect(listTransfers).not.toHaveBeenCalled();
    expect(createTransfer).not.toHaveBeenCalled();
    expect(removeTransfer).not.toHaveBeenCalled();
  });

  it("preserves method and input validation responses", async () => {
    const wrongMethod = response();
    await handler({ method: "POST", query: { action: "list" } }, wrongMethod);
    expect(wrongMethod.statusCode).toBe(405);
    expect(requireSession).not.toHaveBeenCalled();

    const missingContent = response();
    await handler({ method: "POST", query: { action: "create" }, body: { content: "  " } }, missingContent);
    expect(missingContent.statusCode).toBe(400);
    expect(missingContent.body).toEqual({ error: "Content is empty" });
    expect(createTransfer).not.toHaveBeenCalled();

    const oversizedContent = response();
    await handler(
      { method: "POST", query: { action: "create" }, body: { content: "x".repeat(100_001) } },
      oversizedContent,
    );
    expect(oversizedContent.statusCode).toBe(400);
    expect(oversizedContent.body).toEqual({ error: "Content exceeds 100000 characters" });
    expect(createTransfer).not.toHaveBeenCalled();

    const missingId = response();
    await handler({ method: "DELETE", query: { action: "delete" } }, missingId);
    expect(missingId.statusCode).toBe(400);
    expect(missingId.body).toEqual({ error: "Missing id" });
    expect(removeTransfer).not.toHaveBeenCalled();
  });

  it("preserves each route's storage failure response", async () => {
    listTransfers.mockRejectedValue(new Error("List storage failed"));
    createTransfer.mockRejectedValue(new Error("Create storage failed"));
    removeTransfer.mockRejectedValue(new Error("Delete storage failed"));

    const listRes = response();
    await handler({ method: "GET", query: { action: "list" } }, listRes);
    expect(listRes.statusCode).toBe(500);
    expect(listRes.body).toEqual({ error: "List storage failed" });

    const createRes = response();
    await handler({ method: "POST", query: { action: "create" }, body: { content: "private" } }, createRes);
    expect(createRes.statusCode).toBe(500);
    expect(createRes.body).toEqual({ error: "Create storage failed" });

    const deleteRes = response();
    await handler({ method: "DELETE", query: { action: "delete", id: "transfer-1" } }, deleteRes);
    expect(deleteRes.statusCode).toBe(500);
    expect(deleteRes.body).toEqual({ error: "Delete storage failed" });
  });
});
