import React from "react";

/**
 * Seamless CSS-driven marquee. Track holds two identical copies and animates
 * 0 -> -50%, so the loop never seams regardless of content width (fixes the
 * hardcoded wrap-math flagged in review). Pauses on hover so it stays
 * scannable; stops entirely under prefers-reduced-motion (CSS).
 */
export const Marquee = ({ items, className = "", speed = 30, reverse = false }) => (
  <div className={`marquee ${className}`}>
    <div
      className="marquee-track"
      style={{
        animationDuration: `${speed}s`,
        animationDirection: reverse ? "reverse" : "normal",
      }}
    >
      {[0, 1].map((copy) => (
        <div className="marquee-copy" key={copy} aria-hidden={copy === 1}>
          {items.map((item, i) => (
            <span className="marquee-item" key={i}>
              {item}
            </span>
          ))}
        </div>
      ))}
    </div>
  </div>
);

export default Marquee;
