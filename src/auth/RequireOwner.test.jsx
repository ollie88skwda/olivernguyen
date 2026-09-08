import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { useAuth } from "@clerk/react";

import { useOwnerAccess } from "./useOwnerAccess";
import RequireOwner from "./RequireOwner";

vi.mock("@clerk/react", () => ({ useAuth: vi.fn() }));
vi.mock("./useOwnerAccess", () => ({ useOwnerAccess: vi.fn() }));

function renderGate() {
  return render(
    <MemoryRouter initialEntries={["/tracker"]}>
      <RequireOwner><p>owner tracker</p></RequireOwner>
    </MemoryRouter>,
  );
}

describe("RequireOwner", () => {
  const original = process.env.REACT_APP_CLERK_PUBLISHABLE_KEY;

  beforeEach(() => {
    process.env.REACT_APP_CLERK_PUBLISHABLE_KEY = "pk_test_x";
    useAuth.mockReturnValue({ isLoaded: true, isSignedIn: true });
  });

  afterEach(() => {
    if (original === undefined) delete process.env.REACT_APP_CLERK_PUBLISHABLE_KEY;
    else process.env.REACT_APP_CLERK_PUBLISHABLE_KEY = original;
  });

  it("shows a useful loading state while authorization is checked", () => {
    useOwnerAccess.mockReturnValue({ status: "loading", error: null });
    renderGate();
    expect(screen.getByLabelText("Checking tracker access")).toHaveAttribute("aria-busy", "true");
    expect(screen.queryByText("owner tracker")).not.toBeInTheDocument();
  });

  it("shows an unauthorized state to a different signed-in account", () => {
    useOwnerAccess.mockReturnValue({ status: "unauthorized", error: null });
    renderGate();
    expect(screen.getByRole("heading", { name: "Private tracker" })).toBeInTheDocument();
    expect(screen.getByText(/not the configured owner/i)).toBeInTheDocument();
    expect(screen.queryByText("owner tracker")).not.toBeInTheDocument();
  });

  it("shows the tracker only after owner authorization", () => {
    useOwnerAccess.mockReturnValue({ status: "authorized", error: null });
    renderGate();
    expect(screen.getByText("owner tracker")).toBeInTheDocument();
  });

  it("surfaces access errors with a retry action", () => {
    useOwnerAccess.mockReturnValue({ status: "error", error: "Service unavailable" });
    renderGate();
    expect(screen.getByRole("heading", { name: "Access check failed" })).toBeInTheDocument();
    expect(screen.getByText("Service unavailable")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
  });
});
