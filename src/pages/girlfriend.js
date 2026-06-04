import React, { useState } from "react";
import "../styles/Girlfriend.css";

/* /be-my-girlfriend — playful proposal page. Self-contained styling (own
   full-viewport background) like the emoji page; doesn't touch the theme. */

const NO_LABELS = [
  "No",
  "Are you sure?",
  "Really sure?",
  "Think again!",
  "Last chance!",
  "Surely not?",
  "You might regret this",
  "Have a heart!",
  "Don't be so cold!",
  "Pretty please?",
];

export const Girlfriend = () => {
  const [saidYes, setSaidYes] = useState(false);
  const [dodges, setDodges] = useState(0);
  const [noStyle, setNoStyle] = useState({});

  const dodge = () => {
    const pad = 90;
    const x = pad + Math.random() * (window.innerWidth - pad * 2);
    const y = pad + Math.random() * (window.innerHeight - pad * 2);
    setNoStyle({
      position: "fixed",
      left: x,
      top: y,
      transform: "translate(-50%, -50%)",
    });
    setDodges((d) => d + 1);
  };

  const yesScale = Math.min(1 + dodges * 0.16, 2.4);

  if (saidYes) {
    return (
      <div className="gf-page">
        <div className="gf-hearts" aria-hidden="true">
          {Array.from({ length: 24 }).map((_, i) => (
            <span
              key={i}
              className="gf-heart"
              style={{
                left: `${(i * 41 + 13) % 100}%`,
                animationDelay: `${(i % 8) * 0.45}s`,
                fontSize: `${1.2 + (i % 5) * 0.4}rem`,
              }}
            >
              {["\u{1F496}", "\u{1F498}", "\u{1F49D}", "\u{1F495}"][i % 4]}
            </span>
          ))}
        </div>
        <h1 className="gf-title">YAY! {"\u{1F389}"}</h1>
        <p className="gf-sub">Best decision ever {"\u{1F496}"}</p>
      </div>
    );
  }

  return (
    <div className="gf-page">
      <div className="gf-emoji" role="img" aria-label="pleading face">
        {"\u{1F97A}\u{1F449}\u{1F448}"}
      </div>
      <h1 className="gf-title">Will you be my girlfriend?</h1>
      <div className="gf-row">
        <button
          className="gf-yes"
          style={{ transform: `scale(${yesScale})` }}
          onClick={() => setSaidYes(true)}
        >
          Yes {"\u{1F496}"}
        </button>
        <button
          className="gf-no"
          style={noStyle}
          onMouseEnter={dodge}
          onClick={dodge}
        >
          {NO_LABELS[Math.min(dodges, NO_LABELS.length - 1)]}
        </button>
      </div>
    </div>
  );
};

export default Girlfriend;
