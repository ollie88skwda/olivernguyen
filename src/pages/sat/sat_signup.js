import React from "react";
import { Display } from "@/components/brand";

import "@/styles/sakura.css";
import "./sat_signup.css";

// /sat-signup — see docs/sat-signup-restyle-coverage.md.
// Informational placeholder: 05-v1-spec.md §2.3 commits this route's future
// content to a real signup FORM (forms never fake-terminalized), so the page
// stays heading + body copy until that form exists. No controls or surfaces
// yet — Button/Input/Card are reserved for the form when it lands.
const SATSignup = () => {
  return (
    <div className="sakura sat-signup">
      <main className="sat-signup-main">
        <Display as="h1">SAT signup</Display>
        <p className="on-prose">
          This page will explain how to sign up for the SAT.
        </p>
        <p className="on-prose">
          The signup form will go here when it's ready.
        </p>
      </main>
    </div>
  );
};

export default SATSignup;
