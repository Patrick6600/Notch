import React, { useEffect, useMemo, useState } from "react";
import { formatCount, formatPercent, getHabitDetailsStats, getPlanningSummary } from "../domain/stats";
import { getTodayDayKey } from "../domain/dayKey";

function getProgressPercent(completed, expected) {
  if (!expected || expected <= 0) {
    return 0;
  }
  return Math.min(100, (completed / expected) * 100);
}

export default function HabitDetails({
  habit,
  completions,
  skips,
  onUpdatePlanning,
  onUpdateHabitName
}) {
  const todayDayKey = getTodayDayKey();
  const planning = getPlanningSummary(habit);
  const [nameDraft, setNameDraft] = useState(habit.name);
  const stats = useMemo(
    () => getHabitDetailsStats(habit, completions, skips, todayDayKey),
    [habit, completions, skips, todayDayKey]
  );

  useEffect(() => {
    setNameDraft(habit.name);
  }, [habit.id, habit.name]);

  function updateWeeklyTarget(value) {
    onUpdatePlanning(habit.id, value, planning.plannedSkipDaysPerYear);
  }

  function updatePlannedSkips(value) {
    onUpdatePlanning(habit.id, planning.weeklyTarget, value);
  }

  function handleNameChange(value) {
    setNameDraft(value);
    if (value.trim()) {
      onUpdateHabitName(habit.id, value);
    }
  }

  const periodRows = [
    { label: "This week", stats: stats.weekStats },
    { label: "This month", stats: stats.monthStats },
    { label: "This quarter", stats: stats.quarterStats },
    { label: "Rolling 30 days", stats: stats.rolling30Stats }
  ];

  return (
    <aside className="panel details-panel">
      <h2>Habit Details</h2>
      <label className="details-name-field">
        Habit name
        <input
          type="text"
          value={nameDraft}
          onChange={(event) => handleNameChange(event.target.value)}
          maxLength={64}
          aria-label="Edit habit name"
        />
      </label>

      <section className="details-section">
        <h3>Planning</h3>
        <div className="cadence-row">
          <label>
            Weekly target
            <input
              type="number"
              min="1"
              step="1"
              value={planning.weeklyTarget}
              onChange={(event) => updateWeeklyTarget(Number(event.target.value || 1))}
            />
          </label>
          <label>
            Planned skip days/year
            <input
              type="number"
              min="0"
              step="1"
              value={planning.plannedSkipDaysPerYear}
              onChange={(event) => updatePlannedSkips(Number(event.target.value || 0))}
            />
          </label>
          <p className="muted">
            Skip budget used this year: {stats.skipBudget.used}/{stats.skipBudget.planned}
          </p>
        </div>
      </section>

      <section className="details-section">
        <h3>Statistics</h3>
        <ul className="stats-list">
          <li>
            Current streak / Longest: {stats.streaks.current} / {stats.streaks.longest}
          </li>
          {periodRows.map((row) => (
            <li key={row.label} className="stat-progress-item">
              <span>
                {row.label}: {row.stats.completed}/{formatCount(row.stats.expected)}
              </span>
              <span className="progress-track" aria-hidden="true">
                <span
                  className="progress-fill"
                  style={{ width: `${getProgressPercent(row.stats.completed, row.stats.expected)}%` }}
                />
              </span>
            </li>
          ))}
          <li>Avg weekly completions: {formatCount(stats.avgWeeklyCompletions)}</li>
          <li className="momentum-row">
            <span>
              Momentum:{" "}
              {stats.momentum
                ? `${formatPercent(stats.momentum.recentRate)} vs ${formatPercent(stats.momentum.previousRate)} (${stats.momentum.delta >= 0 ? "+" : ""}${formatPercent(stats.momentum.delta)})`
                : "N/A"}
            </span>
            {stats.momentum && stats.momentum.delta > 0 ? (
              <span className="momentum-arrow momentum-arrow-up" aria-hidden="true" />
            ) : null}
            {stats.momentum && stats.momentum.delta < 0 ? (
              <span className="momentum-arrow momentum-arrow-down" aria-hidden="true" />
            ) : null}
          </li>
          <li>
            Projected quarter: {formatCount(stats.projections.quarter.projected)} /{" "}
            {formatCount(stats.projections.quarter.desired)}
          </li>
          <li>
            Projected year: {formatCount(stats.projections.year.projected)} /{" "}
            {formatCount(stats.projections.year.desired)}
          </li>
        </ul>
      </section>
    </aside>
  );
}
