import React, { useState, useEffect, useCallback, useRef } from "react";

// ── On-screen display constants ──────────────────────────────────────────────
const CENTER_IMG_SIZE  = 200;   // px, on-screen center image
const CENTER_IMG_SRC   = "/center-emoji.png";
const ORBIT_SIZE       = 32;    // px, on-screen orbit emoji font size
// The visible face is ~38% of CENTER_IMG_SIZE from centre (accounts for image padding)
const ORBIT_MIN_RADIUS = Math.round(CENTER_IMG_SIZE * 0.38);
const ORBIT_BAND_WIDTH = ORBIT_SIZE + 8;
const COLLISION_DIST   = ORBIT_SIZE + 6;

const DEFAULT_COUNT = 3;
const MIN_COUNT     = 1;
const MAX_COUNT     = 30;

// ── Download canvas constants (independent of viewport) ─────────────────────
const DL_SIZE         = 800;  // square PNG
const DL_CENTER_SIZE  = 560;  // center image fills 70% of canvas
const DL_ORBIT_SIZE   = 52;   // small orbit emojis
// visible face radius in download = DL_CENTER_SIZE * 0.40 ≈ 224; put emojis just outside
const DL_ORBIT_RADIUS = Math.round(DL_CENTER_SIZE * 0.40);
const DL_COLLISION    = DL_ORBIT_SIZE + 4;

// ── Helpers ──────────────────────────────────────────────────────────────────
function getFirstEmoji(str) {
  if (!str) return "";
  const seg = new Intl.Segmenter(undefined, { granularity: "grapheme" });
  for (const { segment } of seg.segment(str)) return segment;
  return "";
}

function overlaps(positions, x, y, minDist) {
  return positions.some((p) => Math.hypot(p.x - x, p.y - y) < minDist);
}

function randomPos(cx, cy, minR, maxR) {
  const angle  = Math.random() * 2 * Math.PI;
  const radius = minR + Math.random() * (maxR - minR);
  return { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) };
}

function computePositions(count, W, H, minR, maxR, collisionDist) {
  const cx  = W / 2;
  const cy  = H / 2;
  const cap = Math.min(maxR, Math.min(W, H) / 2 - DL_ORBIT_SIZE - 8);
  if (cap <= minR) return [];

  const positions = [];
  for (let i = 0; i < count; i++) {
    let pos = randomPos(cx, cy, minR, cap);
    for (let t = 0; t < 30 && overlaps(positions, pos.x, pos.y, collisionDist); t++) {
      pos = randomPos(cx, cy, minR, cap);
    }
    positions.push(pos);
  }
  return positions;
}

