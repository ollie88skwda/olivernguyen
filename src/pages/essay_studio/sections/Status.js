import React from 'react';
import SectionHeading from '../../../components/SectionHeading';
import Reveal from '../../../components/Reveal';
import { BudgetBar } from '../BudgetBar';
import { summarize } from '../vaultModel';

const RAMP = [
  { label: 'within limit', className: 'es-key-fill' },
  { label: 'over', className: 'es-key-over' },
  { label: 'the word wall', className: 'es-key-wall' },
];

// One school gets a plain list. Two or more get a labelled group each, because
// word limits differ per school and comparing a 200-word MIT answer against a
// 350-word UC one on an unlabelled bar would be misleading.
const Group = ({ school, showLabel, onOpen }) => {
  const withDrafts = school.prompts.filter((prompt) => prompt.latest);
  if (!withDrafts.length) return null;

  return (
    <div className="es-budget-group">
      {showLabel && <p className="es-budget-school">{school.name}</p>}
      <div className="es-budget">
        {withDrafts.map((prompt) => (
          <BudgetBar
            key={`${school.slug}/${prompt.slug}`}
            label={prompt.title}
            count={prompt.latest.wordCount}
            limit={prompt.latest.wordLimit}
            title={`Open ${school.name} — ${prompt.title} ${prompt.latest.label}`}
            onClick={() => onOpen(prompt, prompt.latest)}
          />
        ))}
      </div>
    </div>
  );
};

export const Status = ({ schools, eyebrow, onOpen }) => {
  const active = schools.filter((school) => school.prompts.some((prompt) => prompt.latest));
  const allPrompts = schools.flatMap((school) => school.prompts);
  const totals = summarize(allPrompts);
  const multiSchool = active.length > 1;

  return (
    <section id="status" className="es-sec">
      <SectionHeading eyebrow={eyebrow} title="Where Everything Stands" />

      <Reveal as="p" className="es-hint">
        One bar per prompt, drawn on the latest draft. The wall is that prompt&rsquo;s word limit;
        anything past it is hatched. Bars are on one shared scale within a school, so you can see which
        overrun is a trim and which one is a rewrite without reading a number.
      </Reveal>

      {active.length === 0 ? (
        <p className="es-empty">No drafts in the vault yet.</p>
      ) : (
        <>
          <p className="es-readout">
            {multiSchool && `${active.length} schools · `}
            {totals.active} prompt{totals.active === 1 ? '' : 's'}
            {totals.over > 0 && (
              <>
                {' · '}
                <b>{totals.over} over limit</b>
              </>
            )}
            {totals.pending > 0 && ` · ${totals.pending} pending review`}
            {totals.final > 0 && ` · ${totals.final} final`}
          </p>

          {active.map((school) => (
            <Group key={school.slug} school={school} showLabel={multiSchool} onOpen={onOpen} />
          ))}

          <p className="es-legend">
            {RAMP.map((item) => (
              <span className="es-key" key={item.label}>
                <i className={item.className} aria-hidden="true" />
                {item.label}
              </span>
            ))}
          </p>
        </>
      )}
    </section>
  );
};

export default Status;
