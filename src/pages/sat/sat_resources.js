import React from 'react';
import "../../App.css";
import { TopBar } from "../top_bar";

const SATResources = () => {
  return (
    <div>
      <div className="content">
        <main>
          <div className="content-container">
            <h1>SAT Study Resources</h1>
            <div className="content-section">
              <p>This page will contain SAT study resources and materials.</p>
            </div>
          </div>
        </main>
      </div>
      <TopBar />
    </div>
  );
};

export default SATResources;
