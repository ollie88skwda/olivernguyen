import React from "react";
import { TopBar } from "./top_bar";

export const NotFoundPage = () => {
  return (
    <div>
      <div class="content">
        <h1>You probably shouldn't be here...</h1>
        <div class="try-links">
          <h2>Try:</h2>
          <h3>
            <a href="/">Home</a>
          </h3>
        </div>
        <TopBar />
      </div>
    </div>
  );
};