// ── Component ─────────────────────────────────────────────────────────────────
export const EmojiOrbit = () => {
  const displayRef = useRef(null);
  const [inputEmoji,  setInputEmoji]  = useState("");
  const [count,       setCount]       = useState(DEFAULT_COUNT);
  const [positions,   setPositions]   = useState([]);
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
      setPositions(
        computePositions(
          count,
          displaySize.width,
          displaySize.height,
          ORBIT_MIN_RADIUS,
          ORBIT_MIN_RADIUS + ORBIT_BAND_WIDTH,
          COLLISION_DIST
        )
      );
    }
  }, [count, displaySize]);

  const rerandomize = () => {
    setPositions(
      computePositions(
        count,
        displaySize.width,
        displaySize.height,
        ORBIT_MIN_RADIUS,
        ORBIT_MIN_RADIUS + ORBIT_BAND_WIDTH,
        COLLISION_DIST
      )
    );
  };

  const displayedEmoji = inputEmoji || null;

  // Download: recompute positions fresh for the square download canvas so they
  // map correctly to the much-larger center image — no viewport translation needed
  const handleDownload = useCallback(() => {
    const canvas  = document.createElement("canvas");
    canvas.width  = DL_SIZE;
    canvas.height = DL_SIZE;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, DL_SIZE, DL_SIZE);

    const img = new Image();
    img.src = CENTER_IMG_SRC;
    img.onload = () => {
      const cx   = DL_SIZE / 2;
      const cy   = DL_SIZE / 2;
      const half = DL_CENTER_SIZE / 2;

      // Large center image
      ctx.drawImage(img, cx - half, cy - half, DL_CENTER_SIZE, DL_CENTER_SIZE);

      // Orbit emojis — freshly computed for this canvas
      if (displayedEmoji) {
        const dlPositions = computePositions(
          count,
          DL_SIZE,
          DL_SIZE,
          DL_ORBIT_RADIUS,
          DL_ORBIT_RADIUS + DL_ORBIT_SIZE + 8,
          DL_COLLISION
        );

        ctx.font          = `${DL_ORBIT_SIZE}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
        ctx.textAlign     = "center";
        ctx.textBaseline  = "middle";
        ctx.fillStyle     = "#000000";

        dlPositions.forEach((pos) => ctx.fillText(displayedEmoji, pos.x, pos.y));
      }

      const link    = document.createElement("a");
      link.download = "emoji-orbit.png";
      link.href     = canvas.toDataURL("image/png");
      link.click();
    };
  }, [displayedEmoji, count]);

  return (
    <div style={styles.page}>
      <div ref={displayRef} style={styles.display}>
        <img src={CENTER_IMG_SRC} alt="center" style={styles.centerImage} draggable={false} />

        {positions.map((pos, i) =>
          displayedEmoji ? (
            <span
              key={i}
              style={{ ...styles.orbitEmoji, left: pos.x - ORBIT_SIZE / 2, top: pos.y - ORBIT_SIZE / 2 }}
            >
              {displayedEmoji}
            </span>
          ) : (
            <span
              key={i}
              style={{ ...styles.orbitPlaceholder, left: pos.x - ORBIT_SIZE / 2, top: pos.y - ORBIT_SIZE / 2 }}
            />
          )
        )}
      </div>

      <div style={styles.controls}>
        <div style={styles.controlsInner}>
          <input
            type="text"
            value={inputEmoji}
            onChange={(e) => setInputEmoji(getFirstEmoji(e.target.value))}
            placeholder="Type an emoji…"
            style={styles.input}
            maxLength={10}
          />

          <div style={styles.stepper}>
            <button onClick={() => setCount((c) => Math.max(MIN_COUNT, c - 1))} disabled={count <= MIN_COUNT} style={styles.stepBtn} aria-label="Decrease">−</button>
            <span style={styles.countDisplay}>{count}</span>
            <button onClick={() => setCount((c) => Math.min(MAX_COUNT, c + 1))} disabled={count >= MAX_COUNT} style={styles.stepBtn} aria-label="Increase">+</button>
          </div>

          <button onClick={rerandomize} style={styles.rerandomizeBtn}>Rerandomize</button>
          <button onClick={handleDownload} style={styles.downloadBtn}>Download</button>
        </div>
      </div>
    </div>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = {
  page: { display: "flex", flexDirection: "column", height: "100vh", width: "100vw", overflow: "hidden", background: "#ffffff", fontFamily: "GeistMono, monospace" },
  display: { position: "relative", flex: "0 0 80%", overflow: "hidden" },
  centerImage: { position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: CENTER_IMG_SIZE, height: CENTER_IMG_SIZE, objectFit: "contain", userSelect: "none", pointerEvents: "none" },
  orbitEmoji: { position: "absolute", fontSize: ORBIT_SIZE, lineHeight: 1, userSelect: "none", pointerEvents: "none", width: ORBIT_SIZE, height: ORBIT_SIZE, display: "flex", alignItems: "center", justifyContent: "center" },
  orbitPlaceholder: { position: "absolute", width: ORBIT_SIZE * 0.7, height: ORBIT_SIZE * 0.7, borderRadius: "50%", border: "2px dashed rgba(0,0,0,0.18)", boxSizing: "border-box" },
  controls: { flex: "0 0 20%", display: "flex", alignItems: "center", justifyContent: "center", borderTop: "1px solid rgba(0,0,0,0.08)", padding: "0 16px" },
  controlsInner: { display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", justifyContent: "center" },
  input: { background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.15)", borderRadius: 8, color: "#111", fontSize: 24, padding: "8px 14px", outline: "none", width: 160, textAlign: "center", fontFamily: "inherit" },
  stepper: { display: "flex", alignItems: "center", gap: 10 },
  stepBtn: { background: "rgba(0,0,0,0.06)", border: "1px solid rgba(0,0,0,0.15)", borderRadius: 8, color: "#111", fontSize: 22, width: 40, height: 40, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit" },
  countDisplay: { color: "#111", fontSize: 20, minWidth: 32, textAlign: "center", fontFamily: "inherit" },
  rerandomizeBtn: { background: "rgba(0,0,0,0.06)", border: "1px solid rgba(0,0,0,0.15)", borderRadius: 8, color: "#111", fontSize: 15, padding: "10px 20px", cursor: "pointer", fontFamily: "inherit", letterSpacing: "0.02em" },
  downloadBtn: { background: "rgba(0,0,0,0.08)", border: "1px solid rgba(0,0,0,0.2)", borderRadius: 8, color: "#111", fontSize: 15, padding: "10px 20px", cursor: "pointer", fontFamily: "inherit", letterSpacing: "0.02em" },
};
