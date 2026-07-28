// Canonical starting doc for /major: Supabase bootstrap row and offline fallback.
//
// Only Ollie's stated interview answers are encoded here. Anything that would be his
// opinion and has not been stated is left as an explicit "TODO — Ollie" placeholder
// rather than a plausible guess.
//
// Factory, not a shared literal: callers get their own copy to mutate, and updatedAt is
// current at the moment the doc is created.
export function createSeed() {
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    deadline: 'TODO — Ollie',

    gutPrior: {
      ie: true,
      se: true,
      me: false,
      quote:
        "i feel like i don't have enough info on each one to make a solid decision but i guess if i were to choose a decision right now, i would choose industrial or systems because mechanical is too saturated in my opinion",
      recordedAt: '2026-07-27',
    },

    // weight is display-only metadata. model.js derives real weights from `pairwise` via
    // computeAHP and never reads this field. Equal split until the S2 duels run.
    criteria: [
      {
        id: 'doors',
        label: 'Doors kept open',
        blurb: 'How many different jobs you could still walk into after this degree.',
        direction: 'max',
        weight: 1 / 7,
        weightMode: 'manual',
      },
      {
        id: 'earnings',
        label: 'Earnings ceiling',
        blurb: 'How much money the top of this path pays.',
        direction: 'max',
        weight: 1 / 7,
        weightMode: 'manual',
      },
      {
        id: 'enjoyment',
        label: 'Day to day enjoyment',
        blurb: 'How much you would like the classes and the day to day work.',
        direction: 'max',
        weight: 1 / 7,
        weightMode: 'manual',
      },
      {
        id: 'workload',
        label: 'Workload cost',
        blurb: 'How much grind the degree costs you. Lower is better here.',
        direction: 'min',
        weight: 1 / 7,
        weightMode: 'manual',
      },
      {
        id: 'employability',
        label: 'Employability',
        blurb: 'How easy it is to get hired straight out of this degree.',
        direction: 'max',
        weight: 1 / 7,
        weightMode: 'manual',
      },
      {
        id: 'schools',
        label: 'Offered at my schools',
        blurb: 'Whether the schools you are applying to actually offer it.',
        direction: 'max',
        weight: 1 / 7,
        weightMode: 'manual',
      },
      {
        id: 'agents',
        label: 'Feeds agents work',
        blurb: 'How much the degree feeds the AI agents work you already do.',
        direction: 'max',
        weight: 1 / 7,
        weightMode: 'manual',
      },
    ],

    // No duels answered yet. computeAHP treats every missing pair as 1, so this is the
    // honest "no information" state: seven equal weights.
    pairwise: {},

    // Every score is the same placeholder range on purpose. Identical columns tie until
    // Ollie enters real numbers in EDIT mode, which is what "no data yet" should look like.
    alternatives: [
      {
        id: 'ie',
        label: 'Industrial Engineering',
        tagline:
          'Optimizing how people, machines and processes run together. Heavy on statistics, probability and operations research.',
        notes: 'TODO — Ollie: your actual read on this major',
        scores: {
          doors: { lo: 4, mid: 5, hi: 6 },
          earnings: { lo: 4, mid: 5, hi: 6 },
          enjoyment: { lo: 4, mid: 5, hi: 6 },
          workload: { lo: 4, mid: 5, hi: 6 },
          employability: { lo: 4, mid: 5, hi: 6 },
          schools: { lo: 4, mid: 5, hi: 6 },
          agents: { lo: 4, mid: 5, hi: 6 },
        },
      },
      {
        id: 'se',
        label: 'Systems Engineering',
        tagline:
          'Designing and running whole systems end to end. Heavy on requirements, architecture, interfaces and integration.',
        notes: 'TODO — Ollie: your actual read on this major',
        scores: {
          doors: { lo: 4, mid: 5, hi: 6 },
          earnings: { lo: 4, mid: 5, hi: 6 },
          enjoyment: { lo: 4, mid: 5, hi: 6 },
          workload: { lo: 4, mid: 5, hi: 6 },
          employability: { lo: 4, mid: 5, hi: 6 },
          schools: { lo: 4, mid: 5, hi: 6 },
          agents: { lo: 4, mid: 5, hi: 6 },
        },
      },
      {
        id: 'me',
        label: 'Mechanical Engineering',
        tagline:
          'Designing physical machines and the parts inside them. Heavy on mechanics, thermodynamics and materials.',
        notes: 'TODO — Ollie: your actual read on this major',
        scores: {
          doors: { lo: 4, mid: 5, hi: 6 },
          earnings: { lo: 4, mid: 5, hi: 6 },
          enjoyment: { lo: 4, mid: 5, hi: 6 },
          workload: { lo: 4, mid: 5, hi: 6 },
          employability: { lo: 4, mid: 5, hi: 6 },
          schools: { lo: 4, mid: 5, hi: 6 },
          agents: { lo: 4, mid: 5, hi: 6 },
        },
      },
    ],

    schools: [
      {
        name: 'TODO — school 1',
        offers: ['ie', 'se', 'me'],
        combined: null,
        switchPolicy: 'TODO — Ollie',
        deadline: 'TODO — Ollie',
        note: 'Placeholder until Ollie sends the real list.',
      },
      {
        name: 'TODO — school 2',
        offers: ['ie', 'me'],
        combined: null,
        switchPolicy: 'TODO — Ollie',
        deadline: 'TODO — Ollie',
        note: 'No standalone Systems Engineering, so the choice here is really between two.',
      },
      {
        name: 'TODO — school 3',
        offers: ['ie', 'se', 'me'],
        combined: { id: 'ise', label: 'ISE', covers: ['ie', 'se'] },
        switchPolicy: 'TODO — Ollie',
        deadline: 'TODO — Ollie',
        note: 'One combined ISE degree, so IE and SE are the same row there.',
      },
    ],

    unknowns: [
      {
        id: 'u-se-standalone',
        question: 'Which of my target schools actually offer standalone Systems Engineering?',
        criteria: ['schools'],
        effort: '~2 hrs',
        answer: null,
      },
      {
        id: 'u-me-saturated',
        question: 'Is Mechanical genuinely saturated, or is that just a feeling?',
        criteria: ['employability'],
        effort: '~1 hr',
        answer: null,
      },
      {
        id: 'u-math-load',
        question: 'Real credit-hour math load: IE vs SE vs ME at one sample school',
        criteria: ['workload'],
        effort: '~3 hrs',
        answer: null,
      },
    ],

    assumptions: [
      {
        id: 'a-me-saturated',
        claim: 'Mechanical is too saturated',
        status: 'untested',
        test: 'NY Fed unemployment by major, 2025 release',
      },
      {
        id: 'a-ie-math-grind',
        claim: 'Industrial means more math grind than Systems',
        status: 'untested',
        test: 'Count required math and stat credits in 3 catalogs',
      },
      {
        id: 'a-se-agents',
        claim: 'Systems keeps me closest to my agents work',
        status: 'untested',
        test: 'Read 10 real job posts, count the software ones',
      },
      {
        id: 'a-all-offered',
        claim: "All three are offered where I'm applying",
        status: 'untested',
        test: "Check each school's ABET program list",
      },
    ],

    premortem: [],

    evidence: [
      {
        date: '2026-07-27',
        source: 'Interview with Claude',
        url: null,
        criterion: null,
        alternative: null,
        delta: null,
        note: 'Recorded starting gut read: IE or SE over ME',
      },
    ],
  };
}

export default createSeed;
