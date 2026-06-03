import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";

const BURST_COUNT = 67;
const HEADLINE = "YESSS";

function HeartSVG({ size = 24, color = "#FF4D8F" }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill={color} aria-hidden>
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  );
}

function SixtySeven({ scale }) {
  return (
    <span
      style={{
        fontFamily: "var(--bmgf-font-display)",
        fontWeight: 800,
        color: "var(--bmgf-accent)",
        fontSize: `${1.4 * scale}rem`,
        lineHeight: 1,
        letterSpacing: "-0.04em",
      }}
    >
      67
    </span>
  );
}

function BurstItem({ p, reduce }) {
  const tx = Math.cos(p.angle) * p.distance;
  const ty = Math.sin(p.angle) * p.distance;
  if (reduce) {
    return (
      <span
        className="bmgf-burst-item"
        style={{
          left: tx,
          top: ty,
          transform: `translate(-50%, -50%) scale(${p.scale}) rotate(${p.rotation}deg)`,
          opacity: 0.25,
        }}
      >
        {p.kind === "heart" ? <HeartSVG size={28} /> : <SixtySeven scale={p.scale} />}
      </span>
    );
  }
  return (
    <motion.span
      className="bmgf-burst-item"
      initial={{ x: 0, y: 0, scale: 0, rotate: 0, opacity: 0 }}
      animate={{
        x: [0, tx * 0.35, tx, tx],
        y: [0, ty * 0.35, ty, ty],
        scale: [0, p.scale * 1.25, p.scale, p.scale * 0.7],
        rotate: [0, p.rotation * 0.35, p.rotation, p.rotation * 1.1],
        opacity: [0, 1, 1, 0],
      }}
      transition={{
        duration: p.duration,
        delay: 0.55 + p.delay,
        times: [0, 0.2, 0.7, 1],
        ease: "easeOut",
      }}
    >
      {p.kind === "heart" ? <HeartSVG size={28} /> : <SixtySeven scale={p.scale} />}
    </motion.span>
  );
}

function PersistentFloaters({ reduce }) {
  const floaters = useMemo(
    () =>
      Array.from({ length: 16 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 8,
        duration: 9 + Math.random() * 7,
        size: 0.5 + Math.random() * 1.1,
        kind: i % 3 === 0 ? "sixty" : "heart",
        drift: (Math.random() - 0.5) * 80,
      })),
    []
  );
  if (reduce) return null;
  return (
    <div aria-hidden className="bmgf-floaters">
      {floaters.map((f) => (
        <motion.span
          key={f.id}
          className="bmgf-burst-item"
          initial={{ opacity: 0, y: "110vh", x: 0 }}
          animate={{
            y: ["110vh", "-20vh"],
            x: [0, f.drift],
            opacity: [0, 0.5, 0.5, 0],
            rotate: [0, 360],
          }}
          transition={{
            duration: f.duration,
            delay: f.delay + 2.6,
            repeat: Infinity,
            ease: "linear",
            opacity: {
              duration: f.duration,
              delay: f.delay + 2.6,
              repeat: Infinity,
              times: [0, 0.15, 0.85, 1],
            },
          }}
          style={{ left: `${f.x}%` }}
        >
          {f.kind === "heart" ? (
            <HeartSVG size={Math.round(24 * f.size)} color="rgba(255,77,143,0.65)" />
          ) : (
            <span
              style={{
                fontFamily: "var(--bmgf-font-display)",
                fontWeight: 800,
                color: "rgba(255,77,143,0.55)",
                fontSize: `${f.size * 1.5}rem`,
                letterSpacing: "-0.04em",
              }}
            >
              67
            </span>
          )}
        </motion.span>
      ))}
    </div>
  );
}

export default function YesCelebration({ reduce }) {
  const particles = useMemo(
    () =>
      Array.from({ length: BURST_COUNT }, (_, i) => ({
        id: i,
        kind: i % 5 === 4 ? "sixty" : "heart",
        angle: (i / BURST_COUNT) * Math.PI * 2 + Math.random() * 0.45,
        distance: 260 + Math.random() * 460,
        delay: Math.random() * 0.4,
        rotation: (Math.random() - 0.5) * 720,
        scale: 0.55 + Math.random() * 1.4,
        duration: 1.5 + Math.random() * 1.3,
      })),
    []
  );

  const [counter, setCounter] = useState(0);
  useEffect(() => {
    if (reduce) { setCounter(BURST_COUNT); return; }
    const id = window.setInterval(() => {
      setCounter((c) => (c >= BURST_COUNT ? c : c + 1));
    }, 30);
    return () => window.clearInterval(id);
  }, [reduce]);

  const letters = HEADLINE.split("");

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
      className="bmgf-section"
    >
      {!reduce && (
        <motion.div
          aria-hidden
          className="bmgf-flash"
          initial={{ opacity: 0.85 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
        />
      )}
      <motion.div
        aria-hidden
        className="bmgf-pulse"
        animate={reduce ? undefined : { opacity: [0.35, 0.65, 0.35] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
      />

      <div aria-hidden className="bmgf-burst-origin">
        {particles.map((p) => (
          <BurstItem key={p.id} p={p} reduce={reduce} />
        ))}
      </div>

      <h2 className="bmgf-yesss">
        {letters.map((letter, i) => (
          <motion.span
            key={`${letter}-${i}`}
            initial={reduce ? false : { y: 90, opacity: 0, rotate: -18, scale: 0.4 }}
            animate={{ y: 0, opacity: 1, rotate: 0, scale: 1 }}
            transition={{ duration: 0.75, delay: 0.35 + i * 0.08, ease: [0.16, 1.4, 0.3, 1] }}
            style={{ color: i === letters.length - 1 ? "#FF4D8F" : "#F5F1E8" }}
          >
            {letter}
          </motion.span>
        ))}
      </h2>

      <motion.p
        initial={reduce ? false : { y: 22, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 1.05, ease: [0.16, 1, 0.3, 1] }}
        className="bmgf-stuck"
      >
        <span>you're stuck with me now</span>
        <motion.span
          animate={reduce ? undefined : { scale: [1, 1.18, 1], rotate: [0, -8, 8, 0] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut", delay: 1.6 }}
          style={{ display: "inline-flex" }}
          aria-hidden
        >
          <HeartSVG size={28} />
        </motion.span>
      </motion.p>

      <motion.p
        initial={reduce ? false : { y: 14, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 1.4 }}
        className="bmgf-rated"
      >
        rated <span className="bmgf-rated-num">67/10</span>, no notes
      </motion.p>

      <motion.div
        initial={reduce ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.9 }}
        className="bmgf-counter"
      >
        {counter} hearts deployed
      </motion.div>

      <PersistentFloaters reduce={reduce} />
    </motion.section>
  );
}
