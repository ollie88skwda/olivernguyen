/* /mom (alias /mum) — Doris's 50th. Unlisted: nothing links here.
 *
 * Mobile only by design: the whole thing lives in a phone-width column that is
 * merely centred on a desktop. Plain React and CSS animations, no animation or
 * confetti library, no network calls — the content is personal.
 *
 * Flow: opening (once) → tap-through deck of the fifty → reason 50 alone →
 * grid of all fifty. Later visits: short opening → the live age → back where
 * she left off. Progress lives in localStorage; if it is cleared the page
 * simply starts again from the opening. */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { REASONS, TOTAL } from "./reasons";
import { ageState } from "./age";
import "./styles.css";

const KEY_SEEN = "mom50.seenOpening";
const KEY_DONE = "mom50.deckDone";
const KEY_OPENED = "mom50.opened";
const KEY_INDEX = "mom50.index";

// localStorage throws in private mode and when storage is disabled; the page
// still has to work, it just forgets.
//
// The page shipped as /mum first and wrote "mum50.*" keys, so a read falls back
// to the old name: whoever already opened the shared link keeps their progress.
// Writes only ever use the new name, so the old keys just go stale.
const readStore = (key) => {
  try {
    const value = window.localStorage.getItem(key);
    return value === null ? window.localStorage.getItem(key.replace("mom50.", "mum50.")) : value;
  } catch {
    return null;
  }
};
const writeStore = (key, value) => {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* forgetting is fine */
  }
};

const loadOpened = () => {
  try {
    const raw = JSON.parse(readStore(KEY_OPENED));
    if (!Array.isArray(raw)) return new Set();
    return new Set(raw.filter((n) => Number.isInteger(n) && n >= 1 && n <= TOTAL));
  } catch {
    return new Set();
  }
};

const loadIndex = () => {
  const n = Number.parseInt(readStore(KEY_INDEX), 10);
  return Number.isInteger(n) && n >= 0 && n < TOTAL ? n : 0;
};

const pad = (n) => String(n).padStart(2, "0");

function usePrefersReducedMotion() {
  const query = "(prefers-reduced-motion: reduce)";
  const [reduce, setReduce] = useState(
    () => typeof window !== "undefined" && !!window.matchMedia && window.matchMedia(query).matches
  );
  useEffect(() => {
    if (!window.matchMedia) return undefined;
    const mq = window.matchMedia(query);
    const onChange = (event) => setReduce(event.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduce;
}

/** A Date that re-reads the clock every second, but only while it is on screen. */
function useTickingNow(active) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    if (!active) return undefined;
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, [active]);
  return now;
}

const CONFETTI_COLOURS = ["#c9a8e4", "#f7f0e2", "#7c3aab", "#a86fd0", "#e7d3f6"];

/* Pure CSS confetti: one absolutely positioned sliver per piece, animating only
 * transform and opacity so the whole thing stays on the compositor. Randomised
 * once with useMemo — re-randomising on render would make it jitter. */
function Confetti({ count, layer, seedKey }) {
  const bits = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: `${seedKey}-${i}`,
        left: Math.random() * 100,
        delay: -Math.random() * 3.4,
        duration: 2.6 + Math.random() * 2.4,
        drift: Math.round((Math.random() - 0.5) * 90),
        spin: Math.round(240 + Math.random() * 620) * (Math.random() < 0.5 ? -1 : 1),
        width: layer === "front" ? 6 + Math.random() * 4 : 4 + Math.random() * 3,
        height: layer === "front" ? 10 + Math.random() * 8 : 7 + Math.random() * 6,
        colour: CONFETTI_COLOURS[i % CONFETTI_COLOURS.length],
        round: i % 7 === 0,
      })),
    [count, layer, seedKey]
  );

  return (
    <div className={`mom-confetti mom-confetti--${layer}`} aria-hidden="true">
      {bits.map((bit) => (
        <i
          key={bit.id}
          style={{
            left: `${bit.left}%`,
            width: `${bit.width}px`,
            height: `${bit.height}px`,
            background: bit.colour,
            borderRadius: bit.round ? "50%" : "1px",
            animationDelay: `${bit.delay}s`,
            animationDuration: `${bit.duration}s`,
            "--mom-drift": `${bit.drift}px`,
            "--mom-spin": `${bit.spin}deg`,
          }}
        />
      ))}
    </div>
  );
}

