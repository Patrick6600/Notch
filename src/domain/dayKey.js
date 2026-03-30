function pad2(value) {
  return String(value).padStart(2, "0");
}

export function parseDayKey(dayKey) {
  const [year, month, day] = dayKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function toDayKeyFromDate(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export function toDayKey(year, monthIndex, day) {
  return `${year}-${pad2(monthIndex + 1)}-${pad2(day)}`;
}

export function getTodayDayKey() {
  return toDayKeyFromDate(new Date());
}

export function addDaysToDayKey(dayKey, days) {
  const date = parseDayKey(dayKey);
  date.setDate(date.getDate() + days);
  return toDayKeyFromDate(date);
}

export function startOfWeekMonday(dayKey) {
  const date = parseDayKey(dayKey);
  const day = date.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + mondayOffset);
  return toDayKeyFromDate(date);
}

export function endOfWeekMonday(dayKey) {
  return addDaysToDayKey(startOfWeekMonday(dayKey), 6);
}

export function monthLabel(year, monthIndex) {
  return new Date(year, monthIndex, 1).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric"
  });
}

export function getMonthGrid(year, monthIndex) {
  const firstOfMonth = new Date(year, monthIndex, 1);
  const startWeekday = firstOfMonth.getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < startWeekday; i += 1) {
    cells.push(null);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({
      day,
      dayKey: toDayKey(year, monthIndex, day)
    });
  }

  return cells;
}
