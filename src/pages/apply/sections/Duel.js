import React, { useMemo, useState } from 'react';
import SectionHeading from '../../../components/SectionHeading';
import Reveal from '../../../components/Reveal';
import Tip from '../../../components/Tooltip';

// NOTE: these five pure helpers are also inlined in major/sections/Duel.js. Duplicated on
// purpose for now: consolidating them means editing /major, which this piece of work is
// explicitly scoped out of. Worth extracting to components/ the next time either page's
// duel changes.

// Saaty 1 to 9 read in both directions. Index 8 is "they matter the same"; left of it the
// first criterion wins by that much, right of it the second one does.
const LEVELS = [9, 8, 7, 6, 5, 4, 3, 2, 1, 2, 3, 4, 5, 6, 7, 8, 9];
const CENTER = 8;
const CR_LIMIT = 0.1;

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

const valueAt = (index) => (index <= CENTER ? LEVELS[index] : 1 / LEVELS[index]);

// Snap to the nearest stop on a log scale, so a seeded value like 1.2 still lights up the
// right square instead of reading as unanswered.
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
  const { criteria } = doc;
  const { ahp } = derived;

  const pairs = useMemo(() => {
    const out = [];
    for (let i = 0; i < criteria.length; i++) {
      for (let j = i + 1; j < criteria.length; j++) {
        out.push({ a: criteria[i], b: criteria[j], key: `${criteria[i].id}|${criteria[j].id}` });
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

  const [cursor, setCursor] = useState(0);

  if (pairs.length === 0) {
    return (
      <section id="weights" className="ap-sec">
        <SectionHeading eyebrow="S2 / Weights" title="You Never Type A Weight" />
        <p className="ap-hint">Add at least two criteria and the matchups appear here.</p>
      </section>
    );
  }

  const index = Math.min(cursor, pairs.length - 1);
  const pair = pairs[index];
  const answered = pairs.filter((p) => readPair(p) != null).length;
  const selected = stopFor(readPair(pair));

  const answer = (stop) => {
    updateDoc((current) => {
      const next = { ...(current.pairwise || {}) };
      delete next[`${pair.b.id}|${pair.a.id}`];
      next[pair.key] = valueAt(stop);
      return { ...current, pairwise: next };
    });
  };

  const step = (delta) => setCursor((at) => (at + delta + pairs.length) % pairs.length);

  const checkable = answered >= 3;
  const cr = ahp.consistencyRatio || 0;
  const consistent = cr <= CR_LIMIT;

  return (
    <section id="weights" className="ap-sec">
      <SectionHeading eyebrow="S2 / Weights" title="You Never Type A Weight" />

      <Reveal as="p" className="ap-hint">
        Asked how important special programs are out of 100, you would make something up. Nobody
        can answer that honestly. But you can answer this one against that one, all day. So the
        page asks {pairs.length} small matchups and works the <Tip term="weight">weights</Tip> out
        from the answers. The method is called <Tip term="ahp">AHP</Tip>.
      </Reveal>

      <Reveal as="p" className="ap-hint ap-hint-sub">
        These start pre-answered, which is unusual and deliberate. They encode two decisions you
        already made: that kinesiology is a nice-to-have rather than a co-equal criterion, and that
        a program that makes you stand out beats a department that ranks higher. Change any of them
        and every weight moves.
      </Reveal>

      <div className="ap-duel-progress">
        <span className="ap-duel-count">
          {answered} of {pairs.length} answered
        </span>
        <span className="ap-duel-track" aria-hidden="true">
          <span className="ap-duel-fill" style={{ width: `${(answered / pairs.length) * 100}%` }} />
        </span>
      </div>

      <div className="ap-duel">
        <div className="ap-duel-heads">
          <span className="ap-duel-a">{pair.a.label}</span>
          <span className="ap-duel-vs">vs</span>
          <span className="ap-duel-b">{pair.b.label}</span>
        </div>

        <div className="ap-ladder" role="radiogroup" aria-label={`${pair.a.label} versus ${pair.b.label}`}>
          {LEVELS.map((level, stop) => (
            <button
              key={stop}
              type="button"
              role="radio"
              aria-checked={selected === stop}
              aria-label={verdictFor(stop, pair.a, pair.b)}
              className={
                stop === CENTER
                  ? `ap-rung ap-rung-mid${selected === stop ? ' ap-rung-on' : ''}`
                  : `ap-rung${selected === stop ? ' ap-rung-on' : ''}`
              }
              style={{ '--rung': `${(Math.abs(stop - CENTER) / CENTER) * 0.8 + 0.2}` }}
              onClick={() => answer(stop)}
            >
              <i>{stop === CENTER ? '=' : level}</i>
            </button>
          ))}
        </div>

        <p className="ap-verdict-line" role="status">
          {selected == null ? 'Not answered yet.' : verdictFor(selected, pair.a, pair.b)}
        </p>

        <div className="ap-duel-nav">
          <button type="button" className="ap-navbtn" onClick={() => step(-1)}>
            prev
          </button>
          <span className="ap-duel-at">
            {index + 1} / {pairs.length}
          </span>
          <button type="button" className="ap-navbtn" onClick={() => step(1)}>
            next
          </button>
        </div>
      </div>

      <div className="ap-weights">
        {criteria.map((criterion) => (
          <div className="ap-weight" key={criterion.id}>
            <span className="ap-weight-k">{criterion.label}</span>
            <span className="ap-weight-track" aria-hidden="true">
              <i style={{ width: `${(ahp.weights[criterion.id] || 0) * 100}%` }} />
            </span>
            <span className="ap-weight-v">
              {Math.round((ahp.weights[criterion.id] || 0) * 100)}%
            </span>
          </div>
        ))}
      </div>

      <p className={checkable && !consistent ? 'ap-cr ap-cr-bad' : 'ap-cr'}>
        {!checkable
          ? 'Answer three or more matchups and the page starts checking whether they agree with each other.'
          : consistent
            ? `Your answers agree with each other. Consistency ratio ${cr.toFixed(2)}, anything under ${CR_LIMIT} is fine.`
            : `Your answers contradict each other somewhere. Consistency ratio ${cr.toFixed(2)}, over the ${CR_LIMIT} limit.`}
      </p>

      <details className="plain">
        <summary>Plain English: why comparing two at a time works better</summary>
        <div className="pbody">
          <p>
            Handing out percentages across four things at once is a task people are genuinely bad
            at. The numbers come out round, they sum to 100 because you forced them to, and they do
            not survive being asked again a week later.
          </p>
          <p>
            Comparing two things is something people are good at. Ask enough pairs and the answers
            pin down a full set of weights, and they pin it down more honestly than the direct
            question would have.
          </p>
          <p>
            It also lets the page catch you contradicting yourself. If you say A beats B, B beats C,
            and C beats A, there is no set of weights that fits, and the consistency ratio above
            says so instead of quietly averaging the contradiction away.
          </p>
        </div>
      </details>
    </section>
  );
};

export default Duel;
