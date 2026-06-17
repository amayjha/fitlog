import { useState, useEffect, useRef, useMemo } from "react";
import { css, T } from "./theme.js";
import { dkey, e1rm, fmtDate, round1 } from "./utils.js";
import { DEFAULT_EXERCISES, EMPTY_DATA, STORAGE_KEY, loadData } from "./data.js";
import BottomNav from "./components/BottomNav.jsx";
import TimerBar from "./components/TimerBar.jsx";
import HomeScreen from "./screens/HomeScreen.jsx";
import LogScreen from "./screens/LogScreen.jsx";
import PickScreen from "./screens/PickScreen.jsx";
import CalendarScreen from "./screens/CalendarScreen.jsx";
import PRsScreen from "./screens/PRsScreen.jsx";
import BodyScreen from "./screens/BodyScreen.jsx";
import MoreScreen from "./screens/MoreScreen.jsx";
import TemplatesScreen from "./screens/TemplatesScreen.jsx";
import GoalsScreen from "./screens/GoalsScreen.jsx";
import CopyWorkoutScreen from "./screens/CopyWorkoutScreen.jsx";
import NutritionScreen from "./screens/NutritionScreen.jsx";
import FoodPickScreen from "./screens/FoodPickScreen.jsx";

/* ── Workout sharing ── */
const buildShareText = (date, entries, exById, unit) => {
  const lines = [`Workout — ${fmtDate(date)}`, ""];
  let vol = 0;
  for (const en of entries) {
    const ex = exById[en.exId];
    if (!ex || !en.sets.length) continue;
    vol += en.sets.reduce((a, s) => a + s.w * s.r, 0);
    lines.push(`${ex.name}: ${en.sets.map((s) => `${s.w}${unit}×${s.r}`).join(", ")}`);
  }
  lines.push("", `Total volume: ${round1(vol).toLocaleString()} ${unit}`);
  return lines.join("\n");
};

const wrapText = (ctx, text, maxW) => {
  const words = text.split(" ");
  const lines = [];
  let cur = "";
  for (const w of words) {
    const test = cur ? cur + " " + w : w;
    if (ctx.measureText(test).width > maxW && cur) { lines.push(cur); cur = w; }
    else cur = test;
  }
  if (cur) lines.push(cur);
  return lines;
};

const shareWorkoutImage = async (date, entries, exById, unit) => {
  const rows = entries.filter((en) => exById[en.exId] && en.sets.length);
  if (!rows.length) return "Nothing to share yet";
  const scale = 2, W = 680, padX = 36, setFont = "400 16px system-ui, sans-serif";
  const m = document.createElement("canvas").getContext("2d");
  m.font = setFont;
  let vol = 0;
  const prepared = rows.map((en) => {
    const ex = exById[en.exId];
    vol += en.sets.reduce((a, s) => a + s.w * s.r, 0);
    const setsStr = en.sets.map((s) => `${s.w}×${s.r}`).join("   ");
    return { ex, lines: wrapText(m, setsStr, W - padX * 2 - 26) };
  });
  const H = 132 + prepared.reduce((a, p) => a + 34 + p.lines.length * 24 + 16, 0) + 84;
  const c = document.createElement("canvas");
  c.width = W * scale; c.height = H * scale;
  const ctx = c.getContext("2d");
  ctx.scale(scale, scale);
  ctx.fillStyle = "#F5EFE8"; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#C07B52"; ctx.font = "800 13px -apple-system, system-ui, sans-serif";
  ctx.fillText("F I T L O G", padX, 46);
  ctx.fillStyle = "#1C1008"; ctx.font = "800 26px -apple-system, system-ui, sans-serif";
  ctx.fillText(fmtDate(date), padX, 84);
  let y = 138;
  const groupColors = { Chest: "#D4504A", Back: "#3878C8", Legs: "#D8872A", Shoulders: "#4A9E68", Biceps: "#9855C8", Triceps: "#D85050", Core: "#C8A020", Cardio: "#3AAAC0" };
  for (const p of prepared) {
    ctx.fillStyle = groupColors[p.ex.group] || "#A89070";
    ctx.beginPath(); ctx.arc(padX + 7, y - 6, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#1C1008"; ctx.font = "700 18px -apple-system, system-ui, sans-serif";
    ctx.fillText(p.ex.name, padX + 26, y);
    ctx.fillStyle = "#7A6450"; ctx.font = setFont;
    p.lines.forEach((ln, i) => ctx.fillText(ln, padX + 26, y + 26 + i * 24));
    y += 34 + p.lines.length * 24 + 16;
  }
  ctx.strokeStyle = "rgba(0,0,0,0.09)"; ctx.beginPath();
  ctx.moveTo(padX, y); ctx.lineTo(W - padX, y); ctx.stroke();
  ctx.fillStyle = "#7A6450"; ctx.font = "400 14px -apple-system, system-ui, sans-serif";
  ctx.fillText("TOTAL VOLUME", padX, y + 32);
  ctx.fillStyle = "#C07B52"; ctx.font = "800 22px -apple-system, system-ui, sans-serif";
  ctx.fillText(`${round1(vol).toLocaleString()} ${unit}`, padX, y + 60);
  const blob = await new Promise((res) => c.toBlob(res, "image/png"));
  if (!blob) return "Could not create image";
  const file = new File([blob], `workout-${dkey(date)}.png`, { type: "image/png" });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file] }); return "Shared"; }
    catch (e) { if (e.name === "AbortError") return null; }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `workout-${dkey(date)}.png`; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  return "Image downloaded";
};

