/**
 * src/terminal/sections.jsx — printable section blocks (C-1.3/C-1.4).
 * The prototype's <template>s as React renderers: every function returns an
 * ARRAY OF LINES for api.print(). ALL content flows in from terminalModel
 * selectors (zero hardcoded copy — labels/frames here are UI grammar only).
 *
 * Printed interactivity rides data-cmd/data-act attributes; TerminalHome's
 * buffer click delegation turns them into run() calls (§3.1.2 affordances).
 */
import React, { useEffect, useRef, useState } from 'react';
import { ln } from './Buffer.jsx';
import { motionOK } from './lib/cadence.js';
import {
  BOOT_DAY,
  DAY_COUNT,
  EMAIL,
  bootData,
  artifact,
  dayInfo,
  lsEntries,
  sectionByFile,
} from './lib/terminalModel.js';

/* ---------------------------- tiny factories ----------------------------- */

const span = (c, t, key) => (
  <span className={c} key={key}>
    {t}
  </span>
);

const obtn = (label, attrs, key) => (
  <button type="button" className="obtn" key={key} {...attrs}>
    {label}
  </button>
);

const statusCls = (status) =>
  !status
    ? 'mut'
    : /RAN|NOW|ACTIVE|FASTEST/.test(status)
      ? 'ok'
      : /ARCHIVED/.test(status)
        ? 'faint'
        : 'mut';

/* ------------------------------ motd + boot ------------------------------ */

export function motdLines(now = new Date()) {
  const t = now.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return [ln('faint', `Last login: ${now.toDateString()} ${t} on ttys001`)];
}

/**
 * Scramble-reveal name (§3.1.4). Printed as a boot line; the animation only
 * starts once the line is REVEALED (BufferView drops the .pending class it
 * passes down via className). Reduced motion: final text immediately.
 */
export function ScrambleName({ text, className = '' }) {
  const GLYPHS = '!<>-_\\/[]{}—=+*^?#░▒▓';
  const pending = className.includes('pending');
  const mask = (lock = 0) =>
    text
      .split('')
      .map((ch, i) =>
        ch === ' ' ? ' ' : i < lock ? ch : GLYPHS[(Math.random() * GLYPHS.length) | 0],
      )
      .join('');
  const [display, setDisplay] = useState(() => (motionOK() ? mask() : text));
  const doneRef = useRef(false);

  useEffect(() => {
    if (pending || doneRef.current) return undefined;
    if (!motionOK()) {
      doneRef.current = true;
      setDisplay(text);
      return undefined;
    }
    let frame = 0;
    const iv = setInterval(() => {
      frame++;
      const lock = Math.floor((frame * text.length) / 16);
      if (lock >= text.length) {
        clearInterval(iv);
        doneRef.current = true;
        setDisplay(text);
      } else {
        setDisplay(mask(lock));
      }
    }, 40);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending, text]);

  return (
    <h1 className={className} aria-label={text}>
      {display}
    </h1>
  );
}

export function bootLines(day = BOOT_DAY) {
  const b = bootData(day);
  return [
    ln('dim', `╭─ ${b.frameTitle}`),
    ...b.beats.map((beat, i) =>
      ln('k-log', [span('dim', `│ [${beat.t}] `, 'p'), `${beat.glyph} ${beat.body}`], `b${i}`),
    ),
    ln('k-ok', `╰─ ${b.summary}`),
    ln('', ''),
    <ScrambleName key="name" className="ln name" text={b.name} />,
    ln('tagline', b.tagline),
    ln('', ''),
    <p className="ln" key="cta">
      {obtn('[ view the agents ↓ ]', { 'data-cmd': 'cat tools.txt' }, 'c1')}{' '}
      {obtn('[ ⌘K ]', { 'data-act': 'palette' }, 'c2')}{' '}
      {obtn('[ switch to graph mode ]', { 'data-cmd': 'mode graph' }, 'c3')}
    </p>,
  ];
}

/* ------------------------------- sections -------------------------------- */

function itemLines(items, out) {
  items.forEach((it, i) => {
    const idx = String(i + 1).padStart(2, '0');
    out.push(
      ln(
        '',
        [
          span('dim', idx, 'i'),
          '  ',
          <b key="t">{it.title}</b>,
          '  ',
          span('faint', it.type, 'y'),
          it.status ? '  ' : '',
          it.status ? span(statusCls(it.status), `[${it.status}]`, 's') : '',
        ],
        `t${i}`,
      ),
    );
    out.push(ln('ind mut', it.blurb, `b${i}`));
    if (it.tech.length) out.push(ln('ind faint', `· ${it.tech.join(' · ')}`, `k${i}`));
    if (it.statLine) out.push(ln('ind faint', it.statLine, `s${i}`));
    if (i < items.length - 1) out.push(ln('', '', `sp${i}`));
  });
  return out;
}

