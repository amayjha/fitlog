import { useRef, useState, useEffect } from "react";
import { T } from "../theme.js";
import { DEFAULT_EXERCISES } from "../data.js";
import { uploadWorkoutsToGoogleDrive } from "../utils/googleDrive.js";
import { isHealthAvailable, wasHealthPermitted, requestHealthPermissions, getRecentWorkouts } from "../utils/health.js";

const ITEMS = [
  { id: "templates", icon: "📋", label: "Templates", desc: "Save and reuse workout routines", color: "#0A84FF" },
  { id: "goals", icon: "🎯", label: "Goals", desc: "Set targets and track progress", color: "#30D158" },
];

/* ── FitNotes category → our group ── */
const CAT_MAP = {
  chest: "Chest", back: "Back", legs: "Legs", shoulders: "Shoulders",
  biceps: "Biceps", triceps: "Triceps", core: "Core", abs: "Core",
  cardio: "Cardio", forearms: "Biceps", calves: "Legs", glutes: "Legs",
  quadriceps: "Legs", hamstrings: "Legs", neck: "Shoulders", traps: "Back",
  "upper back": "Back", "lower back": "Back",
};

/* ── Minimal CSV parser (handles quoted fields) ── */
function parseCSVLine(line) {
  const fields = [];
  let cur = "", inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') { inQ = !inQ; }
    else if (c === "," && !inQ) { fields.push(cur); cur = ""; }
    else { cur += c; }
  }
  fields.push(cur);
  return fields;
}

/* ── Parse FitNotes CSV → merged data ── */
function importFitNotesCSV(csvText, existingData) {
  const lines = csvText.replace(/\r/g, "").trim().split("\n");
  if (lines.length < 2) throw new Error("Empty file");

  const headers = parseCSVLine(lines[0]).map(h => h.trim().toLowerCase());
  const col = (name) => headers.findIndex(h => h.includes(name.toLowerCase()));

  const iDate     = col("date");
  const iExercise = col("exercise");
  const iCategory = col("category");
  const iWtKg     = col("weight (kg)");
  const iWtLbs    = col("weight (lbs)");
  const iReps     = col("reps");
  const iNotes    = col("notes");
  const iKind     = col("kind");

  if (iDate < 0 || iExercise < 0 || iReps < 0) throw new Error("Unrecognised format");

  // Build name→id lookup from existing exercises
  const allEx = [...DEFAULT_EXERCISES, ...existingData.customExercises];
  const nameToId = {};
  for (const ex of allEx) nameToId[ex.name.toLowerCase()] = ex.id;

  const newCustom = [...existingData.customExercises];
  const newWorkouts = {};

  let imported = 0, skipped = 0;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const cells = parseCSVLine(line);

    const kind = iKind >= 0 ? cells[iKind]?.trim() : "wr";
    if (kind !== "wr") { skipped++; continue; } // skip distance/time rows

    const dateStr   = cells[iDate]?.trim();
    const exName    = cells[iExercise]?.trim();
    const category  = cells[iCategory]?.trim() || "";
    const weightKg  = iWtKg  >= 0 ? parseFloat(cells[iWtKg])  : NaN;
    const weightLbs = iWtLbs >= 0 ? parseFloat(cells[iWtLbs]) : NaN;
    const reps      = parseInt(cells[iReps], 10);
    const note      = iNotes >= 0 ? (cells[iNotes]?.trim() || "") : "";

    if (!dateStr || !exName || isNaN(reps) || reps <= 0) { skipped++; continue; }

    const weight = existingData.unit === "lbs"
      ? (isNaN(weightLbs) ? 0 : weightLbs)
      : (isNaN(weightKg)  ? 0 : weightKg);

    // Resolve or create exercise
    const nameLow = exName.toLowerCase();
    if (!nameToId[nameLow]) {
      const group = CAT_MAP[category.toLowerCase()] || "Chest";
      const id = "fi" + Date.now() + "_" + newCustom.length;
      newCustom.push({ id, name: exName, group });
      nameToId[nameLow] = id;
    }
    const exId = nameToId[nameLow];

    if (!newWorkouts[dateStr]) newWorkouts[dateStr] = {};
    if (!newWorkouts[dateStr][exId]) newWorkouts[dateStr][exId] = [];
    newWorkouts[dateStr][exId].push({ w: weight, r: reps, note, ts: Date.now() });
    imported++;
  }

  // Convert to array format and merge with existing workouts
  const merged = { ...existingData.workouts };
  for (const [date, exMap] of Object.entries(newWorkouts)) {
    const incoming = Object.entries(exMap).map(([exId, sets]) => ({ exId, sets, note: "" }));
    if (!merged[date]) {
      merged[date] = incoming;
    } else {
      const existing = [...merged[date]];
      for (const entry of incoming) {
        const idx = existing.findIndex(e => e.exId === entry.exId);
        if (idx >= 0) {
          existing[idx] = { ...existing[idx], sets: [...existing[idx].sets, ...entry.sets] };
        } else {
          existing.push(entry);
        }
      }
      merged[date] = existing;
    }
  }

  return {
    newData: { ...existingData, workouts: merged, customExercises: newCustom },
    stats: { imported, skipped, days: Object.keys(newWorkouts).length },
  };
}

