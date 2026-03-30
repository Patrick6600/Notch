import React from "react";
import { monthLabel } from "../domain/dayKey";

export default function MonthNav({ year, monthIndex, onPrev, onNext, onToday }) {
  return (
    <div className="month-nav">
      <button type="button" onClick={onPrev}>
        Prev
      </button>
      <h2>{monthLabel(year, monthIndex)}</h2>
      <button type="button" onClick={onNext}>
        Next
      </button>
      <button type="button" onClick={onToday}>
        Today
      </button>
    </div>
  );
}
