import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
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

function activeRun() {
  return applyTimeBlocksAction(
    { ...emptyTimeBlocks(), schedule },
    { type: "start-run", timeZone: "UTC" },
    new Date(),
  );
}

beforeEach(() => {
  vi.spyOn(window, "scrollTo").mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

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

  it("uses the response-time clock when a session starts", async () => {
    const initial = { ...emptyTimeBlocks(), schedule };
    const firstRenderNow = Date.now();
    vi.spyOn(Date, "now")
      .mockReturnValueOnce(firstRenderNow)
      .mockReturnValue(firstRenderNow + 1_000);
    const request = vi.fn(async (_path, options) => {
      if (!options) return { timeBlocks: initial };
      return {
        timeBlocks: applyTimeBlocksAction(
          initial,
          JSON.parse(options.body),
          new Date(firstRenderNow + 1_000),
        ),
      };
    });

    render(<TimeBlocksPage request={request} />);
    fireEvent.click(await screen.findByRole("button", { name: "Start today’s plan" }));
    expect(await screen.findByLabelText("60:00 remaining")).toBeTruthy();
  });

  it("shows the save in progress until the schedule request finishes", async () => {
    const initial = { ...emptyTimeBlocks(), schedule };
    let resolveSave;
    const request = vi.fn((_path, options) => {
      if (!options) return Promise.resolve({ timeBlocks: initial });
      return new Promise((resolve) => { resolveSave = resolve; });
    });

    render(<TimeBlocksPage request={request} />);
    fireEvent.click(await screen.findByRole("button", { name: "Save schedule" }));
    expect(screen.getByRole("button", { name: "Saving…" })).toBeDisabled();

    await act(async () => {
      resolveSave({ timeBlocks: initial });
    });
    expect(await screen.findByRole("button", { name: "Save schedule" })).toBeEnabled();
  });

  it("associates and focuses validation after a save attempt", async () => {
    const initial = { ...emptyTimeBlocks(), schedule };
    const request = vi.fn(async () => ({ timeBlocks: initial }));

    render(<TimeBlocksPage request={request} />);
    const activity = await screen.findByRole("textbox", { name: "Activity 1" });
    fireEvent.change(activity, { target: { value: "" } });
    expect(activity).toHaveAttribute("aria-invalid", "true");
    expect(activity).toHaveAttribute("aria-describedby", "time-blocks-validation");

    fireEvent.click(screen.getByRole("button", { name: "Save schedule" }));
    expect(screen.getByRole("alert")).toHaveFocus();
    expect(request).toHaveBeenCalledTimes(1);
  });

  it("warns before unloading or leaving a run with unsaved schedule edits", async () => {
    const initial = activeRun();
    const request = vi.fn(async () => ({ timeBlocks: initial }));
    const confirm = vi.spyOn(window, "confirm");

    render(<TimeBlocksPage request={request} />);
    fireEvent.click(await screen.findByRole("button", { name: "Edit next schedule" }));
    const activity = screen.getByRole("textbox", { name: "Activity 1" });
    fireEvent.change(activity, { target: { value: "Changed" } });

    const unload = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(unload);
    expect(unload.defaultPrevented).toBe(true);

    confirm.mockReturnValueOnce(false);
    fireEvent.click(screen.getByRole("button", { name: "Back to current run" }));
    expect(screen.getByRole("heading", { name: "Your schedule" })).toBeTruthy();
    expect(activity).toHaveValue("Changed");

    confirm.mockReturnValueOnce(true);
    fireEvent.click(screen.getByRole("button", { name: "Back to current run" }));
    expect(screen.getByRole("heading", { name: "Writing" })).toBeTruthy();
  });
});
