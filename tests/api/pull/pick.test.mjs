import { describe, expect, it } from "vitest";
import { isLegalWeekend } from "../../../api/pull/pick.mjs";

describe("pull weekend validation", () => {
  const now = new Date("2026-09-08T12:00:00Z");

  it("accepts only future Saturdays in the offered window", () => {
    expect(isLegalWeekend("2026-09-12", now)).toBe(true);
    expect(isLegalWeekend("2026-09-05", now)).toBe(false);
    expect(isLegalWeekend("2026-09-13", now)).toBe(false);
    expect(isLegalWeekend("2027-01-02", now)).toBe(false);
  });

  it("rejects calendar dates that JavaScript would normalize", () => {
    expect(isLegalWeekend("2026-02-31", now)).toBe(false);
  });
});
