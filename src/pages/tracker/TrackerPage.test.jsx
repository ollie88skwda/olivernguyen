import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import TrackerPage from "./TrackerPage";

const originalTracker = {
  version: 1,
  classes: [{ id: "physics", name: "Physics", notes: [] }],
};

const changedTracker = {
  version: 1,
  classes: [
    ...originalTracker.classes,
    { id: "chemistry", name: "Chemistry", notes: [] },
  ],
};

const unavailable = new Error("Tracker storage is temporarily unavailable. Try again.");

it("recovers a fresh load after storage comes back", async () => {
  const request = vi.fn()
    .mockRejectedValueOnce(unavailable)
    .mockResolvedValueOnce({ tracker: originalTracker });

  render(<TrackerPage request={request} />);

  expect(await screen.findByRole("alert")).toHaveTextContent(unavailable.message);
  fireEvent.click(screen.getByRole("button", { name: "Try again" }));

  expect(await screen.findByRole("heading", { name: "Physics" })).toBeInTheDocument();
  expect(request).toHaveBeenCalledTimes(2);
});

it("preserves loaded data and can retry work after a long-lived session loses storage", async () => {
  const request = vi.fn()
    .mockResolvedValueOnce({ tracker: originalTracker })
    .mockRejectedValueOnce(unavailable)
    .mockResolvedValueOnce({ tracker: originalTracker })
    .mockResolvedValueOnce({ tracker: changedTracker, selectedClassId: "chemistry" });

  render(<TrackerPage request={request} />);
  expect(await screen.findByRole("heading", { name: "Physics" })).toBeInTheDocument();

  fireEvent.change(screen.getByRole("textbox", { name: "Class name" }), {
    target: { value: "Chemistry" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Add", exact: true }));

  expect(await screen.findByRole("alert")).toHaveTextContent(unavailable.message);
  expect(screen.getByRole("heading", { name: "Physics" })).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "Try again" }));
  await waitFor(() => expect(request).toHaveBeenCalledTimes(3));
  fireEvent.click(screen.getByRole("button", { name: "Add", exact: true }));

  expect(await screen.findByRole("heading", { name: "Chemistry" })).toBeInTheDocument();
  expect(request).toHaveBeenCalledTimes(4);
});
