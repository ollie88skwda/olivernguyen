import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import "../styles/Emoji.css";

const FISHBOWL_SRC = "/fishbowl.jpg";
const FISHBOWL_COVERAGE = 0.7; // 70% of canvas
const ITEM_COVERAGE = 0.13; // 13% of canvas
const EXPORT_SIZE = 1200;

const BG_PRESETS = [
  { color: "#ffffff", label: "white" },
  { color: "#131313", label: "black" },
  { color: "#092441", label: "chrome purple" },
];

const COUNT_PRESETS = [67, 41, 25];
const MAX_COUNT = 200;

function isDarkColor(hex) {
  if (!hex || typeof hex !== "string") return false;
  let h = hex.trim().replace("#", "");
  if (h.length === 3) {
    h = h.split("").map((c) => c + c).join("");
  }
  if (h.length !== 6) return false;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  // Relative luminance (sRGB)
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum < 0.6;
}

function getFirstGrapheme(str) {
  if (!str) return "";
  if (typeof Intl !== "undefined" && typeof Intl.Segmenter === "function") {
    const seg = new Intl.Segmenter(undefined, { granularity: "grapheme" });
    for (const { segment } of seg.segment(str)) return segment;
  }
  return Array.from(str)[0] || "";
}

function pickOne(positions, minR, maxR, minDist) {
  let pos = null;
  for (let t = 0; t < 40; t++) {
    const angle = Math.random() * 2 * Math.PI;
    const r = minR + Math.random() * (maxR - minR);
    const candidate = {
      x: 0.5 + r * Math.cos(angle),
      y: 0.5 + r * Math.sin(angle),
    };
    const ok = positions.every(
      (p) => Math.hypot(p.x - candidate.x, p.y - candidate.y) >= minDist
    );
    pos = candidate;
    if (ok) break;
  }
  return pos;
}

function randomScatterPositions(count) {
  const positions = [];
  const minR = 0.38;
  const maxR = 0.48;
  const minDist = 0.09;
  for (let i = 0; i < count; i++) {
    positions.push(pickOne(positions, minR, maxR, minDist));
  }
  return positions;
}

// Strip the outside-white background of the fishbowl JPG via corner floodfill.
// Preserves inside-white regions (eye whites) because they're enclosed by non-white.
function stripWhiteBackground(img) {
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0);
  let imageData;
  try {
    imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  } catch (e) {
    return canvas; // fallback: tainted canvas, return as-is
  }
  const data = imageData.data;
  const w = canvas.width;
  const h = canvas.height;
  const visited = new Uint8Array(w * h);
  const threshold = 235;

  function isWhite(idx) {
    return (
      data[idx] >= threshold &&
      data[idx + 1] >= threshold &&
      data[idx + 2] >= threshold
    );
  }

  const queue = [];
  const seeds = [
    [0, 0],
    [w - 1, 0],
    [0, h - 1],
    [w - 1, h - 1],
  ];
  for (const [sx, sy] of seeds) {
    const sIdx = sy * w + sx;
    if (!visited[sIdx] && isWhite(sIdx * 4)) {
      queue.push(sIdx);
      visited[sIdx] = 1;
    }
  }

  while (queue.length) {
    const idx = queue.pop();
    const px = idx * 4;
    data[px + 3] = 0; // transparent
    const x = idx % w;
    const y = Math.floor(idx / w);
    const neighbors = [
      [x - 1, y],
      [x + 1, y],
      [x, y - 1],
      [x, y + 1],
    ];
    for (const [nx, ny] of neighbors) {
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
      const nIdx = ny * w + nx;
      if (visited[nIdx]) continue;
      if (!isWhite(nIdx * 4)) continue;
      visited[nIdx] = 1;
      queue.push(nIdx);
    }
  }
  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