/** The outlined 50 that fills with purple from the bottom. */
function FillingFifty({ short }) {
  return (
    <div className={`mom-fifty${short ? " mom-fifty--short" : ""}`} aria-hidden="true">
      50
      <span className="mom-fifty-fill">50</span>
    </div>
  );
}

function OpeningScreen({ onBegin, reduce }) {
  return (
    <section className="mom-screen mom-screen--opening">
      {!reduce && <Confetti count={40} layer="back" seedKey="open-back" />}
      <FillingFifty />
      <h1 className="mom-cap">Happy Birthday, Mom</h1>
      <p className="mom-eyebrow mom-cap-sub">Doris · 20 August 1976</p>
      {!reduce && <Confetti count={18} layer="front" seedKey="open-front" />}
      <p className="mom-begin" aria-hidden="true">
        Tap to begin
      </p>
      <button type="button" className="mom-fullzone" onClick={onBegin} aria-label="Begin" />
    </section>
  );
}

function AgeScreen({ onContinue }) {
  const now = useTickingNow(true);
  const state = ageState(now);
  const [heading, headingRest] = state.heading.split("\n");

  return (
    <section className="mom-screen mom-screen--age">
      <div className="mom-age-body">
        <h1 className="mom-age-hi">
          {heading}
          <br />
          {headingRest}
        </h1>
        <span className="mom-card-rule mom-age-rule" aria-hidden="true" />
        <p className="mom-eyebrow mom-age-lead">{state.lead}</p>
        <p className="mom-age-figure">{state.sentence}</p>
        <p className="mom-age-foot">
          {state.mode === "age"
            ? "Still counting. Tap to read your fifty again."
            : "Not long now. Tap to read your fifty again."}
        </p>
      </div>
      <p className="mom-begin" aria-hidden="true">
        Tap to carry on
      </p>
      <button
        type="button"
        className="mom-fullzone"
        onClick={onContinue}
        aria-label="Read the fifty reasons"
      />
    </section>
  );
}

/* The card is always full height, so short reasons would otherwise sit in a
 * pool of cream. Three length bands instead: the shorter the reason, the bigger
 * it is set, so every card fills its space and the words are as large as they
 * can be. Bands rather than measured auto-fit — the wording is fixed and every
 * one of the fifty is checked against the smallest supported phone. */
const sizeBand = (text) =>
  text.length <= 30 ? " mom-card-text--xl" : text.length <= 60 ? " mom-card-text--lg" : "";

/** One reason, cream card on deep purple. Used by the deck and by the grid. */
function ReasonCard({ number, text, isFinal }) {
  return (
    <article className={`mom-card${isFinal ? " mom-card--final" : ""}`}>
      <span className="mom-card-num">{pad(number)}</span>
      <p className={`mom-card-text${sizeBand(text)}`}>{text}</p>
      <span className="mom-card-rule" aria-hidden="true" />
    </article>
  );
}

/* The page's standing header while she reads. It sits above the card in the
 * flex column and the card takes whatever is left, so the title is always on
 * screen and never pushes the card off it. Shared by the deck and the grid's
 * reader overlay. */
function ReadingHead({ index, trailing }) {
  return (
    <header className="mom-head">
      <h1 className="mom-standing">
        Reasons
        <br />
        We Love You
      </h1>
      <div className="mom-head-side">
        <span className="mom-count">
          {pad(index + 1)}
          <span className="mom-count-total">/{TOTAL}</span>
        </span>
        {trailing}
      </div>
    </header>
  );
}

