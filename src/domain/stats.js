import { addDaysToDayKey, endOfWeekMonday, parseDayKey, startOfWeekMonday, toDayKeyFromDate } from "./dayKey";

const EPSILON = 0.000001;

function dayKeyRange(startDayKey, endDayKey) {
  const days = [];
  let cursor = startDayKey;
  while (cursor <= endDayKey) {
    days.push(cursor);
    cursor = addDaysToDayKey(cursor, 1);
  }
  return days;
}

function getWindowDayCount(startDayKey, endDayKey) {
  if (!startDayKey || !endDayKey || startDayKey > endDayKey) {
    return 0;
  }
  return dayKeyRange(startDayKey, endDayKey).length;
}

function getWeeklyTarget(habit) {
  const target = Number(habit?.planning?.weeklyTarget ?? 5);
  return Number.isFinite(target) && target > 0 ? Math.round(target) : 5;
}

function getPlannedSkipDaysPerYear(habit) {
  const planned = Number(habit?.planning?.plannedSkipDaysPerYear ?? 0);
  return Number.isFinite(planned) && planned >= 0 ? Math.round(planned) : 0;
}

function getDailyValueFromWeekly(habit) {
  return getWeeklyTarget(habit) / 7;
}

function getYearlyBaselineExpected(habit) {
  return getWeeklyTarget(habit) * 52;
}

function getYearlyPlannedExpected(habit) {
  const plannedReduction = getPlannedSkipDaysPerYear(habit) * getDailyValueFromWeekly(habit);
  return Math.max(0, getYearlyBaselineExpected(habit) - plannedReduction);
}

function getUsedSkipsInWindow(skips, habitId, startDayKey, endDayKey) {
  const dayMap = skips[habitId] ?? {};
  return Object.keys(dayMap).filter((dayKey) => dayKey >= startDayKey && dayKey <= endDayKey).length;
}

function getUsedSkipsInYear(skips, habitId, year) {
  return getUsedSkipsInWindow(skips, habitId, `${year}-01-01`, `${year}-12-31`);
}

function getHabitStartDayKey(habitId, completions) {
  const completionKeys = Object.keys(completions[habitId] ?? {});
  if (completionKeys.length === 0) {
    return null;
  }
  return completionKeys.sort()[0];
}

function clipStart(startDayKey, endDayKey, startClipDayKey) {
  if (!startClipDayKey) {
    return startDayKey;
  }
  const clipped = startDayKey < startClipDayKey ? startClipDayKey : startDayKey;
  return clipped <= endDayKey ? clipped : null;
}

function getCompletedInWindow(completions, habitId, startDayKey, endDayKey) {
  const dayMap = completions[habitId] ?? {};
  return Object.keys(dayMap).filter((dayKey) => dayKey >= startDayKey && dayKey <= endDayKey).length;
}

function getRate(completed, expected) {
  if (expected <= EPSILON) {
    return null;
  }
  return completed / expected;
}

