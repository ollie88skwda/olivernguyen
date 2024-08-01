import React, { useState, useEffect, useCallback } from "react";
import on_logo from "../assets/on_logo.png";
import {Top_Bar} from "./top_bar";
export const Home = () => {
  return (
    <div class="content">
      <h1>HOME</h1>
      <h1>
        <a href="/driving">Learn to drive</a>
      </h1>
      <Top_Bar />
    </div>
  );
};
