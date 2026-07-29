import React from 'react';
import SectionHeading from '../../../components/SectionHeading';
import Reveal from '../../../components/Reveal';
import { GLOSSARY } from '../glossary';

// Every dotted-underline term on the page, in one place, in the order glossary.js declares
// them. Same source the tooltips read, so a definition cannot drift between the two.
export const Glossary = () => (
  <section id="glossary" className="ap-sec">
    <SectionHeading eyebrow="S9 / Glossary" title="Every Term, Plainly" />

    <Reveal as="p" className="ap-hint">
      Nothing on this page needs a statistics background. If a word above was doing more work than
      it explained, it is here.
    </Reveal>

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
