/* Calendar-correct age maths for /mum.
 *
 * Everything here is pure and clock-injected (callers pass `now`) so the whole
 * joke can be unit tested — see age.test.js. Units are walked biggest first and
 * borrowed from the real calendar, never from an assumed 30-day month, so leap
 * years and short months come out exact.
 *
 * Her birth time is unknown, so the clock starts at local midnight. Nothing is
 * hard-coded to "50": the year rolls over by itself every 20 August. */

export const BIRTH = new Date(1976, 7, 20, 0, 0, 0); // 20 August 1976, local midnight
export const MILESTONE = new Date(2026, 7, 20, 0, 0, 0); // the morning she turns 50

// Day 0 of a month is the last day of the month before it, so this is the real
// length of the month preceding (year, monthIndex).
const daysInPreviousMonth = (year, monthIndex) => new Date(year, monthIndex, 0).getDate();

/** Whole years/months/days/hours/minutes/seconds between two local dates. */
export function ageParts(from, to) {
  let y = to.getFullYear() - from.getFullYear();
  let m = to.getMonth() - from.getMonth();
  let d = to.getDate() - from.getDate();
  let H = to.getHours() - from.getHours();
  let M = to.getMinutes() - from.getMinutes();
  let S = to.getSeconds() - from.getSeconds();

  if (S < 0) {
    S += 60;
    M--;
  }
  if (M < 0) {
    M += 60;
    H--;
  }
  if (H < 0) {
    H += 24;
    d--;
  }

  // Borrow whole calendar months, walking backwards from `to`. A loop rather
  // than a single step because one short month is not always enough to cover
  // the shortfall (31 January to 1 March needs two).
  let year = to.getFullYear();
  let month = to.getMonth();
  while (d < 0) {
    m--;
    d += daysInPreviousMonth(year, month);
    month--;
    if (month < 0) {
      month = 11;
      year--;
    }
  }
  while (m < 0) {
    m += 12;
    y--;
  }

  return { y, m, d, H, M, S };
}

const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

/** "a, b, c and d" */
const joinParts = (list) =>
  list.length < 2 ? list.join("") : `${list.slice(0, -1).join(", ")} and ${list[list.length - 1]}`;

const UNITS = [
  ["y", "year"],
  ["m", "month"],
  ["d", "day"],
  ["H", "hour"],
  ["M", "minute"],
  ["S", "second"],
];

const spell = (parts, keys) => keys.map(([key, word]) => plural(parts[key], word));

/** "50 years, 3 months, 7 days, 5 hours, 4 minutes and 2 seconds old." */
export function ageSentence(parts) {
  return `${joinParts(spell(parts, UNITS))} old.`;
}

/** Countdown drops units that have not started yet: "9 days, 4 hours … to go." */
export function countdownSentence(parts) {
  const firstUsed = UNITS.findIndex(([key]) => parts[key] > 0);
  const used = firstUsed === -1 ? UNITS.slice(-1) : UNITS.slice(firstUsed);
  return `${joinParts(spell(parts, used))} until the big one.`;
}

export function ordinal(n) {
  const teen = n % 100;
  if (teen >= 11 && teen <= 13) return `${n}th`;
  return `${n}${["th", "st", "nd", "rd"][n % 10] || "th"}`;
}

/**
 * What the page should say right now. Before 20 August 2026 it counts down
 * rather than claim an age she has not reached; on and after it, it counts up
 * and re-reads the year off the calendar, so 2027 becomes 51 unaided.
 */
export function ageState(now) {
  if (now < MILESTONE) {
    const parts = ageParts(now, MILESTONE);
    return {
      mode: "countdown",
      parts,
      heading: "Almost\n50",
      lead: "to be precise, there is",
      sentence: countdownSentence(parts),
    };
  }
  const parts = ageParts(BIRTH, now);
  return {
    mode: "age",
    parts,
    heading: `Happy ${ordinal(parts.y)}\nBirthday`,
    lead: "to be precise, you are",
    sentence: ageSentence(parts),
  };
}
