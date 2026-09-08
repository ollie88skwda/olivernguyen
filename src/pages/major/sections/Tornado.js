import React from 'react';
import { MonoLabel, SectionHead } from '@/components/brand';
import Tip from '../../../components/Tooltip';

// Under this much of a weight shift, one ordinary change of heart flips the answer.
const FRAGILE = 0.1;
const MIN_BAR = 8;
const MAX_BAR = 80;

const pct = (value) => Math.round((value || 0) * 100);

// 9.4 reads as 9 pts, but 0.4 must not round away to 0 pts and claim the answer is free.
const points = (delta) => {
  const n = delta * 100;
  return n >= 1 ? String(Math.round(n)) : n.toFixed(1);
};

const signed = (row) => `${row.direction === 'decrease' ? '-' : '+'}${points(row.delta)} pts`;

export const Tornado = ({ doc, derived, onPreviewFlip }) => {
  const { flip, ahp, wsm } = derived;
  const { criteria, alternatives } = doc;

  const clickable = typeof onPreviewFlip === 'function';

  const rows = criteria
    .map((criterion) => {
      const entry = flip[criterion.id] || {};
      const delta = Number.isFinite(entry.delta) ? entry.delta : Infinity;
      return { criterion, delta, direction: entry.direction || null };
    })
    .sort((a, b) => a.delta - b.delta);

  const finite = rows.filter((row) => Number.isFinite(row.delta));
  const widest = finite.length > 0 ? finite[finite.length - 1].delta : 0;

  const totals = alternatives.map((a) => (wsm[a.id] && wsm[a.id].total) || 0);
  const tied = totals.length > 1 && Math.max(...totals) - Math.min(...totals) < 1e-9;

  const barWidth = (row) => {
    if (!Number.isFinite(row.delta)) return 100;
    if (widest <= 0) return MIN_BAR;
    return MIN_BAR + (MAX_BAR - MIN_BAR) * (row.delta / widest);
  };

  const lead = finite[0];
  const leadFrom = lead ? pct(ahp.weights[lead.criterion.id]) : 0;
  const leadTo = lead
    ? pct(
        (ahp.weights[lead.criterion.id] || 0) +
          (lead.direction === 'decrease' ? -lead.delta : lead.delta)
      )
    : 0;

  return (
    <section id="fragility" className="mj-sec">
      <SectionHead kicker="S4 / Fragility" title="How Little It Takes To Flip" />

      <p className="mj-hint">
        How much would you have to change your mind about each thing before a different major wins?
        That is <Tip term="fragility">fragility</Tip>, and a short bar means one small shift in how
        you feel flips the whole answer.
      </p>

      {tied && (
        <p className="mjb-empty">
          Every major is tied right now, so there is nothing for a change of heart to flip. Put real
          scores on the board first and these bars will mean something.
        </p>
      )}

      {/* Bars are static (§6 has no entrance animation for them): fragile rows carry the
          warning token, robust rows the hairline, everything else the accent. The bar
          LENGTH is the fragility encoding — it is not a Progress component because a flip
          distance is a measurement, not a completion. */}
      <div className="mjb-torn">
        {rows.map((row, i) => {
          const robust = !Number.isFinite(row.delta);
          const fragile = !robust && row.delta < FRAGILE;
          const width = barWidth(row);
          const readout = robust ? 'never flips' : signed(row);
          const classes = ['mjb-torn-bar'];
          if (robust) classes.push('mjb-torn-robust');
          else if (fragile) classes.push('mjb-torn-frag');

          const body = (
            <>
              <span className="mjb-torn-l">{row.criterion.label}</span>
              <span className="mjb-torn-track">
                <span className={classes.join(' ')} style={{ width: `${width}%` }} />
              </span>
              <span className="mjb-torn-v">{readout}</span>
            </>
          );

          // A robust criterion has no flipped world to preview, so it stays a plain row rather
          // than a button that looks live and does nothing.
          if (clickable && !robust) {
            return (
              <button
                type="button"
                className="mjb-torn-row mjb-torn-hit"
                key={row.criterion.id}
                onClick={() => onPreviewFlip(row.criterion.id)}
                aria-label={`Preview the board with ${row.criterion.label} weighted ${readout}`}
              >
                {body}
              </button>
            );
          }
          return (
            <div className="mjb-torn-row" key={row.criterion.id}>
              {body}
            </div>
          );
        })}
      </div>

      <p className="mj-hint mjb-after">
        {lead && (
          <>
            Read the top row as: if {lead.criterion.label.toLowerCase()} went from {leadFrom}% of
            your total {lead.direction === 'decrease' ? 'down' : 'up'} to {leadTo}%, a different
            major wins.{' '}
          </>
        )}
        {clickable && 'Click any bar and the board above redraws showing that version of you. '}
        Bars under {pct(FRAGILE)} points are marked in rust. Those are the ones an ordinary change of
        heart can flip.
      </p>

      <details className="plain">
        <summary>Plain English: why fragility matters more than the winner</summary>
        <div className="pbody">
          <p>
            A result that survives you changing your mind is worth acting on. A result that flips
            when you care 9 points more about having fun is not a result, it is a rounding error.
          </p>
          <p>
            The rows marked never flips are the good news. No matter how you weight that column, the
            answer stays the same, which means that part of your thinking is settled and you can stop
            turning it over.
          </p>
          <p>
            The short bars at the top are the ones to watch. They are the beliefs the whole answer is
            balanced on, so they are the ones worth an hour of real research each.
          </p>
        </div>
      </details>
    </section>
  );
};

export default Tornado;
