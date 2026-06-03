import React, { useRef } from "react";
import { motion, useMotionValue, useSpring, useReducedMotion } from "framer-motion";

/**
 * Anchor that gently pulls toward the cursor (clamped to ±12px, spring-eased)
 * and presses to scale(0.97). Magnetism is desktop/fine-pointer only and off
 * under reduced motion; the press stays (accessible feedback).
 */
export const MagneticButton = ({ children, className, href, onClick, ...rest }) => {
  const reduce = useReducedMotion();
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 300, damping: 20 });
  const sy = useSpring(y, { stiffness: 300, damping: 20 });

  const enabled =
    !reduce &&
    typeof window !== "undefined" &&
    window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  const onMove = (e) => {
    if (!enabled || !ref.current) return;
    const b = ref.current.getBoundingClientRect();
    x.set(Math.max(-12, Math.min(12, (e.clientX - (b.left + b.width / 2)) * 0.3)));
    y.set(Math.max(-12, Math.min(12, (e.clientY - (b.top + b.height / 2)) * 0.4)));
  };
  const onLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.a
      ref={ref}
      href={href}
      onClick={onClick}
      className={className}
      style={enabled ? { x: sx, y: sy } : undefined}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      whileTap={{ scale: 0.97 }}
      {...rest}
    >
      {children}
    </motion.a>
  );
};

export default MagneticButton;