function getMonthStart(dayKey) {
  const date = parseDayKey(dayKey);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-01`;
}

function getCurrentWeekWindow(dayKey) {
  const startDayKey = startOfWeekMonday(dayKey);
  return {
    startDayKey,
    endDayKey: endOfWeekMonday(startDayKey)
  };
}

function getYearAnchor(dayKey) {
  return startOfWeekMonday(`${dayKey.slice(0, 4)}-01-01`);
}

function getCompletedWeeksSinceAnchor(anchorDayKey, todayDayKey) {
  const currentWeekStart = startOfWeekMonday(todayDayKey);
  const allDays = dayKeyRange(anchorDayKey, currentWeekStart);
  const diffDays = Math.max(0, allDays.length - 1);
  return Math.floor(diffDays / 7);
}

function getPeriodicExpectedWithUsedSkips(habit, skips, habitId, periodBaseExpected, startDayKey, endDayKey) {
  const usedSkips = getUsedSkipsInWindow(skips, habitId, startDayKey, endDayKey);
  const reduction = usedSkips * getDailyValueFromWeekly(habit);
  return Math.max(0, periodBaseExpected - reduction);
}

function getPeriodStatsFromBaseExpected(habit, completions, skips, startDayKey, endDayKey, baseExpected) {
  const habitStartDayKey = getHabitStartDayKey(habit.id, completions);
  const clippedStart = clipStart(startDayKey, endDayKey, habitStartDayKey);
  if (!clippedStart) {
    return { completed: 0, expected: 0, rate: null };
  }

  const fullWindowDays = getWindowDayCount(startDayKey, endDayKey);
  const activeWindowDays = getWindowDayCount(clippedStart, endDayKey);
  const clippedBaseExpected =
    fullWindowDays > 0 ? (baseExpected * activeWindowDays) / fullWindowDays : 0;

  const completed = getCompletedInWindow(completions, habit.id, clippedStart, endDayKey);
  const expected = getPeriodicExpectedWithUsedSkips(
    habit,
    skips,
    habit.id,
    clippedBaseExpected,
    clippedStart,
    endDayKey
  );

  return {
    completed,
    expected,
    rate: getRate(completed, expected)
  };
}

function getWeeklyPeriodStats(habit, completions, skips, startDayKey, endDayKey) {
  const baseExpected = getWeeklyTarget(habit);
  return getPeriodStatsFromBaseExpected(habit, completions, skips, startDayKey, endDayKey, baseExpected);
}

function getMonthPeriodStats(habit, completions, skips, startDayKey, endDayKey) {
  const baseExpected = getYearlyPlannedExpected(habit) / 12;
  return getPeriodStatsFromBaseExpected(habit, completions, skips, startDayKey, endDayKey, baseExpected);
}

function getQuarterPeriodStats(habit, completions, skips, startDayKey, endDayKey) {
  const baseExpected = getYearlyPlannedExpected(habit) / 4;
  return getPeriodStatsFromBaseExpected(habit, completions, skips, startDayKey, endDayKey, baseExpected);
}

function getRolling30Stats(habit, completions, skips, startDayKey, endDayKey) {
  const baseExpected = (getYearlyPlannedExpected(habit) * 30) / 364;
  return getPeriodStatsFromBaseExpected(habit, completions, skips, startDayKey, endDayKey, baseExpected);
}

function getYearToDateStats(habit, completions, skips, todayDayKey) {
  const yearAnchor = getYearAnchor(todayDayKey);
  const completedWeeks = getCompletedWeeksSinceAnchor(yearAnchor, todayDayKey);
  const yearlyPlanned = getYearlyPlannedExpected(habit);
  const baseExpected = (yearlyPlanned * completedWeeks) / 52;
  return getPeriodStatsFromBaseExpected(
    habit,
    completions,
    skips,
    yearAnchor,
    todayDayKey,
    baseExpected
  );
}

function getWeekSuccess(stats) {
  if (stats.expected <= EPSILON) {
    return null;
  }
  return stats.completed + EPSILON >= stats.expected;
}

function getHistoryStartWeek(habit, completions, todayDayKey) {
  const habitStartDayKey = getHabitStartDayKey(habit.id, completions);
  if (!habitStartDayKey) {
    return startOfWeekMonday(todayDayKey);
  }
  return startOfWeekMonday(habitStartDayKey);
}

function getWeeklyPeriod(startDayKey) {
  return {
    startDayKey,
    endDayKey: endOfWeekMonday(startDayKey)
  };
}

function getWeeklyPeriodsAscending(startDayKey, count) {
  const periods = [];
  let cursor = startDayKey;
  for (let i = 0; i < count; i += 1) {
    periods.push(getWeeklyPeriod(cursor));
    cursor = addDaysToDayKey(cursor, 7);
  }
  return periods;
}

function getWeeklyPeriodsDescending(anchorDayKey, count, includeCurrentWeek = true) {
  const periods = [];
  const currentWeekStart = startOfWeekMonday(anchorDayKey);
  let cursor = includeCurrentWeek ? currentWeekStart : addDaysToDayKey(currentWeekStart, -7);
  for (let i = 0; i < count; i += 1) {
    periods.push(getWeeklyPeriod(cursor));
    cursor = addDaysToDayKey(cursor, -7);
  }
  return periods;
}

function getAggregateRate(statsList) {
  const totals = statsList.reduce(
    (acc, item) => ({
      completed: acc.completed + item.completed,
      expected: acc.expected + item.expected
    }),
    { completed: 0, expected: 0 }
  );
  return {
    completed: totals.completed,
    expected: totals.expected,
    rate: getRate(totals.completed, totals.expected)
  };
}

export function getStreakStats(habit, completions, skips, todayDayKey) {
  const lastCompletedWeek = getWeeklyPeriod(addDaysToDayKey(startOfWeekMonday(todayDayKey), -7));
  const firstWeekStart = getHistoryStartWeek(habit, completions, todayDayKey);
  if (firstWeekStart > lastCompletedWeek.startDayKey) {
    return { current: 0, longest: 0 };
  }

  const weekCount =
    Math.floor((dayKeyRange(firstWeekStart, lastCompletedWeek.startDayKey).length - 1) / 7) + 1;
  const periods = getWeeklyPeriodsAscending(firstWeekStart, weekCount);

  let longest = 0;
  let running = 0;
  for (const period of periods) {
    const stats = getWeeklyPeriodStats(
      habit,
      completions,
      skips,
      period.startDayKey,
      period.endDayKey
    );
    const success = getWeekSuccess(stats);
    if (success === null) {
      continue;
    }
    if (success) {
      running += 1;
      longest = Math.max(longest, running);
    } else {
      running = 0;
    }
  }

  let current = 0;
  for (let i = periods.length - 1; i >= 0; i -= 1) {
    const stats = getWeeklyPeriodStats(
      habit,
      completions,
      skips,
      periods[i].startDayKey,
      periods[i].endDayKey
    );
    const success = getWeekSuccess(stats);
    if (success === null) {
      continue;
    }
    if (success) {
      current += 1;
    } else {
      break;
    }
  }

  return { current, longest };
}

export function getMomentum(habit, completions, skips, todayDayKey) {
  const periods = getWeeklyPeriodsDescending(todayDayKey, 104, false)
    .map((period) => ({
      ...period,
      stats: getWeeklyPeriodStats(habit, completions, skips, period.startDayKey, period.endDayKey)
    }))
    .filter((period) => period.stats.expected > EPSILON);

  const recent = periods.slice(0, 4).map((item) => item.stats);
  const previous = periods.slice(4, 8).map((item) => item.stats);
  if (recent.length < 4 || previous.length < 4) {
    return null;
  }

  const recentAgg = getAggregateRate(recent);
  const previousAgg = getAggregateRate(previous);
  if (recentAgg.rate === null || previousAgg.rate === null) {
    return null;
  }

  return {
    recentRate: recentAgg.rate,
    previousRate: previousAgg.rate,
    delta: recentAgg.rate - previousAgg.rate
  };
}

export function getHabitCardStats(habit, completions, skips, todayDayKey) {
  const thisWeekWindow = getCurrentWeekWindow(todayDayKey);
  const weekStats = getWeeklyPeriodStats(
    habit,
    completions,
    skips,
    thisWeekWindow.startDayKey,
    todayDayKey
  );
  const fullWeekExpected = getWeeklyPeriodStats(
    habit,
    completions,
    skips,
    thisWeekWindow.startDayKey,
    thisWeekWindow.endDayKey
  ).expected;

  return {
    thisWeek: {
      completed: weekStats.completed,
      expected: fullWeekExpected,
      rate: getRate(weekStats.completed, fullWeekExpected)
    },
    thisYear: getYearToDateStats(habit, completions, skips, todayDayKey)
  };
}

export function getHabitDetailsStats(habit, completions, skips, todayDayKey) {
  const thisWeekWindow = getCurrentWeekWindow(todayDayKey);
  const monthStart = getMonthStart(todayDayKey);
  const rolling30Start = addDaysToDayKey(todayDayKey, -29);
  const quarterStart = addDaysToDayKey(thisWeekWindow.startDayKey, -11 * 7);
  const quarterEnd = endOfWeekMonday(thisWeekWindow.startDayKey);

  const weekProgress = getWeeklyPeriodStats(
    habit,
    completions,
    skips,
    thisWeekWindow.startDayKey,
    todayDayKey
  );
  const weekFull = getWeeklyPeriodStats(
    habit,
    completions,
    skips,
    thisWeekWindow.startDayKey,
    thisWeekWindow.endDayKey
  );
  const weekStats = {
    completed: weekProgress.completed,
    expected: weekFull.expected,
    rate: getRate(weekProgress.completed, weekFull.expected)
  };

  const monthStats = getMonthPeriodStats(habit, completions, skips, monthStart, todayDayKey);
  const quarterStats = getQuarterPeriodStats(habit, completions, skips, quarterStart, todayDayKey);
  const rolling30Stats = getRolling30Stats(habit, completions, skips, rolling30Start, todayDayKey);
  const yearStats = getYearToDateStats(habit, completions, skips, todayDayKey);

  const streaks = getStreakStats(habit, completions, skips, todayDayKey);
  const momentum = getMomentum(habit, completions, skips, todayDayKey);

  const activeWeeks = getWeeklyPeriodsDescending(todayDayKey, 52, false)
    .map((period) => getWeeklyPeriodStats(habit, completions, skips, period.startDayKey, period.endDayKey))
    .filter((stats) => stats.expected > EPSILON);
  const avgWeeklyCompletions =
    activeWeeks.length > 0
      ? activeWeeks.reduce((sum, item) => sum + item.completed, 0) / activeWeeks.length
      : null;

  const observedQuarterWeeks = 12;
  const projectedQuarterTotal =
    observedQuarterWeeks > 0 ? (quarterStats.completed / observedQuarterWeeks) * 12 : null;
  const completedWeeksInYear = getCompletedWeeksSinceAnchor(getYearAnchor(todayDayKey), todayDayKey);
  const projectedYearTotal =
    completedWeeksInYear > 0 ? (yearStats.completed / completedWeeksInYear) * 52 : null;

  return {
    weekStats,
    monthStats,
    quarterStats,
    rolling30Stats,
    yearStats,
    streaks,
    momentum,
    avgWeeklyCompletions,
    skipBudget: {
      planned: getPlannedSkipDaysPerYear(habit),
      used: getUsedSkipsInYear(skips, habit.id, todayDayKey.slice(0, 4))
    },
    projections: {
      quarter: {
        projected: projectedQuarterTotal,
        desired: getYearlyPlannedExpected(habit) / 4
      },
      year: {
        projected: projectedYearTotal,
        desired: getYearlyPlannedExpected(habit)
      }
    }
  };
}

export function getCurrentWeekRange(todayDayKey) {
  return getCurrentWeekWindow(todayDayKey);
}

export function getPlanningSummary(habit) {
  return {
    weeklyTarget: getWeeklyTarget(habit),
    plannedSkipDaysPerYear: getPlannedSkipDaysPerYear(habit)
  };
}

export function formatPercent(rate) {
  if (rate === null || Number.isNaN(rate)) {
    return "N/A";
  }
  return `${Math.round(rate * 100)}%`;
}

export function formatCount(value) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "N/A";
  }
  return String(Math.round(value));
}

export function normalizeHabit(habit) {
  const weeklyTarget = Number(habit?.planning?.weeklyTarget ?? habit?.cadence?.weeklyTarget);
  const plannedSkipDaysPerYear = Number(habit?.planning?.plannedSkipDaysPerYear ?? 0);
  return {
    ...habit,
    color: habit.color || "#2563eb",
    planning: {
      weeklyTarget:
        Number.isFinite(weeklyTarget) && weeklyTarget > 0 ? Math.round(weeklyTarget) : 5,
      plannedSkipDaysPerYear:
        Number.isFinite(plannedSkipDaysPerYear) && plannedSkipDaysPerYear >= 0
          ? Math.round(plannedSkipDaysPerYear)
          : 0
    }
  };
}

export function getTodayDayKeyLocal() {
  return toDayKeyFromDate(new Date());
}
