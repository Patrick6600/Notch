function createId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `log_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function getHabitNotes(data, habitId) {
  return data.notes[habitId] ?? { general: "", logs: [] };
}

export function updateGeneralNote(data, habitId, text) {
  const current = getHabitNotes(data, habitId);
  return {
    ...data,
    notes: {
      ...data.notes,
      [habitId]: { ...current, general: text }
    }
  };
}

export function addLog(data, habitId, title, body) {
  const current = getHabitNotes(data, habitId);
  const newLog = {
    id: createId(),
    title: title.trim() || new Date().toLocaleDateString(),
    body,
    createdAt: new Date().toISOString()
  };
  return {
    ...data,
    notes: {
      ...data.notes,
      [habitId]: { ...current, logs: [newLog, ...current.logs] }
    }
  };
}

export function updateLog(data, habitId, logId, title, body) {
  const current = getHabitNotes(data, habitId);
  return {
    ...data,
    notes: {
      ...data.notes,
      [habitId]: {
        ...current,
        logs: current.logs.map((log) =>
          log.id === logId ? { ...log, title: title.trim() || log.title, body } : log
        )
      }
    }
  };
}

export function deleteLog(data, habitId, logId) {
  const current = getHabitNotes(data, habitId);
  return {
    ...data,
    notes: {
      ...data.notes,
      [habitId]: { ...current, logs: current.logs.filter((log) => log.id !== logId) }
    }
  };
}

export function getNotesForHabit(data, habitId) {
  return getHabitNotes(data, habitId);
}
