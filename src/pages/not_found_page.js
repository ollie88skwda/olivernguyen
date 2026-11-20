import React from "react";
import "../styles/sakura.css";
import "../styles/App.css";

export const NotFoundPage = () => {
  return (
    <div className="sakura" style={{ minHeight: "100dvh", background: "var(--bg)" }}>
      <div className="content">
        <h1>This page doesn't exist</h1>
        <div className="try-links" style={{ margin: 0 }}>
          <h2>Try</h2>
          <h3>
            <a href="/">Home</a>
          </h3>
        </div>
      </div>
    </div>
  );
};
