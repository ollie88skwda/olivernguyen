import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValue, useSpring } from "framer-motion";

const TRIGGER_RADIUS = 150;
const PUSH_BASE = 220;
const PADDING = 24;
const TAUNTS = ["no", "nuh uh", "nope", "67% no", "uhhh", "actually", "hm", "wait", "pls no"];

export default function EvasiveNoButton({ onEvade, reduce }) {
  const wrapRef = useRef(null);
  const buttonRef = useRef(null);
  const [evades, setEvades] = useState(0);
  const [keyboardFocused, setKeyboardFocused] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const recentMouseDown = useRef(false);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 340, damping: 22, mass: 0.55 });
  const springY = useSpring(y, { stiffness: 340, damping: 22, mass: 0.55 });
  const springRotate = useSpring(rotate, { stiffness: 220, damping: 18 });

  const taunt = TAUNTS[Math.min(Math.floor(evades / 2), TAUNTS.length - 1)];
  const scale = Math.max(0.7, 1 - evades * 0.012);

  const getClampedOffset = (targetX, targetY) => {
    const wrap = wrapRef.current;
    if (!wrap) return { x: targetX, y: targetY };
    const r = wrap.getBoundingClientRect();
    const minX = PADDING - r.left;
    const maxX = window.innerWidth - PADDING - r.width - r.left;
    const minY = PADDING - r.top;
    const maxY = window.innerHeight - PADDING - r.height - r.top;
    return {
      x: Math.max(minX, Math.min(maxX, targetX)),
      y: Math.max(minY, Math.min(maxY, targetY)),
    };
  };

  const randomViewportOffset = () => {
    const wrap = wrapRef.current;
    if (!wrap) return { x: 0, y: 0 };
    const r = wrap.getBoundingClientRect();
    const minLeft = PADDING;
    const maxLeft = window.innerWidth - PADDING - r.width;
    const minTop = PADDING;
    const maxTop = window.innerHeight - PADDING - r.height;
    const targetLeft = minLeft + Math.random() * Math.max(0, maxLeft - minLeft);
    const targetTop = minTop + Math.random() * Math.max(0, maxTop - minTop);
    return { x: targetLeft - r.left, y: targetTop - r.top };
  };

  useEffect(() => {
    const md = () => {
      recentMouseDown.current = true;
      window.setTimeout(() => { recentMouseDown.current = false; }, 120);
    };
    window.addEventListener("mousedown", md);
    return () => window.removeEventListener("mousedown", md);
  }, []);

  useEffect(() => {
    const node = buttonRef.current;
    if (!node || reduce) return;
    const handleTouch = (e) => {
      e.preventDefault();
      const next = randomViewportOffset();
      x.set(next.x);
      y.set(next.y);
      rotate.set((Math.random() - 0.5) * 30);
      onEvade();
      setEvades((c) => c + 1);
    };
    node.addEventListener("touchstart", handleTouch, { passive: false });
    return () => node.removeEventListener("touchstart", handleTouch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduce]);

  useEffect(() => {
    if (reduce) return;
    const handleMouseMove = (e) => {
      if (keyboardFocused) return;
      const node = buttonRef.current;
      if (!node) return;
      const rect = node.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = cx - e.clientX;
      const dy = cy - e.clientY;
      const dist = Math.hypot(dx, dy);
      if (dist < TRIGGER_RADIUS) {
        const angle = Math.atan2(dy, dx);
        const intensity = 1 + (TRIGGER_RADIUS - dist) / TRIGGER_RADIUS;
        const push = PUSH_BASE * intensity;
        const targetX = x.get() + Math.cos(angle) * push;
        const targetY = y.get() + Math.sin(angle) * push;
        const next = getClampedOffset(targetX, targetY);
        const movedX = Math.abs(next.x - x.get()) > 2;
        const movedY = Math.abs(next.y - y.get()) > 2;
        if (!movedX && !movedY) {
          const random = randomViewportOffset();
          x.set(random.x);
          y.set(random.y);
        } else {
          x.set(next.x);
          y.set(next.y);
        }
        rotate.set((Math.random() - 0.5) * 28);
        onEvade();
        setEvades((c) => c + 1);
      }
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduce, keyboardFocused]);

  useEffect(() => {
    const onResize = () => {
      const next = getClampedOffset(x.get(), y.get());
      x.set(next.x);
      y.set(next.y);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClick = () => {
    setShowTooltip(true);
    rotate.set(0);
    const base = x.get();
    window.setTimeout(() => x.set(base + 14), 0);
    window.setTimeout(() => x.set(base - 14), 90);
    window.setTimeout(() => x.set(base + 10), 180);
    window.setTimeout(() => x.set(base), 270);
    window.setTimeout(() => setShowTooltip(false), 2400);
  };

  return (
    <span ref={wrapRef} className="bmgf-no-wrap">
      <motion.button
        ref={buttonRef}
        type="button"
        onClick={handleClick}
        onFocus={() => { if (!recentMouseDown.current) setKeyboardFocused(true); }}
        onBlur={() => setKeyboardFocused(false)}
        aria-label="No (the no button tries to run away)"
        style={{ x: springX, y: springY, rotate: springRotate, scale }}
        whileHover={reduce ? undefined : { scale: scale * 1.05 }}
        className="bmgf-no"
      >
        <span style={{ position: "relative", zIndex: 10 }}>{taunt}</span>
        <AnimatePresence>
          {showTooltip && (
            <motion.span
              initial={{ opacity: 0, y: 8, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="bmgf-no-tooltip"
            >
              pls :(
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </span>
  );
}
