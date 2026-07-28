import React, { useState } from 'react';
import SectionHeading from '../../../components/SectionHeading';
import Reveal from '../../../components/Reveal';

// A bare YYYY-MM-DD parses as UTC midnight, which sorts and prints a day early west of
// Greenwich. Pin date-only strings to local midnight. Anything unparseable sinks last.
const timeOf = (raw) => {
  const text = typeof raw === 'string' ? raw.trim() : '';
  const at = Date.parse(/^\d{4}-\d{2}-\d{2}$/.test(text) ? `${text}T00:00:00` : text);
  return Number.isNaN(at) ? -Infinity : at;
};

const today = () => {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
};

const deltaText = (delta) =>
  typeof delta === 'number' ? `${delta > 0 ? '+' : ''}${delta.toFixed(2)}` : String(delta);

const AddEntry = ({ updateDoc }) => {
  const [date, setDate] = useState(today);
  const [source, setSource] = useState('');
  const [url, setUrl] = useState('');
  const [note, setNote] = useState('');

  const submit = (event) => {
    event.preventDefault();
    const trimmedNote = note.trim();
    if (!trimmedNote) return;
    updateDoc((current) => ({
      ...current,
      evidence: [
        ...current.evidence,
        {
          date: date || today(),
          source: source.trim() || 'Not stated',
          url: url.trim() || null,
          criterion: null,
          alternative: null,
          delta: null,
          note: trimmedNote,
        },
      ],
    }));
    setSource('');
    setUrl('');
    setNote('');
    setDate(today());
  };

  return (
    <form className="mjc-form" onSubmit={submit}>
      <p className="mjc-form-t">Log what you just learned</p>

      <div className="mjc-form-row">
        <label className="mjc-field mjc-field-sm">
          <span className="mjc-lbl">Date</span>
          <input
            className="mjc-input"
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />
        </label>

        <label className="mjc-field">
          <span className="mjc-lbl">Source</span>
          <input
            className="mjc-input"
            type="text"
            value={source}
            placeholder="NY Fed, labour market by major"
            onChange={(event) => setSource(event.target.value)}
          />
        </label>
      </div>

      <label className="mjc-field">
        <span className="mjc-lbl">Link, if there is one</span>
        <input
          className="mjc-input"
          type="url"
          value={url}
          placeholder="https://"
          onChange={(event) => setUrl(event.target.value)}
        />
      </label>

      <label className="mjc-field">
        <span className="mjc-lbl">What it changed</span>
        <textarea
          className="mjc-area"
          value={note}
          placeholder="ME unemployment came in lower than IE, so the saturated claim is looking weak"
          onChange={(event) => setNote(event.target.value)}
        />
      </label>

      <button className="mjc-btn" type="submit" disabled={!note.trim()}>
        Add to the log
      </button>
    </form>
  );
};

export const EvidenceLog = ({ doc, editing, updateDoc }) => {
  const rows = [...(doc.evidence || [])].sort((a, b) => timeOf(b.date) - timeOf(a.date));

  const criterionLabel = (id) => {
    const found = doc.criteria.find((c) => c.id === id);
    return found ? found.label : id;
  };
  const alternativeLabel = (id) => {
    const found = doc.alternatives.find((a) => a.id === id);
    return found ? found.label : id;
  };

  return (
    <section id="evidence" className="mj-sec">
      <SectionHeading eyebrow="S8 / Evidence log" title="Why The Answer Moved" />

      <Reveal as="p" className="mj-hint">
        Every time something you find out changes a number, it gets a dated row here. Newest first.
        In three months, when the page says something different to what it says today, this is the
        record of what did it.
      </Reveal>

      <div className="mjc-tablewrap">
        <table className="mjc-table">
          <thead>
            <tr>
              <th className="mjc-col-date">Date</th>
              <th className="mjc-col-src">Source</th>
              <th>What it moved</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={`${row.date}-${row.source}-${index}`}>
                <td className="mjc-date">{row.date}</td>
                <td>
                  {row.url ? (
                    <a href={row.url} target="_blank" rel="noreferrer">
                      {row.source}
                    </a>
                  ) : (
                    row.source
                  )}
                </td>
                <td>
                  {row.note}
                  {(row.criterion || row.alternative || row.delta !== null) && (
                    <span className="mjc-tags">
                      {row.alternative && <i>{alternativeLabel(row.alternative)}</i>}
                      {row.criterion && <i>{criterionLabel(row.criterion)}</i>}
                      {row.delta !== null && row.delta !== undefined && (
                        <i className="mjc-tag-delta">{deltaText(row.delta)}</i>
                      )}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && <AddEntry updateDoc={updateDoc} />}

      <details className="plain">
        <summary>Plain English: why keep a log at all</summary>
        <div className="pbody">
          <p>
            Without it you just have a number that mysteriously moved. With it you can go back and
            see that Systems overtook Industrial the day you read three real job posts, and then
            decide whether three job posts should have counted for that much.
          </p>
          <p>
            It also stops the page from quietly rewriting history. Old rows stay where they are even
            when a later one contradicts them.
          </p>
        </div>
      </details>
    </section>
  );
};

export default EvidenceLog;
