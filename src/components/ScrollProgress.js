import React from "react";
import { motion, useScroll } from "framer-motion";

/**
 * Thin vertical scroll-progress rail fixed to the right edge — reads like a
 * ghost scrollbar, covers no content. Scroll-LINKED (no spring, no re-renders)
 * so it respects user agency and stays cheap.
 */
export const ScrollProgress = () => {
  const { scrollYProgress } = useScroll();
  return (
    <motion.div
      aria-hidden="true"
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        bottom: 0,
        width: 3,
        background: "var(--accent)",
        transformOrigin: "50% 0%",
        scaleY: scrollYProgress,
        zIndex: 2000,
      }}
    />
  );
};

export default ScrollProgress;
