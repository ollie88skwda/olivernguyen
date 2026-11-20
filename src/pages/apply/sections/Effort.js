import React from 'react';
import { SectionHead, StatBlock } from '../../../components/brand';
import Tip from '../../../components/Tooltip';

export const Effort = ({ doc, derived, updateDoc }) => {
  const { entries, recommended } = derived;

  const withEffort = entries
    .map((entry) => {
      const essays = entry.school.essays || {};
      return {
        ...entry,
        essays: typeof essays.count === 'number' ? essays.count : null,
        words: typeof essays.totalWords === 'number' ? essays.totalWords : null,
      };
    })
    .sort((a, b) => (b.essays ?? -1) - (a.essays ?? -1));

  const known = withEffort.filter((entry) => entry.essays != null);
  const totalEssays = known.reduce((sum, entry) => sum + entry.essays, 0);
  const totalWords = known.reduce((sum, entry) => sum + (entry.words || 0), 0);
  const unknownCount = withEffort.length - known.length;

  const budget = (doc.settings && doc.settings.effortBudget) ?? null;
  const setBudget = (value) =>
    updateDoc((current) => ({
      ...current,
      settings: { ...(current.settings || {}), effortBudget: value },
    }));

  const maxEssays = Math.max(...known.map((entry) => entry.essays), 1);
  const maxMarginal = Math.max(...(recommended.curve || []).map((point) => point.marginal), 1e-9);
  const marginalById = new Map((recommended.curve || []).map((point) => [point.id, point.marginal]));

  return (
    <section id="effort" className="ap-sec">
      <SectionHead kicker="S7 / Effort" title="What the list costs you" />

      <p className="on-prose ap-hint">
        What limits a list is not ambition. It is how many supplemental essays you are willing to
        write well. Fifteen rushed essays are worse than eight good ones, so the{' '}
        <Tip term="effort-budget">effort budget</Tip> feeds into which schools S3 recommends.
      </p>

      <div className="ap-ev-stats">
        <div>
          <StatBlock value={totalEssays} label="supplemental essays" />
        </div>
        <div>
          <StatBlock value={totalWords > 0 ? totalWords.toLocaleString() : 'n/a'} label="words, if known" />
        </div>
        <div className={unknownCount ? 'ap-ev-bad' : undefined}>
          <StatBlock value={unknownCount} label="schools with no essay count yet" />
        </div>
      </div>

      <div className="ap-rho">
        <div className="ap-rho-head">
          <label htmlFor="ap-budget">Essays you are willing to write</label>
          <output htmlFor="ap-budget">{budget == null ? 'no limit' : budget}</output>
        </div>
        <input
          id="ap-budget"
          className="ap-range"
          type="range"
          min="0"
          max={Math.max(totalEssays, 10)}
          step="1"
          value={budget == null ? Math.max(totalEssays, 10) : budget}
          onChange={(event) => {
            const value = Number(event.target.value);
            setBudget(value >= Math.max(totalEssays, 10) ? null : value);
          }}
        />
        <p className="ap-rho-note">
          Drag this down and S3's recommended set shrinks to fit, ordered by value per essay. Push
          it to the top for no limit, which shows where the curve flattens on its own.
        </p>
      </div>

      <h3 className="ap-sub">Cost against value</h3>
      <p className="on-prose ap-hint ap-hint-sub">
        Each row is a school. The left bar is how many essays it costs and the right bar is how
        much it raised the expected best offer. A long left bar and a short right bar means a lot
        of writing for little gain.
      </p>

      <div className="ap-effort">
        {withEffort.slice(0, 20).map((entry) => {
          const marginal = marginalById.get(entry.id) || 0;
          return (
            <div className="ap-eff-row" key={entry.id}>
              <span className="ap-eff-name">{entry.name}</span>
              <span className="ap-eff-cost">
                <i
                  style={{ width: `${entry.essays != null ? (entry.essays / maxEssays) * 100 : 0}%` }}
                />
                <em>{entry.essays != null ? `${entry.essays}` : '?'}</em>
              </span>
              <span className="ap-eff-val">
                <i style={{ width: `${(marginal / maxMarginal) * 100}%` }} />
              </span>
            </div>
          );
        })}
      </div>

      {unknownCount > 0 && (
        <p className="ap-gap ap-caveat">
          {unknownCount} schools have no essay count yet, so S3's recommendation counts them as 1
          essay each. That flatters them. They are in S8's gap list, not filled in with a guess.
        </p>
      )}

      <details className="plain">
        <summary>Plain English: why effort belongs in the maths at all</summary>
        <div className="pbody">
          <p>
            Most college lists are built by ranking schools and stopping when the list feels long
            enough. That ignores what decides quality: how much attention each application gets.
          </p>
          <p>
            Treating essays as a budget makes the trade clear. A school worth slightly less that
            costs one essay instead of four can be the better addition. A ranking cannot show you
            that because it never asks what anything costs.
          </p>
        </div>
      </details>
    </section>
  );
};

export default Effort;
