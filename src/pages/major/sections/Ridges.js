import React, { useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import SectionHeading from '../../../components/SectionHeading';
import Reveal from '../../../components/Reveal';
import Tip from '../../../components/Tooltip';

const W = 800;
const H = 176;
const BASE = 168;
const TOP = 16;
const PAD = 30;
const BINS = 48;
// Half-window of the moving average over bin counts. 3 means a 7 bin window, which takes
// the sampling noise out of 10,000 draws without flattening a real second hump.
const SMOOTH = 3;
// Viewbox units. The labels are HTML at a fixed point size while the chart scales, so this
// has to stay wide enough that two peaks still clear each other on a 390px screen.
const LABEL_GAP = 60;
const GRID = 4;
// Anything inside this of a coin toss is close enough that the ranking is not usable yet.
const CLOSE = 0.15;

const pct = (value) => Math.round((value || 0) * 100);
const dec3 = (value) => value.toFixed(3).replace(/^0\./, '.');
const r1 = (value) => Math.round(value * 10) / 10;
const shortName = (alternative) => alternative.label.replace(/\s*engineering$/i, '');

const xOf = (bin) => PAD + ((bin + 0.5) / BINS) * (W - PAD * 2);

// Cubic with both control points held at their own endpoint's height. That smooths the
// corners without ever overshooting above or below the bins it joins, so the curve can
// never invent a peak or dip below zero the way a Catmull-Rom spline would.
const linePath = (points) => {
  let d = `M${points[0].x},${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const from = points[i - 1];
    const to = points[i];
    const grip = r1((to.x - from.x) / 3);
    d += `C${r1(from.x + grip)},${from.y} ${r1(to.x - grip)},${to.y} ${to.x},${to.y}`;
  }
  return d;
};

const areaPath = (points) =>
  `${linePath(points)}L${points[points.length - 1].x},${BASE}L${points[0].x},${BASE}Z`;

function buildChart(alternatives, distributions, winRate) {
  const live = alternatives.filter((a) => {
    const runs = distributions[a.id];
    return Array.isArray(runs) && runs.length > 0;
  });
  if (live.length === 0) return null;

  let min = Infinity;
  let max = -Infinity;
  for (const alternative of live) {
    const runs = distributions[alternative.id];
    for (let i = 0; i < runs.length; i++) {
      if (runs[i] < min) min = runs[i];
      if (runs[i] > max) max = runs[i];
    }
  }
  const span = max - min;
  if (!Number.isFinite(span) || span < 1e-12) return null;

  const density = {};
  let peak = 0;
  for (const alternative of live) {
    const runs = distributions[alternative.id];
    const counts = new Array(BINS).fill(0);
    for (let i = 0; i < runs.length; i++) {
      let bin = Math.floor(((runs[i] - min) / span) * BINS);
      if (bin < 0) bin = 0;
      else if (bin >= BINS) bin = BINS - 1;
      counts[bin] += 1;
    }
    const smoothed = counts.map((_, i) => {
      let sum = 0;
      let seen = 0;
      for (let k = i - SMOOTH; k <= i + SMOOTH; k++) {
        if (k >= 0 && k < BINS) {
          sum += counts[k];
          seen += 1;
        }
      }
      return sum / seen;
    });
    for (const value of smoothed) if (value > peak) peak = value;
    density[alternative.id] = smoothed;
  }
  if (peak <= 0) return null;

  // Weakest first so the front runner draws on top and reads darkest.
  const order = [...live].sort((a, b) => (winRate[a.id] || 0) - (winRate[b.id] || 0));

  const ridges = order.map((alternative, rank) => {
    const bins = density[alternative.id];
    // Anchored on the baseline at both ends. The alternative that owns the global minimum
    // has a real count in bin zero, and without the anchor its area closes as a cliff.
    const points = [
      { x: PAD, y: BASE },
      ...bins.map((value, i) => ({
        x: r1(xOf(i)),
        y: r1(BASE - (value / peak) * (BASE - TOP)),
      })),
      { x: W - PAD, y: BASE },
    ];
    let peakBin = 0;
    for (let i = 1; i < bins.length; i++) if (bins[i] > bins[peakBin]) peakBin = i;
    return {
      id: alternative.id,
      name: shortName(alternative),
      code: alternative.id.toUpperCase(),
      line: linePath(points),
      area: areaPath(points),
      fill: 0.16 + rank * 0.09,
      stroke: 0.45 + rank * 0.22,
      width: 1.5 + rank * 0.25,
      x: r1(xOf(peakBin)),
    };
  });

  // Peaks can sit almost on top of each other, which is the whole point of the picture but
  // makes the labels collide. Nudge right, then walk back from the edge.
  const labels = ridges.map((ridge) => ({ code: ridge.code, x: ridge.x })).sort((a, b) => a.x - b.x);
  for (let i = 1; i < labels.length; i++) {
    if (labels[i].x - labels[i - 1].x < LABEL_GAP) labels[i].x = labels[i - 1].x + LABEL_GAP;
  }
  for (let i = labels.length - 1; i >= 0; i--) {
    if (labels[i].x > W - PAD) labels[i].x = W - PAD;
    if (i > 0 && labels[i].x - labels[i - 1].x < LABEL_GAP) {
      labels[i - 1].x = labels[i].x - LABEL_GAP;
    }
  }
  for (const label of labels) if (label.x < PAD) label.x = PAD;

  return { min, max, ridges, labels };
}

// The two majors whose head to head is nearest a coin toss, reported from the winner's side.
function closestPair(alternatives, beats) {
  let closest = null;
  for (let i = 0; i < alternatives.length; i++) {
    for (let j = i + 1; j < alternatives.length; j++) {
      const a = alternatives[i];
      const b = alternatives[j];
      const ab = beats[`${a.id}__${b.id}`];
      const ba = beats[`${b.id}__${a.id}`];
      if (ab == null && ba == null) continue;
      const forward = ab != null ? ab : 1 - ba;
      const backward = ba != null ? ba : 1 - ab;
      const [winner, loser, share] =
        forward >= backward ? [a, b, forward] : [b, a, backward];
      const gap = Math.abs(share - 0.5);
      if (!closest || gap < closest.gap) closest = { winner, loser, share, gap };
    }
  }
  return closest;
}

export const Ridges = ({ doc, derived }) => {
  const reduce = useReducedMotion();
  const { monteCarlo } = derived;
  const { alternatives } = doc;
  const winRate = monteCarlo.winRate || {};

  // The page shell recomputes derived once per doc change, so monteCarlo is the right
  // identity to key the histogram off. Rebuilding it bins 10,000 draws per alternative.
  const chart = useMemo(
    () => buildChart(alternatives, monteCarlo.distributions || {}, monteCarlo.winRate || {}),
    [alternatives, monteCarlo]
  );

  const ranked = [...alternatives].sort((a, b) => (winRate[b.id] || 0) - (winRate[a.id] || 0));
  const closest = closestPair(alternatives, monteCarlo.pairwiseBeats || {});

  const summary = ranked
    .map((alternative) => `${shortName(alternative)} ${pct(winRate[alternative.id])} percent`)
    .join(', ');

  return (
    <section id="uncertainty" className="mj-sec">
      <SectionHeading eyebrow="S3 / Uncertainty" title="How Much The Three Overlap" />

      <Reveal as="p" className="mj-hint">
        You do not enter one number per box, you enter a <Tip term="range">range</Tip>. Then the page
        plays the decision out <Tip term="monte-carlo">10,000 times</Tip> and draws every result. Each
        hump is one major&apos;s <Tip term="distribution">distribution</Tip>. The overlap is the
        honest part.
      </Reveal>

      {!chart && (
        <p className="mjb-empty">
          Nothing to draw yet. Every run came out the same, which means the scores are still
          placeholders. Put real ranges in first.
        </p>
      )}

      {chart && (
        <Reveal className="mjb-ridges-wrap">
          <svg
            className="mjb-ridges"
            viewBox={`0 0 ${W} ${H}`}
            role="img"
            aria-label={`Score distributions across 10,000 runs. Finishing first: ${summary}.`}
          >
            <g stroke="rgba(18,34,49,.1)">
              {Array.from({ length: GRID }, (_, i) => {
                const x = r1(PAD + ((i + 1) / (GRID + 1)) * (W - PAD * 2));
                return <line key={x} x1={x} y1={TOP - 4} x2={x} y2={BASE} />;
              })}
            </g>
            <line x1="0" y1={BASE} x2={W} y2={BASE} stroke="rgba(18,34,49,.25)" strokeWidth="1" />

            {chart.ridges.map((ridge) => (
              <g key={ridge.id}>
                <path d={ridge.area} fill="var(--accent)" opacity={ridge.fill} />
                <motion.path
                  d={ridge.line}
                  fill="none"
                  stroke="var(--accent)"
                  strokeWidth={ridge.width}
                  opacity={ridge.stroke}
                  initial={reduce ? false : { pathLength: 0 }}
                  whileInView={{ pathLength: 1 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                />
              </g>
            ))}

          </svg>

          {/* HTML, not <text>: the chart scales with the container and in-SVG labels would
              shrink to about four pixels on a phone. The win rates below name them again. */}
          <div className="mjb-ridge-key" aria-hidden="true">
            {chart.labels.map((label) => (
              <span key={label.code} style={{ left: `${(label.x / W) * 100}%` }}>
                {label.code}
              </span>
            ))}
          </div>

          <p className="mjb-axis">
            <span>{dec3(chart.min)}</span>
            <span>score, low to high</span>
            <span>{dec3(chart.max)}</span>
          </p>
        </Reveal>
      )}

      <div className="mjb-pwin">
        {ranked.map((alternative, i) => (
          <span key={alternative.id}>
            {shortName(alternative)} {i === 0 ? 'finishes first' : 'first'}{' '}
            <b>{pct(winRate[alternative.id])}%</b>
          </span>
        ))}
        {closest && (
          <Tip
            term="head-to-head"
            className={closest.gap < CLOSE ? 'mjb-close mjb-close-hot' : 'mjb-close'}
          >
            {shortName(closest.winner)} beats {shortName(closest.loser)} {pct(closest.share)}% head
            to head
          </Tip>
        )}
      </div>

      <details className="plain">
        <summary>Plain English: how to read those humps</summary>
        <div className="pbody">
          <p>
            Left to right is score, low to high. The taller and further right a hump sits, the better
            that major did across all 10,000 runs.
          </p>
          <p>
            Where two humps sit on top of each other, those two majors are genuinely tied. It means
            there are thousands of perfectly reasonable versions of your own opinions where the
            second one wins instead of the first.
          </p>
          <p>
            A hump sitting off on its own, barely touching the others, is the only kind of clear
            signal on this screen. Given how little is settled right now, even that is worth an hour
            of checking before you act on it.
          </p>
        </div>
      </details>
    </section>
  );
};

export default Ridges;
