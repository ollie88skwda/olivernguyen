import { act, renderHook, waitFor } from "@testing-library/react";

import { apiFetch } from "./api";
import { useOwnerAccess } from "./useOwnerAccess";

vi.mock("./api", () => ({ apiFetch: vi.fn() }));

describe("useOwnerAccess", () => {
  it("invalidates the previous authorization when Clerk changes identity", async () => {
    let resolveFirst;
    let resolveSecond;
    apiFetch
      .mockReturnValueOnce(new Promise((resolve) => { resolveFirst = resolve; }))
      .mockReturnValueOnce(new Promise((resolve) => { resolveSecond = resolve; }));

    const { result, rerender } = renderHook(
      ({ userId }) => useOwnerAccess(true, userId),
      { initialProps: { userId: "user_owner" } },
    );

    await waitFor(() => expect(apiFetch).toHaveBeenCalledTimes(1));

    rerender({ userId: "user_other" });
    expect(result.current.status).toBe("loading");

    resolveFirst({ authorized: true });
    await act(async () => {});
    expect(result.current.status).toBe("loading");

    resolveSecond({ authorized: true });
    await waitFor(() => expect(result.current.status).toBe("authorized"));
    expect(apiFetch).toHaveBeenCalledTimes(2);
  });
});
