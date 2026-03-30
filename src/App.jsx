import React, { useMemo, useState } from "react";
import HabitDetails from "./components/HabitDetails";
import HabitList from "./components/HabitList";
import MonthCalendar from "./components/MonthCalendar";
import MonthNav from "./components/MonthNav";
import { getHabitCardStats, getTodayDayKeyLocal } from "./domain/stats";
import { useNotchData } from "./state/useNotchData";

export default function App() {
  const { data, actions } = useNotchData();
  const todayDayKey = getTodayDayKeyLocal();

  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonthIndex, setViewMonthIndex] = useState(today.getMonth());
  const selectedHabit = useMemo(
    () => data.habits.find((habit) => habit.id === data.selectedHabitId) ?? null,
    [data.habits, data.selectedHabitId]
  );
  const cardStatsByHabitId = useMemo(
    () =>
      data.habits.reduce((acc, habit) => {
        acc[habit.id] = getHabitCardStats(habit, data.completions, data.skips, todayDayKey);
        return acc;
      }, {}),
    [data.habits, data.completions, data.skips, todayDayKey]
  );

  function goToPrevMonth() {
    const prev = new Date(viewYear, viewMonthIndex - 1, 1);
    setViewYear(prev.getFullYear());
    setViewMonthIndex(prev.getMonth());
  }

  function goToNextMonth() {
    const next = new Date(viewYear, viewMonthIndex + 1, 1);
    setViewYear(next.getFullYear());
    setViewMonthIndex(next.getMonth());
  }

  function goToTodayMonth() {
    const now = new Date();
    setViewYear(now.getFullYear());
    setViewMonthIndex(now.getMonth());
  }

  return (
    <main className="app">
      <header className="app-header">
        <h1>Notch</h1>
      </header>

      <section className="layout-grid">
        {selectedHabit ? (
          <HabitDetails
            habit={selectedHabit}
            completions={data.completions}
            skips={data.skips}
            onUpdatePlanning={actions.updateHabitPlanning}
            onUpdateHabitName={actions.updateHabitName}
          />
        ) : (
          <aside className="panel side-placeholder">
            <h2>Habit Details</h2>
            <p className="muted">Select a habit card to see stats and skip tools.</p>
          </aside>
        )}

        <section className="content-grid">
          <HabitList
            habits={data.habits}
            selectedHabitId={data.selectedHabitId}
            cardStatsByHabitId={cardStatsByHabitId}
            onAddHabit={actions.addHabit}
            onSelectHabit={actions.selectHabit}
            onUpdateHabitColor={actions.updateHabitColor}
            onDeleteHabit={actions.deleteHabit}
          />

          <section className="panel calendar-panel">
            <MonthNav
              year={viewYear}
              monthIndex={viewMonthIndex}
              onPrev={goToPrevMonth}
              onNext={goToNextMonth}
              onToday={goToTodayMonth}
            />

            <MonthCalendar
              year={viewYear}
              monthIndex={viewMonthIndex}
              habits={data.habits}
              completions={data.completions}
              skips={data.skips}
              onSetDayStatus={actions.setDayStatus}
            />
          </section>
        </section>
      </section>
    </main>
  );
}
