import React, { useState } from 'react';
import SectionHeading from '../../../components/SectionHeading';
import Reveal from '../../../components/Reveal';
import { Markdown, parseOverview } from '../markdown';

// Reads its document only once the user opens it, so the Desk never pays for
// content nobody asked for.
const LazyDoc = ({ path, label, docs, onLoad, render }) => {
  const [opened, setOpened] = useState(false);
  const doc = docs[path];

  return (
    <details
      className="es-archive-item"
      onToggle={(event) => {
        if (event.currentTarget.open && !opened) {
          setOpened(true);
          onLoad(path);
        }
      }}
    >
      <summary>{label}</summary>
      <div className="es-archive-body">
        {!doc || doc.loading ? (
          <p className="es-empty">Loading…</p>
        ) : doc.error ? (
          <p className="es-empty">{doc.error}</p>
        ) : (
          render(doc)
        )}
      </div>
    </details>
  );
};

// Prompts you did not pick and the reference guides, across every school. They
// used to render as empty "No drafts yet" groups mixed into the active list;
// here they are folded away but still reachable.
export const Archive = ({ schools, eyebrow, docs, onLoad }) => {
  const archive = schools.flatMap((school) =>
    school.archive.map((prompt) => ({ ...prompt, schoolName: school.name }))
  );
  const guides = schools.flatMap((school) =>
    school.guides.map((guide) => ({ ...guide, schoolName: school.name }))
  );
  if (!archive.length && !guides.length) return null;

  // Only worth naming the school when there is more than one in play.
  const multi = schools.filter((s) => s.archive.length || s.guides.length).length > 1;
  const label = (item, text) => (multi ? `${item.schoolName} · ${text}` : text);

  return (
    <section id="archive" className="es-sec">
      <SectionHeading eyebrow={eyebrow} title="Not In Play" />

      <Reveal as="p" className="es-hint">
        Prompts you did not select and the reference material. Kept out of the board so the four you are
        writing stay the whole picture.
      </Reveal>

      {archive.length > 0 && (
        <>
          <p className="es-readout">Unselected prompts</p>
          <div className="es-archive">
            {archive.map((prompt) => (
              <LazyDoc
                key={prompt.overviewPath}
                path={prompt.overviewPath}
                label={label(prompt, prompt.title)}
                docs={docs}
                onLoad={onLoad}
                render={(doc) => {
                  const parsed = parseOverview(doc.raw);
                  return parsed.question ? (
                    <>
                      <p>{parsed.question}</p>
                      {parsed.consider && <p className="es-archive-consider">{parsed.consider}</p>}
                    </>
                  ) : (
                    <Markdown source={doc.raw.replace(/^---[\s\S]*?\n---\n/, '')} />
                  );
                }}
              />
            ))}
          </div>
        </>
      )}

      {guides.length > 0 && (
        <>
          <p className="es-readout" style={{ marginTop: '26px' }}>
            Reference
          </p>
          <div className="es-archive">
            {guides.map((guide) => (
              <LazyDoc
                key={guide.path}
                path={guide.path}
                label={label(guide, guide.title)}
                docs={docs}
                onLoad={onLoad}
                render={(doc) => <Markdown source={doc.raw.replace(/^---[\s\S]*?\n---\n/, '')} />}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
};

export default Archive;
