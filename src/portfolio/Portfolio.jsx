/**
 * src/portfolio/Portfolio.jsx — terminal portfolio home (D-37, revised 2026-11-20).
 *
 * whoami hero, one section per project (screenshot + short blurb), a short
 * "off screen" list with the resume, contact. Screenshots only: a live
 * iframe would show a broken page whenever a project site is down.
 *
 * Type matches clarity exactly: Geologica, SHRP 100, body 410, display 760
 * at -0.05em. Mono only for prompt lines.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { EMAIL, intro, making, meta, windows, work } from './content.js';
import { Moon, Sun } from 'lucide-react';
import { useTheme as useSiteTheme } from '../theme/ThemeProvider.jsx';
import './portfolio.css';

const reducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export const Slash = ({ size = 18 }) => (
  <svg className="pf-slash" viewBox="0 0 32 32" width={size} height={size} aria-hidden="true">
    <path d="M1 18.01L31 2.49L31 13.99L1 29.51Z" />
  </svg>
);

const PS1 = () => (
  <span className="pf-ps1" aria-hidden="true">
    <b>{meta.user}@{meta.host}</b>
    <i>:~$</i>
  </span>
);

const useInView = (ref, margin = '200px 0px') => {
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (seen || !el) return undefined;
    if (typeof IntersectionObserver === 'undefined') return setSeen(true);
    const io = new IntersectionObserver((es) => {
      if (es.some((e) => e.isIntersecting)) {
        setSeen(true);
        io.disconnect();
      }
    }, { rootMargin: margin });
    io.observe(el);
    return () => io.disconnect();
  }, [ref, seen, margin]);
  return seen;
};

const useTyped = (text, start) => {
  const instant = reducedMotion();
  const [n, setN] = useState(instant ? text.length : 0);
  useEffect(() => {
    if (instant || !start) return undefined;
    let i = 0;
    let t;
    const tick = () => {
      i += 1;
      setN(i);
      if (i < text.length) t = setTimeout(tick, 38 + Math.random() * 30);
    };
    t = setTimeout(tick, 150);
    return () => clearTimeout(t);
  }, [start, text, instant]);
  return { typed: text.slice(0, n), done: n >= text.length };
};

const Cmd = ({ text, start = true, onDone }) => {
  const { typed, done } = useTyped(text, start);
  useEffect(() => {
    if (done) onDone?.();
  }, [done, onDone]);
  return (
    <p className="pf-cmd">
      <PS1 /> <span>{typed}</span>
      {!done && <span className="pf-caret" aria-hidden="true" />}
      <span className="pf-sr">{text}</span>
    </p>
  );
};

/** A section that types its command when scrolled into view. */
const Block = ({ id, cmd, title, children }) => {
  const ref = useRef(null);
  const seen = useInView(ref, '0px 0px -15% 0px');
  const [done, setDone] = useState(reducedMotion());
  const finish = useCallback(() => setDone(true), []);
  return (
    <section id={id} ref={ref} className="pf-block" data-done={done || undefined} aria-label={title}>
      <Cmd text={cmd} start={seen} onDone={finish} />
      <div className="pf-out">{children}</div>
    </section>
  );
};

/* ---------------- screenshot ---------------- */
const Shot = ({ p }) => (
  <div className="pf-preview">
    <img src={p.shot} alt={`${p.name} screenshot`} className="pf-preview-still" loading="lazy" decoding="async" width="1440" height="900" />
  </div>
);

const Phones = ({ p }) => (
  <div className="pf-phones">
    {p.phones.map((src, k) => (
      <img key={src} src={src} alt={`${p.name} screen ${k + 1}`} loading="lazy" decoding="async" width="500" height="844" />
    ))}
  </div>
);

const Project = ({ p, i }) => {
  const frame = p.phones ? <Phones p={p} /> : (
    <div className="pf-card">
      <div className="pf-card-bar">
        <span className="pf-dots" aria-hidden="true"><i /><i /><i /></span>
        <span className="pf-card-url">{p.hrefLabel || 'not public yet'}</span>
      </div>
      <Shot p={p} />
    </div>
  );
  return (
    <article className="pf-project" id={`p-${p.id}`}>
      <div className="pf-project-text">
        <p className="pf-project-idx">{String(i + 1).padStart(2, '0')} · {p.kind}</p>
        <h3>{p.name}</h3>
        <p className="pf-project-line">{p.line}</p>
        <p className="pf-blurb">{p.blurb}</p>
        {p.href ? (
          <a className="pf-visit" href={p.href} target="_blank" rel="noreferrer">
            Visit {p.name} <span aria-hidden="true">↗</span>
          </a>
        ) : (
          <p className="pf-visit pf-visit-off">{p.status}</p>
        )}
      </div>
      {p.href ? (
        <a className="pf-project-media" href={p.href} target="_blank" rel="noreferrer" tabIndex={-1} aria-hidden="true">{frame}</a>
      ) : (
        <div className="pf-project-media">{frame}</div>
      )}
    </article>
  );
};

