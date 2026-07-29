import React, { useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import SectionHeading from '../../../components/SectionHeading';
import Reveal from '../../../components/Reveal';
import Tip from '../../../components/Tooltip';

// Saaty 1 to 9 read in both directions. Index 8 is "they matter the same"; left of it the
// first criterion wins by that much, right of it the second one does.
const LEVELS = [9, 8, 7, 6, 5, 4, 3, 2, 1, 2, 3, 4, 5, 6, 7, 8, 9];
const CENTER = 8;

// Every word here has to finish the sentence "A is ___ important than B", so the ladder
// reads as one increasing scale rather than a set of loose synonyms.
const WORDS = {
  2: 'barely more',
  3: 'a bit more',
  4: 'noticeably more',
  5: 'clearly more',
  6: 'a lot more',
  7: 'much more',
  8: 'far more',
  9: 'massively more',
};

const CR_LIMIT = 0.1;

const valueAt = (index) => (index <= CENTER ? LEVELS[index] : 1 / LEVELS[index]);

// Snap to the nearest stop on a log scale, so a value written by scripts/decision.mjs
// (0.333 rather than 1/3) still lights up the right square.
const stopFor = (value) => {
  if (!Number.isFinite(value) || value <= 0) return null;
  const target = Math.log(value);
  let best = CENTER;
  let bestError = Infinity;
  for (let i = 0; i < LEVELS.length; i++) {
    const error = Math.abs(Math.log(valueAt(i)) - target);
    if (error < bestError) {
      bestError = error;
      best = i;
    }
  }
  return best;
};

const verdictFor = (index, a, b) => {
  if (index === CENTER) return `${a.label} and ${b.label} matter the same`;
  const word = WORDS[LEVELS[index]];
  return index < CENTER
    ? `${a.label} is ${word} important than ${b.label}`
    : `${b.label} is ${word} important than ${a.label}`;
};

export const Duel = ({ doc, derived, updateDoc }) => {
  const reduce = useReducedMotion();
  const { criteria } = doc;
  const { ahp } = derived;

  const pairs = useMemo(() => {
    const out = [];
    for (let i = 0; i < criteria.length; i++) {
      for (let j = i + 1; j < criteria.length; j++) {
        out.push({
          a: criteria[i],
          b: criteria[j],
          na: i + 1,
          nb: j + 1,
          key: `${criteria[i].id}|${criteria[j].id}`,
        });
      }
    }
    return out;
  }, [criteria]);

  // computeAHP falls back to the reciprocal of the swapped key, so an answer written the
  // other way round still counts as answered and still shows the right square.
  const readPair = (pair) => {
    const map = doc.pairwise || {};
    const direct = map[pair.key];
    if (direct != null) return direct;
    const swapped = map[`${pair.b.id}|${pair.a.id}`];
    if (swapped != null && swapped !== 0) return 1 / swapped;
    return null;
  };

  const firstUnanswered = () => {
    const at = pairs.findIndex((pair) => readPair(pair) == null);
    return at === -1 ? 0 : at;
  };

  const [cursor, setCursor] = useState(firstUnanswered);

  if (pairs.length === 0) {
    return (
      <section id="weights" className="mj-sec">
        <SectionHeading eyebrow="S2 / Weights" title="You Never Type A Weight" />
        <p className="mj-hint">Add at least two criteria and the matchups appear here.</p>
      </section>
    );
  }

  const index = Math.min(cursor, pairs.length - 1);
  const pair = pairs[index];
  const answered = pairs.filter((p) => readPair(p) != null).length;
  const selected = stopFor(readPair(pair));

  const labelOf = (id) => {
    const criterion = criteria.find((c) => c.id === id);
    return criterion ? criterion.label : id;
  };

  const answer = (stop) => {
    updateDoc((current) => {
      const next = { ...(current.pairwise || {}) };
      delete next[`${pair.b.id}|${pair.a.id}`];
      next[pair.key] = valueAt(stop);
      return { ...current, pairwise: next };
    });
  };

  const step = (delta) => setCursor((at) => (at + delta + pairs.length) % pairs.length);

  const jumpToUnanswered = () => {
    for (let hop = 1; hop <= pairs.length; hop++) {
      const at = (index + hop) % pairs.length;
      if (readPair(pairs[at]) == null) {
        setCursor(at);
        return;
      }
    }
  };

  const jumpToPair = (idA, idB) => {
    const at = pairs.findIndex(
      (p) =>
        (p.a.id === idA && p.b.id === idB) || (p.a.id === idB && p.b.id === idA)
    );
    if (at !== -1) setCursor(at);
  };

  // Every missing pair reads as 1, so a consistency ratio computed off two answers is
  // 0.00 by construction and would say "your answers agree" when there is nothing to agree.
  const checkable = answered >= 3;
  const cr = ahp.consistencyRatio || 0;
  const consistent = cr <= CR_LIMIT;
  const triad = checkable && !consistent ? ahp.worstTriad : null;

  const crClass = !checkable ? 'mjb-cr mjb-cr-idle' : consistent ? 'mjb-cr' : 'mjb-cr mjb-cr-bad';

  return (
    <section id="weights" className="mj-sec">
      <SectionHeading eyebrow="S2 / Weights" title="You Never Type A Weight" />

      <Reveal as="p" className="mj-hint">
        If I asked you how important salary is out of 100, you would make something up. Nobody can
        answer that honestly. But you can answer salary or flexibility, which one and by how much,
        all day. So the page asks {pairs.length} of those little matchups and works out your{' '}
        <Tip term="weight">weights</Tip> from the answers. The method has a name,{' '}
        <Tip term="ahp">AHP</Tip>.
      </Reveal>

      <div className="mjb-progress">
        <span className="mjb-count">
          {answered} of {pairs.length} answered
        </span>
        <span className="mjb-track" aria-hidden="true">
          <span
            className="mjb-fill"
            style={{ width: `${(answered / pairs.length) * 100}%` }}
          />
        </span>
        <span className="mjb-count">
          matchup {index + 1} of {pairs.length}
        </span>
      </div>

      <motion.div
        className="mjb-duel"
        key={pair.key}
        initial={reduce ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className={selected != null && selected < CENTER ? 'mjb-plate mjb-plate-won' : 'mjb-plate'}>
          <b>{pair.a.label}</b>
          <small>C{pair.na}</small>
        </div>

        <div className="mjb-scale-wrap">
          <div
            className="mjb-scale"
            role="radiogroup"
            aria-label={`How much more does ${pair.a.label} matter than ${pair.b.label}`}
          >
            {LEVELS.map((magnitude, stop) => {
              const lit =
                selected != null &&
                stop >= Math.min(selected, CENTER) &&
                stop <= Math.max(selected, CENTER);
              const classes = ['mjb-pip'];
              if (lit) classes.push('mjb-pip-on');
              if (stop === CENTER) classes.push('mjb-pip-mid');
              return (
                <label className="mjb-stop" key={stop}>
                  <input
                    type="radio"
                    name={`duel-${pair.key}`}
                    checked={selected === stop}
                    onChange={() => answer(stop)}
                  />
                  <span className={classes.join(' ')} aria-hidden="true" />
                  <span className="mjb-sr">{verdictFor(stop, pair.a, pair.b)}</span>
                </label>
              );
            })}
          </div>
          <p className="mjb-verdict">
            {selected == null ? 'Pick a square. Middle means they matter the same.' : verdictFor(selected, pair.a, pair.b)}
          </p>
        </div>

        <div className={selected != null && selected > CENTER ? 'mjb-plate mjb-plate-won' : 'mjb-plate'}>
          <b>{pair.b.label}</b>
          <small>C{pair.nb}</small>
        </div>
      </motion.div>

      <div className="mjb-nav">
        <button type="button" className="mjb-btn" onClick={() => step(-1)}>
          Previous
        </button>
        <button type="button" className="mjb-btn" onClick={() => step(1)}>
          Next
        </button>
        {answered < pairs.length && (
          <button type="button" className="mjb-btn mjb-btn-go" onClick={jumpToUnanswered}>
            Jump to next unanswered
          </button>
        )}
        {answered === pairs.length && <span className="mjb-done">All {pairs.length} answered</span>}
      </div>

      <p className={crClass}>
        {!checkable && '◆ CONSISTENCY, NOTHING TO CHECK YET. ANSWER A FEW MATCHUPS FIRST'}
        {checkable && consistent &&
          `◆ CONSISTENCY ${cr.toFixed(2)}, YOUR ANSWERS AGREE WITH EACH OTHER (UNDER 0.10 IS FINE)`}
        {checkable && !consistent &&
          `◆ CONSISTENCY ${cr.toFixed(2)}, SOME OF YOUR ANSWERS CANNOT ALL BE TRUE (0.10 IS THE LINE)`}
      </p>

      {triad && (
        <div className="mjb-triad">
          <p>
            These three are fighting: {labelOf(triad[0])}, {labelOf(triad[1])} and{' '}
            {labelOf(triad[2])}. Going round that loop, each one beats the next and the last one
            beats the first, which cannot be true. Open whichever of the three matchups you felt
            least sure about and change it.
          </p>
          <div className="mjb-triad-jumps">
            {[
              [triad[0], triad[1]],
              [triad[1], triad[2]],
              [triad[0], triad[2]],
            ].map(([idA, idB]) => (
              <button
                type="button"
                className="mjb-btn mjb-btn-small"
                key={`${idA}|${idB}`}
                onClick={() => jumpToPair(idA, idB)}
              >
                {labelOf(idA)} vs {labelOf(idB)}
              </button>
            ))}
          </div>
        </div>
      )}

      <p className="mj-hint mjb-after">
        That <Tip term="consistency">consistency</Tip> number catches you contradicting yourself. If
        you say fun beats money, and money beats flexibility, but then say flexibility beats fun,
        the page notices and quotes the exact three answers back at you so you can fix one. Most
        decision matrices never check this, which is how people end up with weights that cannot all
        be true at once.
      </p>

      <details className="plain">
        <summary>Plain English: why not just type the weights in</summary>
        <div className="pbody">
          <p>
            Weights are the single most powerful input in the whole model and the one people are
            worst at. Typing salary: 25 feels precise but it is a guess dressed up as a number.
          </p>
          <p>
            Head to head comparisons are much easier to answer truthfully, and there are enough of
            them that any single sloppy answer gets averaged out by the rest.
          </p>
          <p>
            {pairs.length} matchups sounds like a lot. Each one is a single click, and every answer
            you add changes the column widths on the board above.
          </p>
        </div>
      </details>
    </section>
  );
};

export default Duel;
