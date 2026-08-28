import React from "react";
import { SectionHead, StatusPill } from "@/components/brand";
import "../../styles/SatResources.css";

const SATState = ({ role, status, label, message, busy = false }) => (
  <div className="sakura sat-resources" role={role} aria-live={role === "status" ? "polite" : undefined} aria-busy={busy || undefined}>
    <main className="sat-resources__column">
      <SectionHead kicker="SAT" title="Study resources" as="h1" />
      <StatusPill status={status} className="sat-resources__status">
        {label}
      </StatusPill>
      <p className="sat-resources__message">{message}</p>
    </main>
  </div>
);

export const SATResourcesLoading = () => (
  <SATState
    role="status"
    status="neutral"
    label="Loading"
    message="Loading study resources…"
    busy
  />
);

export const SATResourcesError = () => (
  <SATState
    role="alert"
    status="error"
    label="Unable to load"
    message="Study resources could not be loaded."
  />
);
