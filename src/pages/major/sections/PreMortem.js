import React, { useState } from 'react';
import SectionHeading from '../../../components/SectionHeading';
import Reveal from '../../../components/Reveal';
import Tip from '../Tooltip';

const LIKELIHOODS = [
  { id: 'low', label: 'Long shot' },
  { id: 'med', label: 'Could happen' },
  { id: 'high', label: 'Likely' },
];

const likelihoodLabel = (id) => {
  const found = LIKELIHOODS.find((l) => l.id === id);
  return found ? found.label : id;
};

const AddEntry = ({ alternatives, updateDoc }) => {
  const [alternative, setAlternative] = useState(alternatives[0] ? alternatives[0].id : '');
  const [failureMode, setFailureMode] = useState('');
  const [likelihood, setLikelihood] = useState('med');
  const [mitigation, setMitigation] = useState('');

  const submit = (event) => {
    event.preventDefault();
    const failure = failureMode.trim();
    if (!failure || !alternative) return;
    updateDoc((current) => ({
      ...current,
      premortem: [
        ...current.premortem,
        {
          id: `pm-${Date.now().toString(36)}`,
          alternative,
          failureMode: failure,
          likelihood,
          mitigation: mitigation.trim(),
        },
      ],
    }));
    setFailureMode('');
    setMitigation('');
    setLikelihood('med');
  };

  return (
    <form className="mjc-form" onSubmit={submit}>
      <p className="mjc-form-t">Write a way this goes wrong</p>

      <div className="mjc-form-row">
        <label className="mjc-field">
          <span className="mjc-lbl">You picked</span>
          <select
            className="mjc-select"
            value={alternative}
            onChange={(event) => setAlternative(event.target.value)}
          >
            {alternatives.map((alt) => (
              <option value={alt.id} key={alt.id}>
                {alt.label}
              </option>
            ))}
          </select>
        </label>

        <label className="mjc-field">
          <span className="mjc-lbl">How likely</span>
          <select
            className="mjc-select"
            value={likelihood}
            onChange={(event) => setLikelihood(event.target.value)}
          >
            {LIKELIHOODS.map((option) => (
              <option value={option.id} key={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="mjc-field">
        <span className="mjc-lbl">What went wrong</span>
        <textarea
          className="mjc-area"
          value={failureMode}
          placeholder="I picked it for the money and hated every day of it"
          onChange={(event) => setFailureMode(event.target.value)}
        />
      </label>

      <label className="mjc-field">
        <span className="mjc-lbl">What would have stopped it</span>
        <textarea
          className="mjc-area"
          value={mitigation}
          placeholder="Sit in on one class before the deadline"
          onChange={(event) => setMitigation(event.target.value)}
        />
      </label>

      <button className="mjc-btn" type="submit" disabled={!failureMode.trim()}>
        Add to the pre-mortem
      </button>
    </form>
  );
};

export const PreMortem = ({ doc, editing, updateDoc }) => {
  const entries = doc.premortem || [];

  const labelOf = (id) => {
    const found = doc.alternatives.find((alt) => alt.id === id);
    return found ? found.label : id;
  };

  return (
    <section id="premortem" className="mj-sec">
      <SectionHeading eyebrow="S6 / Pre-mortem" title="It Is 2032 And This Was Wrong" />

      <Reveal as="p" className="mj-hint">
        A <Tip term="premortem">pre-mortem</Tip> is the one part of this page the arithmetic cannot
        do for you. Assume the choice already went badly, then write down why. It catches the risks
        no column ever captures, because you get to say you would resent it instead of scoring it
        out of ten.
      </Reveal>

      {entries.length === 0 ? (
        <Reveal className="mjc-empty">
          <p className="mjc-empty-h">Nothing written down yet.</p>
          <p>
            Start with the one that would actually sting. You are four years in, you tell someone
            you regret it, and the sentence after that is the entry.
          </p>
          {!editing && <p className="mjc-empty-cue">Turn on EDIT to add the first one.</p>}
        </Reveal>
      ) : (
        <div className="mjc-notes">
          {entries.map((entry, index) => (
            <Reveal className="mjc-note" key={entry.id} delay={index * 0.05}>
              <div className="mjc-note-head">
                <span className="mjc-note-alt">{labelOf(entry.alternative)}</span>
                <span className={`mjc-lik mjc-lik-${entry.likelihood}`}>
                  {likelihoodLabel(entry.likelihood)}
                </span>
              </div>
              <p className="mjc-note-fail">{entry.failureMode}</p>
              {entry.mitigation && (
                <p className="mjc-note-mit">
                  <span>What would stop it</span>
                  {entry.mitigation}
                </p>
              )}
            </Reveal>
          ))}
        </div>
      )}

      {editing && <AddEntry alternatives={doc.alternatives} updateDoc={updateDoc} />}

      <details className="plain">
        <summary>Plain English: why imagine failing on purpose</summary>
        <div className="pbody">
          <p>
            Asking whether a plan could fail gets you a shrug. Telling yourself it already failed and
            asking why gets you real answers, because your brain will happily explain something that
            has already happened.
          </p>
          <p>
            Nothing here feeds the score. It sits next to the score on purpose. If the winning major
            has a failure mode you read and immediately believe, that is worth more than a two point
            lead on the board.
          </p>
        </div>
      </details>
    </section>
  );
};

export default PreMortem;
