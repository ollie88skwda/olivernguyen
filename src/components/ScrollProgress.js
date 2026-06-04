import React, { useEffect, useRef, useState } from "react";

/**
 * Scroll "station marker": a floating drafting-sheet instrument pinned
 * bottom-right. Shows the current section designator (U1..U4), a row of
 * pixel cells that fill with scroll, and a mono percent readout. Replaces
 * the edge progress bars, which were invisible next to the native scrollbar.
 * One rAF-throttled passive listener; pointer-events none so it never blocks.
 */
const SECTIONS = [
  { id: "about", label: "U1 / About" },
  { id: "work", label: "U2 / Work" },
  { id: "skills", label: "U3 / Toolkit" },
  { id: "contact", label: "U4 / Contact" },
];
const CELLS = 10;

export const ScrollProgress = () => {
  const [pct, setPct] = useState(0);
  const [label, setLabel] = useState("");
  const raf = useRef(null);

  useEffect(() => {
    const els = SECTIONS.map((s) => ({
      ...s,
      el: document.getElementById(s.id),
    })).filter((s) => s.el);

    const update = () => {
      raf.current = null;
      const max =
        document.documentElement.scrollHeight - window.innerHeight;
      const y = window.scrollY;
      setPct(max > 0 ? Math.min(100, Math.round((y / max) * 100)) : 0);
      if (els.length) {
        const probe = y + window.innerHeight * 0.35;
        let cur = "U0 / Hero";
        for (const s of els) if (s.el.offsetTop <= probe) cur = s.label;
        setLabel(cur);
      }
    };
    const onScroll = () => {
      if (raf.current == null) raf.current = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf.current != null) cancelAnimationFrame(raf.current);
    };
  }, []);

  const filled = Math.round((pct / 100) * CELLS);
  return (
    <div
      className={`scroll-station${pct > 1 ? " visible" : ""}`}
      aria-hidden="true"
    >
      {label && <span className="ss-label">{label}</span>}
      <span className="ss-row">
        <span className="ss-cells">
          {Array.from({ length: CELLS }).map((_, i) => (
            <span key={i} className={`ss-cell${i < filled ? " on" : ""}`} />
          ))}
        </span>
        <span className="ss-pct">{String(pct).padStart(2, "0")}%</span>
      </span>
    </div>
  );
};

export default ScrollProgress;
