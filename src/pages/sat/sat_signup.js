import React from 'react';
import "../../App.css";
import { TopBar } from "../top_bar";

const SATSignup = () => {
  return (
    <div>
      <div className="content">
        <main>
          <div className="content-container">
            <h1>SAT Registration</h1>
            <div className="content-section">
              <p>This page will contain information about signing up for the SAT.</p>
            </div>
          </div>
        </main>
      </div>
      <TopBar />
    </div>
  );
};

export default SATSignup;
