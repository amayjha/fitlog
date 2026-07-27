import { useMemo, useRef, useState } from "react";
import { T } from "../theme.js";
import { dkey, round1 } from "../utils.js";
import Stepper from "../components/Stepper.jsx";
import Graph from "../components/Graph.jsx";
import { addBodyPhoto, getBodyPhotos, removeBodyPhoto } from "../utils/bodyPhotos.js";

const MEASUREMENTS = [
  { key: "weight", label: "Body Weight", unitFn: (u) => u },
  { key: "bodyFat", label: "Body Fat", unitFn: () => "%" },
  { key: "waist", label: "Waist", unitFn: (u) => (u === "kg" ? "cm" : "in") },
  { key: "hips", label: "Hips", unitFn: (u) => (u === "kg" ? "cm" : "in") },
  { key: "chest", label: "Chest", unitFn: (u) => (u === "kg" ? "cm" : "in") },
  { key: "arms", label: "Arms", unitFn: (u) => (u === "kg" ? "cm" : "in") },
  { key: "thighs", label: "Thighs", unitFn: (u) => (u === "kg" ? "cm" : "in") },
];

const COLORS = {
  weight: "#FF9F0A",
  bodyFat: "#FF375F",
  waist: "#5AC8F5",
  hips: "#BF5AF2",
  chest: "#FF375F",
  arms: "#30D158",
  thighs: "#0A84FF",
};

const DEFAULTS = { weight: 70, bodyFat: 20, waist: 80, hips: 90, chest: 95, arms: 35, thighs: 55 };

