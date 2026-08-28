import React from "react";
import { Display } from "@/components/brand";

import "@/styles/sakura.css";
import "./sat_signup.css";

// /sat-signup — legacy restyle lane (docs/redesign-research/16-legacy-restyle).
// Informational placeholder: 05-v1-spec.md §2.3 commits this route's future
// content to a real signup FORM (forms never fake-terminalized), so the page
// stays heading + body copy until that form exists. No controls or surfaces
// yet — Button/Input/Card are reserved for the form when it lands.
const SATSignup = () => {
  return (
    <div className="sakura sat-signup">
      <main className="sat-signup-main">
        <Display as="h1">SAT Registration</Display>
        <p className="on-prose">
          This page will contain information about signing up for the SAT.
        </p>
        <p className="on-prose">
          A signup form will live here once it is available.
        </p>
      </main>
    </div>
  );
};

export default SATSignup;
