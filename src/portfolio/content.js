/**
 * src/portfolio/content.js — every word on the portfolio home.
 *
 * Facts only. Each project line comes from that project's own repo docs or
 * Oliver's activities grid (college-apps/profile). Dates are first-commit
 * dates from each repo's git history. Do not add numbers, awards or users
 * that are not in a source.
 */

export const EMAIL = 'oliverdnguyen@gmail.com';

export const meta = {
  name: 'Oliver Nguyen',
  user: 'oliver',
  host: 'studio',
  where: 'Orange County, CA',
  school: 'Senior, Legacy Magnet Academy',
  links: {
    github: 'https://github.com/ollie88skwda',
    linkedin: 'https://www.linkedin.com/in/oliver-nguyen-988b2a2a3/',
    resume: '/resume.pdf',
  },
};

export const intro = {
  kicker: 'designer · engineer · builder',
  lede:
    'I design and build things people actually use: apps, websites, robots, and the tools between them. This site is a terminal you can scroll. Every project below is real and most of them are live.',
  facts: [
    ['focus', 'human-centered design + engineering'],
    ['now', 'building clarity, an app that teaches by letting you teach'],
    ['also', 'VEX lead engineer · Eagle Scout · 200 wpm'],
  ],
};

/**
 * Featured work, newest first. `shot` paths live in public/portfolio/work.
 * `man` sections render like a man page.
 */
