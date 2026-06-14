import { useState, useMemo } from "react";
import { T, GROUP_COLORS } from "../theme.js";
import { dkey, isToday } from "../utils.js";

const DOW_LABELS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

export default function CopyWorkoutScreen({ data, exById, todayKey, onBack, onCopy }) {
  /* ── Step 1: calendar ── */
  const [step, setStep] = useState("calendar");
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(new Date().getMonth());
  const [sourceKey, setSourceKey] = useState(null);

  /* ── Step 2: selection ── */
  // selected: { [exId]: Set<setIndex> }
  const [selected, setSelected] = useState({});
  // edited: { [exId]: { [setIndex]: { w, r } } }
  const [edited, setEdited] = useState({});
  // inline edit state
  const [editTarget, setEditTarget] = useState(null); // { exId, setIdx }
  const [editW, setEditW] = useState("");
  const [editR, setEditR] = useState("");

  /* ── Past workout dates (exclude today) ── */
  const trainedDays = useMemo(
    () => new Set(Object.keys(data.workouts).filter((k) => k < todayKey && (data.workouts[k] || []).some(en => en.sets.length > 0))),
    [data.workouts, todayKey]
  );

  /* ── Calendar grid ── */
  const shiftMonth = (n) => {
    let m = viewMonth + n, y = viewYear;
    if (m > 11) { m = 0; y++; }
    if (m < 0) { m = 11; y--; }
    setViewMonth(m); setViewYear(y);
  };

  const firstOfMonth = new Date(viewYear, viewMonth, 1);
  const lastOfMonth = new Date(viewYear, viewMonth + 1, 0);
  const startDow = (firstOfMonth.getDay() + 6) % 7;
  const cells = [];
  for (let i = 0; i < startDow; i++) cells.push({ d: new Date(viewYear, viewMonth, 1 - (startDow - i)), current: false });
  for (let i = 1; i <= lastOfMonth.getDate(); i++) cells.push({ d: new Date(viewYear, viewMonth, i), current: true });
  const rem = (7 - (cells.length % 7)) % 7;
  for (let i = 1; i <= rem; i++) cells.push({ d: new Date(viewYear, viewMonth + 1, i), current: false });

  const monthName = firstOfMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" });

  const handleDayClick = (d) => {
    const k = dkey(d);
    if (!trainedDays.has(k)) return;
    setSourceKey(k);
    // Pre-select all sets in every exercise
    const entries = (data.workouts[k] || []).filter(en => en.sets.length > 0);
    const initSel = {};
    entries.forEach(en => { initSel[en.exId] = new Set(en.sets.map((_, i) => i)); });
    setSelected(initSel);
    setEdited({});
    setEditTarget(null);
    setStep("select");
  };

  /* ── Selection helpers ── */
  const toggleSet = (exId, idx) => {
    setSelected(prev => {
      const s = new Set(prev[exId] || []);
      if (s.has(idx)) s.delete(idx); else s.add(idx);
      return { ...prev, [exId]: s };
    });
  };

  const toggleExercise = (exId, totalSets) => {
    setSelected(prev => {
      const cur = prev[exId];
      const allSelected = cur && cur.size === totalSets;
      return { ...prev, [exId]: allSelected ? new Set() : new Set(totalSets > 0 ? [...Array(totalSets).keys()] : []) };
    });
  };

  const totalSelectedSets = Object.values(selected).reduce((a, s) => a + s.size, 0);

  /* ── Inline edit helpers ── */
  const startEdit = (exId, setIdx, set) => {
    const cur = edited[exId]?.[setIdx];
    setEditTarget({ exId, setIdx });
    setEditW(String(cur?.w ?? set.w));
    setEditR(String(cur?.r ?? set.r));
  };

  const saveEdit = () => {
    if (!editTarget) return;
    const { exId, setIdx } = editTarget;
    const w = parseFloat(editW);
    const r = parseInt(editR, 10);
    if (!isNaN(w) && !isNaN(r) && w > 0 && r > 0) {
      setEdited(prev => ({
        ...prev,
        [exId]: { ...(prev[exId] || {}), [setIdx]: { w, r } },
      }));
    }
    setEditTarget(null);
  };

  /* ── Copy ── */
  const handleCopy = () => {
    const result = [];
    const entries = (data.workouts[sourceKey] || []).filter(en => en.sets.length > 0);
    for (const en of entries) {
      const sel = selected[en.exId];
      if (!sel || sel.size === 0) continue;
      const sets = [...sel].sort((a, b) => a - b).map(i => {
        const override = edited[en.exId]?.[i];
        return override ? { ...en.sets[i], ...override } : { ...en.sets[i] };
      });
      result.push({ exId: en.exId, sets });
    }
    onCopy(result);
  };

  /* ── Source date label ── */
  const sourceDateLabel = sourceKey
    ? new Date(sourceKey + "T12:00:00").toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short", year: "numeric" })
    : "";

  const sourceEntries = sourceKey
    ? (data.workouts[sourceKey] || []).filter(en => en.sets.length > 0)
    : [];

  /* ════════════════════════════════════
     STEP 1 — Calendar
  ════════════════════════════════════ */
  if (step === "calendar") {
    return (
      <div className="screen">
        <header className="header">
          <button className="ghostbtn" onClick={onBack}>‹ Back</button>
          <div style={{ fontWeight: 700, fontSize: 17 }}>Copy Workout</div>
          <span style={{ width: 64 }} />
        </header>

        <div style={{ color: T.label, fontSize: 14, textAlign: "center" }}>
          Tap a highlighted date to copy that workout
        </div>

        <div className="panel" style={{ display: "grid", gap: 10 }}>
          {/* Month nav */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button className="ghostbtn" style={{ padding: "6px 12px" }} onClick={() => shiftMonth(-1)}>‹</button>
            <div style={{ flex: 1, textAlign: "center", fontWeight: 700, fontSize: 16 }}>{monthName}</div>
            <button className="ghostbtn" style={{ padding: "6px 12px" }} onClick={() => shiftMonth(1)}>›</button>
          </div>

          {/* Day of week headers */}
          <div className="cal-grid">
            {DOW_LABELS.map(d => (
              <div key={d} style={{ textAlign: "center", color: T.faint, fontSize: 12, fontWeight: 700, padding: "4px 0" }}>{d}</div>
            ))}
          </div>

          {/* Day cells */}
          <div className="cal-grid">
            {cells.map(({ d, current }, i) => {
              const k = dkey(d);
              const hasWorkout = trainedDays.has(k);
              const isFuture = k >= todayKey;
              const isOther = !current;
              return (
                <button
                  key={i}
                  onClick={() => handleDayClick(d)}
                  disabled={!hasWorkout}
                  style={{
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                    padding: "6px 0", borderRadius: 12, minHeight: 52, justifyContent: "center",
                    background: hasWorkout ? "rgba(192,123,82,0.13)" : "transparent",
                    border: hasWorkout ? `1.5px solid rgba(192,123,82,0.35)` : "1.5px solid transparent",
                    color: isFuture || isOther ? T.faint : hasWorkout ? T.text : T.faint,
                    opacity: isFuture ? 0.3 : 1,
                    cursor: hasWorkout ? "pointer" : "default",
                    fontWeight: hasWorkout ? 700 : 400, fontSize: 15,
                  }}
                >
                  <span>{d.getDate()}</span>
                  {hasWorkout && (
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: T.accent, display: "block" }} />
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, paddingTop: 4 }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: T.accent, display: "inline-block" }} />
            <span style={{ color: T.label, fontSize: 13 }}>Workout logged · {trainedDays.size} total sessions</span>
          </div>
        </div>
      </div>
    );
  }

  /* ════════════════════════════════════
     STEP 2 — Select exercises & sets
  ════════════════════════════════════ */
  return (
    <div className="screen">
      <header className="header">
        <button className="ghostbtn" onClick={() => setStep("calendar")}>‹ Calendar</button>
        <div style={{ fontWeight: 700, fontSize: 15 }}>{sourceDateLabel}</div>
        <button
          className="ghostbtn"
          style={{ color: totalSelectedSets > 0 ? T.accent : T.faint, fontWeight: 700 }}
          disabled={totalSelectedSets === 0}
          onClick={handleCopy}
        >
          Copy{totalSelectedSets > 0 ? ` (${totalSelectedSets})` : ""}
        </button>
      </header>

      <div style={{ color: T.label, fontSize: 14 }}>
        Select the exercises and sets you want to copy to today.
      </div>

      {sourceEntries.map(en => {
        const ex = exById[en.exId];
        if (!ex) return null;
        const color = GROUP_COLORS[ex.group] || T.label;
        const sel = selected[en.exId] || new Set();
        const allSelected = sel.size === en.sets.length;
        const someSelected = sel.size > 0 && !allSelected;

        return (
          <div key={en.exId} className="panel" style={{ display: "grid", gap: 0, padding: 0, overflow: "hidden" }}>
            {/* Exercise header row */}
            <button
              style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "14px 16px", background: "none", width: "100%",
                borderBottom: `1px solid ${T.sep}`, cursor: "pointer",
              }}
              onClick={() => toggleExercise(en.exId, en.sets.length)}
            >
              {/* Checkbox */}
              <div style={{
                width: 22, height: 22, borderRadius: 11, flexShrink: 0,
                border: `2px solid ${allSelected ? T.accent : someSelected ? T.accent : T.faint}`,
                background: allSelected ? T.accent : someSelected ? "rgba(192,123,82,0.2)" : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {allSelected && <span style={{ color: "#fff", fontSize: 13, lineHeight: 1 }}>✓</span>}
                {someSelected && <span style={{ color: T.accent, fontSize: 13, lineHeight: 1 }}>−</span>}
              </div>
              <span className="plate" style={{ background: color }} />
              <span style={{ flex: 1, fontWeight: 700, textAlign: "left" }}>{ex.name}</span>
              <span style={{ color: T.label, fontSize: 13 }}>{en.sets.length} set{en.sets.length !== 1 ? "s" : ""}</span>
            </button>

            {/* Set rows */}
            {en.sets.map((s, i) => {
              const isChecked = sel.has(i);
              const isEditing = editTarget?.exId === en.exId && editTarget?.setIdx === i;
              const override = edited[en.exId]?.[i];
              const displayW = override?.w ?? s.w;
              const displayR = override?.r ?? s.r;
              const wasEdited = !!override;

              return (
                <div key={i}>
                  <div style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "12px 16px",
                    borderBottom: i < en.sets.length - 1 || isEditing ? `1px solid ${T.sep}` : "none",
                    background: isChecked ? "rgba(192,123,82,0.05)" : "transparent",
                  }}>
                    {/* Set checkbox */}
                    <button
                      style={{
                        width: 22, height: 22, borderRadius: 11, flexShrink: 0,
                        border: `2px solid ${isChecked ? T.accent : T.faint}`,
                        background: isChecked ? T.accent : "transparent",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        cursor: "pointer",
                      }}
                      onClick={() => toggleSet(en.exId, i)}
                    >
                      {isChecked && <span style={{ color: "#fff", fontSize: 12, lineHeight: 1 }}>✓</span>}
                    </button>

                    <div style={{ flex: 1 }}>
                      <span style={{ fontWeight: 600, fontSize: 15 }}>Set {i + 1}: </span>
                      <span style={{ fontWeight: 700, fontSize: 15, color: wasEdited ? T.accent : T.text }}>
                        {displayW} × {displayR}
                      </span>
                      {wasEdited && (
                        <span style={{ color: T.label, fontSize: 12, marginLeft: 8 }}>
                          (was {s.w}×{s.r})
                        </span>
                      )}
                    </div>

                    <button
                      className="ghostbtn"
                      style={{ fontSize: 13, padding: "4px 12px", minHeight: 36, color: isEditing ? T.accent : T.label }}
                      onClick={() => {
                        if (isEditing) saveEdit();
                        else startEdit(en.exId, i, s);
                      }}
                    >
                      {isEditing ? "Done" : "Edit"}
                    </button>
                  </div>

                  {/* Inline edit row */}
                  {isEditing && (
                    <div style={{
                      display: "flex", gap: 12, padding: "12px 16px",
                      alignItems: "center", background: "rgba(192,123,82,0.06)",
                      borderBottom: i < en.sets.length - 1 ? `1px solid ${T.sep}` : "none",
                    }}>
                      <div style={{ flex: 1, display: "grid", gap: 4 }}>
                        <label style={{ color: T.faint, fontSize: 11, letterSpacing: 1, textTransform: "uppercase" }}>Weight</label>
                        <input
                          className="input"
                          type="number"
                          inputMode="decimal"
                          value={editW}
                          onChange={e => setEditW(e.target.value)}
                          style={{ padding: "10px 12px", fontSize: 16 }}
                          autoFocus
                        />
                      </div>
                      <div style={{ flex: 1, display: "grid", gap: 4 }}>
                        <label style={{ color: T.faint, fontSize: 11, letterSpacing: 1, textTransform: "uppercase" }}>Reps</label>
                        <input
                          className="input"
                          type="number"
                          inputMode="numeric"
                          value={editR}
                          onChange={e => setEditR(e.target.value)}
                          style={{ padding: "10px 12px", fontSize: 16 }}
                        />
                      </div>
                      <button
                        className="primary"
                        style={{ width: "auto", padding: "10px 18px", minHeight: 44, marginTop: 20 }}
                        onClick={saveEdit}
                      >
                        Done
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}

      {/* Bottom Copy button */}
      <button
        className="primary big"
        disabled={totalSelectedSets === 0}
        onClick={handleCopy}
      >
        {totalSelectedSets === 0 ? "Select sets to copy" : `Copy ${totalSelectedSets} set${totalSelectedSets !== 1 ? "s" : ""} to today`}
      </button>
    </div>
  );
}