export default function BodyScreen({ data, addBodyEntry }) {
  const [mode, setMode] = useState("measure"); // "measure" | "photos"
  const [tab, setTab] = useState("weight");
  const [values, setValues] = useState({ ...DEFAULTS });

  const [photos, setPhotos] = useState(() => getBodyPhotos());
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoError, setPhotoError] = useState(null);
  const [viewingPhoto, setViewingPhoto] = useState(null);
  const photoRef = useRef(null);

  const handlePhotoSelect = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setPhotoBusy(true);
    setPhotoError(null);
    try {
      await addBodyPhoto(file, dkey(new Date()));
      setPhotos(getBodyPhotos());
    } catch (err) {
      setPhotoError(err.message || "Could not save photo");
    } finally {
      setPhotoBusy(false);
    }
  };

  const handleDeletePhoto = (id) => {
    removeBodyPhoto(id);
    setPhotos(getBodyPhotos());
    setViewingPhoto(null);
  };

  const unit = data.unit;
  const mDef = MEASUREMENTS.find((m) => m.key === tab);
  const mUnit = mDef?.unitFn(unit) || unit;

  const sorted = useMemo(() => [...data.body].sort((a, b) => (a.d > b.d ? -1 : 1)), [data.body]);
  const graphData = useMemo(
    () =>
      [...data.body]
        .filter((b) => b[tab] != null)
        .sort((a, b) => (a.d > b.d ? 1 : -1))
        .map((b) => ({ k: b.d, best: b[tab] })),
    [data.body, tab]
  );

  const latest = sorted.find((b) => b[tab] != null);

  const handleAdd = () => {
    if (!values[tab]) return;
    addBodyEntry({ [tab]: values[tab] });
  };

  const stepSize = tab === "weight" ? 0.1 : tab === "bodyFat" ? 0.1 : 0.5;

  return (
    <div className="screen">
      <header className="header">
        <div>
          <div className="brand">FITLOG</div>
          <div style={{ fontWeight: 700, fontSize: 17 }}>Body Tracker</div>
        </div>
        {mode === "measure" && latest && (
          <div style={{ textAlign: "right" }}>
            <div style={{ fontWeight: 700, fontSize: 18, color: COLORS[tab] }}>
              {round1(latest[tab])} {mUnit}
            </div>
            <div style={{ color: T.faint, fontSize: 11 }}>Latest</div>
          </div>
        )}
      </header>

      {/* Measurements / Photos toggle */}
      <div style={{ display: "flex", gap: 6 }}>
        {[["measure", "Measurements"], ["photos", "Photos"]].map(([m, label]) => (
          <button key={m} className={`chip${mode === m ? " active" : ""}`} onClick={() => setMode(m)}>
            {label}
          </button>
        ))}
      </div>

      {mode === "measure" ? (
        <>
          {/* Measurement tabs */}
          <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }}>
            {MEASUREMENTS.map((m) => (
              <button
                key={m.key}
                className={`chip${tab === m.key ? " active" : ""}`}
                style={{ flexShrink: 0, borderColor: tab === m.key ? COLORS[m.key] : T.sep, color: tab === m.key ? T.text : T.label }}
                onClick={() => setTab(m.key)}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Input panel */}
          <div className="panel" style={{ display: "grid", gap: 14 }}>
            <Stepper
              label={`${mDef?.label.toUpperCase()} (${mUnit})`}
              value={values[tab]}
              onChange={(v) => setValues((prev) => ({ ...prev, [tab]: v }))}
              onMinus={() => setValues((prev) => ({ ...prev, [tab]: round1(Math.max(0, prev[tab] - stepSize)) }))}
              onPlus={() => setValues((prev) => ({ ...prev, [tab]: round1(prev[tab] + stepSize) }))}
              min={0}
            />
            <button className="primary" onClick={handleAdd}>
              Log {mDef?.label}
            </button>
          </div>

          {/* Graph */}
          {graphData.length >= 2 && (
            <Graph
              history={graphData}
              unit={mUnit}
              color={COLORS[tab]}
              label={`${mDef?.label} over time`}
            />
          )}

          {/* History */}
          {sorted.filter((b) => b[tab] != null).length > 0 && (
            <>
              <div style={{ color: T.faint, fontSize: 11, letterSpacing: 2, textTransform: "uppercase", fontWeight: 700 }}>
                History
              </div>
              {sorted
                .filter((b) => b[tab] != null)
                .slice(0, 20)
                .map((b, i) => (
                  <div key={i} className="setrow">
                    <span style={{ flex: 1, color: T.label }}>
                      {new Date(b.d + "T12:00:00").toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                    <span className="bignum">{round1(b[tab])}</span>
                    <span style={{ color: T.label, marginLeft: 4 }}>{mUnit}</span>
                  </div>
                ))}
            </>
          )}

          {sorted.filter((b) => b[tab] != null).length === 0 && (
            <div className="empty">No {mDef?.label.toLowerCase()} entries yet.</div>
          )}
        </>
      ) : (
        <>
          <button className="primary" disabled={photoBusy} onClick={() => photoRef.current?.click()}>
            {photoBusy ? "Saving…" : "+ Add Progress Photo"}
          </button>
          <input ref={photoRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={handlePhotoSelect} />

          {photoError && (
            <div style={{ color: T.red, fontSize: 13, lineHeight: 1.4, padding: "8px 10px", borderRadius: 10, background: "rgba(212,80,74,0.08)" }}>
              ⚠ {photoError}
            </div>
          )}

          {photos.length === 0 ? (
            <div className="empty">No progress photos yet. Add one to start your timeline.</div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
              {photos.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setViewingPhoto(p)}
                  style={{ padding: 0, border: "none", borderRadius: 12, overflow: "hidden", position: "relative", aspectRatio: "3 / 4", cursor: "pointer" }}
                >
                  <img src={p.dataUrl} alt={p.date} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                  <span style={{
                    position: "absolute", left: 4, bottom: 4, right: 4,
                    background: "rgba(0,0,0,0.55)", color: "#fff", fontSize: 10, fontWeight: 600,
                    borderRadius: 6, padding: "2px 5px", textAlign: "center",
                  }}>
                    {new Date(p.date + "T12:00:00").toLocaleDateString(undefined, { day: "numeric", month: "short" })}
                  </span>
                </button>
              ))}
            </div>
          )}

          {viewingPhoto && (
            <div
              style={{
                position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 300,
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: 20,
              }}
              onClick={() => setViewingPhoto(null)}
            >
              <img
                src={viewingPhoto.dataUrl}
                alt={viewingPhoto.date}
                style={{ maxWidth: "100%", maxHeight: "70vh", borderRadius: 12, objectFit: "contain" }}
                onClick={(e) => e.stopPropagation()}
              />
              <div style={{ color: "#fff", fontWeight: 600 }}>
                {new Date(viewingPhoto.date + "T12:00:00").toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
              </div>
              <div style={{ display: "flex", gap: 10 }} onClick={(e) => e.stopPropagation()}>
                <button className="primary secondary" onClick={() => setViewingPhoto(null)}>Close</button>
                <button className="primary danger" onClick={() => handleDeletePhoto(viewingPhoto.id)}>Delete</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