export const EmojiPage = () => {
  const canvasRef = useRef(null);
  const inputRef = useRef(null);

  const [inputValue, setInputValue] = useState("");
  const [count, setCount] = useState(67);
  const [bgColor, setBgColor] = useState("#ffffff");
  const [items, setItems] = useState([]);
  const [fishbowlDataUrl, setFishbowlDataUrl] = useState(FISHBOWL_SRC);
  const fishbowlCanvasRef = useRef(null);
  const [draggingId, setDraggingId] = useState(null);

  const isDarkBg = useMemo(() => isDarkColor(bgColor), [bgColor]);

  // Load + strip fishbowl on mount
  useEffect(() => {
    let cancelled = false;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (cancelled) return;
      try {
        const processed = stripWhiteBackground(img);
        fishbowlCanvasRef.current = processed;
        setFishbowlDataUrl(processed.toDataURL("image/png"));
      } catch (e) {
        fishbowlCanvasRef.current = null;
      }
    };
    img.onerror = () => {};
    img.src = FISHBOWL_SRC;
    return () => {
      cancelled = true;
    };
  }, []);

  const addItems = useCallback(() => {
    const content = inputValue.trim();
    if (!content) return;
    const entry =
      getFirstGrapheme(content) === content ? content : content;
    // Accept multi-char text (e.g. "67"). For single-grapheme emoji inputs, keep as-is.
    const safeCount =
      typeof count === "number" && !Number.isNaN(count) && count > 0 ? count : 1;
    const positions = randomScatterPositions(safeCount);
    setItems((prev) => [
      ...prev,
      ...positions.map((p, i) => ({
        id: `${Date.now()}-${i}-${Math.random().toString(36).slice(2, 7)}`,
        content: entry,
        x: p.x,
        y: p.y,
      })),
    ]);
    setInputValue("");
    inputRef.current?.focus();
  }, [inputValue, count]);

  const handleCountChange = useCallback((e) => {
    const raw = e.target.value;
    if (raw === "") {
      setCount("");
      return;
    }
    const n = parseInt(raw, 10);
    if (Number.isNaN(n)) return;
    setCount(Math.max(1, Math.min(MAX_COUNT, n)));
  }, []);

  const handleCountBlur = useCallback(() => {
    setCount((c) => {
      if (c === "" || Number.isNaN(c)) return 1;
      return c;
    });
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addItems();
    }
  };

  const handleClear = () => setItems([]);

  // ── Drag ──────────────────────────────────────────────────────────────────
  const handlePointerDown = (e, itemId) => {
    if (!canvasRef.current) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setDraggingId(itemId);
    e.preventDefault();
  };

  const handlePointerMove = (e, itemId) => {
    if (draggingId !== itemId || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const clamp = (v) => Math.max(0.02, Math.min(0.98, v));
    setItems((prev) =>
      prev.map((it) =>
        it.id === itemId ? { ...it, x: clamp(x), y: clamp(y) } : it
      )
    );
  };

  const handlePointerUp = (e, itemId) => {
    if (draggingId === itemId) setDraggingId(null);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (err) {
      /* ignore */
    }
  };

  // ── Export ────────────────────────────────────────────────────────────────
  const exportPNG = useCallback(() => {
    const size = EXPORT_SIZE;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");

    // Background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, size, size);

    // Fishbowl (preserve natural aspect ratio, contain within 70% box)
    const fishbowlSrc = fishbowlCanvasRef.current;
    if (fishbowlSrc) {
      const box = size * FISHBOWL_COVERAGE;
      const natW = fishbowlSrc.width;
      const natH = fishbowlSrc.height;
      const scale = Math.min(box / natW, box / natH);
      const fw = natW * scale;
      const fh = natH * scale;
      const fx = (size - fw) / 2;
      const fy = (size - fh) / 2;
      ctx.drawImage(fishbowlSrc, fx, fy, fw, fh);
    }

    // Items
    const itemSize = size * ITEM_COVERAGE;
    ctx.font = `900 ${itemSize}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = isDarkBg ? "#ffffff" : "#131313";
    for (const it of items) {
      ctx.fillText(it.content, it.x * size, it.y * size);
    }

    return canvas.toDataURL("image/png");
  }, [bgColor, isDarkBg, items]);

  const handleDownload = () => {
    const dataUrl = exportPNG();
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = "fishbowl.png";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Test hook — lets Playwright fetch the exported PNG without going through
  // the browser download dialog.
  useEffect(() => {
    window.__emojiExport = exportPNG;
    return () => {
      if (window.__emojiExport === exportPNG) delete window.__emojiExport;
    };
  }, [exportPNG]);

  const itemColor = isDarkBg ? "#ffffff" : "#131313";

  return (
    <div className="emoji-page" style={{ background: "#ffffff" }}>
      <header className="emoji-header">
        <a href="/" className="wordmark" aria-label="home">
          fishbowl
        </a>
        <span className="attribution">made by ollie</span>
      </header>

      <main className="emoji-stage">
        <div
          ref={canvasRef}
          className="emoji-canvas"
          style={{ background: bgColor }}
        >
          <img
            src={fishbowlDataUrl}
            className="emoji-fishbowl"
            alt="fishbowl"
            draggable={false}
          />
          {items.map((it) => (
            <span
              key={it.id}
              className={`emoji-item ${draggingId === it.id ? "dragging" : ""}`}
              style={{
                left: `${it.x * 100}%`,
                top: `${it.y * 100}%`,
                color: itemColor,
              }}
              onPointerDown={(e) => handlePointerDown(e, it.id)}
              onPointerMove={(e) => handlePointerMove(e, it.id)}
              onPointerUp={(e) => handlePointerUp(e, it.id)}
              onPointerCancel={(e) => handlePointerUp(e, it.id)}
            >
              {it.content}
            </span>
          ))}
        </div>

        <div className="emoji-controls">
          <div className="emoji-input-pill">
            <span className="emoji-plus-icon" aria-hidden="true">
              +
            </span>
            <input
              ref={inputRef}
              className="emoji-input"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="type emoji or text, then hit return"
              aria-label="emoji or text"
            />
            <div className="emoji-count-group" aria-label="count">
              <span className="emoji-count-x" aria-hidden="true">×</span>
              {COUNT_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  className={`emoji-count-preset ${count === preset ? "active" : ""}`}
                  onClick={() => setCount(preset)}
                  aria-label={`${preset} emojis`}
                >
                  {preset}
                </button>
              ))}
              <input
                type="number"
                className="emoji-count-input"
                min="1"
                max={MAX_COUNT}
                value={count}
                onChange={handleCountChange}
                onBlur={handleCountBlur}
                aria-label="custom count"
              />
            </div>
            <span className="emoji-return-hint" aria-hidden="true">
              ↵
            </span>
          </div>

          <div className="emoji-action-pill">
            <div className="emoji-swatches" role="radiogroup" aria-label="background color">
              {BG_PRESETS.map((preset) => (
                <button
                  key={preset.color}
                  className={`emoji-swatch ${bgColor.toLowerCase() === preset.color.toLowerCase() ? "active" : ""}`}
                  style={{ background: preset.color }}
                  onClick={() => setBgColor(preset.color)}
                  aria-label={`${preset.label} background`}
                  role="radio"
                  aria-checked={bgColor.toLowerCase() === preset.color.toLowerCase()}
                />
              ))}
              <label
                className="emoji-swatch emoji-swatch-custom"
                style={{ background: bgColor }}
                aria-label="custom background color"
                title="Pick a custom color"
              >
                <span className="emoji-swatch-rainbow" aria-hidden="true" />
                <input
                  type="color"
                  className="emoji-swatch-color-input"
                  value={/^#[0-9a-fA-F]{6}$/.test(bgColor) ? bgColor : "#ffffff"}
                  onChange={(e) => setBgColor(e.target.value)}
                />
              </label>
            </div>
            <div className="emoji-divider" />
            <button
              className="emoji-clear"
              onClick={handleClear}
              disabled={items.length === 0}
            >
              Clear
            </button>
            <button className="emoji-download" onClick={handleDownload}>
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M12 3v12m0 0l-4-4m4 4l4-4M5 21h14"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Download
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default EmojiPage;
