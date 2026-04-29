import { useEffect, useMemo, useState } from "react";
import { setDayStatus } from "../domain/completions";
import {
  addHabitWithPlanning,
  deleteHabit,
  selectHabit,
  updateHabitName,
  updateHabitPlanning,
  updateHabitColor
} from "../domain/habits";
import { addLog, deleteLog, updateGeneralNote, updateLog } from "../domain/notes";
import { loadData, saveData } from "../storage/localStore";

export function useNotchData() {
  const [data, setData] = useState(() => loadData());

  useEffect(() => {
    saveData(data);
  }, [data]);

  const actions = useMemo(
    () => ({
      addHabit: (name, color, weeklyTarget, plannedSkipDaysPerYear) =>
        setData((prev) =>
          addHabitWithPlanning(prev, name, color, weeklyTarget, plannedSkipDaysPerYear)
        ),
      selectHabit: (habitId) => setData((prev) => selectHabit(prev, habitId)),
      setDayStatus: (habitId, dayKey, status) =>
        setData((prev) => setDayStatus(prev, habitId, dayKey, status)),
      updateHabitName: (habitId, name) => setData((prev) => updateHabitName(prev, habitId, name)),
      updateHabitColor: (habitId, color) =>
        setData((prev) => updateHabitColor(prev, habitId, color)),
      updateHabitPlanning: (habitId, weeklyTarget, plannedSkipDaysPerYear) =>
        setData((prev) => updateHabitPlanning(prev, habitId, weeklyTarget, plannedSkipDaysPerYear)),
      deleteHabit: (habitId) => setData((prev) => deleteHabit(prev, habitId)),
      updateGeneralNote: (habitId, text) =>
        setData((prev) => updateGeneralNote(prev, habitId, text)),
      addLog: (habitId, title, body) => setData((prev) => addLog(prev, habitId, title, body)),
      updateLog: (habitId, logId, title, body) =>
        setData((prev) => updateLog(prev, habitId, logId, title, body)),
      deleteLog: (habitId, logId) => setData((prev) => deleteLog(prev, habitId, logId))
    }),
    []
  );

  return { data, actions };
}
