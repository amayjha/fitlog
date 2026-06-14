import { useRef, useState } from "react";
import { T } from "../theme.js";

const ITEMS = [
  { id: "templates", icon: "📋", label: "Templates", desc: "Save and reuse workout routines", color: "#0A84FF" },
  { id: "goals", icon: "🎯", label: "Goals", desc: "Set targets and track progress", color: "#30D158" },
  { id: "calculators", icon: "🧮", label: "Calculators", desc: "1RM · Plates · Percentages", color: "#FF9F0A" },
];

export default function MoreScreen({ data, persist, exportData, importData, setOverlay }) {
  const fileRef = useRef(null);
  const [importMsg, setImportMsg] = useState(null);
  const [clearConfirm, setClearConfirm] = useState(false);
  const { EMPTY_DATA, STORAGE_KEY } = { EMPTY_DATA: { workouts: {}, customExercises: [], templates: [], goals: [], body: [], unit: "kg", lastSet: {}, workoutNotes: {} }, STORAGE_KEY: "fitlog:v1" };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await importData(file);
      setImportMsg("Data imported successfully");
    } catch {
      setImportMsg("Import failed — invalid file");
    }
    setTimeout(() => setImportMsg(null), 3000);
    e.target.value = "";
  };

  const handleClear = () => {
    if (clearConfirm) {
      localStorage.removeItem("fitlog:v1");
      window.location.reload();
    } else {
      setClearConfirm(true);
      setTimeout(() => setClearConfirm(false), 3000);
    }
  };

  const totalWorkouts = Object.values(data.workouts).filter((e) => e.length > 0).length;
  const totalSets = Object.values(data.workouts).flatMap((entries) => entries.flatMap((en) => en.sets)).length;

  return (
    <div className="screen">
      <header className="header">
        <div>
          <div className="brand">FITLOG</div>
          <div style={{ fontWeight: 700, fontSize: 17 }}>More</div>
        </div>
      </header>

      {/* Quick stats */}
      <div className="panel" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, textAlign: "center" }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 22, color: T.accent }}>{totalWorkouts}</div>
          <div style={{ color: T.faint, fontSize: 11, marginTop: 2 }}>WORKOUTS</div>
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 22, color: T.accent }}>{totalSets}</div>
          <div style={{ color: T.faint, fontSize: 11, marginTop: 2 }}>TOTAL SETS</div>
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 22, color: T.accent }}>{data.templates?.length || 0}</div>
          <div style={{ color: T.faint, fontSize: 11, marginTop: 2 }}>TEMPLATES</div>
        </div>
      </div>

      {/* Navigation items */}
      {ITEMS.map((item) => (
        <button key={item.id} className="more-item" onClick={() => setOverlay({ name: item.id })}>
          <div className="more-icon" style={{ background: item.color + "22" }}>
            <span>{item.icon}</span>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700 }}>{item.label}</div>
            <div style={{ color: T.label, fontSize: 13, marginTop: 2 }}>{item.desc}</div>
          </div>
          <span style={{ color: T.faint }}>›</span>
        </button>
      ))}

      {/* Settings */}
      <div style={{ color: T.faint, fontSize: 11, letterSpacing: 2, textTransform: "uppercase", fontWeight: 700, marginTop: 8 }}>
        Settings
      </div>

      <div className="panel" style={{ display: "grid", gap: 12 }}>
        {/* Unit toggle */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontWeight: 600 }}>Weight unit</div>
            <div style={{ color: T.label, fontSize: 13, marginTop: 2 }}>Used for all exercises and body tracking</div>
          </div>
          <button
            className="chip active"
            style={{ minWidth: 56, justifyContent: "center" }}
            onClick={() => persist({ ...data, unit: data.unit === "kg" ? "lbs" : "kg" })}
          >
            {data.unit}
          </button>
        </div>

        <div style={{ height: 1, background: T.sep }} />

        {/* Export */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontWeight: 600 }}>Export data</div>
            <div style={{ color: T.label, fontSize: 13, marginTop: 2 }}>Download all your data as JSON</div>
          </div>
          <button className="chip" onClick={exportData}>Export</button>
        </div>

        <div style={{ height: 1, background: T.sep }} />

        {/* Import */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontWeight: 600 }}>Import data</div>
            <div style={{ color: T.label, fontSize: 13, marginTop: 2 }}>Restore from a backup file</div>
          </div>
          <button className="chip" onClick={() => fileRef.current?.click()}>Import</button>
          <input ref={fileRef} type="file" accept=".json" style={{ display: "none" }} onChange={handleImport} />
        </div>

        {importMsg && (
          <div style={{ color: importMsg.includes("success") ? T.accent : T.red, fontSize: 13 }}>{importMsg}</div>
        )}

        <div style={{ height: 1, background: T.sep }} />

        {/* Clear data */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontWeight: 600, color: T.red }}>Clear all data</div>
            <div style={{ color: T.label, fontSize: 13, marginTop: 2 }}>This cannot be undone</div>
          </div>
          <button
            className="chip"
            style={{ borderColor: T.red, color: clearConfirm ? T.red : T.faint }}
            onClick={handleClear}
          >
            {clearConfirm ? "Confirm?" : "Clear"}
          </button>
        </div>
      </div>

      <div style={{ color: T.faint, fontSize: 11, textAlign: "center", marginTop: 4 }}>
        FitLog v1.0 · All data stored locally on this device
      </div>
    </div>
  );
}
