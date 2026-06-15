import { useState, useMemo, useRef, useEffect } from "react";
import { T, GROUP_COLORS } from "../theme.js";
import { dkey, fmtDate, isToday, e1rm, round1 } from "../utils.js";
import { getAiApiKey, saveAiApiKey, generateWorkoutSummary } from "../utils/aiSummary.js";

export default function HomeScreen({
  date, setDate, key, todayEntries, exById, bestByExercise, data,
  addExerciseToDay, removeExerciseFromDay,
  setWorkoutNote, shareWorkout, persist, setOverlay, setActiveTab,
}) {
  const todayBtnRef = useRef(null);
  useEffect(() => {
    todayBtnRef.current?.scrollIntoView({ inline: "center", block: "nearest", behavior: "instant" });
  }, []);

  const [shareOpen, setShareOpen] = useState(false);
  const [shareMsg, setShareMsg] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [noteOpen, setNoteOpen] = useState(false);

  const [aiApiKey, setAiApiKeyState] = useState(() => getAiApiKey());
  const [aiKeyDraft, setAiKeyDraft] = useState("");
  const [aiSetupOpen, setAiSetupOpen] = useState(false);
  const [aiSummary, setAiSummary] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  useEffect(() => {
    setAiSummary("");
    setAiError("");
  }, [key]);

  const handleGenerateSummary = async (keyOverride) => {
    const k = keyOverride ?? aiApiKey;
    setAiLoading(true);
    setAiError("");
    try {
      const text = await generateWorkoutSummary(k, todayEntries, exById, data.unit);
      setAiSummary(text);
    } catch (err) {
      setAiError(err.message || "Failed to generate summary");
    } finally {
      setAiLoading(false);
    }
  };

  const shift = (n) => {
    const d = new Date(date);
    d.setDate(d.getDate() + n);
    setDate(d);
    setConfirmDeleteId(null);
  };

  const trainedDays = useMemo(
    () => new Set(Object.keys(data.workouts).filter((k) => data.workouts[k].length)),
    [data.workouts]
  );

  const strip = [];
  for (let i = -6; i <= 7; i++) {
    const d = new Date(date);
    d.setDate(d.getDate() + i);
    strip.push(d);
  }

  const totalVolume = todayEntries.reduce(
    (acc, en) => acc + en.sets.reduce((a, s) => a + s.w * s.r, 0),
    0
  );

  const hasSets = todayEntries.some((en) => en.sets.length > 0);
  const workoutNote = data.workoutNotes?.[key] || "";
  const editable = dkey(date) >= dkey(new Date());

  const doShare = async (kind) => {
    const msg = await shareWorkout(kind);
    setShareOpen(false);
    if (msg) { setShareMsg(msg); setTimeout(() => setShareMsg(null), 2500); }
  };

  const handleDeleteClick = (e, exId) => {
    e.stopPropagation();
    if (confirmDeleteId === exId) {
      removeExerciseFromDay(exId);
      setConfirmDeleteId(null);
    } else {
      setConfirmDeleteId(exId);
    }
  };

  return (
    <div className="screen" onClick={() => confirmDeleteId && setConfirmDeleteId(null)}>
      {/* Header */}
      <header className="header">
        <div>
          <div className="brand">FITLOG</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ fontWeight: 700, fontSize: 17 }}>
              {isToday(date) ? "Today" : fmtDate(date)}
            </div>
            {!isToday(date) && (
              <button
                className="ghostbtn"
                style={{ fontSize: 13, padding: "2px 10px", minHeight: 28 }}
                onClick={() => setDate(new Date())}
              >
                Today
              </button>
            )}
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {hasSets && (
            <button className="ghostbtn" onClick={() => { setShareOpen((o) => !o); setConfirmDeleteId(null); }}>
              Share
            </button>
          )}
          <button
            className="ghostbtn"
            onClick={() => persist({ ...data, unit: data.unit === "kg" ? "lbs" : "kg" })}
          >
            {data.unit}
          </button>
        </div>
      </header>

      {/* Share panel */}
      {shareOpen && (
        <div className="panel" style={{ display: "flex", gap: 8 }}>
          <button className="chip" style={{ flex: 1, justifyContent: "center", padding: "11px 0" }} onClick={() => doShare("text")}>
            Share as text
          </button>
          <button className="chip" style={{ flex: 1, justifyContent: "center", padding: "11px 0" }} onClick={() => doShare("image")}>
            Share as image
          </button>
        </div>
      )}

      {shareMsg && <div className="toast">{shareMsg}</div>}

      {/* Date strip */}
      <div className="panel" style={{ padding: "10px 12px", display: "flex", alignItems: "center", gap: 6 }}>
        <button className="navbtn" style={{ height: 48, borderRadius: 10 }} onClick={() => shift(-1)}>‹</button>
        <div className="strip">
          {strip.map((d) => {
            const k = dkey(d);
            const sel = k === key;
            return (
              <button
                key={k}
                ref={isToday(d) ? todayBtnRef : null}
                className="daystrip-btn"
                onClick={() => { setDate(new Date(d)); setConfirmDeleteId(null); }}
                style={{ background: sel ? T.accent : "transparent", color: sel ? "#000" : isToday(d) ? T.accent : T.label }}
              >
                <span style={{ fontSize: 10, letterSpacing: 1 }}>
                  {d.toLocaleDateString(undefined, { weekday: "narrow" })}
                </span>
                <span style={{ fontWeight: 700 }}>{d.getDate()}</span>
                <span className="dot" style={{ background: trainedDays.has(k) ? (sel ? "#000" : T.accent) : "transparent" }} />
              </button>
            );
          })}
        </div>
        <button className="navbtn" style={{ height: 48, borderRadius: 10 }} onClick={() => shift(1)}>›</button>
      </div>

      {/* Workout content */}
      <div className="panel" style={{ display: "grid", gap: 10 }}>
        {todayEntries.length === 0 ? (
          <div className="empty" style={{ padding: "24px 8px" }}>
            <div style={{ fontSize: 15, marginBottom: 14 }}>Nothing logged for this day.</div>
            {editable && (
              <>
                <button className="primary" onClick={() => setOverlay({ name: "pick" })}>+ Add exercise</button>
                <button className="ghostbtn" style={{ display: "block", margin: "6px auto 0" }} onClick={() => setOverlay({ name: "copyworkout" })}>
                  Copy previous workout
                </button>
              </>
            )}
          </div>
        ) : (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span style={{ color: T.faint, fontSize: 12, letterSpacing: 1, textTransform: "uppercase" }}>
                {todayEntries.length} exercise{todayEntries.length !== 1 ? "s" : ""}
              </span>
              {totalVolume > 0 && (
                <span style={{ color: T.label, fontSize: 13 }}>
                  Vol {round1(totalVolume).toLocaleString()} {data.unit}
                </span>
              )}
            </div>

            {todayEntries.map((en) => {
              const ex = exById[en.exId];
              if (!ex) return null;
              const best = en.sets.reduce((m, s) => Math.max(m, e1rm(s.w, s.r)), 0);
              const isPR = best > 0 && Math.abs(best - (bestByExercise[en.exId] || 0)) < 0.001;
              const pendingDelete = confirmDeleteId === en.exId;
              return (
                <div
                  key={en.exId}
                  className={`card${pendingDelete ? " danger" : ""}`}
                  style={editable ? {} : { cursor: "default" }}
                  onClick={() => {
                    if (!editable) return;
                    if (confirmDeleteId) setConfirmDeleteId(null);
                    else setOverlay({ name: "log", exId: en.exId });
                  }}
                >
                  <span className="plate" style={{ background: GROUP_COLORS[ex.group] || T.label }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {ex.name}
                      {isPR && <span className="pr">PR</span>}
                    </div>
                    <div style={{ color: T.label, fontSize: 13, marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {en.sets.length === 0
                        ? "No sets yet"
                        : en.sets.map((s) => `${s.w}×${s.r}`).join("  ·  ")}
                    </div>
                  </div>
                  {editable && (
                    <button
                      onClick={(e) => handleDeleteClick(e, en.exId)}
                      style={{
                        background: pendingDelete ? T.red : T.card2,
                        color: pendingDelete ? "#fff" : T.faint,
                        border: "none", borderRadius: 10, width: 44, height: 44,
                        fontSize: 18, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                        cursor: "pointer", touchAction: "manipulation",
                      }}
                    >
                      {pendingDelete ? "✓" : "×"}
                    </button>
                  )}
                </div>
              );
            })}

            {editable && (
              <button className="primary" onClick={() => setOverlay({ name: "pick" })}>
                + Add exercise
              </button>
            )}

            {/* Workout note */}
            {(editable || workoutNote) && (
              <div>
                <button
                  className="ghostbtn"
                  style={{ fontSize: 13, color: workoutNote ? T.text : T.faint, padding: "6px 0" }}
                  onClick={() => setNoteOpen((o) => !o)}
                >
                  {noteOpen ? "▾" : "▸"} {workoutNote ? "Workout note" : "Add workout note"}
                </button>
                {noteOpen && (
                  <textarea
                    className="input"
                    style={{ marginTop: 6 }}
                    placeholder="How did this session feel?"
                    value={workoutNote}
                    readOnly={!editable}
                    onChange={(e) => editable && setWorkoutNote(e.target.value)}
                  />
                )}
              </div>
            )}

            {/* AI Summary */}
            {hasSets && (
              <div>
                {!aiApiKey ? (
                  <>
                    <button
                      className="ghostbtn"
                      style={{ fontSize: 13, color: T.faint, padding: "6px 0" }}
                      onClick={() => setAiSetupOpen((o) => !o)}
                    >
                      {aiSetupOpen ? "▾" : "▸"} AI Summary
                    </button>
                    {aiSetupOpen && (
                      <div style={{ marginTop: 8, display: "grid", gap: 10 }}>
                        <div style={{ color: T.label, fontSize: 13, lineHeight: 1.6 }}>
                          Get an AI-generated analysis of your workout:
                          <ol style={{ margin: "8px 0 0", paddingLeft: 18, display: "grid", gap: 3 }}>
                            <li>Go to <strong>console.anthropic.com</strong> → API Keys</li>
                            <li>Create a new API key</li>
                            <li>Paste it below</li>
                          </ol>
                        </div>
                        <input
                          className="input"
                          type="password"
                          placeholder="sk-ant-..."
                          value={aiKeyDraft}
                          onChange={(e) => setAiKeyDraft(e.target.value)}
                          autoComplete="off"
                        />
                        <div style={{ display: "flex", gap: 8 }}>
                          <button
                            className="primary"
                            style={{ flex: 1 }}
                            disabled={!aiKeyDraft.trim()}
                            onClick={() => {
                              const k = aiKeyDraft.trim();
                              saveAiApiKey(k);
                              setAiApiKeyState(k);
                              setAiKeyDraft("");
                              setAiSetupOpen(false);
                              handleGenerateSummary(k);
                            }}
                          >
                            Save & Generate
                          </button>
                          <button className="ghostbtn" onClick={() => setAiSetupOpen(false)}>Cancel</button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {!aiSummary && !aiLoading && (
                      <button
                        className="ghostbtn"
                        style={{ fontSize: 13, color: T.accent, padding: "6px 0" }}
                        onClick={() => handleGenerateSummary()}
                      >
                        ▸ AI Summary
                      </button>
                    )}
                    {aiLoading && (
                      <div style={{ color: T.faint, fontSize: 13, padding: "8px 0" }}>
                        Generating summary…
                      </div>
                    )}
                    {aiError && (
                      <div style={{ color: T.red, fontSize: 13, padding: "6px 0" }}>
                        {aiError}
                        <button
                          className="ghostbtn"
                          style={{ fontSize: 12, marginLeft: 10 }}
                          onClick={() => handleGenerateSummary()}
                        >
                          Retry
                        </button>
                      </div>
                    )}
                    {aiSummary && (
                      <div style={{ background: T.card2, borderRadius: 14, padding: "12px 14px 10px" }}>
                        <div style={{ color: T.faint, fontSize: 11, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>
                          AI Summary
                        </div>
                        <div style={{ fontSize: 14, color: T.text, lineHeight: 1.6 }}>
                          {aiSummary}
                        </div>
                        <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                          <button
                            className="ghostbtn"
                            style={{ fontSize: 12, padding: "3px 10px" }}
                            onClick={() => handleGenerateSummary()}
                          >
                            ↺ Regenerate
                          </button>
                          <button
                            className="ghostbtn"
                            style={{ fontSize: 12, padding: "3px 10px" }}
                            onClick={() => {
                              saveAiApiKey("");
                              setAiApiKeyState("");
                              setAiSummary("");
                              setAiSetupOpen(true);
                            }}
                          >
                            ⚙ Change key
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
