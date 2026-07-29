// The four filters, as predicates over a researched school.
//
// Ollie declined to make any of these hard when asked, so they all default to 'soft' and
// live as a runtime toggle instead of a decision baked into the research. That is why the
// research covers every dimension for every school: tightening a filter in November has to
// be a click, not a reason to go and look everything up again.
//
//   off   ignore the dimension entirely
//   soft  score it, do not exclude anyone (the default)
//   hard  remove schools that fail it, from the board AND from the portfolio maths
//
// A hard filter has to reach the maths, not just the display. Hiding a school from the
// board while still counting its admit probability in P(at least one) would quietly
// produce a number for a list you are not applying to.

const known = (value) => value !== null && value !== undefined;

export const FILTERS = [
  {
    id: 'kines',
    label: 'Kinesiology exists',
    blurb: 'A kinesiology or exercise science major or minor is available.',
    // Unknown passes. Excluding a school because nobody has checked yet would turn a gap
    // in the research into a decision about where to apply.
    test: (school) => !known(school.kines && school.kines.exists) || school.kines.exists === true,
    detail: (school) =>
      !known(school.kines && school.kines.exists)
        ? 'not checked'
        : school.kines.exists
          ? school.kines.majorName || school.kines.minorName || 'available'
          : 'none found',
  },
  {
    id: 'business',
    label: 'Business reachable',
    blurb:
      'Business is open to an engineering student in some form. Scored nowhere, since business happens outside school, but still available as a filter.',
    test: (school) => !known(school.business && school.business.access) || school.business.access !== 'closed',
    detail: (school) =>
      !known(school.business && school.business.access) ? 'not checked' : school.business.access,
  },
  {
    id: 'ieOffered',
    label: 'IE / ISE / Systems offered',
    blurb:
      'A standalone industrial, systems or operations-research engineering degree exists here.',
    test: (school) => {
      const majors = school.majors || {};
      return !!(majors.industrial || majors.systems);
    },
    detail: (school) => {
      const majors = school.majors || {};
      const found = [majors.industrial, majors.systems]
        .filter(Boolean)
        .map((entry) => entry.name || entry)
        .filter(Boolean);
      return found.length ? found.join(' · ') : 'neither offered';
    },
  },
  {
    id: 'switchable',
    label: 'Switching is realistic',
    blurb:
      'You can either start undeclared or move between engineering majors without a fight. Matters more than the entry major when you are undecided.',
    test: (school) => {
      const undeclared = school.undeclaredEntry && school.undeclaredEntry.value;
      const difficulty = school.switchPolicy && school.switchPolicy.difficulty;
      if (undeclared === true) return true;
      if (!known(difficulty)) return true;
      return difficulty !== 'hard';
    },
    detail: (school) => {
      const undeclared = school.undeclaredEntry && school.undeclaredEntry.value;
      const difficulty = (school.switchPolicy && school.switchPolicy.difficulty) || 'unknown';
      return `${undeclared === true ? 'undeclared entry' : 'entry by major'} · switching ${difficulty}`;
    },
  },
];

export const DEFAULT_FILTER_STATE = FILTERS.reduce(
  (state, filter) => ({ ...state, [filter.id]: 'soft' }),
  {}
);

// Schools removed by the currently-hard filters, and why. Returns both halves so the UI can
// show what was cut rather than silently shrinking the board.
export function applyFilters(schools, state = {}) {
  const hard = FILTERS.filter((filter) => state[filter.id] === 'hard');
  if (hard.length === 0) return { kept: schools, cut: [] };

  const kept = [];
  const cut = [];
  for (const school of schools) {
    const failed = hard.filter((filter) => !filter.test(school));
    if (failed.length === 0) kept.push(school);
    else cut.push({ school, failed: failed.map((filter) => filter.id) });
  }
  return { kept, cut };
}

export default FILTERS;
