import React, { useState } from 'react';
import SectionHeading from '../../../components/SectionHeading';
import Reveal from '../../../components/Reveal';
import Tip from '../../../components/Tooltip';
import { FILTERS, DEFAULT_FILTER_STATE } from '../filters';

const MODES = ['off', 'soft', 'hard'];

// A school added mid-cycle enters visibly incomplete. Wide ranges rather than middling
// ones, every field flagged, and a tag on the row, so it can never quietly inherit scores
// it did not earn.
const blankSchool = (name) => ({
  id: `added-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
  name: name.trim(),
  addedBy: 'counselor',
  addedAt: new Date().toISOString().slice(0, 10),
  admitRate: {},
  majors: {},
  kines: {},
  business: {},
  switchPolicy: {},
  undeclaredEntry: {},
  essays: {},
  programs: [],
  scores: {
    programs: { lo: 1, mid: 5, hi: 10, basis: 'unresearched' },
    strength: { lo: 1, mid: 5, hi: 10, basis: 'unresearched' },
    undecided: { lo: 1, mid: 5, hi: 10, basis: 'unresearched' },
    kines: { lo: 1, mid: 5, hi: 10, basis: 'unresearched' },
  },
  needsResearch: ['all'],
  sources: [],
});

export const Filters = ({ doc, derived, updateDoc }) => {
  const [name, setName] = useState('');
  const state = derived.filterState || DEFAULT_FILTER_STATE;
  const cut = derived.cut || [];

  const setMode = (id, mode) =>
    updateDoc((current) => ({
      ...current,
      settings: {
        ...(current.settings || {}),
        filters: { ...((current.settings || {}).filters || DEFAULT_FILTER_STATE), [id]: mode },
      },
    }));

  const addSchool = (event) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    const candidate = blankSchool(trimmed);
    if (doc.schools.some((school) => school.id === candidate.id)) {
      setName('');
      return;
    }
    updateDoc((current) => ({ ...current, schools: [...current.schools, candidate] }));
    setName('');
  };

  const removeSchool = (id) =>
    updateDoc((current) => ({
      ...current,
      schools: current.schools.filter((school) => school.id !== id),
    }));

  const added = doc.schools.filter((school) => school.addedBy);

  return (
    <section id="filters" className="ap-sec">
      <SectionHeading eyebrow="S6 / Filters" title="Tighten Or Loosen, Live" />

      <Reveal as="p" className="ap-hint">
        None of these were made hard requirements, so all four start soft: they influence the
        scoring and exclude nobody. Turning one to <b>hard</b> removes every school that fails it,
        from the board and from the maths in S3, not just from view. That is why the research
        covered all four for every school, so changing your mind in November is a click rather
        than a reason to look everything up again.
      </Reveal>

      <div className="ap-filters">
        {FILTERS.map((filter) => {
          const mode = state[filter.id] || 'soft';
          const failing = derived.schools
            ? doc.schools.filter((school) => school.scores && !filter.test(school)).length
            : 0;

          return (
            <div className={`ap-filter ap-filter-${mode}`} key={filter.id}>
              <div className="ap-filter-top">
                <span className="ap-filter-label">{filter.label}</span>
                <div className="ap-modes" role="radiogroup" aria-label={filter.label}>
                  {MODES.map((option) => (
                    <button
                      key={option}
                      type="button"
                      role="radio"
                      aria-checked={mode === option}
                      className={mode === option ? 'ap-mode ap-mode-on' : 'ap-mode'}
                      onClick={() => setMode(filter.id, option)}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
              <p className="ap-filter-blurb">{filter.blurb}</p>
              <p className="ap-filter-count">
                {failing} of {doc.schools.filter((s) => s.scores).length} schools would fail this
                {mode === 'hard' && <b> · currently cutting them</b>}
              </p>
            </div>
          );
        })}
      </div>

      {cut.length > 0 && (
        <div className="ap-cutlist">
          <p className="ap-cutlist-k">Cut by hard filters · {cut.length}</p>
          <ul>
            {cut.map(({ school, failed }) => (
              <li key={school.id}>
                {school.name} <span>failed {failed.join(', ')}</span>
              </li>
            ))}
          </ul>
          <p className="ap-cutlist-note">
            Listed rather than silently dropped. These are excluded from S3's probabilities too, so
            the odds on this page always describe the list you can actually see.
          </p>
        </div>
      )}

      <h3 className="ap-sub">Add a school</h3>
      <Reveal as="p" className="ap-hint ap-hint-sub">
        For when a counselor suggests one. It enters <Tip term="unresearched">unresearched</Tip>{' '}
        and says so, with hatched cells on the board and wide ranges, so the Monte Carlo reports it
        as genuinely uncertain rather than quietly mediocre. Nothing gets invented on its behalf.
      </Reveal>

      <form className="ap-add" onSubmit={addSchool}>
        <input
          className="ap-add-in"
          type="text"
          value={name}
          placeholder="e.g. Rice University"
          aria-label="School name"
          onChange={(event) => setName(event.target.value)}
        />
        <button className="ap-add-go" type="submit">
          add
        </button>
      </form>

      {added.length > 0 && (
        <ul className="ap-added-list">
          {added.map((school) => (
            <li key={school.id}>
              <span>{school.name}</span>
              <em>
                {school.addedBy} · {school.addedAt}
              </em>
              <button type="button" onClick={() => removeSchool(school.id)}>
                remove
              </button>
            </li>
          ))}
        </ul>
      )}

      <details className="plain">
        <summary>Plain English: why a hard filter changes the odds, not just the list</summary>
        <div className="pbody">
          <p>
            It would be easy to make these filters hide rows. It would also be misleading. The big
            number in S0 is the chance that at least one school admits you, and it is built from
            the schools on the list. If a filter hid six schools from view but kept counting them,
            that number would describe an application season you are not having.
          </p>
          <p>
            So hard filters remove schools from the maths as well. Turn one on and watch the
            probability in S0 fall, because you just decided not to apply to some of the schools
            that were holding it up.
          </p>
          <p>
            Schools where nobody has checked the answer yet always pass. A gap in the research
            should not turn itself into a decision about where you apply.
          </p>
        </div>
      </details>
    </section>
  );
};

export default Filters;
