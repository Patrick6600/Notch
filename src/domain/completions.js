function getUsedSkipsForYear(skips, habitId, year) {
  const dayMap = skips[habitId] ?? {};
  return Object.keys(dayMap).filter((dayKey) => dayKey.startsWith(`${year}-`)).length;
}

function getHabitById(data, habitId) {
  return data.habits.find((habit) => habit.id === habitId) ?? null;
}

function getPlannedSkipDaysPerYear(habit) {
  const value = Number(habit?.planning?.plannedSkipDaysPerYear ?? 0);
  return Number.isFinite(value) && value >= 0 ? Math.round(value) : 0;
}

export function setDayStatus(data, habitId, dayKey, status) {
  if (!habitId || !dayKey) {
    return data;
  }

  const habit = getHabitById(data, habitId);
  if (!habit) {
    return data;
  }

  const nextCompletionsByHabit = { ...(data.completions[habitId] ?? {}) };
  const nextSkipsByHabit = { ...(data.skips[habitId] ?? {}) };

  if (status === "completed") {
    nextCompletionsByHabit[dayKey] = true;
    delete nextSkipsByHabit[dayKey];
  } else if (status === "skipped") {
    const year = dayKey.slice(0, 4);
    const alreadySkipped = Boolean(nextSkipsByHabit[dayKey]);
    const plannedBudget = getPlannedSkipDaysPerYear(habit);
    const usedSkips = getUsedSkipsForYear(data.skips, habitId, year);

    if (!alreadySkipped && usedSkips >= plannedBudget) {
      return data;
    }

    nextSkipsByHabit[dayKey] = true;
    delete nextCompletionsByHabit[dayKey];
  } else {
    delete nextCompletionsByHabit[dayKey];
    delete nextSkipsByHabit[dayKey];
  }

  return {
    ...data,
    completions: {
      ...data.completions,
      [habitId]: nextCompletionsByHabit
    },
    skips: {
      ...data.skips,
      [habitId]: nextSkipsByHabit
    }
  };
}
