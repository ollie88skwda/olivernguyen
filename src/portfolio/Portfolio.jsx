/**
 * src/portfolio/Portfolio.jsx — the terminal portfolio home (2026-11-19).
 *
 * One scrollable terminal session. Each section is a command the visitor
 * "runs" by scrolling to it: the command types itself in, then its output
 * prints. A tmux-style status bar tracks the current window; number keys
 * 1-5 jump between windows and a real prompt at the bottom accepts commands.
 *
 * Brand: clarity's system (paper neutrals, Geologica, slash mark, corner
 * scale) with clarity's blue ramp rotated to pink. Tokens in portfolio.css.
 *
 * Reduced motion: no typing and no reveal; every block renders complete.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { archive, EMAIL, intro, log, making, meta, windows, work } from './content.js';
import { useTheme as useSiteTheme } from '../theme/ThemeProvider.jsx';
import './portfolio.css';

const PS1 = () => (
  <span className="pf-ps1" aria-hidden="true">
    <span className="pf-ps1-user">{meta.user}@{meta.host}</span>
    <span className="pf-ps1-sep">:</span>
    <span className="pf-ps1-path">~</span>
    <span className="pf-ps1-sep">$</span>
  </span>
);

const reducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/* ------------------------------------------------------------------ */
/* Slash mark — clarity's parallelogram, drawn in the accent.           */
export const Slash = ({ size = 18, className = '' }) => (
  <svg className={`pf-slash ${className}`} viewBox="0 0 32 32" width={size} height={size} aria-hidden="true">
    <path d="M1 18.01L31 2.49L31 13.99L1 29.51Z" />
  </svg>
);

/* ------------------------------------------------------------------ */
/* Typing + reveal on first view.                                      */
const useInView = (ref, margin = '0px 0px -12% 0px') => {
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    if (seen) return undefined;
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setSeen(true);
      return undefined;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setSeen(true);
          io.disconnect();
        }
      },
      { rootMargin: margin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, seen, margin]);
  return seen;
};

const useTyped = (text, start, speed = 34) => {
  const instant = reducedMotion();
  const [n, setN] = useState(instant ? text.length : 0);
  useEffect(() => {
    if (instant || !start) return undefined;
    let i = 0;
    let t;
    const tick = () => {
      i += 1;
      setN(i);
      if (i < text.length) t = setTimeout(tick, speed + Math.random() * speed * 0.8);
    };
    t = setTimeout(tick, 180);
    return () => clearTimeout(t);
  }, [start, text, speed, instant]);
  return { typed: text.slice(0, n), done: n >= text.length };
};

/** A command line + its output. Output fades in once the command finishes. */
const Block = ({ id, cmd, children, comment, className = '' }) => {
  const ref = useRef(null);
  const seen = useInView(ref);
  const { typed, done } = useTyped(cmd, seen);
  return (
    <section id={id} ref={ref} className={`pf-block ${className}`} data-done={done || undefined} aria-label={comment || cmd}>
      <p className="pf-cmd">
        <PS1 /> <span className="pf-cmd-text">{typed}</span>
        {!done && <span className="pf-caret" aria-hidden="true" />}
        <span className="pf-sr">{cmd}</span>
      </p>
      <div className="pf-out">{children}</div>
    </section>
  );
};

/* ------------------------------------------------------------------ */
/* Window chrome around screenshots: a tiny terminal title bar.        */
const Shot = ({ src, alt, label, ratio: r, fit = 'cover', pos = 'top' }) => <ShotInner src={src} alt={alt} label={label} ratio={r || '16 / 10'} fit={fit} pos={pos} />;
const ShotInner = ({ src, alt, label, ratio, fit = 'cover', pos = 'top' }) => (
  <figure className="pf-shot">
    <figcaption className="pf-shot-bar">
      <span className="pf-dots" aria-hidden="true"><i /><i /><i /></span>
      <span className="pf-shot-label">{label}</span>
    </figcaption>
    <div className="pf-shot-frame" style={{ aspectRatio: ratio }}>
      <img src={src} alt={alt} loading="lazy" decoding="async" style={{ objectFit: fit, objectPosition: pos }} />
    </div>
  </figure>
);

/* ------------------------------------------------------------------ */
/* Hero: boot + whoami + neofetch.                                     */
const BOOT = [
  'booting olivernguyen.com',
  'loading brand: clarity (pink)',
  `mounting ${work.length} projects + every old version of this site`,
];

