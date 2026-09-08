import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const BUCKET = "transfers";
const ROOT = "_life-tracker";
const MAX_CLASSES = 100;
const MAX_NOTES_PER_CLASS = 1000;
const MAX_NAME_LENGTH = 100;
const MAX_TITLE_LENGTH = 160;
const MAX_BODY_LENGTH = 100_000;

export class TrackerError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export const emptyTracker = () => ({ version: 1, classes: [] });

export function trackerPath(userId) {
  return `${ROOT}/${encodeURIComponent(userId)}.json`;
}

function storage() {
  const url = process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new TrackerError(500, "Tracker storage is not configured on the server.");
  }
  return createClient(url, key, { auth: { persistSession: false } }).storage.from(BUCKET);
}

function isMissing(error) {
  return error && (
    Number(error.status) === 404 ||
    Number(error.statusCode) === 404 ||
    /not found|does not exist/i.test(error.message || "")
  );
}

function cleanString(value, label, maxLength, { allowEmpty = false } = {}) {
  if (typeof value !== "string") throw new TrackerError(400, `${label} must be text.`);
  const clean = value.trim();
  if (!allowEmpty && !clean) throw new TrackerError(400, `${label} cannot be empty.`);
  if (value.length > maxLength) {
    throw new TrackerError(400, `${label} must be ${maxLength} characters or fewer.`);
  }
  return allowEmpty ? value : clean;
}

function normalizeTracker(value) {
  if (!value || value.version !== 1 || !Array.isArray(value.classes)) {
    throw new TrackerError(500, "Saved tracker data is invalid.");
  }
  return value;
}

export async function readTracker(userId) {
  const { data, error } = await storage().download(trackerPath(userId));
  if (error) {
    if (isMissing(error)) return emptyTracker();
    throw new TrackerError(500, error.message || "Tracker could not be loaded.");
  }

  try {
    return normalizeTracker(JSON.parse(await data.text()));
  } catch (error) {
    if (error instanceof TrackerError) throw error;
    throw new TrackerError(500, "Saved tracker data could not be read.");
  }
}

export async function writeTracker(userId, tracker) {
  const { error } = await storage().upload(
    trackerPath(userId),
    JSON.stringify(tracker),
    { contentType: "application/json", upsert: true },
  );
  if (error) throw new TrackerError(500, error.message || "Tracker could not be saved.");
  return tracker;
}

function findClass(tracker, classId) {
  const entry = tracker.classes.find((item) => item.id === classId);
  if (!entry) throw new TrackerError(404, "Class not found.");
  return entry;
}

function findNote(classEntry, noteId) {
  const note = classEntry.notes.find((item) => item.id === noteId);
  if (!note) throw new TrackerError(404, "Note not found.");
  return note;
}

export function applyTrackerAction(tracker, action, now = new Date().toISOString()) {
  const next = structuredClone(normalizeTracker(tracker));
  if (!action || typeof action.type !== "string") {
    throw new TrackerError(400, "Missing tracker action.");
  }

  switch (action.type) {
    case "create-class": {
      if (next.classes.length >= MAX_CLASSES) {
        throw new TrackerError(400, `A tracker can contain at most ${MAX_CLASSES} classes.`);
      }
      const entry = {
        id: randomUUID(),
        name: cleanString(action.name, "Class name", MAX_NAME_LENGTH),
        notes: [],
        createdAt: now,
        updatedAt: now,
      };
      next.classes.push(entry);
      return { tracker: next, selectedClassId: entry.id };
    }
    case "rename-class": {
      const entry = findClass(next, action.classId);
      entry.name = cleanString(action.name, "Class name", MAX_NAME_LENGTH);
      entry.updatedAt = now;
      return { tracker: next, selectedClassId: entry.id };
    }
    case "delete-class": {
      findClass(next, action.classId);
      next.classes = next.classes.filter((item) => item.id !== action.classId);
      return { tracker: next, selectedClassId: next.classes[0]?.id || null };
    }
    case "create-note": {
      const entry = findClass(next, action.classId);
      if (entry.notes.length >= MAX_NOTES_PER_CLASS) {
        throw new TrackerError(400, `A class can contain at most ${MAX_NOTES_PER_CLASS} notes.`);
      }
      const note = {
        id: randomUUID(),
        title: cleanString(action.title || "Untitled note", "Note title", MAX_TITLE_LENGTH),
        body: "",
        createdAt: now,
        updatedAt: now,
      };
      entry.notes.unshift(note);
      entry.updatedAt = now;
      return { tracker: next, selectedClassId: entry.id, selectedNoteId: note.id };
    }
    case "update-note": {
      const entry = findClass(next, action.classId);
      const note = findNote(entry, action.noteId);
      note.title = cleanString(action.title, "Note title", MAX_TITLE_LENGTH);
      note.body = cleanString(action.body, "Note body", MAX_BODY_LENGTH, { allowEmpty: true });
      note.updatedAt = now;
      entry.updatedAt = now;
      return { tracker: next, selectedClassId: entry.id, selectedNoteId: note.id };
    }
    case "delete-note": {
      const entry = findClass(next, action.classId);
      findNote(entry, action.noteId);
      entry.notes = entry.notes.filter((item) => item.id !== action.noteId);
      entry.updatedAt = now;
      return { tracker: next, selectedClassId: entry.id, selectedNoteId: entry.notes[0]?.id || null };
    }
    default:
      throw new TrackerError(400, "Unknown tracker action.");
  }
}

export async function mutateTracker(userId, action) {
  const current = await readTracker(userId);
  const result = applyTrackerAction(current, action);
  await writeTracker(userId, result.tracker);
  return result;
}
