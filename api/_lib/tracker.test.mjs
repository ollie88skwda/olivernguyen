import { describe, expect, it } from "vitest";

import { applyTrackerAction, emptyTracker, trackerPath, TrackerError } from "./tracker.mjs";

const NOW = "2026-09-01T10:00:00.000Z";

function act(tracker, action) {
  return applyTrackerAction(tracker, action, NOW);
}

describe("tracker behavior", () => {
  it("supports the full class and note lifecycle", () => {
    let result = act(emptyTracker(), { type: "create-class", name: " Physics " });
    const classId = result.selectedClassId;
    expect(result.tracker.classes).toMatchObject([{ id: classId, name: "Physics", notes: [] }]);

    result = act(result.tracker, { type: "rename-class", classId, name: "Mechanics" });
    expect(result.tracker.classes[0].name).toBe("Mechanics");

    result = act(result.tracker, { type: "create-note", classId });
    const noteId = result.selectedNoteId;
    expect(result.tracker.classes[0].notes[0]).toMatchObject({
      id: noteId,
      title: "Untitled note",
      body: "",
    });

    result = act(result.tracker, {
      type: "update-note",
      classId,
      noteId,
      title: " Newton's laws ",
      body: "F = ma",
    });
    expect(result.tracker.classes[0].notes[0]).toMatchObject({
      title: "Newton's laws",
      body: "F = ma",
      updatedAt: NOW,
    });

    result = act(result.tracker, { type: "delete-note", classId, noteId });
    expect(result.tracker.classes[0].notes).toEqual([]);

    result = act(result.tracker, { type: "delete-class", classId });
    expect(result.tracker.classes).toEqual([]);
    expect(result.selectedClassId).toBeNull();
  });

  it("rejects empty names and mutations for missing records", () => {
    expect(() => act(emptyTracker(), { type: "create-class", name: "  " })).toThrow(TrackerError);
    expect(() => act(emptyTracker(), { type: "create-note", classId: "missing" })).toThrow(
      "Class not found",
    );
  });

  it("scopes persisted objects to the authenticated identity", () => {
    expect(trackerPath("user_owner")).not.toBe(trackerPath("user_someone_else"));
    expect(trackerPath("user_owner")).toContain("user_owner");
    expect(trackerPath("user_someone_else")).toContain("user_someone_else");
  });
});
