import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { applyTimeBlocksAction, emptyTimeBlocks, normalizeSchedule } from "./model";
import { TimeBlocksPage } from "./TimeBlocksPage";

const schedule = normalizeSchedule({
  startTime: "07:00",
  activities: [{ name: "Writing", hours: 2 }],
});

function dueRun(now = new Date()) {
  return applyTimeBlocksAction(
    { ...emptyTimeBlocks(), schedule },
    { type: "start-run", timeZone: "UTC" },
    new Date(now.getTime() - 2 * 60 * 60 * 1000),
  );
}

beforeEach(() => {
  vi.spyOn(window, "scrollTo").mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("TimeBlocksPage private timers", () => {
  it("starts and finishes each block by tapping its own timer", async () => {
    let latest = dueRun();
    const request = vi.fn(async (_path, options) => {
      if (!options) return { timeBlocks: latest };
      latest = applyTimeBlocksAction(latest, JSON.parse(options.body), new Date());
      return { timeBlocks: latest };
    });
    render(<TimeBlocksPage request={request} />);

    const startButtons = await screen.findAllByRole("button", { name: "Start timer" });
    expect(startButtons).toHaveLength(2);
    fireEvent.click(startButtons[0]);
    expect(await screen.findByRole("button", { name: "Finish timer" })).toBeTruthy();
    expect(latest.run.slots.filter((slot) => slot.status === "active")).toHaveLength(1);

    fireEvent.click(screen.getAllByRole("button", { name: "Start timer" })[0]);
    await waitFor(() => expect(latest.run.slots.filter((slot) => slot.status === "active")).toHaveLength(2));
    fireEvent.click(screen.getAllByRole("button", { name: "Finish timer" })[0]);
    await waitFor(() => expect(latest.run.slots.filter((slot) => slot.status === "completed")).toHaveLength(1));
    expect(latest.run.slots[1].status).toBe("active");
  });

  it("shows elapsed time from the saved start after reloading", async () => {
    const now = Date.now();
    const base = dueRun(new Date(now));
    const slot = base.run.slots[0];
    slot.status = "active";
    slot.startedAt = new Date(now - 75_000).toISOString();
    const request = vi.fn(async () => ({ timeBlocks: JSON.parse(JSON.stringify(base)) }));

    render(<TimeBlocksPage request={request} />);
    expect(await screen.findByLabelText("00:01:15 elapsed")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Finish timer" })).toBeTruthy();
  });
});
