import React from "react";
import { motion, useScroll, useSpring, useReducedMotion } from "framer-motion";

/**
 * ENIG circuit-board identity: a gold trace on the navy "soldermask" that
 * draws down the left rail as you scroll, with right-angle PCB jogs and
 * square pixel vias. Desktop only; static full trace under reduced motion.
 */
export const CircuitTrace = () => {
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const pathLength = useSpring(scrollYProgress, { stiffness: 90, damping: 24 });

  const enabled =
    typeof window !== "undefined" &&
    window.matchMedia("(min-width: 1100px)").matches;
  if (!enabled) return null;

  // vias sit on the trace at each jog (viewBox coords)
  const vias = [
    [12, 118],
    [19, 348],
    [6, 600],
    [12, 852],
    [12, 1080],
  ];

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 1200"
      preserveAspectRatio="none"
      style={{
        position: "fixed",
        left: 26,
        top: 0,
        width: 24,
        height: "100vh",
        zIndex: 1,
        pointerEvents: "none",
        opacity: 0.48,
      }}
    >
      <motion.path
        d="M12 0 V118 H19 V348 H6 V600 H12 V852 H19 V1080 H12 V1200"
        fill="none"
        stroke="var(--accent)"
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
        style={reduce ? { pathLength: 1 } : { pathLength }}
      />
      {vias.map(([x, y], i) => (
        <rect
          key={i}
          x={x - 4}
          y={y - 4}
          width={8}
          height={8}
          fill="var(--accent)"
        />
      ))}
    </svg>
  );
};

export default CircuitTrace;
