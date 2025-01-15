import React, { useEffect } from "react";
import { TopBar } from "./top_bar";
import "../Home.css";

export const Home = () => {
  useEffect(() => {
    // Trigger animations after component mount
    const elements = document.querySelectorAll(".animate-in");
    elements.forEach((element) => {
      element.classList.add("show");
    });
  }, []);

  return (
    <div className="home-page-content">
      <div className="intro-section">
        <p className="greeting animate-in">Hi, my name is</p>
        <h1 className="name animate-in">Oliver Nguyen.</h1>
        {/* <h2 className="description animate-in">I love</h2> */}
      </div>
      <TopBar />
    </div>
  );
};
