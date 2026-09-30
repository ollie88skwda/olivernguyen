import { describe, expect, it } from "vitest";
import {
  HOUR_MS,
  applyTimeBlocksAction,
  emptyTimeBlocks,
  focusState,
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

describe("private time-block schedule model", () => {
  it("requires whole-hour counts and a projected end before midnight", () => {
    expect(() => normalizeSchedule({
      startTime: "07:00", activities: [{ name: "School", hours: 1.5 }],
    })).toThrow("whole number of hours");
    expect(() => normalizeSchedule({
      startTime: "22:00", activities: [{ name: "Study", hours: 2 }],
    })).toThrow("past midnight");
  });

  it("expands a multi-hour activity into separate sessions", () => {
    const document = start();
    expect(document.run.slots.map(({ activityName, activityHour }) => [activityName, activityHour]))
      .toEqual([["School", 1], ["School", 2], ["Robotics", 1]]);
    expect(document.run.slots[0]).toMatchObject({
      status: "active",
      endsAt: "2026-10-01T15:00:00.000Z",
    });
  });

  it("does not count an hour before its deadline and makes confirm idempotent", () => {
    const document = start();
    const first = document.run.slots[0];
    expect(() => applyTimeBlocksAction(document, {
      type: "confirm-session", sessionId: first.id,
    }, "2026-10-01T14:59:59.999Z")).toThrow("not over yet");

    const completed = applyTimeBlocksAction(document, {
      type: "confirm-session", sessionId: first.id,
    }, "2026-10-01T15:00:00.000Z");
    expect(completed.run.slots[0]).toMatchObject({ status: "completed", completedAt: "2026-10-01T15:00:00.000Z" });
    expect(completed.run.slots[1].status).toBe("pending");
    expect(focusState(completed.run, Date.parse("2026-10-01T15:00:00.000Z"))).toBe("due");
    expect(applyTimeBlocksAction(completed, {
      type: "confirm-session", sessionId: first.id,
    }, "2026-10-01T15:01:00.000Z")).toEqual(completed);
  });

  it("starts the next hour only on request and reanchors estimates to actual starts", () => {
    const firstRun = start();
    const first = firstRun.run.slots[0];
    const completed = applyTimeBlocksAction(firstRun, {
      type: "confirm-session", sessionId: first.id,
    }, "2026-10-01T15:00:00.000Z");
    const next = completed.run.slots[1];
    const running = applyTimeBlocksAction(completed, {
      type: "start-session", sessionId: next.id,
    }, "2026-10-01T15:12:00.000Z");
    expect(running.run.slots[1]).toMatchObject({
      status: "active",
      startedAt: "2026-10-01T15:12:00.000Z",
      endsAt: "2026-10-01T16:12:00.000Z",
    });
    expect(running.run.slots[2].plannedStartAt).toBe("2026-10-01T16:12:00.000Z");
    expect(HOUR_MS).toBe(3_600_000);
  });

  it("records an early stop as skipped, never fractional completion", () => {
    const document = start();
    const first = document.run.slots[0];
    const skipped = applyTimeBlocksAction(document, {
      type: "skip-session", sessionId: first.id,
    }, "2026-10-01T14:20:00.000Z");
    expect(skipped.run.slots[0]).toMatchObject({ status: "skipped", completedAt: null });
    expect(skipped.run.status).toBe("waiting");
    expect(focusState(skipped.run, Date.parse("2026-10-01T14:20:00.000Z"))).toBe("scheduled");
    expect(() => applyTimeBlocksAction(skipped, {
      type: "skip-session", sessionId: skipped.run.slots[1].id,
    }, "2026-10-01T14:20:00.000Z")).toThrow("not due yet");
    expect(() => applyTimeBlocksAction(skipped, {
      type: "start-session", sessionId: skipped.run.slots[1].id,
    }, "2026-10-01T14:20:00.000Z")).toThrow("not due yet");
    expect(focusState(skipped.run, Date.parse("2026-10-01T15:00:00.000Z"))).toBe("due");
  });

  it("allows the owner to skip a missed next hour without auto-advancing it", () => {
    const firstRun = start();
    const first = firstRun.run.slots[0];
    const completed = applyTimeBlocksAction(firstRun, {
      type: "confirm-session", sessionId: first.id,
    }, "2026-10-01T15:00:00.000Z");
    const missed = completed.run.slots[1];
    const skipped = applyTimeBlocksAction(completed, {
      type: "skip-session", sessionId: missed.id,
    }, "2026-10-01T17:30:00.000Z");
    expect(skipped.run.slots[1]).toMatchObject({ status: "skipped", completedAt: null });
    expect(skipped.run.activeSessionId).toBeNull();
    expect(skipped.run.slots[2].status).toBe("pending");
    expect(focusState(skipped.run, Date.parse("2026-10-01T17:30:00.000Z"))).toBe("due");
  });

  it("stores the run date in the selected local time zone", () => {
    const document = applyTimeBlocksAction(
      { ...emptyTimeBlocks(), schedule: exampleSchedule() },
      { type: "start-run", timeZone: "America/Los_Angeles" },
      "2026-01-01T02:00:00.000Z",
    );
    expect(document.run.dateKey).toBe("2025-12-31");
    expect(document.run.timeZone).toBe("America/Los_Angeles");
  });
});
