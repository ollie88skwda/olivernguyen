import React, { createContext, useContext, useId } from 'react';

// Inline dotted-underline term. Hover on desktop, tap or Tab on touch and keyboard.
//
// The glossary arrives through context rather than being imported directly, because a
// second page (/apply) needs the same component against a completely different set of
// terms. Context keeps every call site unchanged — still just <Tip term="monte-carlo">
// — while letting each page supply its own dictionary at the root.
const GlossaryContext = createContext(null);

export const GlossaryProvider = GlossaryContext.Provider;

// Two separate copies of the definition on purpose: the visual bubble is display:none
// until :hover/:focus, so screen readers would never reach it, and a visually hidden
// sibling carries the same text for aria-describedby. The sibling sits outside the
// button so it stays a description and never leaks into the button's own name.
export const Tip = ({ term, children, className }) => {
  const id = useId();
  const glossary = useContext(GlossaryContext);
  const entry = glossary && glossary[term];

  // An unknown term renders as plain text rather than throwing. A missing definition
  // should never be able to take a page down.
  if (!entry) return <>{children}</>;

  return (
    <>
      <button
        type="button"
        className={className ? `tt ${className}` : 'tt'}
        aria-describedby={id}
      >
        {children}
        <span className="bub" aria-hidden="true">
          {entry.definition}
        </span>
      </button>
      <span id={id} className="tt-sr">
        {entry.label}. {entry.definition}
      </span>
    </>
  );
};

export default Tip;