/* ── Main App ── */
export default function App() {
  const [data, setData] = useState(loadData);
  const [date, setDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState("today");
  const [overlay, setOverlay] = useState(null); // { name, ...params }
  const [timer, setTimer] = useState(null);
  const timerRef = useRef(null);
  const saveTimeout = useRef(null);

  /* ── Persistence ── */
  const persist = (next) => {
    setData(next);
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); }
      catch (e) { console.error("Save failed", e); }
    }, 300);
  };

  /* ── Timer ── */
  useEffect(() => {
    if (!timer) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      setTimer((t) => {
        if (!t || t.done) return t;
        if (t.remaining <= 1) {
          if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
          if (t.type === "emom" && t.currentMinute < t.totalMinutes) {
            return { ...t, remaining: 60, total: 60, currentMinute: t.currentMinute + 1 };
          }
          if (t.type === "tabata") {
            if (t.phase === "work") {
              return { ...t, phase: "rest", remaining: t.restSecs, total: t.restSecs };
            } else if (t.currentRound < t.totalRounds) {
              return { ...t, phase: "work", remaining: t.workSecs, total: t.workSecs, currentRound: t.currentRound + 1 };
            }
          }
          return { ...t, remaining: 0, done: true };
        }
        return { ...t, remaining: t.remaining - 1 };
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [timer?.startedAt]);

  /* ── Derived data ── */
  const allExercises = useMemo(
    () => [...DEFAULT_EXERCISES, ...data.customExercises],
    [data.customExercises]
  );
  const exById = useMemo(
    () => Object.fromEntries(allExercises.map((e) => [e.id, e])),
    [allExercises]
  );
  const key = dkey(date);
  const todayEntries = data.workouts[key] || [];

  const bestByExercise = useMemo(() => {
    const best = {};
    for (const entries of Object.values(data.workouts)) {
      for (const en of entries) {
        for (const s of en.sets) {
          const v = e1rm(s.w, s.r);
          if (!best[en.exId] || v > best[en.exId]) best[en.exId] = v;
        }
      }
    }
    return best;
  }, [data.workouts]);

  /* ── Workout mutations ── */
  const addExerciseToDay = (exId) => {
    const entries = data.workouts[key] || [];
    if (!entries.find((e) => e.exId === exId)) {
      persist({ ...data, workouts: { ...data.workouts, [key]: [...entries, { exId, sets: [], note: "" }] } });
    }
    setOverlay({ name: "log", exId });
  };

  const addSet = (exId, w, r, note = "") => {
    const entries = (data.workouts[key] || []).map((en) =>
      en.exId === exId ? { ...en, sets: [...en.sets, { w, r, note, ts: Date.now() }] } : en
    );
    persist({ ...data, workouts: { ...data.workouts, [key]: entries }, lastSet: { ...data.lastSet, [exId]: { w, r } } });
  };

  const updateSet = (exId, idx, w, r, note) => {
    const entries = (data.workouts[key] || []).map((en) =>
      en.exId === exId
        ? { ...en, sets: en.sets.map((s, i) => (i === idx ? { ...s, w, r, note } : s)) }
        : en
    );
    persist({ ...data, workouts: { ...data.workouts, [key]: entries } });
  };

  const deleteSet = (exId, idx) => {
    const entries = (data.workouts[key] || []).map((en) =>
      en.exId === exId ? { ...en, sets: en.sets.filter((_, i) => i !== idx) } : en
    );
    persist({ ...data, workouts: { ...data.workouts, [key]: entries } });
  };

  const removeExerciseFromDay = (exId) => {
    const entries = (data.workouts[key] || []).filter((en) => en.exId !== exId);
    const w = { ...data.workouts };
    if (entries.length) w[key] = entries; else delete w[key];
    persist({ ...data, workouts: w });
    setOverlay(null);
  };

  const setExerciseNote = (exId, note) => {
    const entries = (data.workouts[key] || []).map((en) =>
      en.exId === exId ? { ...en, note } : en
    );
    persist({ ...data, workouts: { ...data.workouts, [key]: entries } });
  };

  const copyWorkout = (selections) => {
    const today = [...(data.workouts[key] || [])];
    for (const { exId, sets } of selections) {
      const idx = today.findIndex(e => e.exId === exId);
      const stamped = sets.map(s => ({ ...s, ts: Date.now() }));
      if (idx >= 0) {
        today[idx] = { ...today[idx], sets: [...today[idx].sets, ...stamped] };
      } else {
        today.push({ exId, sets: stamped, note: "" });
      }
    }
    persist({ ...data, workouts: { ...data.workouts, [key]: today } });
    setOverlay(null);
  };

  const addCustomExercise = (name, group) => {
    const ex = { id: "c" + Date.now(), name: name.trim(), group };
    persist({ ...data, customExercises: [...data.customExercises, ex] });
    return ex.id;
  };

  const setWorkoutNote = (note) => {
    persist({ ...data, workoutNotes: { ...data.workoutNotes, [key]: note } });
  };

  /* ── Templates ── */
  const saveTemplate = (name, exIds) => {
    const tpl = { id: "t" + Date.now(), name: name.trim(), exIds, created: Date.now() };
    persist({ ...data, templates: [...data.templates, tpl] });
  };

  const deleteTemplate = (id) => {
    persist({ ...data, templates: data.templates.filter((t) => t.id !== id) });
  };

  const applyTemplate = (tpl) => {
    const existing = data.workouts[key] || [];
    const existingIds = new Set(existing.map((en) => en.exId));
    const toAdd = tpl.exIds.filter((id) => !existingIds.has(id) && exById[id]);
    if (!toAdd.length) return 0;
    const newEntries = [...existing, ...toAdd.map((exId) => ({ exId, sets: [], note: "" }))];
    persist({ ...data, workouts: { ...data.workouts, [key]: newEntries } });
    return toAdd.length;
  };

  /* ── Goals ── */
  const addGoal = (exId, type, target) => {
    const goal = { id: "g" + Date.now(), exId, type, target, created: Date.now(), achieved: null };
    persist({ ...data, goals: [...data.goals, goal] });
  };

  const deleteGoal = (id) => {
    persist({ ...data, goals: data.goals.filter((g) => g.id !== id) });
  };

  const markGoalAchieved = (id) => {
    persist({ ...data, goals: data.goals.map((g) => g.id === id ? { ...g, achieved: Date.now() } : g) });
  };

  /* ── Body measurements ── */
  const addBodyEntry = (measurement) => {
    persist({ ...data, body: [...data.body, { d: dkey(new Date()), ...measurement }] });
  };

  /* ── Export / Import ── */
  const exportData = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fitlog-backup-${dkey(new Date())}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  };

  const importData = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const imported = JSON.parse(e.target.result);
          persist({ ...EMPTY_DATA, ...imported });
          resolve();
        } catch {
          reject(new Error("Invalid backup file"));
        }
      };
      reader.readAsText(file);
    });
  };

  /* ── Timer helpers ── */
  const startTimer = (type, params = {}) => {
    if (type === "rest") {
      const secs = params.secs || 90;
      setTimer({ type: "rest", remaining: secs, total: secs, startedAt: Date.now(), done: false });
    } else if (type === "emom") {
      setTimer({ type: "emom", remaining: 60, total: 60, totalMinutes: params.minutes || 10, currentMinute: 1, startedAt: Date.now(), done: false });
    } else if (type === "amrap") {
      const secs = (params.minutes || 10) * 60;
      setTimer({ type: "amrap", remaining: secs, total: secs, startedAt: Date.now(), done: false });
    } else if (type === "tabata") {
      const workSecs = params.workSecs || 20;
      const restSecs = params.restSecs || 10;
      const totalRounds = params.rounds || 8;
      setTimer({ type: "tabata", phase: "work", remaining: workSecs, total: workSecs, workSecs, restSecs, totalRounds, currentRound: 1, startedAt: Date.now(), done: false });
    }
  };

  /* ── Share workout ── */
  const shareWorkout = async (kind) => {
    if (kind === "text") {
      const text = buildShareText(date, todayEntries, exById, data.unit);
      if (navigator.share) {
        try { await navigator.share({ text }); return "Shared"; }
        catch (e) { if (e.name === "AbortError") return null; }
      }
      try { await navigator.clipboard.writeText(text); return "Copied to clipboard"; }
      catch { return "Could not share"; }
    }
    return shareWorkoutImage(date, todayEntries, exById, data.unit);
  };

  /* ── Shared props ── */
  const shared = {
    data, persist, date, setDate, key, todayEntries, allExercises, exById, bestByExercise,
    addExerciseToDay, addSet, updateSet, deleteSet, removeExerciseFromDay,
    setExerciseNote, addCustomExercise, copyWorkout, setWorkoutNote,
    saveTemplate, deleteTemplate, applyTemplate,
    addGoal, deleteGoal, markGoalAchieved, addBodyEntry,
    exportData, importData, startTimer, shareWorkout,
    setOverlay, setActiveTab,
  };

  const showNav = !overlay;

  return (
    <div className="app">
      <style>{css}</style>

      {/* Tab content */}
      {!overlay && (
        <>
          {activeTab === "today" && <HomeScreen {...shared} />}
          {activeTab === "calendar" && <CalendarScreen {...shared} />}
          {activeTab === "prs" && <PRsScreen {...shared} />}
          {activeTab === "body" && <BodyScreen {...shared} />}
          {activeTab === "nutrition" && (
            <NutritionScreen
              date={date}
              setDate={setDate}
              data={data}
              persist={persist}
              setOverlay={setOverlay}
            />
          )}
          {activeTab === "more" && <MoreScreen {...shared} />}
        </>
      )}

      {/* Full-screen overlays */}
      {overlay?.name === "log" && exById[overlay.exId] && (
        <LogScreen {...shared} ex={exById[overlay.exId]} onBack={() => setOverlay(null)} />
      )}
      {overlay?.name === "pick" && (
        <PickScreen {...shared} onBack={() => setOverlay(null)} onPick={addExerciseToDay} />
      )}
      {overlay?.name === "templates" && (
        <TemplatesScreen {...shared} onBack={() => setOverlay(null)} />
      )}
      {overlay?.name === "goals" && (
        <GoalsScreen {...shared} onBack={() => setOverlay(null)} />
      )}
      {overlay?.name === "copyworkout" && (
        <CopyWorkoutScreen
          data={data}
          exById={exById}
          todayKey={key}
          onBack={() => setOverlay(null)}
          onCopy={copyWorkout}
        />
      )}
      {overlay?.name === "foodpick" && (
        <FoodPickScreen
          onBack={() => setOverlay(null)}
          meal={overlay.meal}
          data={data}
          persist={persist}
          date={date}
        />
      )}

      <TimerBar timer={timer} onDismiss={() => setTimer(null)} />
      {showNav && <BottomNav activeTab={activeTab} onChange={(tab) => setActiveTab(tab)} />}
    </div>
  );
}
