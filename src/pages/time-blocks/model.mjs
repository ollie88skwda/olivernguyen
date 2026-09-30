export const HOUR_MS = 60 * 60 * 1000;
export const DEFAULT_START_TIME = "07:00";
export const emptySchedule = () => ({ startTime: DEFAULT_START_TIME, activities: [] });
export const emptyTimeBlocks = () => ({ version: 1, schedule: emptySchedule(), run: null });

function fail(status, message) {
  const error = new Error(message);
  error.status = status;
  throw error;
}

function cleanTime(value) {
  if (typeof value !== "string" || !/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) {
    fail(400, "Choose a valid preferred start time.");
  }
  return value;
}

export function normalizeSchedule(value) {
  if (!value || typeof value !== "object" || !Array.isArray(value.activities)) {
    fail(400, "A schedule with at least one activity is required.");
  }
  if (value.activities.length < 1 || value.activities.length > 24) {
    fail(400, "Add between one and 24 activities.");
  }

  const startTime = cleanTime(value.startTime);
  const activities = value.activities.map((activity) => {
    const name = typeof activity?.name === "string" ? activity.name.trim() : "";
    const hours = Number(activity?.hours);
    if (!name) fail(400, "Every activity needs a name.");
    if (name.length > 60) fail(400, "Activity names must be 60 characters or fewer.");
    if (!Number.isInteger(hours) || hours < 1 || hours > 24) {
      fail(400, "Each activity needs a whole number of hours from 1 to 24.");
    }
    return { id: crypto.randomUUID(), name, hours };
  });

  const totalHours = activities.reduce((total, activity) => total + activity.hours, 0);
  const [startHour, startMinute] = startTime.split(":").map(Number);
  if (totalHours >= 24 || startHour * 60 + startMinute + totalHours * 60 >= 24 * 60) {
    fail(400, "This plan would extend past midnight. Reduce its hours or choose an earlier start.");
  }
  return { startTime, activities };
}

export function normalizeTimeBlocks(value) {
  if (!value || value.version !== 1 || !value.schedule || !Array.isArray(value.schedule.activities)) {
    fail(500, "Saved time-block data is invalid.");
  }
  return value;
}

