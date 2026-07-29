import React, { useState } from 'react';
import { Markdown } from '../markdown';

// Read-only. These are other people's essays: the rail shows them, and nothing
// in the Studio can write to _Exemplars/.

const stripFrontmatter = (raw) => String(raw ?? '').replace(/^---[\s\S]*?\n---\s*\n/, '');

// What the tier actually means, in the words that matter when you are deciding
// how much weight to give an essay's choices.
const TIER_NOTE = {
  A: 'published by the university',
  B: 'published by a book or news outlet',
  C: 'self-reported — the writing is real, the admission is a claim',
};

export const ExemplarPane = ({ promptKey, exemplars, error, docs, onLoad }) => {
  const [openId, setOpenId] = useState(null);

  if (error) return <p className="es-ctx-empty">{error}</p>;

  const ranked = (exemplars || [])
    .filter((entry) => entry.prompt_key === promptKey)
    .sort((a, b) => (a.rank || 99) - (b.rank || 99));

  if (!ranked.length) {
    return (
      <p className="es-ctx-empty">
        No exemplars for this prompt yet. Run the sweep in{' '}
        <code>_Exemplars/00_Research_Protocol.md</code>.
      </p>
    );
  }

  const toggle = (entry) => {
    if (openId === entry.id) {
      setOpenId(null);
      return;
    }
    setOpenId(entry.id);
    onLoad(entry.path);
  };

  return (
    <ol className="es-ex-list">
      {ranked.map((entry) => {
        const open = openId === entry.id;
        const doc = docs[entry.path];
        return (
          <li key={entry.id} className={open ? 'es-ex-row es-ex-row-open' : 'es-ex-row'}>
            <button
              type="button"
              className="es-ex-head"
              onClick={() => toggle(entry)}
              aria-expanded={open}
            >
              <span className="es-ex-rank">{entry.rank}</span>
              <span className="es-ex-title">{entry.title}</span>
              <span className={`es-ex-tier es-ex-tier-${entry.provenance_tier}`}>
                {entry.provenance_tier}
              </span>
              <span className="es-ex-score">{entry.total}</span>
            </button>

            <p className="es-ex-meta">
              {entry.admit_school}
              {entry.admit_year ? ` ’${String(entry.admit_year).slice(-2)}` : ''} · {entry.word_count}w
              {entry.native_piq === false && <span className="es-ex-flag">not a PIQ answer</span>}
            </p>

            {open && (
              <div className="es-ex-body">
                {!doc || doc.loading ? (
                  <p className="es-ctx-empty">Loading…</p>
                ) : doc.error ? (
                  <p className="es-ctx-empty">{doc.error}</p>
                ) : (
                  <>
                    <p className="es-ex-prov">{TIER_NOTE[entry.provenance_tier]}</p>
                    <Markdown source={stripFrontmatter(doc.raw)} className="es-ctx-md" />
                    <a
                      className="es-ex-src"
                      href={entry.source_url}
                      target="_blank"
                      rel="noreferrer noopener"
                    >
                      {entry.source_name} ↗
                    </a>
                  </>
                )}
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
};

export default ExemplarPane;
