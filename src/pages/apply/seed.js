import { SCHOOLS, PROGRAMS, GENERATED_AT } from './data.generated';

// Canonical starting doc for /apply: Supabase bootstrap row and offline fallback.
//
// Same discipline as /major's seed.js. Researched facts are encoded with their sources.
// Anything that would be Ollie's opinion and has not been stated is an explicit
// 'TODO — Ollie' placeholder rather than a plausible guess, and anything nobody has
// looked up yet gets a wide range so it reads as unknown rather than mediocre.
//
// Factory, not a shared literal: callers get their own copy to mutate, and updatedAt is
// current at the moment the doc is created.

// Weights are never typed. computeAHP derives them from these head-to-head answers, and
// the answers below encode two decisions Ollie has actually made:
//
//   1. Kinesiology is a nice-to-have, not a co-equal criterion. Rather than hardcoding a
//      6% weight, which would break the "you never type a weight" premise the whole S2
//      section rests on, it is seeded to lose about 5:1 to everything else. computeAHP
//      then derives ~6% on its own, and re-duelling it in S2 moves it like any other.
//   2. Special-program access edges out raw program strength, because the stated goal is
//      an application that stands out rather than the highest-ranked department.
//
// Derived result: programs .375, strength .313, undecided .250, kines .062.
const SEEDED_DUELS = {
  'programs|kines': 6,
  'strength|kines': 5,
  'undecided|kines': 4,
  'programs|strength': 1.2,
  'programs|undecided': 1.5,
  'strength|undecided': 1.25,
};

export function createSeed() {
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    researchGeneratedAt: GENERATED_AT,

    // The two dates that actually bind. Nov 1 comes first because ED is live, so the
    // calendar in S5 treats it as the real deadline rather than the UC date.
    deadlines: {
      earlyBinding: '2026-11-01',
      uc: '2026-11-30',
    },

    // Stated in the planning conversation, recorded so the page can show what it was told
    // rather than what it assumed.
    stance: {
      business: 'out',
      businessQuote: "I'll do business outside school",
      cost: 'not a constraint',
      ed: 'willing to spend it on the right program',
      hardFilters: 'none — all criteria stay soft and toggleable',
      recordedAt: '2026-07-29',
    },

    criteria: [
      {
        id: 'programs',
        label: 'Special program access',
        blurb:
          'Programs you can only get at this school, weighted towards the ones whose door closes when high school ends.',
        direction: 'max',
      },
      {
        id: 'strength',
        label: 'Program strength',
        blurb: 'How good the actual engineering department is for what you want to study.',
        direction: 'max',
      },
      {
        id: 'undecided',
        label: 'Undecided friendly',
        blurb:
          'Whether you can start without declaring, and how hard it is to move once you are in.',
        direction: 'max',
      },
      {
        id: 'kines',
        label: 'Kinesiology access',
        blurb: 'Whether kinesiology or exercise science exists here, as a major or a minor.',
        direction: 'max',
      },
    ],

    pairwise: SEEDED_DUELS,

    // Cost and business access were dropped as criteria by explicit decision. Both are
    // still researched and still displayed on each school's dossier, because they are
    // useful to see; they simply carry no weight and never move a ranking.
    droppedCriteria: [
      { id: 'cost', reason: 'Not a constraint. Still shown, never scored.' },
      { id: 'business', reason: "Business happens outside school. Still shown, never scored." },
    ],

    schools: SCHOOLS,
    programs: PROGRAMS,

    // There is deliberately no `profile` key here.
    //
    // This document is stored in Supabase and read with the anon key, which ships in the
    // JavaScript bundle, and /apply is planned to become a public page. A GPA and a test
    // score have no business in it. Personal fields live in localStorage instead, via
    // profile.js, and never touch the shared row. See stripProfile() for the cleanup that
    // removes them from rows written before this rule existed.

    settings: {
      // How much one underlying "how strong is this application" factor drives every
      // decision at once. A judgment call, labelled as one in the UI.
      rho: 0.6,
      // Supplemental essays you are willing to write. null means unbounded, which makes
      // the marginal-value curve in S3 show where it flattens instead of stopping early.
      effortBudget: null,
      effortBudgetNote: 'TODO — Ollie: how many supplemental essays are you actually willing to write?',
      allowEd: true,
    },

    unknowns: [
      {
        id: 'u-eng-admit-rates',
        question:
          'Which schools publish an engineering-specific admit rate, and how far below the campus rate is it?',
        criteria: [],
        effort: '~3 hrs',
        answer: null,
      },
      {
        id: 'u-uc-no-ie',
        question:
          'Four of the five UCs appear to have no industrial or systems engineering. Does that change which UCs are worth an application?',
        criteria: ['strength', 'undecided'],
        effort: '~1 hr',
        answer: null,
      },
      {
        id: 'u-ed-target',
        question:
          'Where does the single Early Decision go, now that the flagship dual-degree programs turn out to be joinable after first year?',
        criteria: ['programs'],
        effort: '~2 hrs',
        answer: null,
      },
    ],

    assumptions: [
      {
        id: 'a-senior-only',
        claim: 'The flagship engineering-and-business dual degrees are senior-only',
        status: 'refuted',
        test: 'Read each program page for an explicit current-student pathway',
        note:
          'Refuted 2026-07-29. Penn M&T, Berkeley M.E.T., Lehigh IBE, UT Canfield, Michigan Ross and UW Foster all take applications from enrolled students.',
      },
      {
        id: 'a-campus-rate-ok',
        claim: 'A campus admit rate is a usable stand-in for an engineering admit rate',
        status: 'untested',
        test: 'Compare published engineering rates against campus rates where both exist',
      },
      {
        id: 'a-list-not-top-heavy',
        claim: 'The list has enough likely-tier schools to make a shut-out unlikely',
        status: 'untested',
        test: 'Run portfolioOutcome once real admit probabilities exist',
      },
    ],

    premortem: [],

    evidence: [
      {
        date: '2026-07-29',
        source: 'Phase A research sweep',
        url: null,
        criterion: null,
        school: null,
        delta: null,
        note: `${SCHOOLS.length} schools and ${PROGRAMS.length} programs researched against primary .edu pages, every claim carrying its source URL.`,
      },
      {
        date: '2026-07-29',
        source: 'Michigan Ross admissions, second fetch',
        url: 'https://michiganross.umich.edu/undergraduate/bba/admissions/UM-applicants',
        criterion: 'programs',
        school: null,
        delta: null,
        note:
          'Cross-Campus Transfer confirmed: enrolled U-M students may apply in their freshman or sophomore year, roughly 100 per year. Preferred Admission is the main door, not the only one.',
      },
    ],
  };
}

export default createSeed;
