import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import Reveal from "./Reveal";

/**
 * Section heading: DM Mono eyebrow + Bebas Neue title + a gold accent line that
 * draws in from the left (scaleX 0 -> 1) when scrolled into view.
 */
export const SectionHeading = ({ eyebrow, title, id }) => {
  const reduce = useReducedMotion();
  return (
    <div className="section-heading">
      {eyebrow && (
        <Reveal as="p" className="section-eyebrow">
          {eyebrow}
        </Reveal>
      )}
      <Reveal as="h2" className="section-title" id={id} delay={0.05}>
        {title}
      </Reveal>
      <motion.div
        className="section-line"
        initial={reduce ? { scaleX: 1 } : { scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      />
    </div>
  );
};

export default SectionHeading;
