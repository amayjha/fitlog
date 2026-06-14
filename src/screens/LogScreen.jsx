import { useState, useMemo } from "react";
import { T, GROUP_COLORS } from "../theme.js";
import { e1rm, round1, fmtShortDate, parseDate } from "../utils.js";
import Stepper from "../components/Stepper.jsx";
import Graph from "../components/Graph.jsx";

export default function LogScreen({
  ex, key, date, data, todayEntries, bestByExercise,
  addSet, updateSet, deleteSet, removeExerciseFromDay, setExerciseNote,
  startTimer, onBack,
}) {
  const entry = todayEntries.find((e) => e.exId === ex.id) || { exId: ex.id, sets: [], note: "" };
  const last = data.lastSet?.[ex.id];
  const bestE1rm = bestByExercise[ex.id] || 0;
  const unit = data.unit;

  const [tab, setTab] = useState("track");
  const [w, setW] = useState(last?.w ?? 20);
  const [r, setR] = useState(last?.r ?? 8);
  const [editing, setEditing] = useState(null);
  const [setNote, setSetNote] = useState("");
  const [noteOpenIdx, setNoteOpenIdx] = useState(null);
  const [timerMode, setTimerMode] = useState("rest"); // rest | emom | amrap | tabata
  const [timerOpen, setTimerOpen] = useState(false);
  const [emomMins, setEmomMins] = useState(10);
  const [amrapMins, setAmrapMins] = useState(10);
  const [tabWorkSecs, setTabWorkSecs] = useState(20);
  const [tabRestSecs, setTabRestSecs] = useState(10);
  const [tabRounds, setTabRounds] = useState(8);
  const [exerciseNoteOpen, setExerciseNoteOpen] = useState(false);

  const step = (setter, val, delta, min) => setter(Math.max(min, round1(val + delta)));

  const history = useMemo(() => {
    const rows = [];
    for (const [k, entries] of Object.entries(data.workouts)) {
      if (k === key) continue;
      const en = entries.find((e) => e.exId === ex.id);
      if (en && en.sets.length) {
        rows.push({ k, sets: en.sets, best: en.sets.reduce((m, s) => Math.max(m, e1rm(s.w, s.r)), 0) });
      }
    }
    return rows.sort((a, b) => (a.k < b.k ? 1 : -1));
  }, [data.workouts, ex.id, key]);

  const graphData = [...history].reverse().map((h) => ({ k: h.k, best: h.best }));

  const handleAddSet = () => {
    addSet(ex.id, w, r, editing !== null ? setNote : "");
    setEditing(null);
    setSetNote("");
    setNoteOpenIdx(null);
  };

  const handleUpdateSet = () => {
    updateSet(ex.id, editing, w, r, setNote);
    setEditing(null);
    setSetNote("");
    setNoteOpenIdx(null);
  };

  const startEdit = (i, s) => {
    setEditing(i);
    setW(s.w);
    setR(s.r);
    setSetNote(s.note || "");
  };

  const launchTimer = () => {
    if (timerMode === "rest") return; // handled by chips
    if (timerMode === "emom") startTimer("emom", { minutes: emomMins });
    if (timerMode === "amrap") startTimer("amrap", { minutes: amrapMins });
    if (timerMode === "tabata") startTimer("tabata", { workSecs: tabWorkSecs, restSecs: tabRestSecs, rounds: tabRounds });
    setTimerOpen(false);
  };

  const dateLabel = date.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  const color = GROUP_COLORS[ex.group] || T.label;

  return (
    <div className="screen">
      <header className="header">
        <button className="ghostbtn" onClick={onBack}>‹ Back</button>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontWeight: 700 }}>{ex.name}</div>
          <div style={{ color: T.faint, fontSize: 11 }}>{dateLabel}</div>
        </div>
        <button className="ghostbtn" onClick={removeExerciseFromDay} title="Remove from this workout" style={{ color: T.red }}>
          🗑
        </button>
      </header>

      <div className="tabs">
        {["track", "history", "graph"].map((t) => (
          <button
            key={t}
            className={`tab${tab === t ? " active" : ""}`}
            onClick={() => setTab(t)}
            style={{ borderBottomColor: tab === t ? color : "transparent" }}
          >
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      {tab === "track" && (
        <>
          <div className="panel" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(148px, 1fr))", gap: 16 }}>
            <Stepper
              label={`WEIGHT (${unit})`} value={w}
              onMinus={() => step(setW, w, -2.5, 0)} onPlus={() => step(setW, w, 2.5, 0)}
              onChange={(v) => setW(Math.max(0, v))}
            />
            <Stepper
              label="REPS" value={r}
              onMinus={() => step(setR, r, -1, 1)} onPlus={() => step(setR, r, 1, 1)}
              onChange={(v) => setR(Math.max(1, Math.round(v)))}
            />
          </div>

          {/* Set note input when editing */}
          {editing !== null && (
            <input className="input" placeholder="Set note (optional)" value={setNote} onChange={(e) => setSetNote(e.target.value)} />
          )}

          {editing === null ? (
            <button className="primary big" onClick={handleAddSet}>SAVE SET</button>
          ) : (
            <div style={{ display: "flex", gap: 8 }}>
              <button className="primary big" style={{ flex: 1 }} onClick={handleUpdateSet}>
                UPDATE SET {editing + 1}
              </button>
              <button className="ghostbtn" onClick={() => { setEditing(null); setSetNote(""); }}>Cancel</button>
            </div>
          )}

          {/* Timers */}
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 8, alignItems: "center" }}>
              <span style={{ color: T.faint, fontSize: 12, whiteSpace: "nowrap" }}>Rest</span>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {[60, 90, 120, 180].map((s) => (
                  <button key={s} className="chip" onClick={() => startTimer("rest", { secs: s })}>
                    {s === 60 ? "1m" : s === 90 ? "1:30" : `${s / 60}m`}
                  </button>
                ))}
              </div>
              <button
                className="chip"
                onClick={() => { setTimerOpen((o) => !o); if (!timerOpen) setTimerMode("emom"); }}
              >
                {timerOpen ? "▴" : "Intervals"}
              </button>
            </div>

            {timerOpen && (
              <div className="panel" style={{ marginTop: 8, display: "grid", gap: 10 }}>
                {/* Mode selector */}
                <div style={{ display: "flex", gap: 6 }}>
                  {["rest", "emom", "amrap", "tabata"].map((m) => (
                    <button key={m} className={`chip${timerMode === m ? " active" : ""}`} onClick={() => setTimerMode(m)}>
                      {m.toUpperCase()}
                    </button>
                  ))}
                </div>

                {timerMode === "rest" && (
                  <div>
                    <div style={{ color: T.faint, fontSize: 12, marginBottom: 6 }}>Custom rest (seconds)</div>
                    <div style={{ display: "flex", gap: 8 }}>
                      {[45, 60, 90, 120, 150, 180, 240, 300].map((s) => (
                        <button key={s} className="chip" onClick={() => { startTimer("rest", { secs: s }); setTimerOpen(false); }}>
                          {s < 60 ? `${s}s` : `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {timerMode === "emom" && (
                  <div style={{ display: "grid", gap: 8 }}>
                    <div style={{ color: T.label, fontSize: 13 }}>Every Minute On the Minute</div>
                    <Stepper label="MINUTES" value={emomMins} onChange={setEmomMins}
                      onMinus={() => setEmomMins((v) => Math.max(1, v - 1))} onPlus={() => setEmomMins((v) => v + 1)} />
                    <button className="primary" onClick={() => { startTimer("emom", { minutes: emomMins }); setTimerOpen(false); }}>
                      Start EMOM
                    </button>
                  </div>
                )}

                {timerMode === "amrap" && (
                  <div style={{ display: "grid", gap: 8 }}>
                    <div style={{ color: T.label, fontSize: 13 }}>As Many Reps As Possible</div>
                    <Stepper label="MINUTES" value={amrapMins} onChange={setAmrapMins}
                      onMinus={() => setAmrapMins((v) => Math.max(1, v - 1))} onPlus={() => setAmrapMins((v) => v + 1)} />
                    <button className="primary" onClick={() => { startTimer("amrap", { minutes: amrapMins }); setTimerOpen(false); }}>
                      Start AMRAP
                    </button>
                  </div>
                )}

                {timerMode === "tabata" && (
                  <div style={{ display: "grid", gap: 8 }}>
                    <div style={{ color: T.label, fontSize: 13 }}>Tabata intervals</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 12 }}>
                      <Stepper label="WORK (s)" value={tabWorkSecs} onChange={setTabWorkSecs}
                        onMinus={() => setTabWorkSecs((v) => Math.max(5, v - 5))} onPlus={() => setTabWorkSecs((v) => v + 5)} />
                      <Stepper label="REST (s)" value={tabRestSecs} onChange={setTabRestSecs}
                        onMinus={() => setTabRestSecs((v) => Math.max(5, v - 5))} onPlus={() => setTabRestSecs((v) => v + 5)} />
                      <Stepper label="ROUNDS" value={tabRounds} onChange={setTabRounds}
                        onMinus={() => setTabRounds((v) => Math.max(1, v - 1))} onPlus={() => setTabRounds((v) => v + 1)} />
                    </div>
                    <button className="primary" onClick={() => { startTimer("tabata", { workSecs: tabWorkSecs, restSecs: tabRestSecs, rounds: tabRounds }); setTimerOpen(false); }}>
                      Start Tabata
                    </button>
                  </div>
                )}

                <button className="ghostbtn" style={{ textAlign: "center" }} onClick={() => setTimerOpen(false)}>Close</button>
              </div>
            )}
          </div>

          {/* Sets list */}
          <div style={{ marginTop: 4 }}>
            {entry.sets.length === 0 && (
              <div className="empty" style={{ padding: "20px 12px" }}>No sets logged yet today.</div>
            )}
            {entry.sets.map((s, i) => {
              const v = e1rm(s.w, s.r);
              const isPR = bestE1rm > 0 && Math.abs(v - bestE1rm) < 0.001;
              return (
                <div key={i}>
                  <div className="setrow" style={{ background: editing === i ? T.cardHi : T.card }}>
                    <span style={{ color: T.faint, width: 24, textAlign: "right" }}>{i + 1}</span>
                    <span className="bignum">{s.w}</span>
                    <span style={{ color: T.label }}>{unit}</span>
                    <span style={{ color: T.faint, margin: "0 2px" }}>×</span>
                    <span className="bignum">{s.r}</span>
                    {isPR && <span className="pr">PR</span>}
                    <span style={{ flex: 1 }} />
                    <button
                      className="set-action"
                      onClick={() => setNoteOpenIdx(noteOpenIdx === i ? null : i)}
                      title="Toggle note"
                    >
                      {s.note ? "✏️" : "📝"}
                    </button>
                    <button className="set-action" onClick={() => startEdit(i, s)}>Edit</button>
                    <button className="set-action red" onClick={() => deleteSet(ex.id, i)}>✕</button>
                  </div>
                  {(noteOpenIdx === i || s.note) && (
                    <input
                      className="input"
                      style={{ marginTop: -4, marginBottom: 4, borderRadius: "0 0 10px 10px", borderTop: "none", fontSize: 13 }}
                      placeholder="Set note…"
                      value={noteOpenIdx === i ? (editing === i ? setNote : s.note || "") : s.note}
                      readOnly={noteOpenIdx !== i}
                      onChange={(e) => {
                        if (editing === i) setSetNote(e.target.value);
                        else updateSet(ex.id, i, s.w, s.r, e.target.value);
                      }}
                      onFocus={() => { if (editing !== i) startEdit(i, s); }}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Exercise note */}
          <div>
            <button
              className="ghostbtn"
              style={{ fontSize: 13, color: entry.note ? T.text : T.faint, padding: "6px 0" }}
              onClick={() => setExerciseNoteOpen((o) => !o)}
            >
              {exerciseNoteOpen ? "▾" : "▸"} {entry.note ? "Exercise note" : "Add exercise note"}
            </button>
            {exerciseNoteOpen && (
              <textarea
                className="input"
                style={{ marginTop: 6 }}
                placeholder="Notes for this exercise today…"
                value={entry.note || ""}
                onChange={(e) => setExerciseNote(ex.id, e.target.value)}
              />
            )}
          </div>
        </>
      )}

      {tab === "history" && (
        <div>
          {history.length === 0 && (
            <div className="empty">No history for this exercise yet.</div>
          )}
          {history.map((h) => (
            <div key={h.k} className="panel" style={{ marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontWeight: 600 }}>
                  {parseDate(h.k).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
                </span>
                <span style={{ color: T.label, fontSize: 13 }}>est 1RM {round1(h.best)} {unit}</span>
              </div>
              <div style={{ color: T.label, fontSize: 14 }}>
                {h.sets.map((s) => `${s.w}×${s.r}`).join("  ·  ")}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "graph" && <Graph history={graphData} unit={unit} color={color} />}
    </div>
  );
}
