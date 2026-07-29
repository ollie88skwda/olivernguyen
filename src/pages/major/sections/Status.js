import React from 'react';
import SectionHeading from '../../../components/SectionHeading';
import Reveal from '../../../components/Reveal';
import Tip from '../../../components/Tooltip';

const DIAL_RADIUS = 70;
const DIAL_LENGTH = 2 * Math.PI * DIAL_RADIUS;
const DAY_MS = 86400000;

const LEVELS = {
  'COIN FLIP': 'mj-lvl-coin',
  LEAN: 'mj-lvl-lean',
  CLEAR: 'mj-lvl-clear',
};

// The closing line of the verdict has to change with the verdict. "Not by enough to act
// on" is a lie once one major is winning three runs in four.
const VERDICT_TAIL = {
  'COIN FLIP':
    'That gap is smaller than how unsure you are about your own numbers, so the page will not call it. Go answer the questions below, then look again.',
  LEAN: 'That is a real lead but not a safe one. Answer the questions below and see whether it holds.',
  CLEAR: 'The questions below are the only things left that could still move it.',
};

const pct = (value) => Math.round((value || 0) * 100);

const shortName = (alternative) => alternative.label.replace(/\s*engineering$/i, '');

// A bare YYYY-MM-DD parses as UTC midnight, which prints as the day before
// anywhere west of Greenwich. Pin date-only strings to local midnight.
const parseWhen = (text) =>
  Date.parse(/^\d{4}-\d{2}-\d{2}$/.test(text) ? `${text}T00:00:00` : text);

const stamp = (raw) => {
  const at = parseWhen(raw);
  if (Number.isNaN(at)) return null;
  return new Date(at)
    .toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    .toUpperCase();
};

// doc.deadline is a free-text field and starts life as the literal string "TODO — Ollie".
// Anything unparseable is shown as written rather than swallowed.
const readDeadline = (raw) => {
  const text = typeof raw === 'string' ? raw.trim() : '';
  const at = parseWhen(text);
  if (!text || Number.isNaN(at)) return { pending: true, text: text || 'NOT SET' };
  const days = Math.ceil((at - Date.now()) / DAY_MS);
  const when = stamp(text);
  return { pending: false, text: days >= 0 ? `${days} DAYS · ${when}` : `PASSED · ${when}` };
};

const Dial = ({ score, label }) => (
  <div className={`mj-dial ${LEVELS[label] || 'mj-lvl-coin'}`}>
    <svg viewBox="0 0 168 168" width="168" height="168" aria-hidden="true">
      <circle cx="84" cy="84" r={DIAL_RADIUS} fill="none" stroke="rgba(18,34,49,.12)" strokeWidth="13" />
      <circle
        cx="84"
        cy="84"
        r={DIAL_RADIUS}
        fill="none"
        stroke="currentColor"
        strokeWidth="13"
        strokeLinecap="butt"
        strokeDasharray={DIAL_LENGTH}
        strokeDashoffset={DIAL_LENGTH * (1 - Math.max(0, Math.min(100, score)) / 100)}
        transform="rotate(-90 84 84)"
      />
      <circle cx="84" cy="84" r="53" fill="none" stroke="rgba(18,34,49,.18)" strokeWidth="1" strokeDasharray="2 6" />
    </svg>
    <div className="mj-dial-mid">
      <span className="mj-dial-num">{Math.round(score)}%</span>
      <span className="mj-dial-lbl">{label}</span>
    </div>
  </div>
);

export const Status = ({ doc, derived }) => {
  const { confidence, monteCarlo, voi } = derived;
  const winRate = monteCarlo.winRate;

  // Ranked by win rate, not WSM total: the paragraph below reports "finished first X% of
  // the time", so the leader it names has to be the win-rate leader or the two numbers can
  // contradict each other (WSM total ties under placeholder data and falls back to array
  // order, which does not track which alternative the simulation actually favored).
  const ranked = [...doc.alternatives].sort(
    (a, b) => (winRate[b.id] || 0) - (winRate[a.id] || 0)
  );
  const leader = ranked[0];
  const runnerUp = ranked[1];

  const flipOf = (unknown) => (voi[unknown.id] && voi[unknown.id].flipFraction) || 0;
  const agenda = [...doc.unknowns].sort((a, b) => flipOf(b) - flipOf(a)).slice(0, 3);

  const criterionLabel = (id) => {
    const criterion = doc.criteria.find((c) => c.id === id);
    return criterion ? criterion.label : id;
  };

  const deadline = readDeadline(doc.deadline);
  const updated = stamp(doc.updatedAt);

  return (
    <section id="status" className="mj-sec">
      <SectionHeading eyebrow="S0 / Status" title="Where It Stands" />

      <div className="mj-status">
        <Reveal>
          <Dial score={confidence.score} label={confidence.label} />
        </Reveal>

        <Reveal delay={0.08}>
          {leader && (
            <>
              <p className="mj-verdict-h">
                {shortName(leader)} is ahead.
                <br />
                {confidence.label === 'CLEAR' ? 'Enough to act on.' : 'Not by enough to act on yet.'}
              </p>
              <p className="mj-verdict-p">
                Across <Tip term="monte-carlo">10,000 simulated runs</Tip>,{' '}
                {shortName(leader)} finished first {pct(winRate[leader.id])}% of the time
                {runnerUp ? `, ${shortName(runnerUp)} ${pct(winRate[runnerUp.id])}%` : ''}.{' '}
                {VERDICT_TAIL[confidence.label]}
              </p>
            </>
          )}

          <div className="mj-countdown">
            <span>APP DEADLINE</span>
            <span className={deadline.pending ? 'mj-todo' : undefined}>{deadline.text}</span>
            {updated && (
              <>
                <span aria-hidden="true">·</span>
                <span>UPDATED {updated}</span>
              </>
            )}
          </div>
        </Reveal>
      </div>

      <Reveal as="p" className="section-eyebrow mj-agenda-eyebrow">
        S0.1 / Go find out, ranked by how much it would change the answer
      </Reveal>

      <div className="mj-agenda">
        {agenda.map((unknown, i) => {
          const flip = flipOf(unknown);
          return (
            <Reveal className="mj-card" key={unknown.id} delay={i * 0.06}>
              <span className="mj-rank" aria-hidden="true">
                {i + 1}
              </span>
              <h4>{unknown.question}</h4>
              <div className="mj-chips">
                <Tip term="flip-fraction" className={flip >= 0.2 ? 'mj-chip mj-chip-hot' : 'mj-chip'}>
                  changes the winner {pct(flip)}% of the time
                </Tip>
                {unknown.effort && <span className="mj-chip">{unknown.effort}</span>}
                {(unknown.criteria || []).map((id) => (
                  <span className="mj-chip" key={id}>
                    {criterionLabel(id)}
                  </span>
                ))}
              </div>
            </Reveal>
          );
        })}
      </div>

      <details className="plain">
        <summary>Plain English: what this screen is doing</summary>
        <div className="pbody">
          <p>
            The dial is a confidence meter, and it is not the same as a win rate. It measures how
            lopsided the 10,000 runs were. 100 means one major won every single time. 0 means they
            all tied. Under 55 the page treats the whole thing as a coin flip.
          </p>
          <p>
            The cards under it are the actual point of the page. Instead of pretending to know your
            answer, it works out which missing piece of information is doing the most damage, and
            tells you to go get that one first.
          </p>
          <p>
            So the workflow is: read the cards, go find out one thing, type what you learned into the
            page, watch the dial move. Repeat until the dial is high enough that you believe it.
          </p>
        </div>
      </details>
    </section>
  );
};

export default Status;
