import React from 'react';
import SectionHeading from '../../../components/SectionHeading';
import Reveal from '../../../components/Reveal';
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
      <SectionHeading eyebrow="S7 / Effort" title="What The List Costs You" />

      <Reveal as="p" className="ap-hint">
        The real constraint on a list is not ambition, it is how many supplemental essays you are
        willing to write well. Writing fifteen badly is worse than writing eight properly, which is
        why the <Tip term="effort-budget">effort budget</Tip> feeds directly into which schools S3
        recommends.
      </Reveal>

      <div className="ap-ev-stats">
        <div>
          <span className="ap-ev-n">{totalEssays}</span>
          <span className="ap-ev-k">supplemental essays</span>
        </div>
        <div>
          <span className="ap-ev-n">{totalWords > 0 ? totalWords.toLocaleString() : '—'}</span>
          <span className="ap-ev-k">words, if known</span>
        </div>
        <div>
          <span className={unknownCount ? 'ap-ev-n ap-ev-bad' : 'ap-ev-n'}>{unknownCount}</span>
          <span className="ap-ev-k">schools with no essay count yet</span>
        </div>
      </div>

      <div className="ap-rho">
        <div className="ap-rho-head">
          <label htmlFor="ap-budget">Essays you are willing to write</label>
          <output htmlFor="ap-budget">{budget == null ? 'no limit' : budget}</output>
        </div>
        <input
          id="ap-budget"
          className="ap-rho-in"
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
          Drag this down and S3's recommended set shrinks to whatever fits, ordered by value per
          essay. Push it to the top for no limit, which is how you see where the curve flattens on
          its own.
        </p>
      </div>

      <h3 className="ap-sub">Cost against value</h3>
      <Reveal as="p" className="ap-hint ap-hint-sub">
        Each row is a school: how many essays it costs on the left, how much it raised the expected
        best offer on the right. A long bar on the left and a short one on the right is a school
        buying you very little for a lot of writing.
      </Reveal>

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
          {unknownCount} schools have no essay count yet, so they cost 1 by default in S3's
          recommendation. That flatters them. It is in S8's gap list rather than being filled in
          with a plausible number.
        </p>
      )}

      <details className="plain">
        <summary>Plain English: why effort belongs in the maths at all</summary>
        <div className="pbody">
          <p>
            Most college lists are built by ranking schools and stopping when the list feels long
            enough. That ignores the thing that actually determines quality, which is how much
            attention each application gets.
          </p>
          <p>
            Treating essays as a budget makes the trade explicit. A school worth slightly less that
            costs one essay instead of four can easily be the better addition, and a ranking can
            never show you that because it never asked what anything cost.
          </p>
        </div>
      </details>
    </section>
  );
};

export default Effort;