/* ── Build FitNotes-compatible CSV string ── */
export function buildFitNotesCSV(data, allExercises) {
  const exById = Object.fromEntries(allExercises.map(e => [e.id, e]));
  const isKg = data.unit === "kg";
  const round2 = n => Math.round(n * 100) / 100;

  const rows = ["Date,Exercise,Category,Weight (kg),Weight (lbs),Reps,Distance,Distance Unit,Time,Notes,Kind"];
  for (const date of Object.keys(data.workouts).sort()) {
    for (const en of data.workouts[date] || []) {
      const ex = exById[en.exId];
      if (!ex) continue;
      for (const s of en.sets) {
        const weightKg  = isKg ? s.w : round2(s.w / 2.20462);
        const weightLbs = isKg ? round2(s.w * 2.20462) : s.w;
        const note = (s.note || "").replace(/"/g, '""');
        rows.push([
          date,
          `"${ex.name.replace(/"/g, '""')}"`,
          ex.group,
          weightKg.toFixed(2),
          weightLbs.toFixed(2),
          s.reps ?? s.r,
          "", "", "",
          note ? `"${note}"` : "",
          "wr",
        ].join(","));
      }
    }
  }
  return rows.join("\r\n");
}

/* ── Export to FitNotes CSV (download) ── */
function exportFitNotesCSV(data, allExercises) {
  const csv = buildFitNotesCSV(data, allExercises);
  const setCount = csv.split("\r\n").length - 1;
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `FitLog-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  return setCount;
}

export default function MoreScreen({ data, persist, exportData, importData, allExercises, setOverlay }) {
  const jsonRef = useRef(null);
  const csvRef  = useRef(null);
  const [importMsg, setImportMsg] = useState(null);
  const [clearConfirm, setClearConfirm] = useState(false);

  const [healthAvailable, setHealthAvailable] = useState(false);
  const [healthPermitted, setHealthPermitted] = useState(() => wasHealthPermitted());
  const [healthConnecting, setHealthConnecting] = useState(false);
  const [healthImporting, setHealthImporting] = useState(false);

  useEffect(() => {
    isHealthAvailable().then(setHealthAvailable).catch(() => {});
  }, []);

  const handleHealthConnect = async () => {
    setHealthConnecting(true);
    try {
      await requestHealthPermissions();
      setHealthPermitted(true);
    } catch (err) {
      showMsg(err.message || "Could not connect to Health", true);
    } finally {
      setHealthConnecting(false);
    }
  };

  const handleHealthImport = async (days) => {
    setHealthImporting(true);
    try {
      const workouts = await getRecentWorkouts(days);
      if (!workouts.length) {
        showMsg(`No importable workouts found in the last ${days} days`);
        return;
      }

      // Build name → id lookup across default + custom exercises
      const allEx = [...DEFAULT_EXERCISES, ...(data.customExercises || [])];
      const nameToId = {};
      for (const ex of allEx) nameToId[ex.name.toLowerCase()] = ex.id;

      const newCustom = [...(data.customExercises || [])];
      const newWorkouts = { ...data.workouts };

      for (const w of workouts) {
        const nameLow = w.name.toLowerCase();
        if (!nameToId[nameLow]) {
          const id = "h" + Date.now() + "_" + newCustom.length;
          newCustom.push({ id, name: w.name, group: w.group });
          nameToId[nameLow] = id;
        }
        const exId = nameToId[nameLow];

        const noteParts = [];
        if (w.calories) noteParts.push(`${w.calories} kcal`);
        if (w.distanceKm) noteParts.push(`${w.distanceKm} km`);
        noteParts.push("via Health");
        const set = { w: 0, r: w.durationMins, note: noteParts.join(" · "), ts: Date.now() };

        if (!newWorkouts[w.dateKey]) {
          newWorkouts[w.dateKey] = [{ exId, sets: [set], note: "" }];
        } else {
          const day = [...newWorkouts[w.dateKey]];
          const idx = day.findIndex((en) => en.exId === exId);
          if (idx >= 0) {
            const alreadyThere = day[idx].sets.some((s) => s.note?.includes("via Health") && s.r === w.durationMins);
            if (!alreadyThere) day[idx] = { ...day[idx], sets: [...day[idx].sets, set] };
          } else {
            day.push({ exId, sets: [set], note: "" });
          }
          newWorkouts[w.dateKey] = day;
        }
      }

      persist({ ...data, workouts: newWorkouts, customExercises: newCustom });
      showMsg(`Imported ${workouts.length} workout${workouts.length !== 1 ? "s" : ""} from Health`);
    } catch (err) {
      showMsg(err.message || "Health import failed", true);
    } finally {
      setHealthImporting(false);
    }
  };

  const [driveClientId, setDriveClientId] = useState(() => localStorage.getItem("fitlog:gclientid") || "");
  const [clientIdDraft, setClientIdDraft] = useState("");
  const [driveSetupOpen, setDriveSetupOpen] = useState(false);
  const [drivePending, setDrivePending] = useState(false);

  const showMsg = (msg, isErr = false) => {
    setImportMsg({ text: msg, err: isErr });
    setTimeout(() => setImportMsg(null), 4000);
  };

  const saveClientId = () => {
    const id = clientIdDraft.trim();
    if (!id) return;
    localStorage.setItem("fitlog:gclientid", id);
    setDriveClientId(id);
    setDriveSetupOpen(false);
  };

  const handleDriveExport = async () => {
    if (!driveClientId) { setDriveSetupOpen(true); setClientIdDraft(""); return; }
    setDrivePending(true);
    try {
      const csv = buildFitNotesCSV(data, allExercises || []);
      const action = await uploadWorkoutsToGoogleDrive(driveClientId, csv);
      showMsg(`FitLog-Workouts.csv ${action} on Google Drive`);
    } catch (err) {
      showMsg(err.message || "Google Drive upload failed", true);
    } finally {
      setDrivePending(false);
    }
  };

  const handleJsonImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await importData(file);
      showMsg("Data imported successfully");
    } catch {
      showMsg("Import failed — invalid JSON file", true);
    }
    e.target.value = "";
  };

  const handleCSVImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const { newData, stats } = importFitNotesCSV(ev.target.result, data);
        persist(newData);
        showMsg(`Imported ${stats.imported} sets across ${stats.days} day${stats.days !== 1 ? "s" : ""}${stats.skipped ? ` · ${stats.skipped} non-weight rows skipped` : ""}`);
      } catch (err) {
        showMsg(`CSV import failed — ${err.message}`, true);
      }
    };
    reader.readAsText(file);
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

        {/* Export JSON */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontWeight: 600 }}>Export data</div>
            <div style={{ color: T.label, fontSize: 13, marginTop: 2 }}>Download all data as JSON backup</div>
          </div>
          <button className="chip" onClick={exportData}>Export</button>
        </div>

        <div style={{ height: 1, background: T.sep }} />

        {/* Import JSON */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontWeight: 600 }}>Import backup</div>
            <div style={{ color: T.label, fontSize: 13, marginTop: 2 }}>Restore from a FitLog JSON backup</div>
          </div>
          <button className="chip" onClick={() => jsonRef.current?.click()}>Import JSON</button>
          <input ref={jsonRef} type="file" accept=".json" style={{ display: "none" }} onChange={handleJsonImport} />
        </div>

        <div style={{ height: 1, background: T.sep }} />

        {/* Import FitNotes CSV */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600 }}>Import FitNotes</div>
            <div style={{ color: T.label, fontSize: 13, marginTop: 2 }}>
              Import from a FitNotes CSV export · Sets are merged, existing data is kept
            </div>
          </div>
          <button className="chip" style={{ flexShrink: 0 }} onClick={() => csvRef.current?.click()}>Import CSV</button>
          <input ref={csvRef} type="file" accept=".csv,.txt" style={{ display: "none" }} onChange={handleCSVImport} />
        </div>

        <div style={{ height: 1, background: T.sep }} />

        {/* Export FitNotes CSV */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600 }}>Export FitNotes</div>
            <div style={{ color: T.label, fontSize: 13, marginTop: 2 }}>
              Download all workouts as a FitNotes-compatible CSV
            </div>
          </div>
          <button
            className="chip"
            style={{ flexShrink: 0 }}
            onClick={() => {
              const count = exportFitNotesCSV(data, allExercises || []);
              showMsg(`Exported ${count} set${count !== 1 ? "s" : ""} to CSV`);
            }}
          >
            Export CSV
          </button>
        </div>

        {importMsg && (
          <div style={{
            color: importMsg.err ? T.red : T.accent,
            fontSize: 13, lineHeight: 1.4,
            padding: "8px 10px", borderRadius: 10,
            background: importMsg.err ? "rgba(212,80,74,0.08)" : "rgba(192,123,82,0.08)",
          }}>
            {importMsg.err ? "⚠ " : "✓ "}{importMsg.text}
          </div>
        )}

        <div style={{ height: 1, background: T.sep }} />

        {/* Apple Health & Google Health */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600 }}>Apple Health &amp; Google Health</div>
            <div style={{ color: T.label, fontSize: 13, marginTop: 2 }}>
              {!healthAvailable
                ? "Not available — open in the native app"
                : healthPermitted
                ? "Connected · Import workouts from last 7 or 30 days"
                : "Grant access to view daily steps and import workouts"}
            </div>
            {healthPermitted && (
              <div style={{ color: T.faint, fontSize: 12, marginTop: 4 }}>
                Cardio sessions only · Strength training is tracked natively in FitLog
              </div>
            )}
          </div>
          <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
            {!healthPermitted ? (
              <button
                className="chip"
                disabled={!healthAvailable || healthConnecting}
                onClick={handleHealthConnect}
              >
                {healthConnecting ? "Connecting…" : "Connect"}
              </button>
            ) : (
              <>
                <button className="chip" disabled={healthImporting} onClick={() => handleHealthImport(7)}>
                  {healthImporting ? "…" : "7d"}
                </button>
                <button className="chip" disabled={healthImporting} onClick={() => handleHealthImport(30)}>
                  30d
                </button>
              </>
            )}
          </div>
        </div>

        <div style={{ height: 1, background: T.sep }} />

        {/* Google Drive */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600 }}>Save to Google Drive</div>
            <div style={{ color: T.label, fontSize: 13, marginTop: 2 }}>
              Upload all workouts as CSV to your Google Drive
            </div>
          </div>
          <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
            {driveClientId && (
              <button
                className="chip"
                title="Change Client ID"
                onClick={() => { setDriveSetupOpen((o) => !o); setClientIdDraft(driveClientId); }}
              >
                ⚙
              </button>
            )}
            <button
              className="chip"
              disabled={drivePending}
              onClick={handleDriveExport}
            >
              {drivePending ? "Saving…" : driveClientId ? "Save to Drive" : "Set up"}
            </button>
          </div>
        </div>

        {driveSetupOpen && (
          <div style={{ display: "grid", gap: 10, padding: "12px 14px", borderRadius: 12, background: "rgba(238,228,218,0.50)" }}>
            <div style={{ fontWeight: 600, fontSize: 14 }}>Google OAuth Client ID</div>
            <ol style={{ color: T.label, fontSize: 13, lineHeight: 1.6, margin: 0, paddingLeft: 18 }}>
              <li>Go to <strong>console.cloud.google.com</strong> and create a project</li>
              <li>Enable the <strong>Google Drive API</strong></li>
              <li>Create <strong>OAuth 2.0 credentials</strong> → Web Application type</li>
              <li>Add <code style={{ background: "rgba(0,0,0,0.06)", padding: "1px 5px", borderRadius: 4 }}>{window.location.origin}</code> as an authorized JavaScript origin</li>
              <li>Paste the Client ID below</li>
            </ol>
            <input
              className="input"
              placeholder="xxxxxxxx.apps.googleusercontent.com"
              value={clientIdDraft}
              onChange={(e) => setClientIdDraft(e.target.value)}
              autoFocus
            />
            <div style={{ display: "flex", gap: 8 }}>
              <button className="primary" style={{ flex: 1 }} disabled={!clientIdDraft.trim()} onClick={saveClientId}>
                Save
              </button>
              <button className="ghostbtn" onClick={() => setDriveSetupOpen(false)}>Cancel</button>
            </div>
            {driveClientId && (
              <button
                className="ghostbtn"
                style={{ color: T.red, fontSize: 13, textAlign: "left" }}
                onClick={() => { localStorage.removeItem("fitlog:gclientid"); setDriveClientId(""); setDriveSetupOpen(false); }}
              >
                Remove saved Client ID
              </button>
            )}
          </div>
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
