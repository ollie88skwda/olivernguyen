import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { applyTimeBlocksAction, emptyTimeBlocks, normalizeSchedule } from "./model";
import { TimeBlocksPage } from "./TimeBlocksPage";

const schedule = normalizeSchedule({
  startTime: "07:00",
  activities: [{ name: "Writing", hours: 1 }],
});

function expiredRun() {
  const startedAt = new Date(Date.now() - 60 * 60 * 1000 - 5_000);
  return applyTimeBlocksAction(
    { ...emptyTimeBlocks(), schedule },
    { type: "start-run", timeZone: "UTC" },
    startedAt,
  );
}

afterEach(() => cleanup());

describe("TimeBlocksPage", () => {
  it("shows an in-app alert when the saved focus hour has ended and requires confirmation", async () => {
    const initial = expiredRun();
    let latest = initial;
    const request = vi.fn(async (_path, options) => {
      if (!options) return { timeBlocks: latest };
      const action = JSON.parse(options.body);
      latest = applyTimeBlocksAction(latest, action, new Date());
      return { timeBlocks: latest };
    });

    render(<TimeBlocksPage request={request} />);
    const alert = await screen.findByRole("status");
    expect(alert.textContent).toContain("Hour ended");
    expect(alert.textContent).toContain("Did you complete Writing, hour 1?");
    expect(screen.getByRole("button", { name: "Confirm this hour" })).toBeEnabled();

    fireEvent.click(screen.getByRole("button", { name: "Confirm this hour" }));
    await waitFor(() => expect(screen.getByRole("heading", { name: "Plan complete" })).toBeTruthy());
    expect(latest.run.slots[0].status).toBe("completed");
    expect(request).toHaveBeenLastCalledWith("/api/time-blocks", expect.objectContaining({ method: "POST" }));
  });
});