export const work = [
  {
    id: 'clarity',
    name: 'clarity',
    kind: 'AI learning app',
    year: '2026',
    started: '2026-09-08',
    status: 'live',
    href: 'https://clarity.olivernguyen.com',
    hrefLabel: 'clarity.olivernguyen.com',
    shot: '/portfolio/work/clarity.webp',
    shotMobile: '/portfolio/work/clarity-mobile.webp',
    synopsis: 'learn it by teaching it',
    description:
      'Bring your notes or a topic and clarity sets up the way you study it: a mock exam, flashcards, a plain explanation, or practice steps. Its core idea is that you explain the material and clarity listens like a curious student, asking one question at a time.',
    design: [
      'Designed the whole brand: the slash mark, the warm paper palette, Geologica type, and a corner-radius scale. This site borrows it, in pink.',
      'Kept the learner in control: clarity never advances, scores, or adds work on its own.',
      'Tested it with rounds of simulated learners, then redesigned the study flow from what broke.',
    ],
    stack: ['Next.js', 'Convex', 'Clerk', 'Cloudflare'],
    stat: ['226', 'commits so far'],
  },
  {
    id: 'hangr',
    name: 'hangr',
    kind: 'company website · Virtual Enterprise',
    year: '2026',
    started: '2026-11-17',
    status: 'live',
    href: 'https://hangrve.vercel.app',
    hrefLabel: 'hangrve.vercel.app',
    shot: '/portfolio/work/hangr.webp',
    synopsis: 'a clothes hanger with built-in steam',
    description:
      'The site for Hangr, my Virtual Enterprise company: a hanger that steams and scents your clothes. Built for the website competition with a cinematic hero, extra-bold type, and a shop.',
    design: [
      'Followed the company brand book as the single visual authority.',
      'Made it readable for both professionals and teenagers, phone first.',
    ],
    stack: ['Next.js', 'Three.js', 'Motion'],
  },
  {
    id: 'everbloom',
    name: 'everbloom',
    kind: 'company website · Virtual Enterprise',
    year: '2026',
    started: '2026-11-01',
    status: 'live',
    href: 'https://everbloom-ve.vercel.app',
    hrefLabel: 'everbloom-ve.vercel.app',
    shot: '/portfolio/work/everbloom.webp',
    synopsis: 'preserved roses, a shop that sways',
    description:
      'A storefront for a preserved-flower company. The hero roses bend in the wind: a WebGL layer sways them from the stems and falls back to a still image when it cannot run.',
    design: [
      'Built an admin page so classmates can edit prices and products without code.',
    ],
    stack: ['Astro', 'WebGL', 'Cloudflare Workers'],
  },
  {
    id: 'synkra',
    name: 'synkra',
    kind: 'group scheduling app',
    year: '2026',
    started: '2026-04-01',
    status: 'prototype',
    href: 'https://synkra.oliverdnguyen.workers.dev',
    hrefLabel: 'synkra.oliverdnguyen.workers.dev',
    shot: '/portfolio/work/synkra.webp',
    synopsis: 'find a time that works for everyone',
    description:
      'Share a link, everyone drags to mark when they are busy, and Synkra shows when the whole group is free. Nobody has to sign up.',
    design: ['Three steps, no accounts: the fewer things to learn, the more people answer.'],
    stack: ['Next.js', 'Supabase', 'Cloudflare'],
  },
  {
    id: 'smart-goals',
    name: 'smart-goals',
    kind: 'goal tracker',
    year: '2026',
    started: '2026-11-09',
    status: 'live',
    href: 'https://smart-goals-sooty.vercel.app/',
    hrefLabel: 'smart-goals-sooty.vercel.app',
    shot: '/portfolio/work/smartgoals.webp',
    synopsis: 'small wins, all day',
    description:
      'Set a few bigger goals, break them into steps, tick them off, and add photos as proof of progress. Phone first, with onboarding that teaches the SMART method.',
    design: ['Styled the daily sheet like a paper checklist with a stamp for each finished step.'],
    stack: ['React', 'Vercel'],
  },
  {
    id: 'consent-lab',
    name: 'consent-lab',
    kind: 'research prototype · human-centered AI',
    year: '2026',
    started: '2026-10-22',
    status: 'prototype',
    href: null,
    shot: '/portfolio/work/consentlab.webp',
    synopsis: 'the AI can do it. should it be allowed to?',
    description:
      'A local lab comparing four ways an AI agent can ask permission before it edits your documents, messages, or calendar. 24 authored cases run against each pattern so you can see what changes, what gets blocked, and what cannot be undone.',
    design: [
      'All cases are synthetic. It measures the designs, not real people.',
    ],
    stack: ['HTML', 'CSS', 'JavaScript', 'Node test runner'],
  },
  {
    id: 'scopecreep',
    name: 'scopecreep',
    kind: 'Chrome extension',
    year: '2026',
    started: '2026-05-23',
    status: 'beta',
    href: 'https://scopecreep-notary.vercel.app',
    hrefLabel: 'scopecreep-notary.vercel.app',
    shot: '/portfolio/work/scopecreep.webp',
    synopsis: 'catch the words clients use to quietly add work',
    description:
      'Reads client Slack threads in your browser, flags phrases that quietly expand a contract, and drafts the change-order email. No server, no analytics, no AI at runtime.',
    design: ['Privacy as a design choice: everything stays in the browser.'],
    stack: ['Chrome MV3', 'JavaScript'],
  },
  {
    id: 'cracktrack',
    name: 'cracktrack',
    kind: 'personal app',
    year: '2026',
    started: '2026-11-18',
    status: 'in progress',
    href: null,
    shot: '/portfolio/work/cracktrack.webp',
    shotRatio: '16 / 10',
    shotFit: 'contain',
    synopsis: 'every can you have cracked, in one cooler',
    description:
      'A shelf of every energy drink you have tried: log each can, rate it, search 97 flavors across the big brands, and see your stats. Every can is drawn in code.',
    design: [],
    stack: ['React', 'TypeScript', 'Convex'],
  },
];

/** Older, smaller work, shown as a compact `ls -l` list. */
export const archive = [
  { name: 'voice-operator', what: 'Claude Code loop that ran one project alone for 7 days, 257 logged decisions', year: '2026' },
  { name: 'wahoos-fishing', what: 'Pygame + pixel art game for the owner of Wahoo’s Fish Taco', year: '2024' },
  { name: 'khanclock', what: 'Chrome extension: a timer for Khan Academy SAT practice', year: '2024' },
  { name: 'pull', what: 'weekend scheduler for a robotics tournament', year: '2026' },
  { name: 'emoji-orbit', what: 'make an orbit of emoji around a photo, then download it', year: '2026' },
];

/**
 * The evolution log. lane 0 = this website, lane 1 = projects.
 * Every date is a real first commit. `shot` = a screenshot of that era.
 */
