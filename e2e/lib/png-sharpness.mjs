// Tiny PNG reader + a sharpness metric, for the one thing a screenshot
// assertion cannot express: "is this region of the canvas still crisp?"
//
// Why it exists: a `backdrop-filter` on the fixed chrome bar promotes the bar
// to its own composited layer, and Chromium can then re-rasterise unrelated
// content (the graph canvas) at a coarser scale. The damage is 200px away from
// the bar, so no bounding-box or computed-style assertion can see it — only the
// pixels can. See docs/DECISIONS.md D-30 and D-27's implementation note.
//
// Not a spec file (testMatch is **/*.spec.js), so it does not move the e2e count.
import { inflateSync } from "node:zlib";

/** Decode an 8-bit non-interlaced PNG (colour type 2 or 6) to {width,height,data:RGBA}. */
export function decodePng(buf) {
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error("not a PNG");
  let off = 8;
  let width = 0;
  let height = 0;
  let colorType = 0;
  let bitDepth = 0;
  const idat = [];
  while (off < buf.length) {
    const len = buf.readUInt32BE(off);
    const type = buf.toString("ascii", off + 4, off + 8);
    const body = buf.subarray(off + 8, off + 8 + len);
    if (type === "IHDR") {
      width = body.readUInt32BE(0);
      height = body.readUInt32BE(4);
      bitDepth = body[8];
      colorType = body[9];
      if (bitDepth !== 8) throw new Error(`bit depth ${bitDepth} unsupported`);
      if (body[12] !== 0) throw new Error("interlaced PNG unsupported");
    } else if (type === "IDAT") {
      idat.push(body);
    } else if (type === "IEND") {
      break;
    }
    off += len + 12;
  }
  const channels = colorType === 6 ? 4 : colorType === 2 ? 3 : 0;
  if (!channels) throw new Error(`colour type ${colorType} unsupported`);

  const raw = inflateSync(Buffer.concat(idat));
  const stride = width * channels;
  const out = Buffer.alloc(width * height * 4);
  let prev = Buffer.alloc(stride);
  let p = 0;
  for (let y = 0; y < height; y++) {
    const filter = raw[p++];
    const line = Buffer.from(raw.subarray(p, p + stride));
    p += stride;
    for (let i = 0; i < stride; i++) {
      const a = i >= channels ? line[i - channels] : 0;
      const b = prev[i];
      const c = i >= channels ? prev[i - channels] : 0;
      let v = line[i];
      if (filter === 1) v += a;
      else if (filter === 2) v += b;
      else if (filter === 3) v += (a + b) >> 1;
      else if (filter === 4) {
        const pa = Math.abs(b - c);
        const pb = Math.abs(a - c);
        const pc = Math.abs(a + b - 2 * c);
        v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      line[i] = v & 0xff;
    }
    for (let x = 0; x < width; x++) {
      const s = x * channels;
      const d = (y * width + x) * 4;
      out[d] = line[s];
      out[d + 1] = line[s + 1];
      out[d + 2] = line[s + 2];
      out[d + 3] = channels === 4 ? line[s + 3] : 255;
    }
    prev = line;
  }
  return { width, height, data: out };
}

/**
 * Variance of the Laplacian over luma — the standard focus measure.
 * Softer raster -> lower number. Same content, so the two sides are comparable.
 */
export function sharpness(png) {
  const { width, height, data } = png;
  const luma = new Float64Array(width * height);
  for (let i = 0; i < width * height; i++) {
    luma[i] = 0.2126 * data[i * 4] + 0.7152 * data[i * 4 + 1] + 0.0722 * data[i * 4 + 2];
  }
  let sum = 0;
  let sumSq = 0;
  let n = 0;
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = y * width + x;
      const l =
        4 * luma[i] - luma[i - 1] - luma[i + 1] - luma[i - width] - luma[i + width];
      sum += l;
      sumSq += l * l;
      n++;
    }
  }
  return n ? sumSq / n - (sum / n) ** 2 : 0;
}

export function sharpnessOf(buf) {
  return sharpness(decodePng(buf));
}
