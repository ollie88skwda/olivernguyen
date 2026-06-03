import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import "@fontsource-variable/bricolage-grotesque";
import "@fontsource-variable/inter";
import EvasiveNoButton from "./EvasiveNoButton";
import YesCelebration from "./YesCelebration";
import "./styles.css";

const SUBTITLES = [
  "67% sure you already know the answer",
  "it's a yes or no question",
  "no pressure though",
  "the no button is being kinda shy",
  "ok now it's just being silly",
  "this is getting dramatic ngl",
  "67/10 chance you pick yes anyway",
  "the suspense is killing me",
  "at this point just click yes lol",
];

function FloatingSixtySevens({ reduce }) {
  const sixties = useMemo(
    () =>
      Array.from({ length: 9 }, (_, i) => ({
        id: i,
        x: 6 + Math.random() * 88,
        y: 18 + Math.random() * 70,
        delay: Math.random() * 4,
        duration: 7 + Math.random() * 5,
        size: 0.55 + Math.random() * 0.9,
        drift: (Math.random() - 0.5) * 40,
      })),
    []
  );
  if (reduce) return null;
  return (
    <div aria-hidden className="bmgf-floaters">
      {sixties.map((s) => (
        <motion.span
          key={s.id}
          className="bmgf-sixty"
          style={{ left: `${s.x}%`, top: `${s.y}%`, fontSize: `${s.size * 2.2}rem` }}
          initial={{ opacity: 0, y: 30 }}
          animate={{
            opacity: [0, 0.16, 0.16, 0],
            y: [10, -120],
            x: [0, s.drift],
            rotate: [0, s.drift * 0.8],
          }}
          transition={{
            duration: s.duration,
            delay: s.delay,
            repeat: Infinity,
            ease: "linear",
            opacity: {
              duration: s.duration,
              delay: s.delay,
              repeat: Infinity,
              times: [0, 0.2, 0.8, 1],
            },
          }}
        >
          67
        </motion.span>
      ))}
    </div>
  );
}

function AskScreen({ onYes, reduce }) {
  const [evadeCount, setEvadeCount] = useState(0);
  const subtitleIdx = Math.min(evadeCount, SUBTITLES.length - 1);

  return (
    <motion.section
      initial={reduce ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.92, filter: "blur(8px)" }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="bmgf-section"
    >
      <FloatingSixtySevens reduce={reduce} />

      <motion.h1
        initial={reduce ? false : { y: 28, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="bmgf-headline"
      >
        do you want to be my{" "}
        <span className="bmgf-headline-accent">
          girlfriend
          <motion.span
            aria-hidden
            className="bmgf-headline-underline"
            initial={reduce ? false : { scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.9, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
          />
        </span>
        ?
      </motion.h1>

      <motion.p
        key={subtitleIdx}
        initial={reduce ? false : { y: 8, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="bmgf-subtitle"
      >
        {SUBTITLES[subtitleIdx]}
      </motion.p>

      <motion.div
        initial={reduce ? false : { y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="bmgf-buttons"
      >
        <button
          type="button"
          onClick={onYes}
          aria-label="Yes, be your girlfriend"
          className="bmgf-yes"
        >
          <span style={{ position: "relative", zIndex: 10 }}>yes</span>
          <span aria-hidden className="bmgf-yes-grad" />
        </button>

        <EvasiveNoButton onEvade={() => setEvadeCount((c) => c + 1)} reduce={reduce} />
      </motion.div>

      <motion.p
        initial={reduce ? false : { opacity: 0 }}
        animate={{ opacity: evadeCount === 0 ? 1 : 0 }}
        transition={{ duration: 0.6, delay: evadeCount === 0 ? 1.8 : 0 }}
        className="bmgf-hint"
      >
        pick one
      </motion.p>
    </motion.section>
  );
}

export default function BeMyGirlfriend() {
  const [phase, setPhase] = useState("asking");
  const reduce = useReducedMotion();

  useEffect(() => {
    const prevTitle = document.title;
    const prevBg = document.body.style.backgroundColor;
    const prevOverflow = document.body.style.overflow;
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    const prevTheme = themeMeta ? themeMeta.getAttribute("content") : null;

    document.title = "a very important question";
    document.body.style.backgroundColor = "#092441";
    document.body.style.overflow = "hidden";
    if (themeMeta) themeMeta.setAttribute("content", "#092441");

    return () => {
      document.title = prevTitle;
      document.body.style.backgroundColor = prevBg;
      document.body.style.overflow = prevOverflow;
      if (themeMeta && prevTheme !== null) themeMeta.setAttribute("content", prevTheme);
    };
  }, []);

  return (
    <main className="bmgf-root">
      <div aria-hidden className="bmgf-glow" />
      <div aria-hidden className="bmgf-grain" />
      <AnimatePresence mode="wait">
        {phase === "asking" ? (
          <AskScreen key="ask" onYes={() => setPhase("accepted")} reduce={!!reduce} />
        ) : (
          <YesCelebration key="celebrate" reduce={!!reduce} />
        )}
      </AnimatePresence>
    </main>
  );
}
