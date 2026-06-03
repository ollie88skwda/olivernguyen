import React, { useRef } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useReducedMotion,
} from "framer-motion";

/**
 * Pointer-tilt 3D card. Tilts toward the cursor (capped at `max` degrees),
 * spring-eased so it feels alive. Bounding rect is cached on enter to avoid
 * per-move layout reads. Hard-disabled on touch / <768px / reduced-motion,
 * where it renders a plain div (CSS handles the fallback image scale).
 */
export const TiltCard = ({ children, className, max = 6 }) => {
  const reduce = useReducedMotion();
  const ref = useRef(null);
  const rect = useRef(null);
  const raf = useRef(0);

  const px = useMotionValue(0); // -0.5 .. 0.5
  const py = useMotionValue(0);
  const sx = useSpring(px, { stiffness: 300, damping: 30 });
  const sy = useSpring(py, { stiffness: 300, damping: 30 });
  const rotateY = useTransform(sx, [-0.5, 0.5], [-max, max]);
  const rotateX = useTransform(sy, [-0.5, 0.5], [max, -max]);

  const enabled =
    !reduce &&
    typeof window !== "undefined" &&
    window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
    window.innerWidth >= 768;

  if (!enabled) return <div className={className}>{children}</div>;

  const onEnter = () => {
    if (ref.current) rect.current = ref.current.getBoundingClientRect();
  };
  const onMove = (e) => {
    if (raf.current) return; // throttle to one update per frame
    const cx = e.clientX;
    const cy = e.clientY;
    raf.current = requestAnimationFrame(() => {
      raf.current = 0;
      const r = rect.current;
      if (!r) return;
      px.set((cx - r.left) / r.width - 0.5);
      py.set((cy - r.top) / r.height - 0.5);
      // cursor-spotlight position for the CSS ::before glow
      if (ref.current) {
        ref.current.style.setProperty("--mx", cx - r.left + "px");
        ref.current.style.setProperty("--my", cy - r.top + "px");
      }
    });
  };
  const onLeave = () => {
    if (raf.current) {
      cancelAnimationFrame(raf.current);
      raf.current = 0;
    }
    px.set(0);
    py.set(0);
    rect.current = null;
  };

  return (
    <motion.div
      ref={ref}
      className={className}
      onMouseEnter={onEnter}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      whileTap={{ scale: 0.97 }}
      style={{
        rotateX,
        rotateY,
        transformPerspective: 1000,
        transformStyle: "preserve-3d",
        willChange: "transform",
      }}
    >
      {children}
    </motion.div>
  );
};

export default TiltCard;
