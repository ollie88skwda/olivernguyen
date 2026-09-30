import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import { SiteChrome } from "@/chrome/SiteChrome";
import { ModeProvider } from "@/mode/ModeProvider";
import { ThemeProvider } from "@/theme/ThemeProvider";
import TimeBlocksPage from "./TimeBlocksPage";
import { applyTimeBlocksAction, emptyTimeBlocks, HOUR_MS, normalizeSchedule } from "./model.mjs";
import "@/index.css";

const params = new URLSearchParams(window.location.search);
const schedule = normalizeSchedule({
  startTime: "07:00",
  activities: [
    { name: "School", hours: 2 },
    { name: "Writing", hours: 1 },
  ],
});
let timeBlocks = { ...emptyTimeBlocks(), schedule };
const state = params.get("state");
const startedAt = Date.now() - (state === "late" ? 2 * HOUR_MS + 5_000 : HOUR_MS + 5_000);
if (state === "ended" || state === "late") {
  timeBlocks = applyTimeBlocksAction(timeBlocks, { type: "start-run", timeZone: "UTC" }, new Date(startedAt));
  if (state === "late") {
    timeBlocks = applyTimeBlocksAction(timeBlocks, {
      type: "confirm-session", sessionId: timeBlocks.run.slots[0].id,
    }, new Date(startedAt + HOUR_MS));
  }
}
let failOnce = params.get("storage") === "fail-once";

async function testOnlyRequest(_path, options = {}) {
  if (failOnce) {
    failOnce = false;
    throw new Error("Test storage is temporarily unavailable. Try again.");
  }
  if (!options.method) return { timeBlocks: structuredClone(timeBlocks) };
  const action = JSON.parse(options.body);
  timeBlocks = applyTimeBlocksAction(timeBlocks, action, new Date());
  return { timeBlocks: structuredClone(timeBlocks) };
}

document.documentElement.dataset.mode = params.get("mode") === "terminal" ? "terminal" : "graph";
document.documentElement.dataset.theme = params.get("theme") === "dark" ? "dark" : "light";

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <ThemeProvider>
      <ModeProvider>
        <SiteChrome
          clerkEnabled
          accountState={{
            status: "signed-in",
            name: "Test owner",
            ownerAuthorized: params.get("owner") !== "no",
            onAccount: () => {},
            onSignOut: () => {},
          }}
        />
        <TimeBlocksPage request={testOnlyRequest} />
      </ModeProvider>
    </ThemeProvider>
  </BrowserRouter>,
);
