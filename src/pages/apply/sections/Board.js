import React, { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import SectionHeading from '../../../components/SectionHeading';
import Reveal from '../../../components/Reveal';
import Tip from '../../../components/Tooltip';

const EMPTY_SCORE = { lo: 0, mid: 0, hi: 0 };
const INK_FLOOR = 0.15;
const INK_RANGE = 0.85;
// Below this the navy is too pale to carry cream text.
const INK_INVERT = 0.5;
const RAMP = [0.2, 0.4, 0.6, 0.8, 1];
const COLLAPSED_ROWS = 12;

const dec2 = (value) => value.toFixed(2).replace(/^0/, '');
const dec3 = (value) => value.toFixed(3).replace(/^0/, '');
const ink = (value) => INK_FLOOR + INK_RANGE * value;

const cellStyle = (value) => ({
  background: `rgba(9, 36, 65, ${ink(value)})`,
  color: ink(value) > INK_INVERT ? 'var(--on-accent)' : 'var(--text-muted)',
});

// A school nobody has researched gets hatching rather than a shade, because a mid-grey box
// reads as "average" and the honest answer is "unknown". Ollie asked for counselor picks to
// be addable mid-cycle, and this is what stops them inheriting scores they did not earn.
const HATCH = {
  background:
    'repeating-linear-gradient(45deg, rgba(9,36,65,.10), rgba(9,36,65,.10) 5px, transparent 5px, transparent 10px)',
  color: 'var(--text-faint)',
};

const isUnresearched = (school, criterionId) => {
  const basis = school.scores && school.scores[criterionId] && school.scores[criterionId].basis;
  return typeof basis === 'string' && basis === 'unresearched';
};

export const Board = ({ doc, derived, editing, updateDoc }) => {
  const reduce = useReducedMotion();
  const [showAll, setShowAll] = useState(false);
  const [sortBy, setSortBy] = useState('total');

  const { ahp, normalized, wsm } = derived;
  const { criteria } = doc;
  const schools = doc.schools.filter((s) => s && s.scores);

  const totalOf = (id) => (wsm[id] && wsm[id].total) || 0;
  const contributionOf = (schoolId, critId) =>
    (wsm[schoolId] && wsm[schoolId].contributions[critId]) || 0;
  const ratingOf = (schoolId, critId) => (normalized[critId] && normalized[critId][schoolId]) || 0;
  const scoreOf = (school, critId) => (school.scores && school.scores[critId]) || EMPTY_SCORE;

  const sorted = [...schools].sort((a, b) =>
    sortBy === 'total' ? totalOf(b.id) - totalOf(a.id) : ratingOf(b.id, sortBy) - ratingOf(a.id, sortBy)
  );
  const rows = showAll ? sorted : sorted.slice(0, COLLAPSED_ROWS);

  const maxWeight = Math.max(...criteria.map((c) => ahp.weights[c.id] || 0), 0.0001);

  const setScore = (schoolId, critId, key, raw) => {
    const parsed = Number(raw);
    const value = Number.isFinite(parsed) ? parsed : 0;
    updateDoc((current) => ({
      ...current,
      schools: current.schools.map((school) =>
        school.id === schoolId
          ? {
              ...school,
              scores: {
                ...school.scores,
                [critId]: {
                  ...(school.scores[critId] || EMPTY_SCORE),
                  [key]: value,
                  // Typing a number is Ollie overriding the derivation, so the basis has to
                  // stop claiming a rule produced it.
                  basis: 'entered by hand',
                },
              },
            }
          : school
      ),
    }));
  };

  return (
    <section id="board" className="ap-sec">
      <SectionHeading eyebrow="S1 / The Board" title="Every School, As Ink" />

      <Reveal as="p" className="ap-hint">
        Each column is one thing you care about and each box is how well a school does on it.
        Darker is better. The number at the end of a row is the whole{' '}
        <Tip term="weighted-matrix">weighted</Tip> result. Columns are even and the{' '}
        <Tip term="weight">weight</Tip> sits under each heading as a bar and a percentage, so the
        heading can just be the name of the thing.
      </Reveal>

      <div className="ap-board-tools">
        <label className="ap-sortlab">
          Sort
          <select
            className="ap-sort"
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value)}
          >
            <option value="total">by total</option>
            {criteria.map((criterion) => (
              <option key={criterion.id} value={criterion.id}>
                by {criterion.label.toLowerCase()}
              </option>
            ))}
          </select>
        </label>
        <span className="ap-count">
          {rows.length} of {schools.length}
        </span>
      </div>

      <div className={editing ? 'ap-board ap-board-edit' : 'ap-board'}>
        <div className="ap-head">
          <span className="ap-head-name">School</span>
          {criteria.map((criterion) => (
            <span className="ap-head-col" key={criterion.id}>
              <span className="ap-head-label">{criterion.label}</span>
              <span className="ap-rail" aria-hidden="true">
                <span className="ap-rail-track">
                  <i style={{ width: `${((ahp.weights[criterion.id] || 0) / maxWeight) * 100}%` }} />
                </span>
                <em>{Math.round((ahp.weights[criterion.id] || 0) * 100)}%</em>
              </span>
            </span>
          ))}
          <span className="ap-head-total">total</span>
        </div>

        {rows.map((school) => (
          <motion.div
            className="ap-row"
            key={school.id}
            layout={!reduce}
            transition={{ layout: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } }}
          >
            <div className="ap-name">
              {school.name}
              {school.addedBy && <small className="ap-added">{school.addedBy}</small>}
            </div>

            <div className="ap-cells">
              {criteria.map((criterion, index) => {
                const rating = ratingOf(school.id, criterion.id);
                const score = scoreOf(school, criterion.id);
                const unknown = isUnresearched(school, criterion.id);

                if (editing) {
                  return (
                    <div className="ap-cell ap-cell-edit" key={criterion.id}>
                      {['lo', 'mid', 'hi'].map((key) => (
                        <span className="ap-in-row" key={key}>
                          <i>{key}</i>
                          <input
                            className="ap-in"
                            type="number"
                            step="0.5"
                            value={score[key]}
                            aria-label={`${school.name}, ${criterion.label}, ${key}`}
                            onChange={(event) =>
                              setScore(school.id, criterion.id, key, event.target.value)
                            }
                          />
                        </span>
                      ))}
                    </div>
                  );
                }

                const side =
                  index === 0 ? ' ap-pop-l' : index === criteria.length - 1 ? ' ap-pop-r' : '';
                return (
                  <button
                    type="button"
                    className="ap-cell"
                    key={criterion.id}
                    style={unknown ? HATCH : cellStyle(rating)}
                    aria-label={
                      unknown
                        ? `${school.name}, ${criterion.label}: not researched yet`
                        : `${school.name}, ${criterion.label}: rated ${dec2(rating)} of 1. Range ${score.lo} to ${score.hi}, best guess ${score.mid}. ${score.basis || ''}`.trim()
                    }
                  >
                    <span className="ap-cell-v">{unknown ? '—' : dec2(rating)}</span>
                    <span className={`ap-pop${side}`} aria-hidden="true">
                      <b>
                        {school.name} · {criterion.label}
                      </b>
                      {unknown ? (
                        <span>Not researched yet. Wide on purpose, so it reads as unknown.</span>
                      ) : (
                        <>
                          <span>
                            {score.lo} to {score.hi}, best guess {score.mid}
                          </span>
                          <span>
                            rated {dec2(rating)} of 1, adds{' '}
                            {dec3(contributionOf(school.id, criterion.id))} to the row
                          </span>
                        </>
                      )}
                      {score.basis && <span className="ap-pop-note">{score.basis}</span>}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="ap-total">{dec3(totalOf(school.id))}</div>
          </motion.div>
        ))}
      </div>

      {schools.length > COLLAPSED_ROWS && (
        <button type="button" className="ap-more" onClick={() => setShowAll((on) => !on)}>
          {showAll ? 'show top 12' : `show all ${schools.length}`}
        </button>
      )}

      <div className="ap-legend">
        <span className="ap-key">
          Darkness is how well a school does on that column
          <span className="ap-ramp" aria-hidden="true">
            {RAMP.map((step) => (
              <i key={step} style={{ background: `rgba(9, 36, 65, ${step})` }} />
            ))}
          </span>
        </span>
        <span className="ap-key">
          Hatched means <Tip term="unresearched">unresearched</Tip>, not bad.
        </span>
        <span className="ap-key">
          Weights come from the duels in S2. You never type one.
        </span>
      </div>

      <details className="plain">
        <summary>Plain English: where these scores came from</summary>
        <div className="pbody">
          <p>
            Three of the four columns were filled in from research, not opinion. Whether a
            kinesiology department exists is a fact. Whether you can start undeclared and how hard
            it is to switch majors afterwards are facts. How many programs a school has whose door
            shuts when high school ends is a fact. Hover any box and it tells you the rule that
            produced its number.
          </p>
          <p>
            Program strength is the exception. Whether Georgia Tech beats Purdue for what you
            actually want to do is your call, not something a page can look up, so every school
            starts as a placeholder there until you fill it in.
          </p>
          <p>
            Anything nobody has checked stays hatched and wide rather than landing in the middle. A
            grey box in the middle would read as average, and the honest answer is that we do not
            know yet.
          </p>
        </div>
      </details>
    </section>
  );
};

export default Board;