export function applyTimeBlocksAction(document, action, now = new Date()) {
  const next = structuredClone(normalizeTimeBlocks(document));
  if (!action || typeof action.type !== "string") fail(400, "Choose an action.");
  const nowDate = new Date(now);
  const nowIso = nowDate.toISOString();

  switch (action.type) {
    case "save-schedule": {
      next.schedule = normalizeSchedule(action.schedule);
      next.updatedAt = nowIso;
      return next;
    }
    case "start-run": {
      if (!next.schedule.activities.length) fail(400, "Add activities before starting today’s plan.");
      if (next.run && next.run.status !== "complete") {
        fail(409, "Finish or skip the previous run before starting a new one.");
      }
      const requestedTimeZone = typeof action.timeZone === "string" ? action.timeZone : "UTC";
      let dateKey;
      try {
        const parts = new Intl.DateTimeFormat("en-CA", {
          timeZone: requestedTimeZone,
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }).formatToParts(nowDate);
        dateKey = `${parts.find((part) => part.type === "year").value}-${parts.find((part) => part.type === "month").value}-${parts.find((part) => part.type === "day").value}`;
      } catch {
        fail(400, "Choose a valid device time zone before starting the plan.");
      }
      if (next.run?.dateKey === dateKey) fail(409, "Today’s plan has already been started.");
      const firstStartedAt = nowDate.getTime();
      const slots = next.schedule.activities.flatMap((activity) =>
        Array.from({ length: activity.hours }, (_, index) => ({
          id: crypto.randomUUID(),
          activityId: activity.id,
          activityName: activity.name,
          activityHour: index + 1,
          activityHours: activity.hours,
          status: "pending",
          plannedStartAt: new Date(firstStartedAt + slotsOffset(next.schedule.activities, activity, index) * HOUR_MS).toISOString(),
          startedAt: null,
          endsAt: null,
          completedAt: null,
        })),
      );
      const first = slots[0];
      first.status = "active";
      first.startedAt = nowIso;
      first.endsAt = new Date(firstStartedAt + HOUR_MS).toISOString();
      next.run = {
        id: crypto.randomUUID(),
        dateKey,
        timeZone: requestedTimeZone.slice(0, 80),
        scheduleSnapshot: structuredClone(next.schedule),
        slots,
        activeSessionId: first.id,
        status: "active",
        createdAt: nowIso,
        completedAt: null,
      };
      next.updatedAt = nowIso;
      return next;
    }
    case "start-session": {
      const run = requireRun(next);
      const session = findSession(run, action.sessionId);
      if (session.status === "active") return next;
      if (run.activeSessionId) fail(409, "Finish or skip the active hour first.");
      const nextPending = run.slots.find((slot) => slot.status === "pending");
      if (!nextPending || nextPending.id !== session.id) fail(409, "This is not the next scheduled hour.");
      requireSessionDue(session, nowDate);
      session.status = "active";
      session.startedAt = nowIso;
      session.endsAt = new Date(nowDate.getTime() + HOUR_MS).toISOString();
      let forecastAt = nowDate.getTime();
      for (const slot of run.slots) {
        if (slot.id === session.id || slot.status === "pending") {
          slot.plannedStartAt = new Date(forecastAt).toISOString();
          forecastAt += HOUR_MS;
        }
      }
      run.activeSessionId = session.id;
      run.status = "active";
      next.updatedAt = nowIso;
      return next;
    }
    case "confirm-session":
    case "skip-session": {
      const run = requireRun(next);
      const session = findSession(run, action.sessionId);
      if (session.status === "completed" || session.status === "skipped") return next;
      const isActive = session.id === run.activeSessionId && session.status === "active";
      const isNextDue = action.type === "skip-session"
        && !run.activeSessionId
        && session.status === "pending"
        && currentSession(run)?.id === session.id;
      if (!isActive && !isNextDue) fail(409, "This hour is no longer active.");
      if (isNextDue) requireSessionDue(session, nowDate);
      if (action.type === "confirm-session" && nowDate.getTime() < Date.parse(session.endsAt)) {
        fail(409, "This hour is not over yet. Keep focusing until the timer ends.");
      }
      session.status = action.type === "confirm-session" ? "completed" : "skipped";
      session.completedAt = action.type === "confirm-session" ? nowIso : null;
      run.activeSessionId = null;
      const unfinished = run.slots.some((slot) => slot.status === "pending" || slot.status === "active");
      if (!unfinished) {
        run.status = "complete";
        run.completedAt = nowIso;
      } else {
        run.status = "waiting";
      }
      next.updatedAt = nowIso;
      return next;
    }
    default:
      fail(400, "That time-block action is not supported.");
  }
}

function slotsOffset(activities, current, index) {
  let offset = index;
  for (const activity of activities) {
    if (activity.id === current.id) break;
    offset += activity.hours;
  }
  return offset;
}

function requireRun(document) {
  if (!document.run) fail(409, "Start today’s plan before beginning a focus hour.");
  return document.run;
}

function requireSessionDue(session, now) {
  const plannedStart = Date.parse(session.plannedStartAt);
  if (!Number.isFinite(plannedStart)) fail(500, "Saved time-block timing is invalid.");
  if (now.getTime() < plannedStart) fail(409, "This hour is not due yet.");
}

function findSession(run, sessionId) {
  if (typeof sessionId !== "string") fail(400, "Choose a scheduled hour.");
  const session = run.slots.find((slot) => slot.id === sessionId);
  if (!session) fail(404, "That scheduled hour was not found.");
  return session;
}

export function currentSession(run) {
  if (!run) return null;
  return run.slots.find((slot) => slot.id === run.activeSessionId)
    || run.slots.find((slot) => slot.status === "pending")
    || null;
}

export function focusState(run, now = Date.now()) {
  if (!run) return "not-started";
  if (run.status === "complete") return "complete";
  const session = currentSession(run);
  if (!session) return "complete";
  if (session.status === "pending") {
    const plannedStart = Date.parse(session.plannedStartAt);
    return now < plannedStart ? "scheduled" : "due";
  }
  return now >= Date.parse(session.endsAt) ? "awaiting-confirmation" : "active";
}
