import React, { useEffect } from "react";
import { Display, MonoLabel, SectionHead } from "@/components/brand";
import "../../styles/sakura.css";
import "./drivers_license.css";

// /license — sakura restyle (16-legacy-restyle lane).
// Content-page grammar shared with /permit: .sakura root, display heading,
// body copy, semantic section, brand link treatment. Copy is preserved
// verbatim — this is a deliberately short page, not a padded one.
export const DriversLicense = () => {
  // Route parity with /permit: land at the top of the page on navigation.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <main className="sakura dl">
      <div className="dl-col">
        <header className="dl-hero">
          <MonoLabel>driving</MonoLabel>
          <Display as="h1">How to get your drivers license after your permit</Display>
        </header>
        <section className="dl-section">
          <SectionHead title="1: Get your permit" />
          <p className="on-prose">
            If you don't have your permit, go get it. Learn how to get it{" "}
            <a className="dl-link" href="/permit">
              here
            </a>
            .
          </p>
        </section>
      </div>
    </main>
  );
};

export default DriversLicense;
