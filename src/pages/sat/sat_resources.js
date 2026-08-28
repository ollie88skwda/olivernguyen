import React from "react";
import { SectionHead, StatusPill } from "@/components/brand";
import "../../styles/SatResources.css";

// Legacy restyle lane: /sat-resources is an intentional empty state — the
// route has no resource list yet. "Coming soon" is a real status, carried by
// the brand StatusPill, not padded with invented content.
const SATResources = () => {
  return (
    <div className="sakura sat-resources">
      <main className="sat-resources__column">
        <SectionHead kicker="SAT" title="Study resources" as="h1" />
        <StatusPill status="neutral" className="sat-resources__status">
          Coming soon
        </StatusPill>
      </main>
    </div>
  );
};

export default SATResources;
