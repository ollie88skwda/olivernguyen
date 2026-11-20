import React, { useState } from 'react';
import { SectionHead } from '../../../components/brand';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
      <SectionHead kicker="S6 / Filters" title="Tighten or loosen, live" />

      <p className="on-prose ap-hint">
        None of these is a hard requirement, so all four start soft. They affect the scoring and
        exclude nobody. Setting one to <b>hard</b> removes every school that fails it, from the
        board and from the math in S3, not just from view. The research covered all four for every
        school, so changing your mind in November takes one click.
      </p>

      <div className="ap-filters">
        {FILTERS.map((filter) => {
          const mode = state[filter.id] || 'soft';
          const failing = derived.schools
            ? doc.schools.filter((school) => school.scores && !filter.test(school)).length
            : 0;

          return (
            <div
              className={`ap-filter${mode === 'hard' ? ' ap-filter-hard' : ''}${
                mode === 'off' ? ' ap-filter-off' : ''
              }`}
              key={filter.id}
            >
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
                {mode === 'hard' && <b> · cutting them now</b>}
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
            Listed so nothing is dropped silently. They are left out of S3's probabilities too, so
            the odds on this page always match the list you can see.
          </p>
        </div>
      )}

      <h3 className="ap-sub">Add a school</h3>
      <p className="on-prose ap-hint ap-hint-sub">
        For when a counselor suggests one. It enters <Tip term="unresearched">unresearched</Tip>{' '}
        with hatched cells on the board and wide ranges, so the Monte Carlo treats it as uncertain,
        not mediocre. Nothing is made up for it.
      </p>

      <form className="ap-add" onSubmit={addSchool}>
        <Input
          className="ap-add-in"
          type="text"
          value={name}
          placeholder="e.g. Rice University"
          aria-label="School name"
          onChange={(event) => setName(event.target.value)}
        />
        <Button type="submit">Add</Button>
      </form>

      {added.length > 0 && (
        <ul className="ap-added-list">
          {added.map((school) => (
            <li key={school.id}>
              <span>{school.name}</span>
              <em>
                {school.addedBy} · {school.addedAt}
              </em>
              <Button type="button" variant="danger" size="sm" onClick={() => removeSchool(school.id)}>
                Remove
              </Button>
            </li>
          ))}
        </ul>
      )}

      <details className="plain">
        <summary>Plain English: why a hard filter changes the odds, not just the list</summary>
        <div className="pbody">
          <p>
            Making these filters just hide rows would be easy, and misleading. The big number in S0
            is the chance that at least one school admits you, and it is built from the schools on
            the list. If a filter hid six schools but kept counting them, that number would describe
            an application season you are not having.
          </p>
          <p>
            So hard filters remove schools from the math too. Turn one on and the probability in S0
            falls, because you just chose not to apply to some of the schools that were holding it
            up.
          </p>
          <p>
            Schools where nobody has checked the answer yet always pass. A gap in the research
            should not decide where you apply.
          </p>
        </div>
      </details>
    </section>
  );
};

export default Filters;
