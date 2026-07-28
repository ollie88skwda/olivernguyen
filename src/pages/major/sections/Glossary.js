import React from 'react';
import SectionHeading from '../../../components/SectionHeading';
import Reveal from '../../../components/Reveal';
import { GLOSSARY } from '../glossary';

// Every dotted-underline term on the page, in one place, in the order glossary.js declares
// them. Same source as the <Tip> bubbles, so the two can never disagree.
export const Glossary = () => (
  <section id="glossary" className="mj-sec">
    <SectionHeading eyebrow="S9 / Glossary" title="Every Term On This Page" />

    <Reveal as="p" className="mj-hint">
      Nothing here is harder than multiplication and counting. The names sound worse than the ideas.
    </Reveal>

    <dl className="mjc-gloss">
      {Object.entries(GLOSSARY).map(([term, entry], index) => (
        <Reveal key={term} delay={Math.min(index, 6) * 0.03}>
          <dt>{entry.label}</dt>
          <dd>{entry.definition}</dd>
        </Reveal>
      ))}
    </dl>
  </section>
);

export default Glossary;
