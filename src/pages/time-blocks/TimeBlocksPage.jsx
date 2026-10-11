import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

import { apiFetch } from "@/auth/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Display, MonoLabel } from "@/components/brand";
import {
  elapsedMilliseconds,
  emptySchedule,
  normalizeSchedule,
} from "./model.mjs";
import "./time-blocks.css";

const requestTimeBlocks = (path, options) => apiFetch(path, options);

function formatClock(value) {
  return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

function formatDue(value) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
  }).format(new Date(value));
}

function formatElapsed(milliseconds) {
  const seconds = Math.floor(Math.max(0, milliseconds) / 1000);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

function projectedEnd(schedule) {
  const total = schedule.activities.reduce((sum, item) => sum + Number(item.hours || 0), 0);
  const [hour, minute] = schedule.startTime.split(":").map(Number);
  const result = new Date();
  result.setHours(hour, minute + total * 60, 0, 0);
  return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(result);
}

function scheduleError(schedule) {
  try {
    normalizeSchedule(schedule);
    return null;
  } catch (error) {
    return error.message;
  }
}

function scheduleMatches(left, right) {
  return left?.startTime === right?.startTime
    && left?.activities?.length === right?.activities?.length
    && left.activities.every((activity, index) =>
      activity.name === right.activities[index]?.name
      && Number(activity.hours) === Number(right.activities[index]?.hours));
}

function LoadingState() {
  return (
    <main className="time-blocks-page sakura" aria-busy="true" aria-label="Loading time blocks">
      <div className="time-blocks-shell">
        <MonoLabel>Private · owner only</MonoLabel>
        <div className="time-blocks-loading" />
        <div className="time-blocks-loading" />
      </div>
    </main>
  );
}

export function TimeBlocksPage({ request = requestTimeBlocks }) {
  const [timeBlocks, setTimeBlocks] = useState(null);
  const [draft, setDraft] = useState(emptySchedule);
  const [now, setNow] = useState(Date.now());
  const [pendingAction, setPendingAction] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editing, setEditing] = useState(false);
  const validationRef = useRef(null);
  const busy = Boolean(pendingAction);

  const load = useCallback(async () => {
    setError("");
    try {
      const result = await request("/api/time-blocks");
      setTimeBlocks(result.timeBlocks);
      setDraft(structuredClone(result.timeBlocks.schedule));
    } catch (loadError) {
      setError(loadError.message || "Your schedule could not be loaded.");
    }
  }, [request]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const interval = window.setInterval(tick, 1000);
    if (timeBlocks?.run) window.addEventListener("focus", tick);
    globalThis.document.addEventListener("visibilitychange", tick);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", tick);
      globalThis.document.removeEventListener("visibilitychange", tick);
    };
  }, [timeBlocks?.run?.id]);

  const mutate = async (action, successMessage) => {
    if (busy) return false;
    setPendingAction(action.type);
    setError("");
    setNotice("");
    try {
      const result = await request("/api/time-blocks", {
        method: "POST",
        body: JSON.stringify(action),
      });
      setTimeBlocks(result.timeBlocks);
      if (action.type === "save-schedule") setDraft(structuredClone(result.timeBlocks.schedule));
      if (action.type === "start-run" || action.type === "toggle-session") setNow(Date.now());
      if (successMessage) setNotice(successMessage);
      return true;
    } catch (mutationError) {
      setError(mutationError.message || "That change could not be saved. Try again.");
      return false;
    } finally {
      setPendingAction("");
    }
  };

  const run = timeBlocks?.run || null;
  const totalHours = draft.activities.reduce((sum, item) => sum + Number(item.hours || 0), 0);
  const resolvedCount = run?.slots.filter((slot) => slot.status === "completed" || slot.status === "skipped").length || 0;
  const completedCount = run?.slots.filter((slot) => slot.status === "completed").length || 0;
  const validationError = scheduleError(draft);
  const scheduleDirty = Boolean(timeBlocks && !scheduleMatches(timeBlocks.schedule, draft));
  const localDate = new Intl.DateTimeFormat("en-CA").format(new Date());
  const alreadyStartedToday = run?.dateKey === localDate;
  const preferredStart = new Date(now);
  const [preferredHour, preferredMinute] = draft.startTime.split(":").map(Number);
  preferredStart.setHours(preferredHour, preferredMinute, 0, 0);
  const firstHourDue = !run && !alreadyStartedToday && !validationError && now >= preferredStart.getTime();
  const showingRun = Boolean(run && !editing);

  useEffect(() => {
    if (!scheduleDirty) return undefined;
    const warnBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = "";
      return "";
    };
    window.addEventListener("beforeunload", warnBeforeUnload);
    return () => window.removeEventListener("beforeunload", warnBeforeUnload);
  }, [scheduleDirty]);

  useLayoutEffect(() => {
    if (showingRun) window.scrollTo(0, 0);
  }, [showingRun]);

  const updateActivity = (id, field, value) => {
    setDraft((current) => ({
      ...current,
      activities: current.activities.map((activity) => activity.id === id
        ? { ...activity, [field]: value }
        : activity),
    }));
  };

  const addActivity = () => {
    setDraft((current) => ({
      ...current,
      activities: [...current.activities, { id: crypto.randomUUID(), name: "", hours: 1 }],
    }));
  };

  const moveActivity = (index, offset) => {
    setDraft((current) => {
      const target = index + offset;
      if (target < 0 || target >= current.activities.length) return current;
      const activities = [...current.activities];
      [activities[index], activities[target]] = [activities[target], activities[index]];
      return { ...current, activities };
    });
  };

  if (!timeBlocks) {
    if (!error) return <LoadingState />;
    return (
      <main className="time-blocks-page sakura">
        <div className="time-blocks-shell">
          <MonoLabel>Private · owner only</MonoLabel>
          <Display>Time blocks</Display>
          <div className="time-blocks-error" role="alert">
            <p>{error}</p>
            <Button variant="ghost" type="button" onClick={load}>Try again</Button>
          </div>
        </div>
      </main>
    );
  }

  const saveSchedule = () => {
    if (validationError) {
      validationRef.current?.focus();
      return;
    }
    mutate({ type: "save-schedule", schedule: draft }, "Schedule saved for your next run.");
  };
  const leaveEditor = () => {
    if (scheduleDirty && !window.confirm("Discard your unsaved schedule changes?")) return;
    setDraft(structuredClone(timeBlocks.schedule));
    setEditing(false);
  };
  const startRun = () => mutate({
    type: "start-run",
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
  });
  const toggleSession = (slot) => mutate({ type: "toggle-session", sessionId: slot.id });
  const skipSession = (slot) => mutate({ type: "skip-session", sessionId: slot.id }, "Time block skipped.");

  return (
    <main className="time-blocks-page sakura">
      <div className="time-blocks-shell">
        <header className="time-blocks-header">
          <MonoLabel>Private · owner only</MonoLabel>
          <Display>Time blocks</Display>
          <p>Tap each scheduled block to start its timer, then tap again when you finish.</p>
        </header>

        {error && (
          <div className="time-blocks-error" role="alert">
            <p>{error}</p>
            <Button variant="ghost" type="button" onClick={load}>Try again</Button>
          </div>
        )}
        {notice && <p className="time-blocks-saved" role="status">{notice}</p>}
        {firstHourDue && !editing && (
          <div className="time-blocks-alert" role="status" aria-live="polite">
            <strong>First focus hour is due · {draft.startTime}</strong>
            <span>Start today’s plan when you’re ready. Each timer starts when you tap its block.</span>
          </div>
        )}

        {run && !editing ? (
          <Card className="time-blocks-card">
            <CardHeader>
              <MonoLabel>{run.status === "complete" ? "Today · complete" : "Today · private timers"}</MonoLabel>
              <CardTitle as="h2">{run.status === "complete" ? "Plan complete" : "Your time blocks"}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="time-blocks-copy">Tap a due block to start its timer. Tap it again to finish. Each timer is saved independently.</p>
              <div className="time-blocks-progress-copy">{resolvedCount} of {run.slots.length} blocks resolved · {completedCount} finished</div>
              <div className="time-blocks-activities">
                {run.slots.map((slot) => {
                  const started = slot.status === "active";
                  const planned = Date.parse(slot.plannedStartAt);
                  const due = now >= planned;
                  const elapsed = elapsedMilliseconds(slot, now);
                  return (
                    <div className="time-blocks-activity" key={slot.id}>
                      <div className="time-blocks-session-label">
                        {slot.activityName} · hour {slot.activityHour} of {slot.activityHours}
                      </div>
                      <p className="time-blocks-time">
                        {started ? `Started ${formatClock(slot.startedAt)}` : `Planned ${formatDue(slot.plannedStartAt)}`}
                        {slot.status === "completed" && slot.completedAt ? ` · finished ${formatClock(slot.completedAt)}` : ""}
                        {slot.status === "skipped" ? " · skipped" : ""}
                      </p>
                      {(started || slot.status === "completed") && (
                        <div className="time-blocks-timer" aria-label={`${formatElapsed(elapsed)} elapsed`}>{formatElapsed(elapsed)}</div>
                      )}
                      {slot.status === "pending" || started ? (
                        <div className="time-blocks-actions">
                          <Button type="button" disabled={busy || (!started && !due)} onClick={() => toggleSession(slot)}>
                            {started ? "Finish timer" : due ? "Start timer" : "Not due yet"}
                          </Button>
                          {slot.status === "pending" && due && (
                            <Button variant="ghost" type="button" disabled={busy} onClick={() => skipSession(slot)}>Skip block</Button>
                          )}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
              <Button variant="ghost" type="button" disabled={busy} onClick={() => setEditing(true)}>
                {run.status === "complete" ? "Edit tomorrow’s schedule" : "Edit next schedule"}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="time-blocks-card">
            <CardHeader>
              <MonoLabel>One reusable daily template</MonoLabel>
              <CardTitle as="h2">Your schedule</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="time-blocks-copy">An activity can span several focused hours. Each hour stays a separate session.</p>
              <div className="time-blocks-field">
                <label htmlFor="time-block-start">Preferred first-hour start</label>
                <Input
                  id="time-block-start"
                  name="preferredStartTime"
                  type="time"
                  autoComplete="off"
                  value={draft.startTime}
                  disabled={busy}
                  aria-invalid={Boolean(validationError)}
                  aria-describedby={validationError ? "time-blocks-validation" : undefined}
                  onChange={(event) => setDraft((current) => ({ ...current, startTime: event.target.value }))}
                />
              </div>
              <div className="time-blocks-activities">
                {draft.activities.length === 0 && <p className="time-blocks-empty">Add an activity to begin your daily plan.</p>}
                {draft.activities.map((activity, index) => (
                  <div className="time-blocks-activity" key={activity.id}>
                    <div className="time-blocks-activity-fields">
                      <div className="time-blocks-field">
                        <label htmlFor={`activity-name-${activity.id}`}>Activity {index + 1}</label>
                        <Input
                          id={`activity-name-${activity.id}`}
                          name={`activities[${index}].name`}
                          value={activity.name}
                          maxLength={60}
                          autoComplete="off"
                          disabled={busy}
                          placeholder="For example, School…"
                          aria-invalid={Boolean(validationError)}
                          aria-describedby={validationError ? "time-blocks-validation" : undefined}
                          onChange={(event) => updateActivity(activity.id, "name", event.target.value)}
                        />
                      </div>
                      <div className="time-blocks-field">
                        <label htmlFor={`activity-hours-${activity.id}`}>Hours</label>
                        <Input
                          id={`activity-hours-${activity.id}`}
                          name={`activities[${index}].hours`}
                          type="number"
                          min="1"
                          max="24"
                          step="1"
                          value={activity.hours}
                          autoComplete="off"
                          disabled={busy}
                          aria-label={`Activity ${index + 1} hours`}
                          aria-invalid={Boolean(validationError)}
                          aria-describedby={validationError ? "time-blocks-validation" : undefined}
                          onChange={(event) => updateActivity(activity.id, "hours", event.target.value)}
                        />
                      </div>
                    </div>
                    <div className="time-blocks-row-actions">
                      <Button variant="ghost" size="sm" type="button" disabled={index === 0 || busy} onClick={() => moveActivity(index, -1)}>Move up</Button>
                      <Button variant="ghost" size="sm" type="button" disabled={index === draft.activities.length - 1 || busy} onClick={() => moveActivity(index, 1)}>Move down</Button>
                      <Button variant="ghost" size="sm" type="button" disabled={busy} onClick={() => setDraft((current) => ({ ...current, activities: current.activities.filter((item) => item.id !== activity.id) }))}>Remove</Button>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="ghost" type="button" disabled={busy || draft.activities.length >= 24} onClick={addActivity}>Add activity</Button>
              <div className="time-blocks-summary">
                <div><MonoLabel>Plan total</MonoLabel><strong>{totalHours} {totalHours === 1 ? "hour" : "hours"}</strong><span>{totalHours} separate focus sessions</span></div>
                <div><MonoLabel>Estimated end</MonoLabel><strong>{validationError ? "—" : projectedEnd(draft)}</strong></div>
              </div>
              {validationError && (
                <p
                  id="time-blocks-validation"
                  className="time-blocks-validation"
                  role="alert"
                  tabIndex="-1"
                  ref={validationRef}
                >
                  {validationError}
                </p>
              )}
              <div className="time-blocks-actions">
                <Button type="button" disabled={busy} onClick={saveSchedule}>{pendingAction === "save-schedule" ? "Saving…" : "Save schedule"}</Button>
                {run && <Button variant="ghost" type="button" disabled={busy} onClick={leaveEditor}>Back to current run</Button>}
                {(!run || (run.status === "complete" && !alreadyStartedToday)) && (
                  <Button variant="ghost" type="button" disabled={busy || Boolean(validationError) || scheduleDirty || alreadyStartedToday} onClick={startRun}>Start today’s plan</Button>
                )}
                {scheduleDirty && <p className="time-blocks-footnote">Save your schedule before starting the run.</p>}
              </div>
              {!run && <p className="time-blocks-footnote">The preferred time is a reminder, not an automatic start. Starting the plan late does not move its planned blocks.</p>}
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}

export default TimeBlocksPage;