export function toolsLines() {
  const s = sectionByFile('tools.txt');
  const out = [ln('dim', s.heading), ln('', '')];
  return itemLines(s.items, out);
}

export function roboticsLines() {
  const s = sectionByFile('robotics.log');
  const out = [ln('dim', s.heading), ln('', '')];
  itemLines(s.items, out);
  out.push(ln('', ''), ln('faint', s.strip, 'strip'));
  return out;
}

export function whoamiLines() {
  const s = sectionByFile('whoami.txt');
  const out = [ln('dim', s.heading), ln('', ''), ln('mut', s.bio), ln('', '')];
  itemLines(s.items, out);
  out.push(ln('', ''), ln('faint', s.strip, 'strip'));
  return out;
}

export function contactLines() {
  const s = sectionByFile('contact.txt');
  const links = s.channels.filter((c) => c.id !== 'email' && c.link);
  return [
    ln('dim', s.heading),
    ln('', ''),
    ln('big', s.big),
    ln('mut', s.blurb),
    ln('', ''),
    <p className="ln" key="row">
      {obtn('[ copy email ]', { 'data-cmd': 'email' }, 'e')}
      {links.map((c) => (
        <React.Fragment key={c.id}>
          {'  '}
          <a
            className="plain"
            href={c.link.href}
            {...(c.link.href.startsWith('http')
              ? { target: '_blank', rel: 'noreferrer' }
              : {})}
          >
            {c.title.toLowerCase()}
          </a>
        </React.Fragment>
      ))}
    </p>,
    ln('', ''),
    ln('faint', s.footer, 'f'),
  ];
}

export const sectionLinesByFile = (file) =>
  ({
    'tools.txt': toolsLines,
    'robotics.log': roboticsLines,
    'whoami.txt': whoamiLines,
    'contact.txt': contactLines,
  })[file]();

/* --------------------------- ls / day / artifact ------------------------- */

export function lsLines() {
  const w = Math.max(...lsEntries().map((r) => r.name.length)) + 3;
  return lsEntries().map((r, i) =>
    ln('', [span('acc', r.name.padEnd(w), 'n'), span('faint', r.desc, 'd')], i),
  );
}

export function dayLines(n) {
  const d = dayInfo(n);
  return [
    ln('dim', `╭─ operator · day ${d.day}/${DAY_COUNT} · ${d.date}`),
    ...d.beats.map((b, i) =>
      ln('k-log', [span('dim', `│ [${b.t}] `, 'p'), `${b.glyph} ${b.body}`], i),
    ),
    ln('dim', `╰─ ${DAY_COUNT - d.day} day${DAY_COUNT - d.day === 1 ? '' : 's'} remaining`, 'e'),
  ];
}

export function artifactLines(id) {
  const a = artifact(id);
  const out = [
    ln('dim', `╭─ ${a.glyph} ${a.dTitle} — ${a.type}`),
  ];
  if (a.status) out.push(ln('', [span('dim', '│ ', 'p'), span(statusCls(a.status), `[${a.status}]`, 's')], 'st'));
  out.push(ln('ind mut', a.blurb, 'b'));
  if (a.statLine) out.push(ln('ind faint', a.statLine, 'sl'));
  if (a.tech.length) out.push(ln('ind faint', `· ${a.tech.join(' · ')}`, 'tech'));
  if (a.beats)
    a.beats.forEach((b, i) =>
      out.push(ln('k-log', [span('dim', `│ [${b.t}] `, 'p'), `${b.glyph} ${b.body}`], `bt${i}`)),
    );
  if (a.link)
    out.push(
      <p className="ln ind" key="lk">
        <a
          className="plain"
          href={a.link.href}
          {...(a.link.href.startsWith('http') ? { target: '_blank', rel: 'noreferrer' } : {})}
        >
          {a.link.label}
        </a>
      </p>,
    );
  out.push(
    <p className="ln dim" key="ld">
      {'╰─ linked: '}
      {a.linked.map((rid, i) => (
        <React.Fragment key={rid}>
          {i > 0 && ' · '}
          {obtn(rid, { 'data-cmd': `open ${rid}` }, rid)}
        </React.Fragment>
      ))}
    </p>,
  );
  return out;
}

/* ------------------------------ help / misc ------------------------------ */

export function helpLines() {
  const rows = [
    ['keys      ', 'j/k scroll · 1-5 windows · gg/G top/bottom · ? help sheet · ⌘K palette'],
    ['commands  ', 'ls · cat FILE · day N · open NODE · mode graph · email · clear · help'],
    ['prompt    ', 'Tab completes · ↑/↓ history · Esc clears · : prefix works'],
  ];
  return rows.map(([k, v], i) => ln('', [span('dim', k, 'k'), span('mut', v, 'v')], i));
}

export const quitText = 'this is a website. you live here now.';

export const emailCopiedText = `copied ${EMAIL} ✓`;
