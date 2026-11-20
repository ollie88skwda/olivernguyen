/**
 * src/portfolio/content.js — every word on the portfolio home.
 * Facts only, sourced in docs/portfolio-facts.md. Keep lines short; links do the rest.
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
  lede: 'I design and build apps, websites and robots.',
};

export const work = [
  {
    id: 'clarity',
    name: 'clarity',
    line: 'Learn anything by teaching it to an AI.',
    tag: 'app',
    status: 'live',
    href: 'https://clarity.olivernguyen.com',
    hrefLabel: 'clarity.olivernguyen.com',
    shot: '/portfolio/work/clarity.webp',
    noFrame: true, // clarity sends X-Frame-Options SAMEORIGIN; still until it allows olivernguyen.com
  },
  {
    id: 'hangr',
    name: 'hangr',
    line: 'A hanger that steams your clothes.',
    tag: 'company site',
    status: 'live',
    href: 'https://hangrve.vercel.app',
    hrefLabel: 'hangrve.vercel.app',
    shot: '/portfolio/work/hangr.webp',
  },
  {
    id: 'everbloom',
    name: 'everbloom',
    line: 'Preserved roses that sway in the wind.',
    tag: 'company site',
    status: 'live',
    href: 'https://everbloom-ve.vercel.app',
    hrefLabel: 'everbloom-ve.vercel.app',
    shot: '/portfolio/work/everbloom.webp',
  },
  {
    id: 'smart-goals',
    name: 'smart goals',
    line: 'Big goals, small daily wins.',
    tag: 'app',
    status: 'live',
    href: 'https://smart-goals-sooty.vercel.app/',
    hrefLabel: 'smart-goals-sooty.vercel.app',
    shot: '/portfolio/work/smartgoals.webp',
  },
  {
    id: 'synkra',
    name: 'synkra',
    line: 'Find a time that works for everyone.',
    tag: 'app',
    status: 'prototype',
    href: 'https://synkra.oliverdnguyen.workers.dev',
    hrefLabel: 'synkra.oliverdnguyen.workers.dev',
    shot: '/portfolio/work/synkra.webp',
  },
  {
    id: 'scopecreep',
    name: 'scopecreep',
    line: 'Flags when clients quietly add work.',
    tag: 'chrome extension',
    status: 'beta',
    href: 'https://scopecreep-notary.vercel.app',
    hrefLabel: 'scopecreep-notary.vercel.app',
    shot: '/portfolio/work/scopecreep.webp',
  },
  {
    id: 'consent-lab',
    name: 'consent lab',
    line: 'Should an AI ask before it acts?',
    tag: 'research',
    status: 'prototype',
    href: null,
    shot: '/portfolio/work/consentlab.webp',
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
