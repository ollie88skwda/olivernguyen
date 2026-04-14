import React, { useState, useEffect, useCallback, useRef } from "react";

const CENTER_EMOJI = "😳";
const CENTER_SIZE = 90;
const ORBIT_SIZE = 32;
const DEFAULT_COUNT = 10;
const MIN_COUNT = 1;
const MAX_COUNT = 30;

function getFirstEmoji(str) {
  if (!str) return "";
  const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });
  for (const { segment } of segmenter.segment(str)) {
    // Accept any grapheme (emoji or otherwise); caller handles placeholder
    return segment;
  }
  return "";
}

function overlaps(positions, x, y) {
  return positions.some((p) => Math.hypot(p.x - x, p.y - y) < ORBIT_SIZE);
}

function randomPos(cx, cy, minRadius, maxRadius) {
  const angle = Math.random() * 2 * Math.PI;
  const radius = minRadius + Math.random() * (maxRadius - minRadius);
  return { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) };
}

function computePositions(count, displayWidth, displayHeight) {
  const cx = displayWidth / 2;
  const cy = displayHeight / 2;
  const minRadius = CENTER_SIZE * 0.9;
  const maxRadius = Math.min(displayWidth, displayHeight) / 2 - ORBIT_SIZE - 8;

  if (maxRadius <= minRadius) return [];

  const positions = [];
  for (let i = 0; i < count; i++) {
    let pos = randomPos(cx, cy, minRadius, maxRadius);
    for (let attempt = 1; attempt < 10 && overlaps(positions, pos.x, pos.y); attempt++) {
      pos = randomPos(cx, cy, minRadius, maxRadius);
    }
    positions.push(pos);
  }
  return positions;
}

export const EmojiOrbit = () => {
  const displayRef = useRef(null);
  const [inputEmoji, setInputEmoji] = useState("");
  const [count, setCount] = useState(DEFAULT_COUNT);
  const [positions, setPositions] = useState([]);
  const [displaySize, setDisplaySize] = useState({ width: 0, height: 0 });

  const measure = useCallback(() => {
    if (displayRef.current) {
      const { clientWidth, clientHeight } = displayRef.current;
      setDisplaySize({ width: clientWidth, height: clientHeight });
    }
  }, []);

  useEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  useEffect(() => {
    if (displaySize.width > 0 && displaySize.height > 0) {
      setPositions(computePositions(count, displaySize.width, displaySize.height));
    }
  }, [count, displaySize]);

  const rerandomize = () => {
    setPositions(computePositions(count, displaySize.width, displaySize.height));
  };

  const handleInput = (e) => {
    const raw = e.target.value;
    const first = getFirstEmoji(raw);
    setInputEmoji(first);
  };

  const adjustCount = (delta) => {
    setCount((c) => Math.min(MAX_COUNT, Math.max(MIN_COUNT, c + delta)));
  };

  const displayedEmoji = inputEmoji || null;

  return (
    <div style={styles.page}>
      {/* Display area */}
      <div ref={displayRef} style={styles.display}>
        {/* Center emoji */}
        <span style={styles.centerEmoji}>{CENTER_EMOJI}</span>

        {/* Orbit emojis */}
        {positions.map((pos, i) =>
          displayedEmoji ? (
            <span
              key={i}
              style={{
                ...styles.orbitEmoji,
                left: pos.x - ORBIT_SIZE / 2,
                top: pos.y - ORBIT_SIZE / 2,
              }}
            >
              {displayedEmoji}
            </span>
          ) : (
            <span
              key={i}
              style={{
                ...styles.orbitPlaceholder,
                left: pos.x - ORBIT_SIZE / 2,
                top: pos.y - ORBIT_SIZE / 2,
              }}
            />
          )
        )}
      </div>

      {/* Controls area */}
      <div style={styles.controls}>
        <div style={styles.controlsInner}>
          <input
            type="text"
            value={inputEmoji}
            onChange={handleInput}
            placeholder="Type an emoji..."
            style={styles.input}
            maxLength={10}
          />

          <div style={styles.stepper}>
            <button
              onClick={() => adjustCount(-1)}
              disabled={count <= MIN_COUNT}
              style={styles.stepBtn}
              aria-label="Decrease count"
            >
              −
            </button>
            <span style={styles.countDisplay}>{count}</span>
            <button
              onClick={() => adjustCount(1)}
              disabled={count >= MAX_COUNT}
              style={styles.stepBtn}
              aria-label="Increase count"
            >
              +
            </button>
          </div>

          <button onClick={rerandomize} style={styles.rerandomizeBtn}>
            Rerandomize
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  page: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    width: "100vw",
    overflow: "hidden",
    background: "#0f0f0f",
    fontFamily: "GeistMono, monospace",
  },
  display: {
    position: "relative",
    flex: "0 0 80%",
    overflow: "hidden",
  },
  centerEmoji: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    fontSize: CENTER_SIZE,
    lineHeight: 1,
    userSelect: "none",
    pointerEvents: "none",
  },
  orbitEmoji: {
    position: "absolute",
    fontSize: ORBIT_SIZE,
    lineHeight: 1,
    userSelect: "none",
    pointerEvents: "none",
    width: ORBIT_SIZE,
    height: ORBIT_SIZE,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  orbitPlaceholder: {
    position: "absolute",
    width: ORBIT_SIZE * 0.7,
    height: ORBIT_SIZE * 0.7,
    borderRadius: "50%",
    border: "2px dashed rgba(255,255,255,0.18)",
    boxSizing: "border-box",
  },
  controls: {
    flex: "0 0 20%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderTop: "1px solid rgba(255,255,255,0.08)",
    padding: "0 16px",
  },
  controlsInner: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  input: {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.15)",
    borderRadius: 8,
    color: "#fff",
    fontSize: 24,
    padding: "8px 14px",
    outline: "none",
    width: 160,
    textAlign: "center",
    fontFamily: "inherit",
  },
  stepper: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  stepBtn: {
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.15)",
    borderRadius: 8,
    color: "#fff",
    fontSize: 22,
    width: 40,
    height: 40,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "inherit",
    transition: "background 0.15s",
  },
  countDisplay: {
    color: "#fff",
    fontSize: 20,
    minWidth: 32,
    textAlign: "center",
    fontFamily: "inherit",
  },
  rerandomizeBtn: {
    background: "rgba(255,255,255,0.1)",
    border: "1px solid rgba(255,255,255,0.2)",
    borderRadius: 8,
    color: "#fff",
    fontSize: 15,
    padding: "10px 20px",
    cursor: "pointer",
    fontFamily: "inherit",
    letterSpacing: "0.02em",
    transition: "background 0.15s",
  },
};
