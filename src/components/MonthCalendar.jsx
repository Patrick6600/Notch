import React, { useEffect, useMemo, useRef, useState } from "react";
import { getMonthGrid } from "../domain/dayKey";
import { getPlanningSummary } from "../domain/stats";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getUsedSkipsForYear(skips, habitId, year) {
  const dayMap = skips[habitId] ?? {};
  return Object.keys(dayMap).filter((dayKey) => dayKey.startsWith(`${year}-`)).length;
}

export default function MonthCalendar({
  year,
  monthIndex,
  habits,
  completions,
  skips,
  onSetDayStatus
}) {
  const cells = getMonthGrid(year, monthIndex);
  const activeHabits = useMemo(() => habits.filter((habit) => !habit.archived), [habits]);
  const [openDayKey, setOpenDayKey] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    function onPointerDown(event) {
      if (!menuRef.current) {
        return;
      }

      if (!menuRef.current.contains(event.target)) {
        setOpenDayKey(null);
      }
    }

    function onKeyDown(event) {
      if (event.key === "Escape") {
        setOpenDayKey(null);
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  function getDayHabitDots(dayKey) {
    return activeHabits.filter((habit) => Boolean(completions[habit.id]?.[dayKey]));
  }

  return (
    <section>
      <div className="weekdays">
        {WEEKDAYS.map((weekday) => (
          <div key={weekday} className="weekday">
            {weekday}
          </div>
        ))}
      </div>

      <div className="calendar-grid">
        {cells.map((cell, index) => {
          if (!cell) {
            return <div key={`empty_${index}`} className="day-cell empty" />;
          }

          const dayDots = getDayHabitDots(cell.dayKey);
          const isMenuOpen = openDayKey === cell.dayKey;

          return (
            <div key={cell.dayKey} className="day-wrapper">
              <button
                type="button"
                className="day-cell"
                onClick={() => setOpenDayKey((prev) => (prev === cell.dayKey ? null : cell.dayKey))}
                title={cell.dayKey}
              >
                <span>{cell.day}</span>
                <span className="day-dots" aria-hidden="true">
                  {dayDots.map((habit) => (
                    <span
                      key={habit.id}
                      className="day-dot"
                      style={{ backgroundColor: habit.color || "#2563eb" }}
                    />
                  ))}
                </span>
              </button>

              {isMenuOpen ? (
                <div className="day-menu" ref={menuRef}>
                  <p className="day-menu-title">{cell.dayKey}</p>
                  {activeHabits.length === 0 ? (
                    <p className="muted">No habits yet.</p>
                  ) : (
                    <ul className="day-menu-list">
                      {activeHabits.map((habit) => {
                        const completed = Boolean(completions[habit.id]?.[cell.dayKey]);
                        const skipped = Boolean(skips[habit.id]?.[cell.dayKey]);
                        const planning = getPlanningSummary(habit);
                        const used = getUsedSkipsForYear(skips, habit.id, cell.dayKey.slice(0, 4));
                        const skipBudgetExhausted = !skipped && used >= planning.plannedSkipDaysPerYear;
                        return (
                          <li key={habit.id}>
                            <div className="day-menu-item">
                              <span
                                className="habit-color-chip small"
                                style={{ backgroundColor: habit.color || "#2563eb" }}
                              />
                              <span>{habit.name}</span>
                              <div className="day-menu-actions">
                                <label>
                                  <input
                                    type="checkbox"
                                    checked={completed}
                                    onChange={(event) =>
                                      onSetDayStatus(
                                        habit.id,
                                        cell.dayKey,
                                        event.target.checked ? "completed" : "none"
                                      )
                                    }
                                  />
                                  Done
                                </label>
                                <label>
                                  <input
                                    type="checkbox"
                                    checked={skipped}
                                    disabled={skipBudgetExhausted}
                                    onChange={(event) =>
                                      onSetDayStatus(
                                        habit.id,
                                        cell.dayKey,
                                        event.target.checked ? "skipped" : "none"
                                      )
                                    }
                                  />
                                  Skip
                                </label>
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