export const log = [
  { lane: 0, hash: 'HEAD', date: '2026-11-19', title: 'terminal portfolio, clarity brand in pink', note: 'This page. One terminal you scroll, borrowing the brand I designed for clarity.', head: true },
  { lane: 1, hash: 'e9df41c', date: '2026-11-18', title: 'cracktrack', ref: 'cracktrack' },
  { lane: 1, hash: '9deb2d2', date: '2026-11-17', title: 'hangr: company site goes live', ref: 'hangr' },
  { lane: 1, hash: 'ea2b41d', date: '2026-11-09', title: 'smart goals v2, phone-first', ref: 'smart-goals' },
  { lane: 1, hash: '4229048', date: '2026-11-01', title: 'everbloom storefront', ref: 'everbloom' },
  { lane: 1, hash: '·······', date: '2026-10-22', title: 'consent lab', ref: 'consent-lab' },
  { lane: 1, hash: '3382d47', date: '2026-09-08', title: 'clarity: first commit', ref: 'clarity', big: true },
  { lane: 0, hash: '4531b14', date: '2026-08-17', title: 'sakura: a terminal and a graph', note: 'Two ways to browse one site: a working terminal and a node graph. Pink first showed up here.', shots: ['/portfolio/eras/2026-sakura-terminal.webp', '/portfolio/eras/2026-sakura-graph.webp'] },
  { lane: 0, hash: 'a94cc16', date: '2026-06-03', title: 'navy + gold, then cream', note: 'A full redesign with a motion system. Same week: a bolder cream direction.', shots: ['/portfolio/eras/2026-06-navy.webp', '/portfolio/eras/2026-06-cream.webp'] },
  { lane: 1, hash: '7e41541', date: '2026-05-23', title: 'scopecreep notary', ref: 'scopecreep' },
  { lane: 1, hash: '908bf4d', date: '2026-04-01', title: 'synkra', ref: 'synkra' },
  { lane: 0, hash: 'e51b009', date: '2026-03-27', title: 'pull: a tournament scheduler', note: 'The site starts hosting tools friends actually use.' },
  { lane: 0, hash: '280c160', date: '2025-01-02', title: 'driver’s license + SAT guides', note: 'Utility pages for classmates.' },
  { lane: 0, hash: '24326bd', date: '2024-07-03', title: 'oN.c, the green one', note: '“Hi, my name is Oliver Nguyen. I love to build things.”', shots: ['/portfolio/eras/2024-07-green.webp'] },
  { lane: 0, hash: '79a0af9', date: '2024-02-26', title: 'first commit', note: 'olivernguyen.com begins.', root: true },
];

/** Work away from the keyboard. Numbers copied from Oliver's activities grid. */
export const making = [
  {
    name: 'vex-robotics',
    role: 'lead engineer · build, CAD, code',
    lines: [
      'Led teams of 5-7 to 3 district titles across 8+ robots.',
      'Qualified for the state championship 5 of 5 seasons.',
      'Mentor 3 VEX IQ teams at TechX; one qualified for Worlds.',
    ],
  },
  {
    name: 'ev-challenge',
    role: 'driver · systems engineer',
    lines: [
      'Wired, steered and shaped the aero shell of an electric car.',
      'Built a telemetry app for lap times and wattage.',
      '4th of 32 on speed and energy efficiency. 200/200 design score.',
    ],
  },
  {
    name: 'verus-aerospace',
    role: 'manufacturing intern · 4 chosen of 20',
    lines: [
      'Heard about back pain from carrying heavy machined parts.',
      'Designed 10+ fixes: carts, storage, navigation systems.',
    ],
  },
  {
    name: 'virtual-enterprise',
    role: 'VP digital operations · web designer',
    lines: [
      'Built the websites for Setta, Hangr and Everbloom.',
      'Rapid Prototyping Gold for Cell-U-Safe; ReKnew AI Challenge Top 10.',
    ],
  },
  {
    name: 'eagle-scout',
    role: 'Eagle rank · 12 years in scouting',
    lines: [
      'Eagle project: rebuilt my school’s robotics room with 15+ volunteers.',
      'Completed all 4 national high adventure bases (Grand Slam).',
    ],
  },
  {
    name: 'keyboards',
    role: 'hobby',
    lines: ['Saved up at 14 for my first mechanical keyboard; have built and sold many since.'],
  },
];

export const windows = [
  { id: 'top', n: 1, label: 'home' },
  { id: 'work', n: 2, label: 'work' },
  { id: 'log', n: 3, label: 'log' },
  { id: 'making', n: 4, label: 'making', short: 'make' },
  { id: 'contact', n: 5, label: 'contact', short: 'hi' },
];
