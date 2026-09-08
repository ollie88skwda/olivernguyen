import { useEffect, useState } from "react";

import { apiFetch } from "./api";

export function useOwnerAccess(enabled) {
  const [state, setState] = useState({ status: "idle", error: null });

  useEffect(() => {
    let active = true;
    if (!enabled) {
      setState({ status: "idle", error: null });
      return () => {
        active = false;
      };
    }

    setState({ status: "loading", error: null });
    apiFetch("/api/tracker/session")
      .then(() => {
        if (active) setState({ status: "authorized", error: null });
      })
      .catch((error) => {
        if (!active) return;
        if (error.status === 401 || error.status === 403) {
          setState({ status: "unauthorized", error: null });
        } else {
          setState({ status: "error", error: error.message || "Access check failed." });
        }
      });

    return () => {
      active = false;
    };
  }, [enabled]);

  return state;
}
