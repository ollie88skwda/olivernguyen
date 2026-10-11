import { describe, expect, it } from "vitest";
import {
  HOUR_MS,
  applyTimeBlocksAction,
  elapsedMilliseconds,
  emptyTimeBlocks,
  normalizeSchedule,
} from "./model.mjs";

const exampleSchedule = () => normalizeSchedule({
  startTime: "07:00",
  activities: [
    { name: "School", hours: 2 },
    { name: "Robotics", hours: 1 },
  ],
});

function start(schedule = exampleSchedule(), now = "2026-10-01T14:00:00.000Z") {
  return applyTimeBlocksAction(
    { ...emptyTimeBlocks(), schedule },
    { type: "start-run", timeZone: "America/Los_Angeles" },
    now,
  );
}

const toggle = (document, slot, now) => applyTimeBlocksAction(document, {
  type: "toggle-session", sessionId: slot.id,
}, now);

describe("private time-block timers", () => {
  it("preserves the 24-hour schedule limit and expands activities to planned blocks", () => {
    expect(() => normalizeSchedule({
      startTime: "07:00", activities: [{ name: "School", hours: 1.5 }],
    })).toThrow("whole number of hours");
    expect(() => normalizeSchedule({
      startTime: "22:00", activities: [{ name: "Study", hours: 2 }],
    })).toThrow("past midnight");
    const document = start();
    expect(document.run.slots.map(({ activityName, activityHour }) => [activityName, activityHour]))
      .toEqual([["School", 1], ["School", 2], ["Robotics", 1]]);
    expect(document.run.slots.map((slot) => slot.plannedStartAt)).toEqual([
      "2026-10-01T14:00:00.000Z",
      "2026-10-01T15:00:00.000Z",
      "2026-10-01T16:00:00.000Z",
    ]);
    expect(document.run.slots.every((slot) => slot.status === "pending")).toBe(true);
  });

  it("records actual start on the first tap and finish on the next tap without changing planned times", () => {
    const initial = start();
    const slot = initial.run.slots[0];
    const plannedTimes = initial.run.slots.map((item) => item.plannedStartAt);
    const running = toggle(initial, slot, "2026-10-01T14:12:00.000Z");
    expect(running.run.slots[0]).toMatchObject({ status: "active", startedAt: "2026-10-01T14:12:00.000Z" });
    const finished = toggle(running, slot, "2026-10-01T14:40:30.000Z");
    expect(finished.run.slots[0]).toMatchObject({ status: "completed", completedAt: "2026-10-01T14:40:30.000Z" });
    expect(finished.run.slots.map((item) => item.plannedStartAt)).toEqual(plannedTimes);
    expect(elapsedMilliseconds(finished.run.slots[0], Date.parse("2030-01-01"))).toBe(28 * 60_000 + 30_000);
  });

  it("allows different blocks to run simultaneously", () => {
    const initial = start();
    const first = initial.run.slots[0];
    const second = initial.run.slots[1];
    const oneRunning = toggle(initial, first, "2026-10-01T14:00:00.000Z");
    const bothRunning = toggle(oneRunning, second, "2026-10-01T15:05:00.000Z");
    expect(bothRunning.run.slots.map((slot) => slot.status)).toEqual(["active", "active", "pending"]);
    expect(bothRunning.run.slots[0].startedAt).toBe("2026-10-01T14:00:00.000Z");
    expect(bothRunning.run.slots[1].startedAt).toBe("2026-10-01T15:05:00.000Z");
  });

  it("calculates elapsed time from persisted timestamps after reload and across midnight", () => {
    const initial = start(undefined, "2026-10-01T23:40:00.000Z");
    const started = toggle(initial, initial.run.slots[0], "2026-10-01T23:45:00.000Z");
    const reloaded = JSON.parse(JSON.stringify(started));
    expect(reloaded.run.slots[0].startedAt).toBe("2026-10-01T23:45:00.000Z");
    expect(elapsedMilliseconds(reloaded.run.slots[0], Date.parse("2026-10-02T00:15:00.000Z"))).toBe(30 * 60_000);
    expect(reloaded.run.dateKey).toBe("2026-10-01");
  });

  it("keeps completed timers stable and rejects starts before the planned time", () => {
    const initial = start();
    expect(() => toggle(initial, initial.run.slots[1], "2026-10-01T14:59:59.999Z")).toThrow("not due yet");
    const finished = toggle(toggle(initial, initial.run.slots[0], "2026-10-01T14:00:00.000Z"), initial.run.slots[0], "2026-10-01T14:30:00.000Z");
    expect(finished.run.slots[0].status).toBe("completed");
    expect(elapsedMilliseconds(finished.run.slots[0], Date.parse("2026-10-02T00:00:00Z"))).toBe(30 * 60_000);
    expect(HOUR_MS).toBe(3_600_000);
  });

  it("preserves the run date in its selected local time zone", () => {
    const document = start(exampleSchedule(), "2026-01-01T02:00:00.000Z");
    expect(document.run.dateKey).toBe("2025-12-31");
    expect(document.run.timeZone).toBe("America/Los_Angeles");
  });
});
