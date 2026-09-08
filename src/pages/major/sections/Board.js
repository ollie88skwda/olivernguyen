import React from 'react';
import { MonoLabel, SectionHead } from '@/components/brand';
import { Input } from '@/components/ui/input';
import { useTheme } from '../../../theme/ThemeProvider';
import Tip from '../../../components/Tooltip';

const EMPTY_SCORE = { lo: 0, mid: 0, hi: 0 };
// The cell fill is an accent-token mix with a theme-specific range. The cell's own
// number is always available in the popup and aria-label.
const INK_FLOOR = 0.15;
const INK_RANGE = 0.85;
const DARK_INK_FLOOR = 0.6;
const INK_LOUD_LIGHT = 0.85;
const RAMP = [0.2, 0.4, 0.6, 0.8, 1];

const dec2 = (value) => value.toFixed(2).replace(/^0/, '');
const dec3 = (value) => value.toFixed(3).replace(/^0/, '');
const ink = (value, theme) =>
  theme === 'dark' ? DARK_INK_FLOOR + (1 - DARK_INK_FLOOR) * value : INK_FLOOR + INK_RANGE * value;

const cellStyle = (value, theme = 'light') => {
  const fill = Math.round(ink(value, theme) * 100);
  return {
    background:
      theme === 'dark'
        ? `color-mix(in srgb, var(--accent) ${fill}%, var(--bg))`
        : `color-mix(in srgb, var(--accent) ${fill}%, transparent)`,
  };
};

