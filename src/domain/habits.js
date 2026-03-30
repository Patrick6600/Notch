function createId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `habit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function sanitizeWeeklyTarget(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : 5;
}

function sanitizePlannedSkips(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed) : 0;
}

function getUsedSkipsByYear(skips, habitId) {
  const byYear = {};
  for (const dayKey of Object.keys(skips[habitId] ?? {})) {
    const year = dayKey.slice(0, 4);
    byYear[year] = (byYear[year] ?? 0) + 1;
  }
  return byYear;
}

export function addHabitWithPlanning(data, name, color, weeklyTarget, plannedSkipDaysPerYear) {
  const trimmed = name.trim();
  if (!trimmed) {
    return data;
  }

  const newHabit = {
    id: createId(),
    name: trimmed,
    color: color || "#2563eb",
    planning: {
      weeklyTarget: sanitizeWeeklyTarget(weeklyTarget),
      plannedSkipDaysPerYear: sanitizePlannedSkips(plannedSkipDaysPerYear)
    },
    createdAt: new Date().toISOString(),
    archived: false
  };

  return {
    ...data,
    habits: [...data.habits, newHabit],
    selectedHabitId: data.selectedHabitId ?? newHabit.id
  };
}

export function selectHabit(data, habitId) {
  return {
    ...data,
    selectedHabitId: habitId
  };
}

export function updateHabitColor(data, habitId, color) {
  return {
    ...data,
    habits: data.habits.map((habit) =>
      habit.id === habitId
        ? {
            ...habit,
            color: color || habit.color || "#2563eb"
          }
        : habit
    )
  };
}

export function updateHabitName(data, habitId, name) {
  const trimmed = name.trim();
  if (!trimmed) {
    return data;
  }

  return {
    ...data,
    habits: data.habits.map((habit) =>
      habit.id === habitId
        ? {
            ...habit,
            name: trimmed
          }
        : habit
    )
  };
}

export function updateHabitPlanning(data, habitId, weeklyTarget, plannedSkipDaysPerYear) {
  const nextWeeklyTarget = sanitizeWeeklyTarget(weeklyTarget);
  const nextPlannedSkips = sanitizePlannedSkips(plannedSkipDaysPerYear);

  const usedByYear = getUsedSkipsByYear(data.skips, habitId);
  const maxUsed = Object.values(usedByYear).reduce((max, value) => Math.max(max, value), 0);
  if (nextPlannedSkips < maxUsed) {
    return data;
  }

  return {
    ...data,
    habits: data.habits.map((habit) =>
      habit.id === habitId
        ? {
            ...habit,
            planning: {
              weeklyTarget: nextWeeklyTarget,
              plannedSkipDaysPerYear: nextPlannedSkips
            }
          }
        : habit
    )
  };
}

export function deleteHabit(data, habitId) {
  const remainingHabits = data.habits.filter((habit) => habit.id !== habitId);
  const nextCompletions = { ...data.completions };
  const nextSkips = { ...data.skips };
  delete nextCompletions[habitId];
  delete nextSkips[habitId];

  const selectedHabitId =
    data.selectedHabitId === habitId ? (remainingHabits[0]?.id ?? null) : data.selectedHabitId;

  return {
    ...data,
    habits: remainingHabits,
    selectedHabitId,
    completions: nextCompletions,
    skips: nextSkips
  };
}
