/**
 * src/portfolio/Portfolio.jsx — terminal portfolio home (D-37, revised 2026-11-20).
 *
 * Compact: whoami hero, a grid of work cards, a short "off screen" list with
 * the resume, contact. Each work card previews the LIVE site in a scaled
 * iframe (so it updates whenever that site does); sites that refuse framing
 * (clarity: X-Frame-Options SAMEORIGIN) or have no public URL use a still.
 *
 * Type matches clarity exactly: Geologica, SHRP 100, body 410, display 760
 * at -0.05em. Mono only for prompt lines.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { EMAIL, intro, making, meta, windows, work } from './content.js';
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

/* ---------------- live preview ---------------- */
const FRAME_W = 1440;
const FRAME_H = 900;

const Preview = ({ p }) => {
  const box = useRef(null);
  const near = useInView(box, '400px 0px');
  const [scale, setScale] = useState(0.25);
  const [loaded, setLoaded] = useState(false);
  const live = Boolean(p.href) && !p.noFrame;

  useEffect(() => {
    const el = box.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(([e]) => setScale(e.contentRect.width / FRAME_W));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={box} className="pf-preview" data-loaded={loaded || !live || undefined}>
      <img src={p.shot} alt="" className="pf-preview-still" loading="lazy" decoding="async" />
      {live && near && (
        <iframe
          title={`${p.name}, live`}
          src={p.href}
          loading="lazy"
          tabIndex={-1}
          aria-hidden="true"
          sandbox="allow-scripts allow-same-origin"
          referrerPolicy="no-referrer"
          onLoad={() => setLoaded(true)}
          style={{ width: FRAME_W, height: FRAME_H, transform: `scale(${scale})` }}
        />
      )}
    </div>
  );
};

const WorkCard = ({ p }) => {
  const Tag = p.href ? 'a' : 'div';
  const linkProps = p.href ? { href: p.href, target: '_blank', rel: 'noreferrer' } : {};
  const live = Boolean(p.href) && !p.noFrame;
  return (
    <Tag className="pf-card" {...linkProps}>
      <div className="pf-card-bar">
        <span className="pf-dots" aria-hidden="true"><i /><i /><i /></span>
        <span className="pf-card-url">{p.hrefLabel || 'local only'}</span>
        {live && <span className="pf-live">live</span>}
      </div>
      <Preview p={p} />
      <div className="pf-card-text">
        <h3>
          {p.name}
          {p.href && <span className="pf-arrow" aria-hidden="true">↗</span>}
        </h3>
        <p>{p.line}</p>
        <p className="pf-card-meta">
          {p.tag}
          {p.status !== 'live' && <span> · {p.status}</span>}
        </p>
      </div>
    </Tag>
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
    <div className="pf-grid">
      {work.map((p) => (
        <WorkCard key={p.id} p={p} />
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
      <p className="pf-foot">© 2026 Oliver Nguyen</p>
    </Block>
  );
};

/* ---------------- chrome ---------------- */
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
        <button
          type="button"
          className="pf-icon-btn"
          onClick={() => setTheme(dark ? 'light' : 'dark')}
          aria-label={dark ? 'Switch to light' : 'Switch to dark'}
        >
          {dark ? '☀' : '☾'}
        </button>
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
