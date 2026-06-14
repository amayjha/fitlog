import { useState, useMemo } from "react";
import { T } from "../theme.js";
import { round1 } from "../utils.js";
import Stepper from "../components/Stepper.jsx";
import Graph from "../components/Graph.jsx";

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
  const [tab, setTab] = useState("weight");
  const [values, setValues] = useState({ ...DEFAULTS });

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
        {latest && (
          <div style={{ textAlign: "right" }}>
            <div style={{ fontWeight: 700, fontSize: 18, color: COLORS[tab] }}>
              {round1(latest[tab])} {mUnit}
            </div>
            <div style={{ color: T.faint, fontSize: 11 }}>Latest</div>
          </div>
        )}
      </header>

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
    </div>
  );
}
