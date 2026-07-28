import React, { useId } from 'react';
import { GLOSSARY } from './glossary';

// Inline dotted-underline term. Hover on desktop, tap or Tab on touch and keyboard.
//
// Two separate copies of the definition on purpose: the visual bubble is display:none
// until :hover/:focus, so screen readers would never reach it, and a visually hidden
// sibling carries the same text for aria-describedby. The sibling sits outside the
// button so it stays a description and never leaks into the button's own name.
export const Tip = ({ term, children, className }) => {
  const id = useId();
  const entry = GLOSSARY[term];
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
