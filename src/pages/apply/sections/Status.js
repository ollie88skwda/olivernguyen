import React from 'react';
import SectionHeading from '../../../components/SectionHeading';
import Reveal from '../../../components/Reveal';
import Tip from '../../../components/Tooltip';

// Never round up to a flat 100%. It is arithmetically defensible and it reads as either a
// bug or a promise, and this is the largest number on the page.
const pct = (value) => (value >= 0.995 ? '>99%' : `${(value * 100).toFixed(0)}%`);
const pct1 = (value) => {
  if (value >= 0.9995) return '>99.9%';
  if (value > 0 && value < 0.001) return '<0.1%';
  return `${(value * 100).toFixed(1)}%`;
};

// The dial reads the chance of at least one admission, not a fit score. Shut out is the
// outcome the whole list exists to prevent, so it is what the biggest number on the page
// should be about.
const Dial = ({ value, label, provisional }) => {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const filled = Math.max(0, Math.min(1, value)) * circumference;

  // A confident arc built from nothing but published admit rates is the most misleading
  // thing this page could draw, because it is the biggest number on the screen and it
  // reads as being about you. Provisional dashes the arc and says so under the number.
  return (
    <svg
      className={provisional ? 'ap-dial ap-dial-prov' : 'ap-dial'}
      viewBox="0 0 128 128"
      role="img"
      aria-label={`${label}: ${pct(value)}${provisional ? ', provisional, no profile entered yet' : ''}`}
    >
      <circle cx="64" cy="64" r={radius} className="ap-dial-track" />
      <circle
        cx="64"
        cy="64"
        r={radius}
        className="ap-dial-arc"
        strokeDasharray={provisional ? '4 6' : `${filled} ${circumference}`}
        transform="rotate(-90 64 64)"
      />
      <text x="64" y="60" className="ap-dial-v">
        {pct(value)}
      </text>
      <text x="64" y="80" className="ap-dial-k">
        {provisional ? 'provisional' : label}
      </text>
    </svg>
  );
};

export const Status = ({ doc, derived, clock }) => {
  const { outcome, entries } = derived;

  // Only schools that actually have a probability can say anything about the profile. An
  // unresearched school carries p === null, and counting those made `every` short-circuit
  // to false, which silently suppressed the "these are not your odds yet" warning on
  // exactly the page state where it matters most.
  const priced = entries.filter((entry) => entry.p);
  const profileEmpty = priced.length > 0 && priced.every((entry) => !entry.p.profileKnown);

  const unpriced = outcome.unpriced;
  const overstatement = outcome.naivePAtLeastOne - outcome.pAtLeastOne;

  // Top-heavy is the failure mode a ranking cannot see: plenty of good schools, no floor.
  const reachHeavy =
    outcome.byTier.reach > 0 &&
    outcome.byTier.likely <= 2 &&
    outcome.byTier.reach >= outcome.byTier.target;

  const gaps = doc.schools.reduce((n, s) => n + ((s.needsResearch || []).length), 0);

  return (
    <section id="status" className="ap-sec">
      <SectionHeading eyebrow="S0 / Status" title="Where The List Stands" />

      <div className="ap-status">
        <Dial value={outcome.pAtLeastOne} label="at least one" provisional={profileEmpty} />

        <div className="ap-status-read">
          <p className="ap-verdict">
            {outcome.counted} schools priced
            {unpriced > 0 && <span className="ap-warn"> · {unpriced} not yet</span>}
          </p>
          <p className="ap-status-line">
            <Tip term="shut-out">Shut out</Tip> everywhere: <b>{pct1(outcome.pShutOut)}</b>.
            A spreadsheet assuming <Tip term="independence">independence</Tip> would tell you{' '}
            {pct1(1 - outcome.naivePAtLeastOne)}, which is {pct1(overstatement)} of false comfort.
          </p>
          <p className="ap-status-line">
            Reach {outcome.byTier.reach} · target {outcome.byTier.target} · likely{' '}
            {outcome.byTier.likely}
            {outcome.byTier.unknown > 0 && ` · unknown ${outcome.byTier.unknown}`}
          </p>
        </div>

        <div className="ap-clock">
          <div>
            <span className="ap-clock-k">Binding, Nov 1</span>
            <span className="ap-clock-v">{clock.binding}</span>
          </div>
          <div>
            <span className="ap-clock-k">UC closes, Nov 30</span>
            <span className="ap-clock-v">{clock.uc}</span>
          </div>
        </div>
      </div>

      {profileEmpty && (
        <Reveal as="p" className="ap-flag">
          Every probability above is built from published admit rates alone. Nothing about you has
          been entered yet, so these are wide on purpose and describe the schools, not your odds.
          Turn on EDIT and fill in the profile to make them yours.
        </Reveal>
      )}

      {reachHeavy && (
        <Reveal as="p" className="ap-flag ap-flag-warn">
          This list is top heavy. With only {outcome.byTier.likely} likely-tier school
          {outcome.byTier.likely === 1 ? '' : 's'}, the correlated shut-out risk above is doing
          real work. Adding a floor is cheaper than adding another reach.
        </Reveal>
      )}

      {gaps > 0 && (
        <Reveal as="p" className="ap-flag">
          {gaps} researched fields are still open across {doc.schools.length} schools. They are
          listed per school in S8 rather than filled in with something plausible.
        </Reveal>
      )}

      <details className="plain">
        <summary>Plain English: why this page does not just rank the schools</summary>
        <div className="pbody">
          <p>
            You are not choosing one school. You are choosing a set of about fifteen, and a set can
            be bad even when every school in it is good. Rank thirty four schools, take the top
            fifteen, and you can end up with eight reaches that all say no on the same afternoon.
          </p>
          <p>
            So the number that matters is not how good the best school on the list is. It is how
            good the best school that actually admits you turns out to be, averaged over every way
            the season could go. That is what this page tries to make big.
          </p>
          <p>
            The other thing it does differently is assume the decisions are related. The same
            transcript and the same essays go to every school, so if one committee is unimpressed
            the others usually are too. Treating fifteen applications as fifteen independent coin
            flips makes being shut out look far less likely than it is.
          </p>
        </div>
      </details>
    </section>
  );
};

export default Status;
