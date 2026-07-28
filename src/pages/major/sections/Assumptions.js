import React from 'react';
import SectionHeading from '../../../components/SectionHeading';
import Reveal from '../../../components/Reveal';

const STATUSES = ['untested', 'supported', 'refuted'];

export const Assumptions = ({ doc, editing, updateDoc }) => {
  const rows = doc.assumptions || [];
  const untested = rows.filter((row) => row.status === 'untested').length;

  const patch = (id, field, value) =>
    updateDoc((current) => ({
      ...current,
      assumptions: current.assumptions.map((row) =>
        row.id === id ? { ...row, [field]: value } : row
      ),
    }));

  return (
    <section id="assumptions" className="mj-sec">
      <SectionHeading eyebrow="S7 / Assumptions" title="Your Beliefs, Written Down As Work" />

      <Reveal as="p" className="mj-hint">
        None of these are facts yet. They are things you said, sitting in the model and moving the
        scores as if they were checked. Written out with the word untested next to them, they turn
        into a short list of jobs.
      </Reveal>

      {untested > 0 && (
        <p className="mjc-count">
          {untested} of {rows.length} still untested
        </p>
      )}

      <div className="mjc-tablewrap">
        <table className="mjc-table">
          <thead>
            <tr>
              <th>What you believe</th>
              <th>Status</th>
              <th>How to check it</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{row.claim}</td>
                <td>
                  {editing ? (
                    <select
                      className="mjc-select mjc-select-sm"
                      value={row.status}
                      aria-label={`Status of: ${row.claim}`}
                      onChange={(event) => patch(row.id, 'status', event.target.value)}
                    >
                      {STATUSES.map((status) => (
                        <option value={status} key={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className={`mjc-pill mjc-pill-${row.status}`}>{row.status}</span>
                  )}
                </td>
                <td>
                  {editing ? (
                    <input
                      className="mjc-input mjc-input-sm"
                      type="text"
                      value={row.test}
                      aria-label={`How to check: ${row.claim}`}
                      onChange={(event) => patch(row.id, 'test', event.target.value)}
                    />
                  ) : (
                    row.test
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <details className="plain">
        <summary>Plain English: why write down things you already believe</summary>
        <div className="pbody">
          <p>
            Right now mechanical is saturated is quietly acting like a fact inside your head, and it
            is dragging Mechanical down on the board without anyone ever checking it. Putting it in a
            table with untested next to it makes that visible.
          </p>
          <p>
            Each row comes with the cheapest way to settle it. When one turns out to be true, mark it
            supported and the belief has earned its place. When one turns out to be wrong, mark it
            refuted and go fix the score it was holding down.
          </p>
        </div>
      </details>
    </section>
  );
};

export default Assumptions;
