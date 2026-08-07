import { useState, useEffect, useRef, useMemo } from "react";
import { buildCss, applyTheme, DEFAULT_THEME } from "./theme.js";
import { dkey, e1rm } from "./utils.js";
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
import SummaryScreen from "./screens/SummaryScreen.jsx";
import ShareWorkoutScreen from "./screens/ShareWorkoutScreen.jsx";
import CommunityScreen from "./screens/CommunityScreen.jsx";
import RecapScreen from "./screens/RecapScreen.jsx";
import Walkthrough from "./components/Walkthrough.jsx";
import { loadBgImage, saveBgImage, clearBgImage } from "./utils/background.js";
import { supabase } from "./utils/supabaseClient.js";
import { getItemSync, setItem } from "./lib/storage.js";
import { applyStatusBarForTheme, exitApp, hideSplashScreen, onBackButton } from "./lib/nativeInit.js";

/* ── Main App ── */
export default function App() {
  const [data, setData] = useState(loadData);
  const [date, setDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState("today");
  const [overlay, setOverlay] = useState(null); // { name, ...params }
  const [timer, setTimer] = useState(null);
  const [tourActive, setTourActive] = useState(() => {
    try { return getItemSync(STORAGE_KEY) === null; }
    catch { return false; }
  });
  const [bgImage, setBgImage] = useState(loadBgImage);
  const [bgError, setBgError] = useState(null);
  const [themeName, setThemeName] = useState(() => {
    let name = DEFAULT_THEME;
    try { name = getItemSync("fitlog:theme") || DEFAULT_THEME; } catch {}
    applyTheme(name); // mutate the shared T object before first render, so there's no flash of the wrong theme
    return name;
  });
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [authNotice, setAuthNotice] = useState(null);
  const timerRef = useRef(null);
  const saveTimeout = useRef(null);
  const dataRef = useRef(data);

  /* ── Auth / Community session ── */
  const loadProfile = async (userId) => {
    const { data: row, error } = await supabase.from("profiles").select("*").eq("id", userId).single();
    setProfile(error ? null : row);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (s) loadProfile(s.user.id);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s) loadProfile(s.user.id); else setProfile(null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  /* ── Native: status bar + splash (once), back button (re-armed on nav state change) ── */
  useEffect(() => {
    applyStatusBarForTheme(themeName);
    // Wait a tiny bit for the first React paint before hiding the splash screen
    // to prevent the white flash.
    setTimeout(() => {
      hideSplashScreen();
    }, 100);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => onBackButton(() => {
    if (overlay) setOverlay(null);
    else if (activeTab !== "today") setActiveTab("today");
    else exitApp();
  }), [overlay, activeTab]);

  const signUp = async (email, password, username) => {
    setAuthBusy(true);
    setAuthError(null);
    setAuthNotice(null);
    const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { username } } });
    if (error) setAuthError(error.message);
    else if (!data.session) setAuthNotice("Check your email to confirm your account, then sign in.");
    setAuthBusy(false);
  };

  const signIn = async (email, password) => {
    setAuthBusy(true);
    setAuthError(null);
    setAuthNotice(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setAuthError(error.message);
    setAuthBusy(false);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  /* ── Persistence ── */
  const persist = (next) => {
    dataRef.current = next;
    setData(next);
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(async () => {
      try { await setItem(STORAGE_KEY, JSON.stringify(next)); }
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
    const d = dataRef.current;
    const entries = d.workouts[key] || [];
    if (!entries.find((e) => e.exId === exId)) {
      persist({ ...d, workouts: { ...d.workouts, [key]: [...entries, { exId, sets: [], note: "" }] } });
    }
    setOverlay({ name: "log", exId });
  };

  const addSet = (exId, w, r, note = "") => {
    const d = dataRef.current;
    const entries = (d.workouts[key] || []).map((en) =>
      en.exId === exId ? { ...en, sets: [...en.sets, { w, r, note, ts: Date.now() }] } : en
    );
    persist({ ...d, workouts: { ...d.workouts, [key]: entries }, lastSet: { ...d.lastSet, [exId]: { w, r } } });
  };

  const updateSet = (exId, idx, w, r, note) => {
    const d = dataRef.current;
    const entries = (d.workouts[key] || []).map((en) =>
      en.exId === exId
        ? { ...en, sets: en.sets.map((s, i) => (i === idx ? { ...s, w, r, note } : s)) }
        : en
    );
    persist({ ...d, workouts: { ...d.workouts, [key]: entries } });
  };

  const deleteSet = (exId, idx) => {
    const d = dataRef.current;
    const entries = (d.workouts[key] || []).map((en) =>
      en.exId === exId ? { ...en, sets: en.sets.filter((_, i) => i !== idx) } : en
    );
    persist({ ...d, workouts: { ...d.workouts, [key]: entries } });
  };

  const removeExerciseFromDay = (exId) => {
    const d = dataRef.current;
    const entries = (d.workouts[key] || []).filter((en) => en.exId !== exId);
    const w = { ...d.workouts };
    if (entries.length) w[key] = entries; else delete w[key];
    persist({ ...d, workouts: w });
    setOverlay(null);
  };

  const setExerciseNote = (exId, note) => {
    const d = dataRef.current;
    const entries = (d.workouts[key] || []).map((en) =>
      en.exId === exId ? { ...en, note } : en
    );
    persist({ ...d, workouts: { ...d.workouts, [key]: entries } });
  };

  const copyWorkout = (selections) => {
    const d = dataRef.current;
    const today = [...(d.workouts[key] || [])];
    for (const { exId, sets } of selections) {
      const idx = today.findIndex(e => e.exId === exId);
      const stamped = sets.map(s => ({ ...s, ts: Date.now() }));
      if (idx >= 0) {
        today[idx] = { ...today[idx], sets: [...today[idx].sets, ...stamped] };
      } else {
        today.push({ exId, sets: stamped, note: "" });
      }
    }
    persist({ ...d, workouts: { ...d.workouts, [key]: today } });
    setOverlay(null);
  };

  const addCustomExercise = (name, group) => {
    const d = dataRef.current;
    const ex = { id: "c" + Date.now(), name: name.trim(), group };
    persist({ ...d, customExercises: [...d.customExercises, ex] });
    return ex.id;
  };

  const setWorkoutNote = (note) => {
    const d = dataRef.current;
    persist({ ...d, workoutNotes: { ...d.workoutNotes, [key]: note } });
  };

  /* ── Templates ── */
  const saveTemplate = (name, exIds) => {
    const d = dataRef.current;
    const tpl = { id: "t" + Date.now(), name: name.trim(), exIds, created: Date.now() };
    persist({ ...d, templates: [...d.templates, tpl] });
  };

  const deleteTemplate = (id) => {
    const d = dataRef.current;
    persist({ ...d, templates: d.templates.filter((t) => t.id !== id) });
  };

  const applyTemplate = (tpl) => {
    const d = dataRef.current;
    const existing = d.workouts[key] || [];
    const existingIds = new Set(existing.map((en) => en.exId));
    const toAdd = tpl.exIds.filter((id) => !existingIds.has(id) && exById[id]);
    if (!toAdd.length) return 0;
    const newEntries = [...existing, ...toAdd.map((exId) => ({ exId, sets: [], note: "" }))];
    persist({ ...d, workouts: { ...d.workouts, [key]: newEntries } });
    return toAdd.length;
  };

  /* ── Goals ── */
  const addGoal = (exId, type, target) => {
    const d = dataRef.current;
    const goal = { id: "g" + Date.now(), exId, type, target, created: Date.now(), achieved: null };
    persist({ ...d, goals: [...d.goals, goal] });
  };

  const deleteGoal = (id) => {
    const d = dataRef.current;
    persist({ ...d, goals: d.goals.filter((g) => g.id !== id) });
  };

  const markGoalAchieved = (id) => {
    const d = dataRef.current;
    persist({ ...d, goals: d.goals.map((g) => g.id === id ? { ...g, achieved: Date.now() } : g) });
  };

  /* ── Body measurements ── */
  const addBodyEntry = (measurement) => {
    const d = dataRef.current;
    persist({ ...d, body: [...d.body, { d: dkey(new Date()), ...measurement }] });
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

  /* ── Walkthrough ── */
  const startTour = () => {
    setOverlay(null);
    setActiveTab("today");
    setTourActive(true);
  };

  const finishTour = () => {
    setTourActive(false);
    persist(dataRef.current); // ensures storage key exists so the tour won't auto-start again
  };

  /* ── Background image ── */
  const setBackgroundImage = async (file) => {
    setBgError(null);
    try {
      const dataUrl = await saveBgImage(file);
      setBgImage(dataUrl);
    } catch (e) {
      setBgError(e.message || "Could not set background image");
    }
  };

  const resetBackgroundImage = () => {
    clearBgImage();
    setBgImage(null);
    setBgError(null);
  };

  /* ── Theme ── */
  const changeTheme = (name) => {
    applyTheme(name); // mutate T synchronously so the upcoming re-render already sees the new colors
    setThemeName(name);
    setItem("fitlog:theme", name).catch(() => {});
    applyStatusBarForTheme(name);
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

  /* ── Shared props ── */
  const shared = {
    data, persist, date, setDate, key, todayEntries, allExercises, exById, bestByExercise,
    addExerciseToDay, addSet, updateSet, deleteSet, removeExerciseFromDay,
    setExerciseNote, addCustomExercise, copyWorkout, setWorkoutNote,
    saveTemplate, deleteTemplate, applyTemplate,
    addGoal, deleteGoal, markGoalAchieved, addBodyEntry,
    exportData, importData, startTimer,
    setOverlay, setActiveTab, startTour,
    bgImage, bgError, setBackgroundImage, resetBackgroundImage,
    themeName, changeTheme,
    session, profile, authBusy, authError, authNotice, signUp, signIn, signOut,
  };

  const showNav = !overlay;

  return (
    <div className="app" style={bgImage ? { backgroundImage: `url(${bgImage})` } : undefined}>
      <style>{buildCss()}</style>

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
      {overlay?.name === "summary" && (
        <SummaryScreen data={data} exById={exById} onBack={() => setOverlay(null)} />
      )}
      {overlay?.name === "share" && (
        <ShareWorkoutScreen data={data} exById={exById} date={date} todayEntries={todayEntries} bestByExercise={bestByExercise} onBack={() => setOverlay(null)} />
      )}
      {overlay?.name === "community" && (
        <CommunityScreen {...shared} onBack={() => setOverlay(null)} />
      )}
      {overlay?.name === "recap" && (
        <RecapScreen {...shared} onBack={() => setOverlay(null)} />
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

      <Walkthrough
        active={tourActive}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onFinish={finishTour}
      />
    </div>
  );
}
