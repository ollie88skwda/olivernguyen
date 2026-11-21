import React from "react";
import "../styles/sakura.css";
import "../styles/NotFound.css";

export const NotFoundPage = () => (
  <main className="sakura nf-page">
    <p className="nf-code">404</p>
    <h1>This page doesn't exist</h1>
    <a className="nf-home" href="/">Back home</a>
  </main>
);
