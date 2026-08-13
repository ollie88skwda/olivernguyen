import "../../styles/App.css";
import React from "react";

export const DriversLicense = () => {
  return (
    <div>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <div className="content">
        <header>
          <h1>How to get your drivers license after your permit</h1>
        </header>
        <div className="section1">
          <h2>1: Get your permit</h2>
          <p>
            If you don't have your permit, go get it. Learn how to get it{" "}
            <a href="/permit">here</a>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DriversLicense;
