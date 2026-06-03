import React from "react";
import { motion, useReducedMotion } from "framer-motion";

/**
 * Per-WORD mask reveal for the hero name. Each word slides up from behind an
 * invisible clip edge. Per-word (not per-letter) — letter-by-letter is the #1
 * AI-slop tell and hurts comprehension. Plain text under reduced-motion.
 */
export const WordReveal = ({ text, className, stagger = 0.08, delay = 0.12 }) => {
  const reduce = useReducedMotion();
  if (reduce) return <span className={className}>{text}</span>;

  const words = text.split(/\s+/).filter(Boolean);
  return (
    <span
      className={className}
      style={{ display: "flex", flexWrap: "wrap", gap: "0 0.28em" }}
    >
      {words.map((word, i) => (
        <span
          key={i}
          style={{
            display: "inline-block",
            overflow: "hidden",
            paddingBottom: "0.1em",
          }}
        >
          <motion.span
            style={{ display: "inline-block", willChange: "transform" }}
            initial={{ y: "115%" }}
            animate={{ y: 0 }}
            transition={{
              duration: 0.65,
              ease: [0.22, 1, 0.36, 1],
              delay: delay + i * stagger,
            }}
          >
            {word}
          </motion.span>
        </span>
      ))}
    </span>
  );
};

export default WordReveal;