function DeckScreen({ index, onNext, onBack, isFinal, reduce }) {
  return (
    <section className="mom-screen mom-screen--deck">
      {isFinal && !reduce && <Confetti count={26} layer="back" seedKey="final-back" />}
      <ReadingHead index={index} />

      <button
        type="button"
        className="mom-tapzone"
        onClick={onNext}
        aria-label={isFinal ? "Show all fifty" : "Next reason"}
      >
        <ReasonCard key={index} number={index + 1} text={REASONS[index]} isFinal={isFinal} />
      </button>

      <footer className="mom-foot">
        <button
          type="button"
          className="mom-back"
          onClick={onBack}
          disabled={index === 0}
          aria-label="Previous reason"
        >
          ← back
        </button>
        <span className="mom-eyebrow mom-foot-hint">
          {isFinal ? "that's all fifty" : "tap to keep going"}
        </span>
      </footer>

      <div className="mom-progress" aria-hidden="true">
        <span style={{ transform: `scaleX(${(index + 1) / TOTAL})` }} />
      </div>
    </section>
  );
}

function GridScreen({ opened, onPick, reduce }) {
  const now = useTickingNow(true);
  const state = ageState(now);
  const readCount = opened.size;

  return (
    <section className={`mom-screen mom-screen--grid${reduce ? " mom-no-anim" : ""}`}>
      <div className="mom-scroll">
        <header className="mom-grid-head">
          <p className="mom-eyebrow">Doris · 20 August 1976</p>
          <h1 className="mom-grid-title">
            Fifty reasons
            <br />
            we love you
          </h1>
          <p className="mom-grid-sub">
            {readCount === TOTAL
              ? "All fifty read. Tap any number to read it again."
              : `${readCount} of ${TOTAL} read. Tap any number.`}
          </p>
        </header>

        <ul className="mom-grid">
          {REASONS.map((_, i) => (
            <li key={i}>
              <button
                type="button"
                style={{ "--i": i }}
                className={`mom-tile${opened.has(i + 1) ? " is-open" : ""}`}
                onClick={() => onPick(i)}
                aria-label={`Reason ${i + 1}`}
              >
                {pad(i + 1)}
              </button>
            </li>
          ))}
        </ul>

        <footer className="mom-grid-foot">
          <p className="mom-eyebrow">{state.lead}</p>
          <p className="mom-age-figure mom-age-figure--small">{state.sentence}</p>
        </footer>
      </div>
    </section>
  );
}

function ReaderOverlay({ index, onNext, onPrev, onClose }) {
  return (
    <div className="mom-overlay" role="dialog" aria-modal="true" aria-label={`Reason ${index + 1}`}>
      <ReadingHead
        index={index}
        trailing={
          <button type="button" className="mom-close" onClick={onClose}>
            all fifty ✕
          </button>
        }
      />

      <button type="button" className="mom-tapzone" onClick={onNext} aria-label="Next reason">
        <ReasonCard key={index} number={index + 1} text={REASONS[index]} />
      </button>

      <footer className="mom-foot">
        <button
          type="button"
          className="mom-back"
          onClick={onPrev}
          disabled={index === 0}
          aria-label="Previous reason"
        >
          ← back
        </button>
        <span className="mom-eyebrow mom-foot-hint">tap to keep going</span>
      </footer>
    </div>
  );
}

