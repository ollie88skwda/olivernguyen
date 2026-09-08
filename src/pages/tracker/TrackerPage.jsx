import React, { useEffect, useMemo, useRef, useState } from "react";

import { apiFetch } from "@/auth/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Display, MonoLabel } from "@/components/brand";
import "./tracker.css";

const requestTracker = (path, options) => apiFetch(path, options);

function dateLabel(value) {
  if (!value) return "Not saved yet";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

const LoadingTracker = () => (
  <main className="tracker-page sakura" aria-busy="true" aria-label="Loading life tracker">
    <div className="tracker-shell">
      <header className="tracker-header">
        <Skeleton shape="text" className="tracker-skeleton-label" />
        <Skeleton shape="text" className="tracker-skeleton-title" />
      </header>
      <div className="tracker-workspace tracker-loading-grid">
        <Skeleton shape="surface" />
        <Skeleton shape="surface" />
        <Skeleton shape="surface" />
      </div>
    </div>
  </main>
);

const EmptyPanel = ({ title, children, action }) => (
  <div className="tracker-empty">
    <h3>{title}</h3>
    <p>{children}</p>
    {action}
  </div>
);

export function TrackerPage({ request = requestTracker }) {
  const [tracker, setTracker] = useState(null);
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [selectedNoteId, setSelectedNoteId] = useState(null);
  const [newClassName, setNewClassName] = useState("");
  const [renameValue, setRenameValue] = useState("");
  const [renaming, setRenaming] = useState(false);
  const [titleStatus, setTitleStatus] = useState("Saved");
  const [draftTitle, setDraftTitle] = useState("");
  const [draftBody, setDraftBody] = useState("");
  const [pendingDelete, setPendingDelete] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const classInput = useRef(null);
  const titleInput = useRef(null);

  useEffect(() => {
    const alreadyScoped = document.body.classList.contains("sakura");
    document.body.classList.add("sakura");
    return () => {
      if (!alreadyScoped) document.body.classList.remove("sakura");
    };
  }, []);

  const load = async () => {
    setError(null);
    try {
      const { tracker: loaded } = await request("/api/tracker/data");
      setTracker(loaded);
      setSelectedClassId((current) =>
        loaded.classes.some((entry) => entry.id === current) ? current : loaded.classes[0]?.id || null,
      );
    } catch (loadError) {
      setError(loadError.message || "The tracker could not be loaded.");
      setTracker((current) => current || { version: 1, classes: [] });
    }
  };

  useEffect(() => {
    load();
  }, []);

  const selectedClass = useMemo(
    () => tracker?.classes.find((entry) => entry.id === selectedClassId) || null,
    [tracker, selectedClassId],
  );
  const selectedNote = useMemo(
    () => selectedClass?.notes.find((entry) => entry.id === selectedNoteId) || null,
    [selectedClass, selectedNoteId],
  );
  const dirty = Boolean(
    selectedNote && (draftTitle !== selectedNote.title || draftBody !== selectedNote.body),
  );

  useEffect(() => {
    const first = selectedClass?.notes[0]?.id || null;
    if (!selectedClass?.notes.some((entry) => entry.id === selectedNoteId)) {
      setSelectedNoteId(first);
    }
  }, [selectedClass, selectedNoteId]);

  useEffect(() => {
    setDraftTitle(selectedNote?.title || "");
    setDraftBody(selectedNote?.body || "");
    setTitleStatus("Saved");
  }, [selectedNote?.id, selectedNote?.title, selectedNote?.body]);

  const mutate = async (action) => {
    if (busy) return null;
    setBusy(true);
    setError(null);
    try {
      const result = await request("/api/tracker/data", {
        method: "POST",
        body: JSON.stringify(action),
      });
      setTracker(result.tracker);
      if (Object.prototype.hasOwnProperty.call(result, "selectedClassId")) {
        setSelectedClassId(result.selectedClassId);
      }
      if (Object.prototype.hasOwnProperty.call(result, "selectedNoteId")) {
        setSelectedNoteId(result.selectedNoteId);
      }
      setBusy(false);
      return result;
    } catch (mutationError) {
      setError(mutationError.message || "That change could not be saved.");
      setBusy(false);
      return null;
    }
  };

  const createClass = async (event) => {
    event.preventDefault();
    const name = newClassName.trim();
    if (!name) return;
    const result = await mutate({ type: "create-class", name });
    if (result) {
      setNewClassName("");
      setRenaming(false);
    }
  };

  const beginRename = () => {
    if (!selectedClass) return;
    setRenameValue(selectedClass.name);
    setRenaming(true);
  };

  const renameClass = async (event) => {
    event.preventDefault();
    const name = renameValue.trim();
    if (!selectedClass || !name) return;
    const result = await mutate({ type: "rename-class", classId: selectedClass.id, name });
    if (result) setRenaming(false);
  };

  const createNote = async () => {
    if (!selectedClass) return;
    const result = await mutate({ type: "create-note", classId: selectedClass.id });
    if (result) requestAnimationFrame(() => titleInput.current?.select());
  };

  const saveNote = async () => {
    if (!selectedClass || !selectedNote || !draftTitle.trim() || !dirty) return;
    setTitleStatus("Saving");
    const result = await mutate({
      type: "update-note",
      classId: selectedClass.id,
      noteId: selectedNote.id,
      title: draftTitle,
      body: draftBody,
    });
    setTitleStatus(result ? "Saved" : "Save failed");
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    const action = pendingDelete.type === "class"
      ? { type: "delete-class", classId: pendingDelete.id }
      : { type: "delete-note", classId: selectedClass.id, noteId: pendingDelete.id };
    const result = await mutate(action);
    if (result) setPendingDelete(null);
  };

  if (!tracker) return <LoadingTracker />;

  return (
    <main className="tracker-page sakura">
      <div className="tracker-shell">
        <header className="tracker-header">
          <MonoLabel>Life tracker · private</MonoLabel>
          <Display>Classes & notes</Display>
          <p>Keep each class and every useful thought in one place. Changes are saved to your private account.</p>
        </header>

        {error && (
          <div className="tracker-error" role="alert">
            <span>{error}</span>
            <Button type="button" variant="ghost" size="sm" onClick={load}>Try again</Button>
          </div>
        )}

        <div className="tracker-workspace">
          <aside className="tracker-panel tracker-classes" aria-label="Classes">
            <div className="tracker-panel-head">
              <MonoLabel as="h2">Classes</MonoLabel>
              <span>{tracker.classes.length}</span>
            </div>
            <form className="tracker-create-class" onSubmit={createClass}>
              <Input
                ref={classInput}
                value={newClassName}
                onChange={(event) => setNewClassName(event.target.value)}
                maxLength={100}
                placeholder="Add a class"
                aria-label="Class name"
              />
              <Button
                type="submit"
                size="sm"
                disabled={!newClassName.trim() || dirty || busy}
                title={dirty ? "Save the open note before adding a class" : undefined}
              >
                Add
              </Button>
            </form>

            {tracker.classes.length === 0 ? (
              <EmptyPanel title="No classes yet">Add the first class to start its notes.</EmptyPanel>
            ) : (
              <div className="tracker-list" role="list">
                {tracker.classes.map((entry) => (
                  <button
                    key={entry.id}
                    type="button"
                    className="tracker-list-button"
                    data-active={entry.id === selectedClassId ? "true" : undefined}
                    disabled={dirty && entry.id !== selectedClassId}
                    title={dirty && entry.id !== selectedClassId ? "Save the open note before switching classes" : undefined}
                    onClick={() => {
                      setSelectedClassId(entry.id);
                      setRenaming(false);
                    }}
                  >
                    <span>{entry.name}</span>
                    <small>{entry.notes.length}</small>
                  </button>
                ))}
              </div>
            )}
          </aside>

          <section className="tracker-panel tracker-notes" aria-labelledby="tracker-notes-heading">
            <div className="tracker-panel-head tracker-class-heading">
              {selectedClass ? (
                renaming ? (
                  <form className="tracker-rename" onSubmit={renameClass}>
                    <Input
                      value={renameValue}
                      onChange={(event) => setRenameValue(event.target.value)}
                      maxLength={100}
                      aria-label="Rename class"
                      autoFocus
                    />
                    <Button type="submit" size="sm" disabled={!renameValue.trim() || busy}>Save</Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setRenaming(false)}>Cancel</Button>
                  </form>
                ) : (
                  <>
                    <h2 id="tracker-notes-heading">{selectedClass.name}</h2>
                    <div className="tracker-heading-actions">
                      <Button type="button" variant="ghost" size="sm" onClick={beginRename} disabled={dirty}>Rename</Button>
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        onClick={() => setPendingDelete({ type: "class", id: selectedClass.id, name: selectedClass.name })}
                      >
                        Delete
                      </Button>
                    </div>
                  </>
                )
              ) : (
                <MonoLabel as="h2" id="tracker-notes-heading">Notes</MonoLabel>
              )}
            </div>

            {!selectedClass ? (
              <EmptyPanel title="Choose a class">Select a class, or add one from the classes panel.</EmptyPanel>
            ) : (
              <>
                <Button type="button" size="sm" onClick={createNote} disabled={dirty || busy}>New note</Button>
                {selectedClass.notes.length === 0 ? (
                  <EmptyPanel
                    title="No notes yet"
                    action={<Button type="button" variant="ghost" size="sm" onClick={createNote}>Create a note</Button>}
                  >
                    Start with a lecture summary, assignment detail, or question for office hours.
                  </EmptyPanel>
                ) : (
                  <div className="tracker-list tracker-note-list" role="list">
                    {selectedClass.notes.map((note) => (
                      <button
                        key={note.id}
                        type="button"
                        className="tracker-list-button tracker-note-button"
                        data-active={note.id === selectedNoteId ? "true" : undefined}
                        disabled={dirty && note.id !== selectedNoteId}
                        title={dirty && note.id !== selectedNoteId ? "Save the open note before switching notes" : undefined}
                        onClick={() => setSelectedNoteId(note.id)}
                      >
                        <span>{note.title}</span>
                        <small>{dateLabel(note.updatedAt)}</small>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </section>

          <section className="tracker-panel tracker-editor" aria-labelledby="tracker-editor-heading">
            {selectedNote ? (
              <>
                <div className="tracker-panel-head tracker-editor-head">
                  <div>
                    <MonoLabel as="h2" id="tracker-editor-heading">Note editor</MonoLabel>
                    <span className="tracker-save-status" aria-live="polite">{dirty ? "Unsaved" : titleStatus}</span>
                  </div>
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={() => setPendingDelete({ type: "note", id: selectedNote.id, name: selectedNote.title })}
                  >
                    Delete note
                  </Button>
                </div>
                <div className="tracker-editor-fields">
                  <label>
                    <MonoLabel>Title</MonoLabel>
                    <Input
                      ref={titleInput}
                      value={draftTitle}
                      maxLength={160}
                      onChange={(event) => setDraftTitle(event.target.value)}
                      aria-invalid={!draftTitle.trim() || undefined}
                    />
                  </label>
                  <label className="tracker-body-field">
                    <MonoLabel>Notes</MonoLabel>
                    <Textarea
                      value={draftBody}
                      maxLength={100000}
                      onChange={(event) => setDraftBody(event.target.value)}
                      onKeyDown={(event) => {
                        if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
                          event.preventDefault();
                          saveNote();
                        }
                      }}
                      placeholder="Lecture notes, links, reminders, questions…"
                      aria-label="Note body"
                    />
                  </label>
                </div>
                <footer className="tracker-editor-footer">
                  <span>Last saved {dateLabel(selectedNote.updatedAt)}</span>
                  <Button type="button" onClick={saveNote} disabled={!dirty || !draftTitle.trim() || busy}>
                    {busy && titleStatus === "Saving" ? "Saving…" : "Save note"}
                  </Button>
                </footer>
              </>
            ) : (
              <EmptyPanel title="No note selected">Create or select a note to start writing.</EmptyPanel>
            )}
          </section>
        </div>
      </div>

      <Dialog open={Boolean(pendingDelete)} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Delete {pendingDelete?.type === "class" ? "class" : "note"}?
            </DialogTitle>
            <DialogDescription>
              {pendingDelete?.type === "class"
                ? `This permanently deletes "${pendingDelete.name}" and every note inside it.`
                : `This permanently deletes "${pendingDelete?.name}".`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost">Cancel</Button>
            </DialogClose>
            <Button type="button" variant="danger" onClick={confirmDelete} disabled={busy}>
              {busy ? "Deleting…" : pendingDelete?.type === "class" ? "Delete class" : "Delete note"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}

export default TrackerPage;
