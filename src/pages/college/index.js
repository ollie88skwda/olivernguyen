import React from 'react';
import { TopBar } from '../top_bar';
import '../../styles/College.css';

// Copy is deliberately unwritten. Oliver supplies the headline, the lede and the
// three descriptions; shipping invented prose under his name is worse than a
// visible gap, so these render as obvious placeholders.
const TOOLS = [
  {
    name: 'Major',
    route: '/major',
    gate: 'Passphrase',
    desc: '[ one line on what /major is for ]',
  },
  {
    name: 'Apply',
    route: '/apply',
    gate: 'Passphrase',
    desc: '[ one line on what /apply is for ]',
  },
  {
    name: 'Studio',
    route: '/studio',
    gate: 'Sign in',
    desc: '[ one line on what /studio is for ]',
  },
];

export const College = () => (
  <>
    <TopBar />
    <main className="cl-page">
      <div className="cl-inner">
        <p className="cl-eyebrow">olivernguyen.com · college</p>
        <h1 className="cl-title">[ headline ]</h1>
        <div className="cl-rule" aria-hidden="true" />
        <p className="cl-lede">[ two or three sentences introducing the college work ]</p>

        <div className="cl-cards">
          {TOOLS.map((tool) => (
            <a className="cl-card" href={tool.route} key={tool.route}>
              <div className="cl-card-top">
                <h2 className="cl-card-name">{tool.name}</h2>
                <span className="cl-lock">{tool.gate}</span>
              </div>
              <p className="cl-card-desc">{tool.desc}</p>
              <p className="cl-card-route">{tool.route}</p>
            </a>
          ))}
        </div>
      </div>
    </main>
  </>
);

export default College;