/* ---------------- sections ---------------- */
const Hero = () => {
  const [done, setDone] = useState(reducedMotion());
  const finish = useCallback(() => setDone(true), []);
  return (
    <section id="top" className="pf-hero" aria-label="Introduction">
      <Cmd text="whoami" onDone={finish} />
      <div className="pf-hero-body" data-show={done || undefined}>
        <p className="pf-kicker"><Slash size={14} /> {intro.kicker}</p>
        <h1 className="pf-name">
          Oliver Nguyen<span className="pf-cursor" aria-hidden="true" />
        </h1>
        <p className="pf-lede">{intro.lede}</p>
        <div className="pf-actions">
          <a className="pf-btn pf-btn-primary" href="#work">See work</a>
          <a className="pf-btn" href={meta.links.resume} target="_blank" rel="noreferrer">Resume</a>
        </div>
      </div>
    </section>
  );
};

const Work = () => (
  <Block id="work" cmd="ls ./work" title="Work">
    <div className="pf-projects">
      {work.map((p, i) => (
        <Project key={p.id} p={p} i={i} />
      ))}
    </div>
  </Block>
);

const Making = () => (
  <Block id="making" cmd="cat off-screen.txt" title="Off screen">
    <div className="pf-making">
      <ul>
        {making.map((m) => (
          <li key={m.name}>
            <span className="pf-making-name">{m.name}</span>
            <span className="pf-making-role">{m.role}</span>
            <span className="pf-making-fact">{m.fact}</span>
          </li>
        ))}
      </ul>
      <a className="pf-btn" href={meta.links.resume} target="_blank" rel="noreferrer">Full resume ↗</a>
    </div>
  </Block>
);

const Contact = () => {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(EMAIL);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      window.location.href = `mailto:${EMAIL}`;
    }
  };
  return (
    <Block id="contact" cmd="./contact" title="Contact">
      <h2 className="pf-h2">Say hi<span className="pf-cursor" aria-hidden="true" /></h2>
      <div className="pf-actions">
        <button type="button" className="pf-btn pf-btn-primary" onClick={copy}>
          {copied ? 'Copied' : EMAIL}
        </button>
        <a className="pf-btn" href={meta.links.github} target="_blank" rel="noreferrer">GitHub</a>
        <a className="pf-btn" href={meta.links.linkedin} target="_blank" rel="noreferrer">LinkedIn</a>
      </div>
    </Block>
  );
};

/* ---------------- chrome ---------------- */
const PAGES = [
  { group: 'Projects', items: [['PULL', '/pull'], ['Emoji', '/emoji']] },
  { group: 'College', items: [['Major', '/major'], ['Apply', '/apply'], ['Studio', '/studio'], ['Transfer', '/transfer']] },
  { group: 'Driving', items: [['Permit', '/permit'], ['License', '/license']] },
  { group: 'SAT', items: [['Resources', '/sat-resources'], ['Sign up', '/sat-signup']] },
];

const PagesMenu = () => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => {
      if (e.type === 'keydown' ? e.key === 'Escape' : !ref.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('pointerdown', close);
      document.removeEventListener('keydown', close);
    };
  }, [open]);
  return (
    <div className="pf-pages" ref={ref}>
      <button type="button" className="pf-pages-btn" aria-expanded={open} aria-haspopup="true" onClick={() => setOpen((o) => !o)}>
        Pages
      </button>
      {open && (
        <div className="pf-pages-menu" role="menu">
          {PAGES.map((g) => (
            <div key={g.group} className="pf-pages-group">
              <p>{g.group}</p>
              {g.items.map(([label, href]) => (
                <a key={href} href={href} role="menuitem">{label}</a>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const StatusBar = ({ active, go }) => (
  <nav className="pf-status" aria-label="Sections">
    <span className="pf-status-session"><Slash size={12} /></span>
    <ol>
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
          </a>
        </li>
      ))}
    </ol>
  </nav>
);

export const Portfolio = () => {
  const [active, setActive] = useState('top');
  const { theme, setTheme } = useSiteTheme();
  const dark = theme === 'dark';

  useEffect(() => {
    const m = document.querySelector('meta[name="theme-color"]');
    if (m) m.setAttribute('content', dark ? '#191513' : '#fcf9f4');
  }, [dark]);

  const go = useCallback((id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth' });
    history.replaceState(null, '', `#${id}`);
  }, []);

  useEffect(() => {
    const onScroll = () => {
      let cur = windows[0].id;
      for (const w of windows) {
        const el = document.getElementById(w.id);
        if (el && el.getBoundingClientRect().top < window.innerHeight * 0.4) cur = w.id;
      }
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) cur = windows.at(-1).id;
      setActive(cur);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey || /INPUT|TEXTAREA/.test(e.target?.tagName)) return;
      const w = windows.find((x) => String(x.n) === e.key);
      if (w) go(w.id);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go]);

  return (
    <div className="pf">
      <header className="pf-top">
        <a className="pf-logo" href="#top" onClick={(e) => { e.preventDefault(); go('top'); }}>
          <Slash size={20} />
          <span>oliver nguyen</span>
        </a>
        <div className="pf-top-right">
        <PagesMenu />
        <button
          type="button"
          className="pf-icon-btn"
          onClick={() => setTheme(dark ? 'light' : 'dark')}
          aria-label={dark ? 'Switch to light' : 'Switch to dark'}
        >
          {dark ? <Sun size={18} strokeWidth={1.75} aria-hidden="true" /> : <Moon size={18} strokeWidth={1.75} aria-hidden="true" />}
        </button>
        </div>
      </header>
      <main className="pf-main">
        <Hero />
        <Work />
        <Making />
        <Contact />
      </main>
      <StatusBar active={active} go={go} />
    </div>
  );
};

export default Portfolio;
