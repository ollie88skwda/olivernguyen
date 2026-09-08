import { useEffect, useState } from "react";

import { apiFetch } from "./api";

export function useOwnerAccess(enabled, userId) {
  const identity = enabled ? userId || null : null;
  const [state, setState] = useState({ status: "idle", error: null, identity: null });
  const visibleState = state.identity === identity
    ? state
    : { status: enabled ? "loading" : "idle", error: null, identity };

  useEffect(() => {
    let active = true;
    if (!enabled || !userId) {
      setState({ status: enabled ? "loading" : "idle", error: null, identity });
      return () => {
        active = false;
      };
    }

    setState({ status: "loading", error: null, identity });
    apiFetch("/api/tracker/session")
      .then(() => {
        if (active) setState({ status: "authorized", error: null, identity });
      })
      .catch((error) => {
        if (!active) return;
        if (error.status === 401 || error.status === 403) {
          setState({ status: "unauthorized", error: null, identity });
        } else {
          setState({ status: "error", error: error.message || "Access check failed.", identity });
        }
      });

    return () => {
      active = false;
    };
  }, [enabled, identity, userId]);

  return visibleState;
}