const Hero = () => {
  const instant = reducedMotion();
  const [step, setStep] = useState(instant ? BOOT.length : 0);
  useEffect(() => {
    if (instant || step >= BOOT.length) return undefined;
    const t = setTimeout(() => setStep((s) => s + 1), step === 0 ? 260 : 210);
    return () => clearTimeout(t);
  }, [step, instant]);
  const booted = step >= BOOT.length;
  const { typed, done } = useTyped('whoami', booted, 60);

  return (
    <section id="top" className="pf-hero" aria-label="Introduction">
      <ol className="pf-boot" aria-hidden="true">
        {BOOT.slice(0, step).map((line) => (
          <li key={line}>
            <span className="pf-ok">[ ok ]</span> {line}
          </li>
        ))}
      </ol>
      <p className="pf-cmd">
        <PS1 /> <span className="pf-cmd-text">{typed}</span>
        {!done && <span className="pf-caret" aria-hidden="true" />}
      </p>
      <div className="pf-hero-grid" data-show={done || undefined}>
        <div className="pf-hero-main">
          <div className="pf-hero-name">
          <p className="pf-kicker">
            <Slash size={14} /> {intro.kicker}
          </p>
          <h1 className="pf-name">
            Oliver
            <br />
            Nguyen<span className="pf-name-cursor" aria-hidden="true" />
          </h1>
          </div>
          <div className="pf-hero-copy">
          <p className="pf-lede">{intro.lede}</p>
          <div className="pf-hero-actions">
            <a className="pf-btn pf-btn-primary" href="#work">
              ls ./work <span aria-hidden="true">↓</span>
            </a>
            <a className="pf-btn" href="#log">
              git log --site
            </a>
          </div>
          </div>
        </div>
        <dl className="pf-fetch" aria-label="Quick facts">
          <div className="pf-fetch-art" aria-hidden="true">
            <Slash size={72} />
          </div>
          <div className="pf-fetch-head">
            <b>{meta.user}</b>@<b>{meta.host}</b>
          </div>
          <div className="pf-fetch-rule" aria-hidden="true" />
          {[
            ['os', 'human-centered design'],
            ['school', meta.school],
            ['loc', meta.where],
            ...intro.facts,
            ['shell', 'zsh · 200 wpm'],
          ].map(([k, v]) => (
            <div className="pf-fetch-row" key={k}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
          <div className="pf-swatches" aria-hidden="true">
            {[1, 3, 5, 7, 8, 9, 11, 12].map((n) => (
              <i key={n} style={{ background: `var(--pink-${n})` }} />
            ))}
          </div>
        </dl>
      </div>
    </section>
  );
};

/* ------------------------------------------------------------------ */
/* Work: one man-page style entry per project.                         */
const StatusChip = ({ status }) => (
  <span className="pf-chip" data-status={status.replace(/\s/g, '-')}>
    {status === 'live' && <i className="pf-live-dot" aria-hidden="true" />}
    {status}
  </span>
);

const Project = ({ p, i }) => {
  const ref = useRef(null);
  const seen = useInView(ref, '0px 0px -8% 0px');
  return (
    <article id={`work-${p.id}`} ref={ref} className="pf-project" data-seen={seen || undefined} data-flip={i % 2 ? '' : undefined}>
      <header className="pf-project-head">
        <span className="pf-project-n">{String(i + 1).padStart(2, '0')}</span>
        <h3 className="pf-project-name">
          {p.name}
          <span className="pf-project-man">(1)</span>
        </h3>
        <StatusChip status={p.status} />
      </header>
      <div className="pf-project-body">
        <div className="pf-project-text">
          <p className="pf-project-synopsis">
            <span className="pf-label">NAME</span>
            {p.name} <span className="pf-dim">—</span> {p.synopsis}
          </p>
          <p className="pf-project-kind">
            <span className="pf-label">KIND</span>
            {p.kind} <span className="pf-dim">· {p.year}</span>
          </p>
          <p className="pf-project-desc">
            <span className="pf-label">DESCRIPTION</span>
            {p.description}
          </p>
          {p.design.length > 0 && (
            <div className="pf-project-design">
              <span className="pf-label">DESIGN NOTES</span>
              <ul>
                {p.design.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
            </div>
          )}
          <p className="pf-project-stack">
            {p.stack.map((s) => (
              <span key={s} className="pf-tag">
                {s}
              </span>
            ))}
          </p>
          {p.href ? (
            <a className="pf-link" href={p.href} target="_blank" rel="noreferrer">
              open {p.hrefLabel} <span aria-hidden="true">↗</span>
            </a>
          ) : (
            <span className="pf-dim pf-mono-sm">runs locally · not public yet</span>
          )}
        </div>
        <div className="pf-project-media">
          <Shot src={p.shot} alt={`${p.name} screenshot`} label={p.hrefLabel || `~/${p.name}`} ratio={p.shotRatio} fit={p.shotFit} />
          {p.shotMobile && (
            <div className="pf-phone" aria-hidden="true">
              <img src={p.shotMobile} alt="" loading="lazy" decoding="async" />
            </div>
          )}
        </div>
      </div>
    </article>
  );
};

const Work = () => (
  <Block id="work" cmd="ls ./work --long --newest" comment="Selected work">
    <h2 className="pf-h2">
      Selected work <span className="pf-count">{work.length} entries</span>
    </h2>
    <table className="pf-ls" aria-label="Project index">
      <tbody>
        {work.map((p) => (
          <tr key={p.id}>
            <td className="pf-dim">drwxr-xr-x</td>
            <td className="pf-dim">{p.started}</td>
            <td>
              <a href={`#work-${p.id}`}>{p.name}/</a>
            </td>
            <td className="pf-ls-kind">{p.kind}</td>
            <td>
              <StatusChip status={p.status} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
    <div className="pf-projects">
      {work.map((p, i) => (
        <Project key={p.id} p={p} i={i} />
      ))}
    </div>
    <div className="pf-archive">
      <p className="pf-cmd pf-cmd-inline">
        <PS1 /> <span className="pf-cmd-text">ls ./archive</span>
      </p>
      <ul>
        {archive.map((a) => (
          <li key={a.name}>
            <span className="pf-dim">{a.year}</span>
            <b>{a.name}</b>
            <span>{a.what}</span>
          </li>
        ))}
      </ul>
    </div>
  </Block>
);

/* ------------------------------------------------------------------ */
/* Evolution: a two-lane git graph. Left lane = this website, right =   */
/* projects. Site eras carry screenshots.                               */
const workById = Object.fromEntries(work.map((p) => [p.id, p]));

const Evolution = () => {
  const [lane, setLane] = useState('all');
  const rows = useMemo(
    () => log.filter((e) => lane === 'all' || (lane === 'site' ? e.lane === 0 : e.lane === 1)),
    [lane],
  );
  return (
    <Block id="log" cmd="git log --graph --all --since=2024" comment="How the work evolved">
      <h2 className="pf-h2">How it evolved</h2>
      <p className="pf-sub">
        Two branches. <span className="pf-lane-key" data-lane="0">site</span> is this website, redesigned five times
        since 2024. <span className="pf-lane-key" data-lane="1">projects</span> is everything I built alongside it.
      </p>
      <div className="pf-seg" role="group" aria-label="Filter branches">
        {[
          ['all', '--all'],
          ['site', 'site'],
          ['projects', 'projects'],
        ].map(([k, l]) => (
          <button key={k} type="button" aria-pressed={lane === k} onClick={() => setLane(k)}>
            {l}
          </button>
        ))}
      </div>
      <ol className="pf-git" data-filter={lane}>
        {rows.map((e) => {
          const p = e.ref && workById[e.ref];
          return (
            <li key={e.hash + e.date} className="pf-commit" data-lane={e.lane} data-head={e.head || undefined} data-big={e.big || undefined}>
              <div className="pf-rail" aria-hidden="true">
                <span className="pf-rail-line" data-l="0" />
                <span className="pf-rail-line" data-l="1" />
                <span className="pf-node" />
              </div>
              <div className="pf-commit-body">
                <p className="pf-commit-meta">
                  <span className="pf-hash">{e.hash}</span>
                  {e.head && <span className="pf-ref">HEAD → main</span>}
                  {e.root && <span className="pf-ref pf-ref-root">root</span>}
                  <span className="pf-dim">{e.date}</span>
                  <span className="pf-branch" data-lane={e.lane}>
                    {e.lane === 0 ? 'site' : 'projects'}
                  </span>
                </p>
                <p className="pf-commit-title">
                  {p ? <a href={`#work-${p.id}`}>{e.title}</a> : e.title}
                </p>
                {e.note && <p className="pf-commit-note">{e.note}</p>}
                {e.shots && (
                  <div className="pf-commit-shots" data-n={e.shots.length}>
                    {e.shots.map((s) => (
                      <Shot key={s} src={s} alt={`olivernguyen.com, ${e.title}`} label={`olivernguyen.com · ${e.date.slice(0, 7)}`} ratio="16 / 11" />
                    ))}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </Block>
  );
};

/* ------------------------------------------------------------------ */
const Making = () => (
  <Block id="making" cmd="cat ~/off-screen/*.log" comment="Making away from the keyboard">
    <h2 className="pf-h2">Off the screen</h2>
    <p className="pf-sub">Robots, cars, factory floors and keyboards. Same habit: find what bugs people, then build the fix.</p>
    <div className="pf-making">
      {making.map((m) => (
        <article key={m.name} className="pf-card">
          <p className="pf-card-file">
            <span className="pf-dim">==&gt;</span> {m.name}.log <span className="pf-dim">&lt;==</span>
          </p>
          <p className="pf-card-role">{m.role}</p>
          <ul>
            {m.lines.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
        </article>
      ))}
    </div>
  </Block>
);

/* ------------------------------------------------------------------ */
const Contact = () => {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(EMAIL);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      window.location.href = `mailto:${EMAIL}`;
    }
  };
  return (
    <Block id="contact" cmd="./contact --open" comment="Contact">
      <h2 className="pf-h2 pf-h2-big">
        Say hi<span className="pf-name-cursor" aria-hidden="true" />
      </h2>
      <div className="pf-contact">
        <button type="button" className="pf-btn pf-btn-primary pf-btn-lg" onClick={copy}>
          {copied ? 'copied ✓' : EMAIL}
        </button>
        <a className="pf-btn" href={meta.links.github} target="_blank" rel="noreferrer">
          github ↗
        </a>
        <a className="pf-btn" href={meta.links.linkedin} target="_blank" rel="noreferrer">
          linkedin ↗
        </a>
        <a className="pf-btn" href={meta.links.resume} target="_blank" rel="noreferrer">
          resume.pdf ↗
        </a>
      </div>
      <p className="pf-foot pf-dim">
        <Slash size={12} /> brand borrowed from clarity, which I also designed · built with React + Vite · © 2026 Oliver Nguyen
      </p>
    </Block>
  );
};

/* ------------------------------------------------------------------ */
/* The live prompt: a tiny shell for visitors who want to type.        */
const HELP = [
  'help        this list',
  'ls          list projects',
  'open <name> open a project (e.g. open clarity)',
  'log         jump to the evolution log',
  'contact     email + links',
  'theme       flip light / dark',
  'clear       clear this output',
];

const Shell = ({ go, toggleTheme }) => {
  const [value, setValue] = useState('');
  const [out, setOut] = useState([]);
  const [hist, setHist] = useState([]);
  const [hi, setHi] = useState(-1);
  const inputRef = useRef(null);

  const run = (raw) => {
    const line = raw.trim();
    if (!line) return;
    setHist((h) => [line, ...h].slice(0, 30));
    setHi(-1);
    const [cmd, ...rest] = line.split(/\s+/);
    const arg = rest.join(' ').toLowerCase();
    const say = (lines) => setOut((o) => [...o, { cmd: line, lines }].slice(-4));
    switch (cmd.toLowerCase()) {
      case 'help':
      case '?':
        return say(HELP);
      case 'ls':
        go('work');
        return say(work.map((p) => `${p.name.padEnd(13)} ${p.kind}`));
      case 'open':
      case 'cd': {
        const p = work.find((w) => w.id === arg || w.name === arg.replace(/\/$/, ''));
        if (p) {
          go(`work-${p.id}`);
          return say([`→ ${p.name}: ${p.synopsis}`]);
        }
        const win = windows.find((w) => w.label === arg || w.id === arg);
        if (win) {
          go(win.id);
          return say([`→ ${win.label}`]);
        }
        return say([`no such project: ${arg || '(none)'} · try ls`]);
      }
      case 'log':
      case 'git':
        go('log');
        return say(['→ git log --graph --all']);
      case 'contact':
      case 'email':
        go('contact');
        return say([EMAIL]);
      case 'whoami':
        return say([`${meta.name} · ${intro.kicker}`]);
      case 'theme':
        toggleTheme();
        return say(['theme flipped']);
      case 'clear':
        return setOut([]);
      case 'sudo':
        return say(['nice try']);
      default:
        return say([`zsh: command not found: ${cmd} · type help`]);
    }
  };

  const onKey = (e) => {
    if (e.key === 'Enter') {
      run(value);
      setValue('');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const n = Math.min(hi + 1, hist.length - 1);
      if (n >= 0) {
        setHi(n);
        setValue(hist[n]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const n = hi - 1;
      setHi(n);
      setValue(n >= 0 ? hist[n] : '');
    } else if (e.key === 'Tab') {
      const names = [...work.map((w) => `open ${w.name}`), 'help', 'ls', 'log', 'contact', 'theme', 'clear'];
      const m = names.find((n) => n.startsWith(value) && n !== value);
      if (m && value) {
        e.preventDefault();
        setValue(m);
      }
    } else if (e.key === 'Escape') {
      setValue('');
      inputRef.current?.blur();
    }
  };

  return (
    <div className="pf-shell">
      {out.length > 0 && (
        <div className="pf-shell-out" aria-live="polite">
          {out.map((o, i) => (
            <div key={i}>
              <p className="pf-dim">$ {o.cmd}</p>
              {o.lines.map((l) => (
                <p key={l}>{l}</p>
              ))}
            </div>
          ))}
        </div>
      )}
      <label className="pf-shell-line">
        <PS1 />
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKey}
          placeholder="type help"
          spellCheck={false}
          autoCapitalize="off"
          autoComplete="off"
          aria-label="Terminal command"
          enterKeyHint="go"
        />
      </label>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Status bar: tmux-style windows, live clock, scroll percent.          */
const useClock = () => {
  const fmt = () =>
    new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/Los_Angeles' });
  const [t, setT] = useState(fmt);
  useEffect(() => {
    const id = setInterval(() => setT(fmt()), 20000);
    return () => clearInterval(id);
  }, []);
  return t;
};

const StatusBar = ({ active, pct, go }) => {
  const clock = useClock();
  return (
    <nav className="pf-status" aria-label="Sections">
      <span className="pf-status-session">
        <Slash size={12} /> on
      </span>
      <ol className="pf-status-wins">
        {windows.map((w) => (
          <li key={w.id}>
            <a
              href={`#${w.id}`}
              aria-current={active === w.id ? 'true' : undefined}
              onClick={(e) => {
                e.preventDefault();
                go(w.id);
              }}
            >
              {w.n}:{w.label}
              {active === w.id ? '*' : ''}
            </a>
          </li>
        ))}
      </ol>
      <span className="pf-status-right">
        <span className="pf-status-pct">{pct}%</span>
        <span className="pf-status-clock">{clock} PT</span>
      </span>
    </nav>
  );
};

/* ------------------------------------------------------------------ */
const usePfTheme = () => {
  const { theme, setTheme } = useSiteTheme();
  const dark = theme === 'dark';
  const toggle = useCallback(() => setTheme(dark ? 'light' : 'dark'), [dark, setTheme]);
  useEffect(() => {
    const m = document.querySelector('meta[name="theme-color"]');
    if (m) m.setAttribute('content', dark ? '#191513' : '#fcf9f4');
  }, [dark]);
  return { dark, toggle };
};

export const Portfolio = () => {
  const [active, setActive] = useState('top');
  const [pct, setPct] = useState(0);
  const { dark, toggle } = usePfTheme();

  const go = useCallback((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start' });
    history.replaceState(null, '', `#${id}`);
  }, []);

  useEffect(() => {
    const ids = windows.map((w) => w.id);
    const onScroll = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      setPct(max > 0 ? Math.round((window.scrollY / max) * 100) : 0);
      let cur = ids[0];
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top < window.innerHeight * 0.35) cur = id;
      }
      setActive(cur);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      const t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const w = windows.find((x) => String(x.n) === e.key);
      if (w) {
        e.preventDefault();
        go(w.id);
      } else if (e.key === '/' || e.key === ':') {
        e.preventDefault();
        document.querySelector('.pf-shell input')?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go]);

  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (id) setTimeout(() => document.getElementById(id)?.scrollIntoView(), 50);
  }, []);

  return (
    <div className="pf">
      <header className="pf-top">
        <a className="pf-logo" href="#top" onClick={(e) => { e.preventDefault(); go('top'); }}>
          <Slash size={20} />
          <span>oliver nguyen</span>
        </a>
        <span className="pf-top-path pf-dim" aria-hidden="true">
          ~/portfolio — zsh — 120×{Math.max(40, Math.round(pct / 2) + 40)}
        </span>
        <button type="button" className="pf-icon-btn" onClick={toggle} aria-label={dark ? 'Switch to light' : 'Switch to dark'}>
          {dark ? '☀' : '☾'}
        </button>
      </header>
      <main className="pf-main">
        <Hero />
        <Work />
        <Evolution />
        <Making />
        <Contact />
      </main>
      <div className="pf-dock">
        <Shell go={go} toggleTheme={toggle} />
        <StatusBar active={active} pct={pct} go={go} />
      </div>
    </div>
  );
};

export default Portfolio;
