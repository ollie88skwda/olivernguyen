import React from 'react';
import { SectionHead } from '@/components/brand';
import { GLOSSARY } from '../glossary';

// Every dotted-underline term on the page, in one place, in the order glossary.js declares
// them. Same source as the <Tip> bubbles, so the two can never disagree.
export const Glossary = () => (
  <section id="glossary" className="mj-sec">
    <SectionHead eyebrow="S9 / Glossary" title="Every Term On This Page" />

    <p className="mj-hint">
      Nothing here is harder than multiplication and counting. The names sound worse than the ideas.
    </p>

    <dl className="mjc-gloss">
      {Object.entries(GLOSSARY).map(([term, entry]) => (
        <div key={term}>
          <dt>{entry.label}</dt>
          <dd>{entry.definition}</dd>
        </div>
      ))}
    </dl>
  </section>
);

export default Glossary;