export default function MomFifty() {
  const reduce = usePrefersReducedMotion();
  const [phase, setPhase] = useState(() => (readStore(KEY_SEEN) === "1" ? "returning" : "opening"));
  const [index, setIndex] = useState(loadIndex);
  const [opened, setOpened] = useState(loadOpened);
  const [focus, setFocus] = useState(null); // reason opened from the grid
  const deckDone = useRef(readStore(KEY_DONE) === "1");

  useEffect(() => {
    const prevTitle = document.title;
    const prevBg = document.body.style.backgroundColor;
    const prevOverflow = document.body.style.overflow;
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    const prevTheme = themeMeta ? themeMeta.getAttribute("content") : null;

    document.title = "Happy 50th, Mom";
    document.body.style.backgroundColor = "#2c0d45";
    document.body.style.overflow = "hidden";
    if (themeMeta) themeMeta.setAttribute("content", "#2c0d45");

    return () => {
      document.title = prevTitle;
      document.body.style.backgroundColor = prevBg;
      document.body.style.overflow = prevOverflow;
      if (themeMeta && prevTheme !== null) themeMeta.setAttribute("content", prevTheme);
    };
  }, []);

  const markOpened = useCallback((n) => {
    setOpened((prev) => {
      if (prev.has(n)) return prev;
      const next = new Set(prev);
      next.add(n);
      writeStore(KEY_OPENED, JSON.stringify([...next]));
      return next;
    });
  }, []);

  const showDeck = useCallback(
    (nextIndex) => {
      setIndex(nextIndex);
      writeStore(KEY_INDEX, String(nextIndex));
      markOpened(nextIndex + 1);
      setPhase("deck");
    },
    [markOpened]
  );

  const finishDeck = useCallback(() => {
    deckDone.current = true;
    writeStore(KEY_DONE, "1");
    setPhase("grid");
  }, []);

  // Returning visit: the short opening plays, then the live age takes over.
  useEffect(() => {
    if (phase !== "returning") return undefined;
    const id = setTimeout(() => setPhase("age"), reduce ? 0 : 1900);
    return () => clearTimeout(id);
  }, [phase, reduce]);

  // Reason 50 lands alone and holds a beat before the grid resolves in.
  const isFinal = phase === "deck" && index === TOTAL - 1;
  useEffect(() => {
    if (!isFinal) return undefined;
    const id = setTimeout(finishDeck, reduce ? 2200 : 4200);
    return () => clearTimeout(id);
  }, [isFinal, finishDeck, reduce]);

  const begin = useCallback(() => {
    writeStore(KEY_SEEN, "1");
    if (deckDone.current) {
      setPhase("grid");
      return;
    }
    showDeck(index);
  }, [index, showDeck]);

  const openFromGrid = useCallback(
    (i) => {
      setFocus(i);
      markOpened(i + 1);
    },
    [markOpened]
  );

  const stepFocus = useCallback(
    (delta) => {
      setFocus((current) => {
        const next = current + delta;
        if (next < 0 || next >= TOTAL) return current;
        markOpened(next + 1);
        return next;
      });
    },
    [markOpened]
  );

  return (
    <main className={`mom-root${reduce ? " mom-reduce" : ""}`}>
      <div className="mom-phone">
        {phase === "opening" && <OpeningScreen onBegin={begin} reduce={reduce} />}

        {phase === "returning" && (
          <section className="mom-screen mom-screen--opening">
            {!reduce && <Confetti count={22} layer="back" seedKey="ret-back" />}
            <FillingFifty short />
            <h1 className="mom-cap">Happy Birthday, Mom</h1>
          </section>
        )}

        {phase === "age" && (
          <AgeScreen onContinue={() => (deckDone.current ? setPhase("grid") : showDeck(index))} />
        )}

        {phase === "deck" && (
          <DeckScreen
            index={index}
            isFinal={isFinal}
            reduce={reduce}
            onNext={() => (isFinal ? finishDeck() : showDeck(index + 1))}
            onBack={() => showDeck(Math.max(0, index - 1))}
          />
        )}

        {phase === "grid" && (
          <>
            <GridScreen opened={opened} onPick={openFromGrid} reduce={reduce} />
            {focus !== null && (
              <ReaderOverlay
                index={focus}
                onNext={() => (focus === TOTAL - 1 ? setFocus(null) : stepFocus(1))}
                onPrev={() => stepFocus(-1)}
                onClose={() => setFocus(null)}
              />
            )}
          </>
        )}
      </div>
    </main>
  );
}
