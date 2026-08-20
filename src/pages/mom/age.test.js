import {
  BIRTH,
  MILESTONE,
  ageParts,
  ageSentence,
  ageState,
  countdownSentence,
  ordinal,
} from "./age";

const at = (y, m, d, H = 0, M = 0, S = 0) => new Date(y, m - 1, d, H, M, S);

// Adding the parts back onto the start date must land exactly on the end date.
// This is the invariant that catches divide-by-30 drift and bad borrowing.
const reconstruct = (from, p) =>
  new Date(
    from.getFullYear() + p.y,
    from.getMonth() + p.m,
    from.getDate() + p.d,
    from.getHours() + p.H,
    from.getMinutes() + p.M,
    from.getSeconds() + p.S
  );

describe("ageParts", () => {
  test("is exactly 50 years and nothing else on the morning of the birthday", () => {
    expect(ageParts(BIRTH, MILESTONE)).toEqual({ y: 50, m: 0, d: 0, H: 0, M: 0, S: 0 });
  });

  test("one second before the birthday she is still 49", () => {
    // Borrows a second, a minute, an hour, a day and a month in one go.
    expect(ageParts(BIRTH, at(2026, 8, 19, 23, 59, 59))).toEqual({
      y: 49,
      m: 11,
      d: 30, // July is 31 days long, and the borrow must use July, not "a month"
      H: 23,
      M: 59,
      S: 59,
    });
  });

  test("a year later it is 51 with nobody touching the code", () => {
    expect(ageParts(BIRTH, at(2027, 8, 20))).toEqual({ y: 51, m: 0, d: 0, H: 0, M: 0, S: 0 });
    expect(ageParts(BIRTH, at(2076, 8, 20)).y).toBe(100);
  });

  test("lands on a leap day itself", () => {
    // 20 Aug 1976 + 47y = 20 Aug 2023, + 6m = 20 Feb 2024, + 9d = 29 Feb 2024.
    expect(ageParts(BIRTH, at(2024, 2, 29, 13, 5, 6))).toEqual({
      y: 47,
      m: 6,
      d: 9,
      H: 13,
      M: 5,
      S: 6,
    });
  });

  test("borrows 29 days in a leap February and 28 in a common one", () => {
    // Same calendar date, one year apart: the answer must differ by the leap day.
    expect(ageParts(BIRTH, at(2024, 3, 5))).toMatchObject({ y: 47, m: 6, d: 14 });
    expect(ageParts(BIRTH, at(2023, 3, 5))).toMatchObject({ y: 46, m: 6, d: 13 });
  });

  test("borrows the real length of the previous month, 31 or 30", () => {
    expect(ageParts(BIRTH, at(2020, 8, 1))).toMatchObject({ y: 43, m: 11, d: 12 }); // July, 31
    expect(ageParts(BIRTH, at(2020, 5, 1))).toMatchObject({ y: 43, m: 8, d: 11 }); // April, 30
    expect(ageParts(BIRTH, at(2021, 3, 1))).toMatchObject({ y: 44, m: 6, d: 9 }); // February, 28
  });

  test("never returns a negative unit, even when one short month cannot cover the gap", () => {
    // 31 January to 1 March has to borrow February and then January.
    const p = ageParts(at(2024, 1, 31), at(2024, 3, 1));
    expect(p).toEqual({ y: 0, m: 0, d: 30, H: 0, M: 0, S: 0 });
  });

  test("every day of a leap year and a common year reconstructs exactly", () => {
    for (const year of [2024, 2025]) {
      for (let day = new Date(year, 0, 1); day.getFullYear() === year; day.setDate(day.getDate() + 1)) {
        const to = new Date(year, day.getMonth(), day.getDate(), 12, 34, 56);
        const p = ageParts(BIRTH, to);
        Object.values(p).forEach((v) => expect(v).toBeGreaterThanOrEqual(0));
        expect(p.m).toBeLessThan(12);
        expect(reconstruct(BIRTH, p).getTime()).toBe(to.getTime());
      }
    }
  });
});

describe("sentences", () => {
  test("reads the way the joke has to read", () => {
    expect(ageSentence({ y: 50, m: 3, d: 7, H: 5, M: 4, S: 2 })).toBe(
      "50 years, 3 months, 7 days, 5 hours, 4 minutes and 2 seconds old."
    );
  });

  test("singular units drop the s", () => {
    expect(ageSentence({ y: 1, m: 1, d: 1, H: 1, M: 1, S: 1 })).toBe(
      "1 year, 1 month, 1 day, 1 hour, 1 minute and 1 second old."
    );
  });

  test("the countdown drops units that have not started", () => {
    expect(countdownSentence({ y: 0, m: 0, d: 9, H: 4, M: 0, S: 1 })).toBe(
      "9 days, 4 hours, 0 minutes and 1 second until the big one."
    );
    expect(countdownSentence({ y: 0, m: 0, d: 0, H: 0, M: 0, S: 1 })).toBe(
      "1 second until the big one."
    );
  });

  test("ordinals", () => {
    expect([50, 51, 52, 53, 61, 111, 112, 113].map(ordinal)).toEqual([
      "50th",
      "51st",
      "52nd",
      "53rd",
      "61st",
      "111th",
      "112th",
      "113th",
    ]);
  });
});

describe("ageState", () => {
  test("counts down before the birthday instead of claiming a wrong age", () => {
    const s = ageState(at(2026, 2, 14, 9, 30, 0));
    expect(s.mode).toBe("countdown");
    expect(s.heading).toContain("Almost");
    expect(s.sentence).toBe("6 months, 5 days, 14 hours, 30 minutes and 0 seconds until the big one.");
  });

  test("one second before midnight is still a countdown", () => {
    expect(ageState(at(2026, 8, 19, 23, 59, 59))).toMatchObject({
      mode: "countdown",
      sentence: "1 second until the big one.",
    });
  });

  test("switches over on the stroke of the birthday", () => {
    const s = ageState(MILESTONE);
    expect(s.mode).toBe("age");
    expect(s.heading).toBe("Happy 50th\nBirthday");
    expect(s.sentence).toBe("50 years, 0 months, 0 days, 0 hours, 0 minutes and 0 seconds old.");
  });

  test("holds the same headline all year, then rolls to 51 on its own", () => {
    expect(ageState(at(2027, 8, 19, 23, 59, 59)).heading).toBe("Happy 50th\nBirthday");
    expect(ageState(at(2027, 8, 20)).heading).toBe("Happy 51st\nBirthday");
  });
});