export const Board = ({ doc, derived, editing, updateDoc }) => {
  const { theme } = useTheme();
  const { ahp, normalized, wsm } = derived;
  const { criteria, alternatives } = doc;

  const totalOf = (id) => (wsm[id] && wsm[id].total) || 0;
  const contributionOf = (altId, critId) =>
    (wsm[altId] && wsm[altId].contributions[critId]) || 0;
  const ratingOf = (altId, critId) =>
    (normalized[critId] && normalized[critId][altId]) || 0;
  const scoreOf = (alternative, critId) => alternative.scores[critId] || EMPTY_SCORE;

  // Edit mode drops the weight-proportional widths: three number inputs cannot live in a
  // column that is 8% of the row. Fixed columns plus a scroll container instead.
  const columnStyle = (critId) =>
    editing ? { flex: '0 0 96px' } : { width: `${(ahp.weights[critId] || 0) * 100}%` };

  const rows = [...alternatives].sort((a, b) => totalOf(b.id) - totalOf(a.id));

  const allTied = criteria.every((c) => alternatives.every((a) => ratingOf(a.id, c.id) === 0.5));

  const inkTier = (value) => theme === 'dark' || value >= INK_LOUD_LIGHT ? 'accent' : 'quiet';

  const setScore = (altId, critId, key, raw) => {
    const parsed = Number(raw);
    const value = Number.isFinite(parsed) ? parsed : 0;
    updateDoc((current) => ({
      ...current,
      alternatives: current.alternatives.map((alternative) =>
        alternative.id === altId
          ? {
              ...alternative,
              scores: {
                ...alternative.scores,
                [critId]: { ...(alternative.scores[critId] || EMPTY_SCORE), [key]: value },
              },
            }
          : alternative
      ),
    }));
  };

  return (
    <section id="board" className="mj-sec">
      <SectionHead kicker="S1 / The Board" title="The Matrix, As A Picture" />

      <p className="mj-hint">
        This is a <Tip term="weighted-matrix">weighted matrix</Tip>, drawn instead of tabulated.
        Column width is how much that thing counts to you. How dark a box is shows how well that
        major does on it. The best option is the widest, darkest row, so you do not have to read any
        numbers to see it. Hover or tap any box for what it measures and the{' '}
        <Tip term="range">range</Tip> behind its number.
      </p>

      {allTied && (
        <p className="mj-tie">
          Every box is tied at .50 because the scores are still placeholders. Turn on EDIT and put
          real numbers in.
        </p>
      )}

      <div className={editing ? 'mj-board mj-board-edit' : 'mj-board'}>
        <div className="mj-head">
          {criteria.map((criterion) => (
            <span key={criterion.id} style={columnStyle(criterion.id)}>
              {criterion.label}
            </span>
          ))}
        </div>

        {rows.map((alternative) => (
          <div className="mj-row" key={alternative.id}>
            <div className="mj-name">
              {alternative.label.replace(/\s*engineering$/i, '')}
              <MonoLabel tone="faint" className="mj-name-code">
                {alternative.id.toUpperCase()}
              </MonoLabel>
            </div>

            <div className="mj-cells">
              {criteria.map((criterion, index) => {
                const rating = ratingOf(alternative.id, criterion.id);
                const score = scoreOf(alternative, criterion.id);

                if (editing) {
                  return (
                    <div
                      className="mj-cell mj-cell-edit"
                      key={criterion.id}
                      style={columnStyle(criterion.id)}
                    >
                      {['lo', 'mid', 'hi'].map((key) => (
                        <div className="mj-in-row" key={key}>
                          <i>{key}</i>
                          <Input
                            className="mj-in"
                            face="mono"
                            type="number"
                            step="0.5"
                            value={score[key]}
                            aria-label={`${alternative.label}, ${criterion.label}, ${key}`}
                            onChange={(e) => setScore(alternative.id, criterion.id, key, e.target.value)}
                          />
                        </div>
                      ))}
                    </div>
                  );
                }

                const side =
                  index === 0 ? ' mj-pop-l' : index === criteria.length - 1 ? ' mj-pop-r' : '';
                return (
                  <button
                    type="button"
                    className="mj-cell"
                    data-ink={inkTier(rating)}
                    key={criterion.id}
                    style={{ ...columnStyle(criterion.id), ...cellStyle(rating, theme) }}
                    aria-label={`${alternative.label}, ${criterion.label}: rated ${dec2(rating)} of 1. Range ${score.lo} to ${score.hi}, best guess ${score.mid}. ${alternative.notes || ''}`.trim()}
                  >
                    <span className="mj-cell-v">{dec2(rating)}</span>
                    <span className={`mj-pop${side}`} aria-hidden="true">
                      <b>
                        {alternative.label} · {criterion.label}
                      </b>
                      <span>
                        {score.lo} to {score.hi}, best guess {score.mid}
                      </span>
                      <span>
                        rated {dec2(rating)} of 1, adds {dec3(contributionOf(alternative.id, criterion.id))} to
                        the row
                      </span>
                      {alternative.notes && <span className="mj-pop-note">{alternative.notes}</span>}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mj-total">{dec3(totalOf(alternative.id))}</div>
          </div>
        ))}
      </div>

      <div className="mj-legend">
        <span className="mj-key">
          Darkness is how well a major does on that column
          <span className="mj-ramp" aria-hidden="true">
            {RAMP.map((step) => (
              <i key={step} style={cellStyle(step, theme)} />
            ))}
          </span>
        </span>
        <span className="mj-key">
          Column width is the <Tip term="weight">weight</Tip>. Weights come from the duels in S2.
        </span>
      </div>

      <details className="plain">
        <summary>Plain English: how the number at the end of a row is built</summary>
        <div className="pbody">
          <p>
            Every major gets a 0 to 1 rating on each column. The best of the three on a column gets
            1, the worst gets 0, and anything in between lands in between. Three majors with the
            same number all get .50, which is what a tie looks like.
          </p>
          <p>
            Then each column has a weight, which is how much you personally care. If doors kept open
            is worth 20% of the total, a major rated .85 there earns .85 times .20, which is .17
            from that column.
          </p>
          <p>
            Do that for every column and add them up. That is the number at the end of the row.
            There is no hidden cleverness in this part, it is multiplication and addition, and the
            rest of the page exists to check whether the result deserves your trust.
          </p>
        </div>
      </details>
    </section>
  );
};

export default Board;
