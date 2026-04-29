import React, { useMemo, useState } from "react";
import { formatCount } from "../domain/stats";

const PRESET_COLORS = ["#2563eb", "#16a34a", "#dc2626", "#d97706", "#7c3aed", "#0f766e"];

export default function HabitList({
  habits,
  selectedHabitId,
  cardStatsByHabitId,
  onAddHabit,
  onSelectHabit,
  onUpdateHabitColor,
  onDeleteHabit
}) {
  const [name, setName] = useState("");
  const [presetColor, setPresetColor] = useState(PRESET_COLORS[0]);
  const [customColor, setCustomColor] = useState(PRESET_COLORS[0]);
  const [weeklyTarget, setWeeklyTarget] = useState("5");
  const [plannedSkipDaysPerYear, setPlannedSkipDaysPerYear] = useState("0");

  const activeHabits = useMemo(() => habits.filter((habit) => !habit.archived), [habits]);

  function handleSubmit(event) {
    event.preventDefault();
    onAddHabit(name, customColor || presetColor, weeklyTarget, plannedSkipDaysPerYear);
    setName("");
  }

  function handlePresetPick(color) {
    setPresetColor(color);
    setCustomColor(color);
  }

  function handleDeleteHabit(habit) {
    const confirmed = window.confirm(`Delete "${habit.name}" and its completions?`);
    if (!confirmed) {
      return;
    }

    onDeleteHabit(habit.id);
  }

  return (
    <>
      <section className="panel create-panel">
        <h2>Create Habit</h2>

        <form className="habit-form-stack" onSubmit={handleSubmit}>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Habit name"
            maxLength={64}
            aria-label="Habit name"
          />

          <div className="color-row">
            <div className="swatches" role="list" aria-label="Preset colors">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={presetColor === color ? "swatch active" : "swatch"}
                  style={{ backgroundColor: color }}
                  onClick={() => handlePresetPick(color)}
                  aria-label={`Choose color ${color}`}
                />
              ))}
            </div>
            <label className="color-picker-label">
              Custom
              <input
                type="color"
                value={customColor}
                onChange={(event) => setCustomColor(event.target.value)}
                aria-label="Custom habit color"
              />
            </label>
          </div>

          <label className="inline-field">
            Weekly target
            <input
              type="number"
              min="1"
              step="1"
              value={weeklyTarget}
              onChange={(event) => setWeeklyTarget(event.target.value)}
              onBlur={() => setWeeklyTarget(String(Math.max(1, Math.round(Number(weeklyTarget) || 1))))}
            />
          </label>

          <label className="inline-field">
            Planned skip days/year
            <input
              type="number"
              min="0"
              step="1"
              value={plannedSkipDaysPerYear}
              onChange={(event) => setPlannedSkipDaysPerYear(event.target.value)}
              onBlur={() => setPlannedSkipDaysPerYear(String(Math.max(0, Math.round(Number(plannedSkipDaysPerYear) || 0))))}
            />
          </label>

          <button type="submit">Add Habit</button>
        </form>
      </section>

      <section className="panel habits-panel">
        <h2>Habits</h2>
        {activeHabits.length === 0 ? (
          <p className="muted">Create your first habit to start tracking.</p>
        ) : (
          <ul className="habit-cards">
            {activeHabits.map((habit) => (
              <li
                key={habit.id}
                className={habit.id === selectedHabitId ? "habit-card selected" : "habit-card"}
                onClick={() => onSelectHabit(habit.id)}
              >
                <div className="habit-card-header">
                  <label
                    className="habit-color-trigger"
                    onClick={(event) => event.stopPropagation()}
                    aria-label={`Change color for ${habit.name}`}
                  >
                    <span
                      className="habit-color-chip interactive"
                      style={{ backgroundColor: habit.color }}
                    />
                    <input
                      className="visually-hidden-color-input"
                      type="color"
                      value={habit.color || "#2563eb"}
                      onChange={(event) => onUpdateHabitColor(habit.id, event.target.value)}
                    />
                  </label>
                  <h3>{habit.name}</h3>
                </div>
                <div className="habit-card-controls">
                  <button
                    type="button"
                    className="danger-btn"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleDeleteHabit(habit);
                    }}
                  >
                    Delete
                  </button>
                </div>
                <p className="muted">
                  This week: {cardStatsByHabitId[habit.id]?.thisWeek.completed ?? 0}/
                  {formatCount(cardStatsByHabitId[habit.id]?.thisWeek.expected ?? 0)}
                </p>
                <p className="muted">
                  This year: {cardStatsByHabitId[habit.id]?.thisYear.completed ?? 0}/
                  {formatCount(cardStatsByHabitId[habit.id]?.thisYear.expected ?? 0)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
