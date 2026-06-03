import React from "react";
import { motion, useScroll } from "framer-motion";

/**
 * Thin gold scroll-progress bar fixed to the top. Scroll-LINKED (no spring, no
 * re-renders) so it respects user agency and stays cheap.
 */
export const ScrollProgress = () => {
  const { scrollYProgress } = useScroll();
  return (
    <motion.div
      aria-hidden="true"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: 3,
        background: "var(--accent)",
        transformOrigin: "0% 50%",
        scaleX: scrollYProgress,
        zIndex: 2000,
      }}
    />
  );
};

export default ScrollProgress;
