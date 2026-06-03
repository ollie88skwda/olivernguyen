import React from "react";
import { motion, useReducedMotion } from "framer-motion";

/**
 * Scroll-reveal wrapper. Rises UP into place (y:16 -> 0) on a tuned ease-out
 * curve, fires once, and collapses to a plain fade under prefers-reduced-motion.
 *
 * <Reveal as="h2" className="..." delay={0.1}>Title</Reveal>
 */
export const Reveal = ({
  children,
  as = "div",
  className,
  style,
  delay = 0,
  y = 16,
  amount = 0.2,
  ...rest
}) => {
  const reduce = useReducedMotion();
  const Comp = motion[as] || motion.div;
  return (
    <Comp
      className={className}
      style={style}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y }}
      whileInView={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay }}
      {...rest}
    >
      {children}
    </Comp>
  );
};

export default Reveal;
