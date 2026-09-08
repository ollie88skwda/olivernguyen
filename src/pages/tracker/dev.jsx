import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import { SiteChrome } from "@/chrome/SiteChrome";
import { ModeProvider } from "@/mode/ModeProvider";
import { ThemeProvider } from "@/theme/ThemeProvider";
import TrackerPage from "./TrackerPage";
import "@/index.css";

const now = new Date().toISOString();
let tracker = {
  version: 1,
  classes: [
    {
      id: "physics",
      name: "Physics 101",
      createdAt: now,
      updatedAt: now,
      notes: [
        {
          id: "motion",
          title: "Week 3 · Motion",
          body: "Velocity is the slope of position over time.\n\nQuestions for office hours:\n- When does average velocity hide useful detail?\n- Rework problem 4 before Friday.",
          createdAt: now,
          updatedAt: now,
        },
        {
          id: "vectors",
          title: "Vector review",
          body: "Resolve every force into x and y components before writing the equations.",
          createdAt: now,
          updatedAt: now,
        },
      ],
    },
    {
      id: "writing",
      name: "Academic Writing",
      createdAt: now,
      updatedAt: now,
      notes: [],
    },
  ],
};

function id(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

async function demoRequest(_path, options = {}) {
  if (!options.method) return { tracker: structuredClone(tracker) };
  const action = JSON.parse(options.body);
  const stamp = new Date().toISOString();
  let selectedClassId;
  let selectedNoteId;

  if (action.type === "create-class") {
    const entry = { id: id("class"), name: action.name.trim(), notes: [], createdAt: stamp, updatedAt: stamp };
    tracker.classes.push(entry);
    selectedClassId = entry.id;
  } else {
    const classEntry = tracker.classes.find((entry) => entry.id === action.classId);
    if (action.type === "rename-class") {
      classEntry.name = action.name.trim();
      selectedClassId = classEntry.id;
    }
    if (action.type === "delete-class") {
      tracker.classes = tracker.classes.filter((entry) => entry.id !== action.classId);
      selectedClassId = tracker.classes[0]?.id || null;
    }
    if (action.type === "create-note") {
      const note = { id: id("note"), title: "Untitled note", body: "", createdAt: stamp, updatedAt: stamp };
      classEntry.notes.unshift(note);
      selectedClassId = classEntry.id;
      selectedNoteId = note.id;
    }
    if (action.type === "update-note") {
      const note = classEntry.notes.find((entry) => entry.id === action.noteId);
      note.title = action.title.trim();
      note.body = action.body;
      note.updatedAt = stamp;
      selectedClassId = classEntry.id;
      selectedNoteId = note.id;
    }
    if (action.type === "delete-note") {
      classEntry.notes = classEntry.notes.filter((entry) => entry.id !== action.noteId);
      selectedClassId = classEntry.id;
    }
  }

  return {
    tracker: structuredClone(tracker),
    ...(selectedClassId !== undefined ? { selectedClassId } : {}),
    ...(selectedNoteId !== undefined ? { selectedNoteId } : {}),
  };
}

const params = new URLSearchParams(window.location.search);
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
            name: "Oliver",
            ownerAuthorized: params.get("owner") !== "no",
            onAccount: () => {},
            onSignOut: () => {},
          }}
        />
        <TrackerPage request={demoRequest} />
      </ModeProvider>
    </ThemeProvider>
  </BrowserRouter>,
);
