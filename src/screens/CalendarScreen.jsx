import { useState, useMemo } from "react";
import { T } from "../theme.js";
import { dkey, isToday } from "../utils.js";

const DOW_LABELS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

export default function CalendarScreen({ date, setDate, data, setActiveTab }) {
  const [viewYear, setViewYear] = useState(date.getFullYear());
  const [viewMonth, setViewMonth] = useState(date.getMonth());

  const trainedDays = useMemo(
    () => new Set(Object.keys(data.workouts).filter((k) => data.workouts[k].length)),
    [data.workouts]
  );

  const shiftMonth = (n) => {
    let m = viewMonth + n;
    let y = viewYear;
    if (m > 11) { m = 0; y++; }
    if (m < 0) { m = 11; y--; }
    setViewMonth(m);
    setViewYear(y);
  };

  // Build the grid: start from Monday of the week containing the 1st
  const firstOfMonth = new Date(viewYear, viewMonth, 1);
  const lastOfMonth = new Date(viewYear, viewMonth + 1, 0);

  // Mon=0 … Sun=6 offset
  const startDow = (firstOfMonth.getDay() + 6) % 7;
  const cells = [];
  for (let i = 0; i < startDow; i++) {
    const d = new Date(viewYear, viewMonth, 1 - (startDow - i));
    cells.push({ d, current: false });
  }
  for (let i = 1; i <= lastOfMonth.getDate(); i++) {
    cells.push({ d: new Date(viewYear, viewMonth, i), current: true });
  }
  const remaining = (7 - (cells.length % 7)) % 7;
  for (let i = 1; i <= remaining; i++) {
    cells.push({ d: new Date(viewYear, viewMonth + 1, i), current: false });
  }

  const selectedKey = dkey(date);

  const handleDayClick = (d) => {
    setDate(new Date(d));
    setActiveTab("today");
  };

  const monthName = firstOfMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" });

  // Streak calculation
  const streakDays = useMemo(() => {
    const sorted = [...trainedDays].sort().reverse();
    if (!sorted.length) return 0;
    const today = dkey(new Date());
    let streak = 0;
    let current = today;
    for (const k of sorted) {
      if (k === current) {
        streak++;
        const d = new Date(k + "T12:00:00");
        d.setDate(d.getDate() - 1);
        current = dkey(d);
      } else if (k < current) {
        break;
      }
    }
    return streak;
  }, [trainedDays]);

  const monthWorkouts = useMemo(() => {
    const prefix = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}`;
    return [...trainedDays].filter((k) => k.startsWith(prefix)).length;
  }, [trainedDays, viewYear, viewMonth]);

  return (
    <div className="screen">
      <header className="header">
        <div>
          <div className="brand">FITLOG</div>
          <div style={{ fontWeight: 700, fontSize: 17 }}>Calendar</div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ color: T.label, fontSize: 13 }}>🔥 {streakDays} day streak</span>
        </div>
      </header>

      {/* Month navigation */}
      <div className="panel" style={{ display: "grid", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button className="ghostbtn" style={{ padding: "6px 12px" }} onClick={() => shiftMonth(-1)}>‹</button>
          <div style={{ flex: 1, textAlign: "center", fontWeight: 700, fontSize: 16 }}>{monthName}</div>
          <button className="ghostbtn" style={{ padding: "6px 12px" }} onClick={() => shiftMonth(1)}>›</button>
        </div>

        {/* Day of week headers */}
        <div className="cal-grid">
          {DOW_LABELS.map((d) => (
            <div key={d} style={{ textAlign: "center", color: T.faint, fontSize: 12, fontWeight: 700, padding: "4px 0" }}>
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="cal-grid">
          {cells.map(({ d, current }, i) => {
            const k = dkey(d);
            const isSel = k === selectedKey;
            const isTod = isToday(d);
            const hasWorkout = trainedDays.has(k);
            return (
              <button
                key={i}
                className={`cal-cell${isSel ? " selected" : ""}${isTod && !isSel ? " today" : ""}${!current ? " other-month" : ""}`}
                onClick={() => handleDayClick(d)}
              >
                <span>{d.getDate()}</span>
                <span
                  className="dot"
                  style={{
                    background: hasWorkout ? (isSel ? "#000" : T.accent) : "transparent",
                  }}
                />
              </button>
            );
          })}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", color: T.faint, fontSize: 12 }}>
          <span>{monthWorkouts} workout{monthWorkouts !== 1 ? "s" : ""} this month</span>
          <span style={{ color: T.label }}>{trainedDays.size} total sessions</span>
        </div>
      </div>

      {/* Recent workouts */}
      <div style={{ color: T.faint, fontSize: 11, letterSpacing: 2, textTransform: "uppercase", fontWeight: 700 }}>Recent</div>
      {[...trainedDays].sort().reverse().slice(0, 5).map((k) => {
        const entries = data.workouts[k] || [];
        const d = new Date(k + "T12:00:00");
        return (
          <button
            key={k}
            className="card"
            onClick={() => handleDayClick(d)}
          >
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600 }}>
                {d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })}
              </div>
              <div style={{ color: T.label, fontSize: 13, marginTop: 2 }}>
                {entries.map((en) => {
                  const totalSets = en.sets.length;
                  return totalSets > 0 ? `${totalSets} sets` : null;
                }).filter(Boolean).length} exercises logged
              </div>
            </div>
            <span style={{ color: T.faint, fontSize: 13 }}>{entries.length} exercises ›</span>
          </button>
        );
      })}
    </div>
  );
}
