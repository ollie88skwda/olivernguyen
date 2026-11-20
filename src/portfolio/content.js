/**
 * src/portfolio/content.js: every word on the portfolio home.
 * Facts only, sourced in docs/portfolio-facts.md. Short, plain lines. Screenshots, not live frames, so a site going down never shows here.
 */

export const EMAIL = 'oliverdnguyen@gmail.com';

export const meta = {
  name: 'Oliver Nguyen',
  user: 'oliver',
  host: 'studio',
  links: {
    github: 'https://github.com/ollie88skwda',
    linkedin: 'https://www.linkedin.com/in/oliver-nguyen-988b2a2a3/',
    resume: '/resume.pdf',
  },
};

export const intro = {
  kicker: 'design + engineering',
  lede: 'I design apps and websites, and I build robots for VEX.',
};

export const work = [
  {
    id: 'clarity',
    name: 'Clarity',
    line: 'Learn anything by teaching it to an AI.',
    kind: 'AI learning app',
    status: 'live',
    href: 'https://clarity.olivernguyen.com',
    hrefLabel: 'clarity.olivernguyen.com',
    shot: '/portfolio/work/clarity.webp',
    blurb:
      'You explain a topic and Clarity listens like a curious student, asking one question at a time. I also designed its look, from the slash logo to the warm paper colors.',
  },
  {
    id: 'frog',
    name: 'Frog',
    line: 'A training notebook run by a frog.',
    kind: 'workout app',
    status: 'live',
    href: 'https://frog.olivernguyen.com',
    hrefLabel: 'frog.olivernguyen.com',
    phones: ['/portfolio/work/frog-today.webp', '/portfolio/work/frog-plan.webp', '/portfolio/work/frog-progress.webp'],
    blurb:
      'A workout log that tracks sleep, caffeine and stress next to your lifts, then shows what lines up. The numbers stay serious. The frog only jokes on empty screens and error pages.',
  },
  {
    id: 'hangr',
    name: 'Hangr',
    line: 'A hanger that steams your clothes.',
    kind: 'company site · Virtual Enterprise',
    status: 'live',
    href: 'https://hangrve.vercel.app',
    hrefLabel: 'hangrve.vercel.app',
    shot: '/portfolio/work/hangr.webp',
    blurb:
      "The site for Hangr, my Virtual Enterprise company's hanger with built-in steam. I worked from the company brand book and laid it out like a clothing campaign, with big photos and serif headlines.",
  },
  {
    id: 'everbloom',
    name: 'Everbloom',
    line: 'Preserved roses that sway in the wind.',
    kind: 'company site · Virtual Enterprise',
    status: 'live',
    href: 'https://everbloom-ve.vercel.app',
    hrefLabel: 'everbloom-ve.vercel.app',
    shot: '/portfolio/work/everbloom.webp',
    blurb:
      'A shop for preserved roses. The roses at the top bend in the wind, and a four-step builder lets you put a bouquet together and send it.',
  },
  {
    id: 'smart-goals',
    name: 'Smart Goals',
    line: 'Big goals, small daily wins.',
    kind: 'goal tracker',
    status: 'live',
    href: 'https://smart-goals-sooty.vercel.app/',
    hrefLabel: 'smart-goals-sooty.vercel.app',
    shot: '/portfolio/work/smartgoals.webp',
    blurb:
      'Pick a few big goals, break them into steps and add photos as proof. One green means progress, and the form asks one SMART question at a time.',
  },
  {
    id: 'synkra',
    name: 'Synkra',
    line: 'Find a time that works for everyone.',
    kind: 'group scheduling app',
    status: 'prototype',
    href: 'https://synkra.oliverdnguyen.workers.dev',
    hrefLabel: 'synkra.oliverdnguyen.workers.dev',
    shot: '/portfolio/work/synkra.webp',
    blurb:
      "Share a link, everyone drags over the times they're busy, and Synkra shows when the whole group is free. Nobody has to make an account.",
  },
  {
    id: 'consent-lab',
    name: 'Consent Lab',
    line: 'Should an AI ask before it acts?',
    kind: 'research prototype',
    status: 'prototype',
    href: null,
    shot: '/portfolio/work/consentlab.webp',
    blurb:
      'A research tool that compares four ways an AI agent could ask permission before it edits your files, messages or calendar. It runs 24 invented test cases so you can see what each approach lets through.',
  },
];

/** Away from the keyboard. Numbers from Oliver's activities grid. */
export const making = [
  { name: 'VEX Robotics', role: 'Lead engineer', fact: '3 district titles · state 5/5 seasons' },
  { name: 'EV Challenge', role: 'Driver + systems', fact: '4th of 32 · 200/200 design' },
  { name: 'Verus Aerospace', role: 'Manufacturing intern', fact: '10+ shop-floor fixes' },
  { name: 'Virtual Enterprise', role: 'VP digital ops', fact: 'Rapid Prototyping Gold' },
  { name: 'Eagle Scout', role: '12 years', fact: 'Grand Slam: all 4 high adventure bases' },
];

export const windows = [
  { id: 'top', n: 1, label: 'home' },
  { id: 'work', n: 2, label: 'work' },
  { id: 'making', n: 3, label: 'making' },
  { id: 'contact', n: 4, label: 'contact' },
];
