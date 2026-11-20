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
    kind: 'AI learning app',
    status: 'live',
    href: 'https://clarity.olivernguyen.com',
    hrefLabel: 'clarity.olivernguyen.com',
    shot: '/portfolio/work/clarity.webp',
    noFrame: true, // clarity sends X-Frame-Options SAMEORIGIN; still until it allows olivernguyen.com
    notes: [
      ['brand', 'A slash mark, warm paper colors and one typeface, Geologica.'],
      ['ui', 'One question at a time, like a curious student.'],
      ['decision', 'It never moves on or grades you by itself. You stay in control.'],
    ],
  },
  {
    id: 'frog',
    name: 'frog',
    line: 'A training notebook run by a frog.',
    kind: 'workout app',
    status: 'prototype',
    href: null,
    shot: '/portfolio/work/frog.webp',
    notes: [
      ['brand', 'The closer to the data, the more serious. The frog only jokes at the edges.'],
      ['ui', 'Square corners, one green, and numbers that always line up.'],
      ['decision', 'Three voices: Human, Frog and Ultrafrog. The words change, the numbers never do.'],
    ],
  },
  {
    id: 'hangr',
    name: 'hangr',
    line: 'A hanger that steams your clothes.',
    kind: 'company site · Virtual Enterprise',
    status: 'live',
    href: 'https://hangrve.vercel.app',
    hrefLabel: 'hangrve.vercel.app',
    shot: '/portfolio/work/hangr.webp',
    notes: [
      ['brand', 'Built from the company brand book: slate, ice blue, a little mauve.'],
      ['ui', 'Full-bleed photos and big serif headlines, like a clothing campaign.'],
      ['decision', 'Product art never shows features the real hanger does not have.'],
    ],
  },
  {
    id: 'everbloom',
    name: 'everbloom',
    line: 'Preserved roses that sway in the wind.',
    kind: 'company site · Virtual Enterprise',
    status: 'live',
    href: 'https://everbloom-ve.vercel.app',
    hrefLabel: 'everbloom-ve.vercel.app',
    shot: '/portfolio/work/everbloom.webp',
    notes: [
      ['brand', 'Italic serif labels and soft rose tones.'],
      ['ui', 'Build a bouquet in four steps: roses, wrap, card, send.'],
      ['decision', 'Cut the flashy hover effects. Buttons just change color.'],
    ],
  },
  {
    id: 'smart-goals',
    name: 'smart goals',
    line: 'Big goals, small daily wins.',
    kind: 'goal tracker',
    status: 'live',
    href: 'https://smart-goals-sooty.vercel.app/',
    hrefLabel: 'smart-goals-sooty.vercel.app',
    shot: '/portfolio/work/smartgoals.webp',
    notes: [
      ['brand', 'One green that only ever means progress.'],
      ['ui', 'Every screen does one thing. The form asks one SMART question at a time.'],
      ['decision', 'Dropped a busier stamp-and-paper look because it did too much.'],
    ],
  },
  {
    id: 'synkra',
    name: 'synkra',
    line: 'Find a time that works for everyone.',
    kind: 'group scheduling app',
    status: 'prototype',
    href: 'https://synkra.oliverdnguyen.workers.dev',
    hrefLabel: 'synkra.oliverdnguyen.workers.dev',
    shot: '/portfolio/work/synkra.webp',
    notes: [
      ['ui', 'Share a link, drag your busy times, see when everyone is free.'],
      ['decision', 'No accounts. The fewer steps, the more friends answer.'],
      ['brand', 'Soft and friendly, made for friend groups of any kind.'],
    ],
  },
  {
    id: 'consent-lab',
    name: 'consent lab',
    line: 'Should an AI ask before it acts?',
    kind: 'research prototype',
    status: 'prototype',
    href: null,
    shot: '/portfolio/work/consentlab.webp',
    notes: [
      ['ui', 'Compares four ways an AI can ask permission, side by side.'],
      ['brand', 'Looks like a tool, not an ad: navy, teal and clear status words.'],
      ['decision', 'What the AI wants to do and what it actually did look different.'],
    ],
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
