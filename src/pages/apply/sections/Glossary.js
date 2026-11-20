import React from 'react';
import { SectionHead } from '../../../components/brand';
import { GLOSSARY } from '../glossary';

// Every dotted-underline term on the page, in one place, in the order glossary.js declares
// them. Same source the tooltips read, so a definition cannot drift between the two.
export const Glossary = () => (
  <section id="glossary" className="ap-sec">
    <SectionHead kicker="S9 / Glossary" title="Every term, plainly" />

    <p className="on-prose ap-hint">
      You do not need a statistics background for this page. Any word above that was unclear is
      explained here.
    </p>

    <dl className="ap-glossary">
      {Object.entries(GLOSSARY).map(([key, entry]) => (
        <div className="ap-gloss" key={key}>
          <dt>{entry.label}</dt>
          <dd>{entry.definition}</dd>
        </div>
      ))}
    </dl>
  </section>
);

export default Glossary;
