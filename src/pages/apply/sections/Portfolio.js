import React from 'react';
import { SectionHead, MonoLabel, StatBlock } from '../../../components/brand';
import Tip from '../../../components/Tooltip';
import { probabilityAtLeastOne } from '../portfolio';
import Profile from './Profile';

// "100.0%" reads as a bug even when it is arithmetically what the independence model
// says. Showing the ceiling explicitly keeps the absurdity legible as absurdity.
const pct = (value) => {
  if (value >= 0.9995) return '>99.9%';
  if (value > 0 && value < 0.001) return '<0.1%';
  return `${(value * 100).toFixed(1)}%`;
};

const TIERS = [
  { id: 'reach', label: 'Reach', note: 'under 25%' },
  { id: 'target', label: 'Target', note: '25 to 60%' },
  { id: 'likely', label: 'Likely', note: 'over 60%' },
  { id: 'unknown', label: 'Unpriced', note: 'no admit rate yet' },
];

export const Portfolio = ({ doc, derived, updateDoc, profile, setProfile }) => {
  const { outcome, recommended, entries, rho } = derived;

  const priced = entries.filter((entry) => entry.p);
  const setRho = (value) =>
    updateDoc((current) => ({
      ...current,
      settings: { ...(current.settings || {}), rho: value },
    }));

  // The same list evaluated at both extremes. Showing the pair is the point: the distance
  // between them is the size of the mistake every chance calculator makes.
  const independent = probabilityAtLeastOne(priced, 0);
  const perfectlyCorrelated = probabilityAtLeastOne(priced, 1);

  // "At least one admit anywhere" barely moves once the list has a floor under it, which
  // makes it a poor advertisement for the correction even though it is the honest headline.
  // The reaches are where correlation actually bites, so show that comparison too.
  // How many schools are priced off a genuine engineering rate versus a campus fallback.
  // admitProbability records which one it used, and hiding that would make the fallbacks
  // read as if they carried the same weight as the real numbers.
  const programCount = priced.filter((entry) => entry.p.rateSource === 'engineering').length;
  const fallbackCount = priced.length - programCount;

  const reaches = priced.filter((entry) => entry.tier === 'reach');
  const reachReal = probabilityAtLeastOne(reaches, rho);
  const reachNaive = probabilityAtLeastOne(reaches, 0);

  const curve = recommended.curve || [];
  const maxMarginal = Math.max(...curve.map((point) => point.marginal), 0.0001);

  // Where the curve stops paying. Not a hard rule, just the first point that adds less than
  // a twentieth of what the first school added.
  const flatAt = curve.findIndex((point) => point.marginal < curve[0]?.marginal / 20);

  return (
    <section id="portfolio" className="ap-sec">
      <SectionHead kicker="S3 / Portfolio" title="The List As One Bet" />

      <p className="on-prose ap-hint">
        Everything above scores schools. This scores the <Tip term="portfolio">set</Tip>. The
        question is not which school is best, it is how good the best school that actually admits
        you turns out to be, and whether the list has a floor under it.
      </p>

      <Profile profile={profile} setProfile={setProfile} />

      <p className="on-prose ap-hint ap-hint-sub">
        Split into <Tip term="tier">reach, target and likely</Tip> bands:
      </p>

      {fallbackCount > 0 && (
        <p className="ap-flag">
          <b>{programCount} of {priced.length}</b> schools use a real{' '}
          <Tip term="program-admit-rate">engineering admit rate</Tip>. The other{' '}
          {fallbackCount} fall back to the campus-wide number because their university does not
          publish one, and a campus rate always flatters an engineering applicant. Where both exist
          the gap is large: UCLA's engineering rate is 3.9% against a 9.4% campus rate, and
          Berkeley's is 6.8% against 11.4%. Treat the {fallbackCount} fallbacks as optimistic.
        </p>
      )}

      <div className="ap-tiers">
        {TIERS.map((tier) => (
          <div className={`ap-tier ap-tier-${tier.id}`} key={tier.id}>
            <StatBlock value={outcome.byTier[tier.id]} label={tier.label} />
            <MonoLabel tone="faint" className="ap-tier-note">
              {tier.note}
            </MonoLabel>
          </div>
        ))}
      </div>

      <div className="ap-rho">
        <div className="ap-rho-head">
          <label htmlFor="ap-rho-in">
            <Tip term="correlation">Correlation</Tip> between decisions
          </label>
          <output htmlFor="ap-rho-in">{rho.toFixed(2)}</output>
        </div>
        <input
          id="ap-rho-in"
          className="ap-range"
          type="range"
          min="0"
          max="0.95"
          step="0.05"
          value={rho}
          onChange={(event) => setRho(Number(event.target.value))}
        />
        <p className="ap-rho-note">
          How much one underlying "how strong is this application" factor drives every decision at
          once. This is a judgement call, not a measured constant, which is why it is a slider you
          can argue with rather than a number buried in the code.
        </p>
      </div>

      <div className="ap-compare">
        <div className="ap-compare-row">
          <span className="ap-compare-k">At this correlation</span>
          <span className="ap-compare-track">
            <i style={{ width: `${outcome.pAtLeastOne * 100}%` }} />
          </span>
          <span className="ap-compare-v">{pct(outcome.pAtLeastOne)}</span>
        </div>
        <div className="ap-compare-row ap-compare-ghost">
          <span className="ap-compare-k">
            If decisions were <Tip term="independence">independent</Tip>
          </span>
          <span className="ap-compare-track">
            <i style={{ width: `${independent * 100}%` }} />
          </span>
          <span className="ap-compare-v">{pct(independent)}</span>
        </div>
        <div className="ap-compare-row ap-compare-floor">
          <span className="ap-compare-k">If every school agreed exactly</span>
          <span className="ap-compare-track">
            <i style={{ width: `${perfectlyCorrelated * 100}%` }} />
          </span>
          <span className="ap-compare-v">{pct(perfectlyCorrelated)}</span>
        </div>
      </div>

      <p className="ap-gap">
        Across the whole list the two answers are close, because the likely-tier schools put a
        floor under it. That is the honest headline and it is not very dramatic.
      </p>

      {reaches.length > 1 && (
        <>
          <h3 className="ap-sub">Where correlation actually bites</h3>
          <p className="on-prose ap-hint ap-hint-sub">
            Narrow it to just the {reaches.length} reaches and the gap opens up. This is the
            comparison that matters, because reaches are the applications people add believing each
            one is a fresh roll of the dice.
          </p>

          <div className="ap-compare">
            <div className="ap-compare-row">
              <span className="ap-compare-k">At least one reach, correlated</span>
              <span className="ap-compare-track">
                <i style={{ width: `${reachReal * 100}%` }} />
              </span>
              <span className="ap-compare-v">{pct(reachReal)}</span>
            </div>
            <div className="ap-compare-row ap-compare-ghost">
              <span className="ap-compare-k">What a spreadsheet says</span>
              <span className="ap-compare-track">
                <i style={{ width: `${reachNaive * 100}%` }} />
              </span>
              <span className="ap-compare-v">{pct(reachNaive)}</span>
            </div>
          </div>

          <p className="ap-gap">
            <b>{pct(reachNaive - reachReal)}</b> of false comfort on the reaches alone. The whole
            list still has a floor, so you are unlikely to end up with nothing. What you are
            unlikely to end up with is a <Tip term="shut-out">reach</Tip>, and no amount of adding
            more reaches fixes that as efficiently as it looks.
          </p>
        </>
      )}

      {curve.length > 0 && (
        <>
          <h3 className="ap-sub">Where the list stops paying</h3>
          <p className="on-prose ap-hint ap-hint-sub">
            Each bar is what one more application adds to the expected best offer, in the order a
            greedy search would add them. When the bars flatten, more schools stop buying you
            anything and start costing essays for free.
          </p>

          <div className="ap-curve">
            {curve.map((point, index) => (
              <div
                className={
                  flatAt !== -1 && index >= flatAt ? 'ap-curve-bar ap-curve-flat' : 'ap-curve-bar'
                }
                key={point.id}
                title={`${point.id}: adds ${point.marginal.toFixed(4)}`}
              >
                <i style={{ height: `${Math.max(2, (point.marginal / maxMarginal) * 100)}%` }} />
                <span>{index + 1}</span>
              </div>
            ))}
          </div>

          {flatAt > 0 && (
            <>
              <p className="ap-gap">
                Past school <b>{flatAt}</b> each additional application adds less than a twentieth
                of what the first one did.
              </p>
              <p className="ap-gap ap-caveat">
                Do not read that as "apply to {flatAt} schools". It flattens this fast because
                program strength is still a placeholder on every row, so the schools look far more
                interchangeable than they are. Fill that column in and the curve will spread out.
                It is also measuring expected value, not risk: the reason to apply to more than{' '}
                {flatAt} is the tail where the first {flatAt} all say no.
              </p>
            </>
          )}
        </>
      )}

      {recommended.ed && (
        <div className="ap-ed">
          <p className="ap-ed-k">
            Where the one <Tip term="ed">Early Decision</Tip> goes
          </p>
          <p className="ap-ed-v">
            {(entries.find((entry) => entry.id === recommended.ed.id) || {}).name ||
              recommended.ed.id}
          </p>
          <p className="ap-ed-note">
            Chosen by trying it on every eligible school in the list and keeping whichever
            placement raised the expected best offer most. It is binding and you get exactly one,
            so it is modelled as something to spend rather than a bonus that applies everywhere.
          </p>
        </div>
      )}

      <details className="plain">
        <summary>Plain English: why eight reaches is not eight chances</summary>
        <div className="pbody">
          <p>
            Suppose each of eight reach schools admits seven percent of applicants. Multiply the
            rejections together and it looks like you have a forty four percent chance somewhere.
            That is the number a spreadsheet gives you, and it is wrong.
          </p>
          <p>
            It is wrong because it assumes eight separate coin flips. But the same transcript and
            the same essays go to all eight. In the versions of the world where you are a weaker
            applicant than you think, all eight say no together, and in the versions where you are
            stronger you had offers anyway. The eight outcomes move as a group.
          </p>
          <p>
            The practical consequence: past a certain point, another reach is not insurance. A
            school you are likely to get into is insurance, and it is usually cheaper to apply to.
            Drag the slider to zero to see the spreadsheet's world, and back up to watch the
            difference appear.
          </p>
        </div>
      </details>
    </section>
  );
};

export default Portfolio;
