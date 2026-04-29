import { EMPTY_DATA, STORAGE_KEY } from "../domain/types";
import { normalizeHabit } from "../domain/stats";

export function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return EMPTY_DATA;
    }

    const parsed = JSON.parse(raw);

    const rawHabits = Array.isArray(parsed.habits) ? parsed.habits : EMPTY_DATA.habits;
    const habits = rawHabits.map((habit) => normalizeHabit(habit));
    const selectedHabitId =
      typeof parsed.selectedHabitId === "string" &&
      habits.some((habit) => habit.id === parsed.selectedHabitId)
        ? parsed.selectedHabitId
        : habits[0]?.id ?? null;

    return {
      habits,
      selectedHabitId,
      completions: parsed.completions && typeof parsed.completions === "object" ? parsed.completions : {},
      skips: parsed.skips && typeof parsed.skips === "object" ? parsed.skips : {},
      notes: parsed.notes && typeof parsed.notes === "object" ? parsed.notes : {}
    };
  } catch {
    return EMPTY_DATA;
  }
}

export function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
