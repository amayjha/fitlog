import { useState } from "react";
import { T } from "../theme.js";
import { e1rm, e1rmBrzycki, e1rmLander, e1rmLombardi, e1rmOConner, round1, round25 } from "../utils.js";
import Stepper from "../components/Stepper.jsx";

/* ── 1RM Calculator ── */
function OneRMCalc({ unit }) {
  const [w, setW] = useState(80);
  const [r, setR] = useState(5);

  const formulas = [
    { name: "Epley", fn: e1rm },
    { name: "Brzycki", fn: e1rmBrzycki },
    { name: "Lander", fn: e1rmLander },
    { name: "Lombardi", fn: e1rmLombardi },
    { name: "O'Conner", fn: e1rmOConner },
  ];

  const step = (setter, val, delta, min) =>
    setter(Math.max(min, round1(val + delta)));

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div className="panel" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
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

      <div style={{ color: T.faint, fontSize: 12, textAlign: "center" }}>
        Estimated 1RM using {formulas.length} formulas
      </div>

      {formulas.map((f) => {
        const val = round1(f.fn(w, r));
        return (
          <div key={f.name} className="setrow" style={{ justifyContent: "space-between" }}>
            <span style={{ color: T.label, width: 100 }}>{f.name}</span>
            <span className="bignum" style={{ color: T.accent }}>{val}</span>
            <span style={{ color: T.label }}>{unit}</span>
          </div>
        );
      })}

      <div className="panel" style={{ fontSize: 13, color: T.label, lineHeight: 1.5 }}>
        <strong style={{ color: T.text }}>Epley</strong> is the most widely used formula.
        Results are estimates — actual 1RM may vary based on technique and fatigue.
      </div>
    </div>
  );
}

/* ── Plate Calculator ── */
function PlateCalc({ unit }) {
  const [target, setTarget] = useState(unit === "kg" ? 100 : 225);
  const [barWeight, setBarWeight] = useState(unit === "kg" ? 20 : 45);
  const [useWomen, setUseWomen] = useState(false);

  const kgPlates = [25, 20, 15, 10, 5, 2.5, 1.25];
  const lbsPlates = [45, 35, 25, 10, 5, 2.5, 1.25];
  const plates = unit === "kg" ? kgPlates : lbsPlates;

  const calcPlates = () => {
    let remaining = round1((target - barWeight) / 2);
    if (remaining <= 0) return { valid: false, plates: [] };
    const result = [];
    for (const p of plates) {
      while (remaining >= p - 0.001) {
        result.push(p);
        remaining = round1(remaining - p);
      }
    }
    if (remaining > 0.001) return { valid: false, plates: result, leftover: remaining };
    return { valid: true, plates: result };
  };

  const result = calcPlates();
  const plateColors = {
    45: "#FF375F", 25: "#0A84FF",
    35: "#FF9F0A", 20: "#0A84FF",
    10: "#30D158", 15: "#FFD60A",
    5: "#8E8E93",
    2.5: "#FF9F0A",
    1.25: "#636366",
  };

  const barOptions = unit === "kg"
    ? [{ label: "20 kg (Olympic)", v: 20 }, { label: "15 kg (Women's)", v: 15 }, { label: "10 kg (Training)", v: 10 }]
    : [{ label: "45 lbs (Olympic)", v: 45 }, { label: "35 lbs (Women's)", v: 35 }, { label: "25 lbs (Training)", v: 25 }];

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div className="panel" style={{ display: "grid", gap: 10 }}>
        <Stepper
          label={`TARGET WEIGHT (${unit})`} value={target}
          onMinus={() => setTarget((v) => Math.max(barWeight, round1(v - 2.5)))}
          onPlus={() => setTarget((v) => round1(v + 2.5))}
          onChange={(v) => setTarget(Math.max(0, v))}
        />
        <div>
          <div style={{ color: T.faint, fontSize: 12, marginBottom: 6 }}>Bar weight</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {barOptions.map((o) => (
              <button
                key={o.v}
                className={`chip${barWeight === o.v ? " active" : ""}`}
                onClick={() => setBarWeight(o.v)}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Plates per side */}
      {target > barWeight && (
        <div className="panel">
          <div style={{ color: T.faint, fontSize: 12, marginBottom: 10 }}>
            Plates per side — {round1((target - barWeight) / 2)} {unit} each side
          </div>

          {result.plates.length > 0 ? (
            <>
              {/* Visual bar representation */}
              <div style={{ display: "flex", alignItems: "center", gap: 3, justifyContent: "center", marginBottom: 12, flexWrap: "wrap" }}>
                {/* Collar side */}
                {[...result.plates].reverse().map((p, i) => (
                  <div
                    key={`left-${i}`}
                    style={{
                      background: plateColors[p] || T.label,
                      height: 32 + (p >= 20 ? 20 : p >= 10 ? 12 : p >= 5 ? 4 : 0),
                      width: p >= 20 ? 16 : p >= 10 ? 13 : p >= 5 ? 10 : 8,
                      borderRadius: 3,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: p >= 10 ? 9 : 7,
                      fontWeight: 800,
                      color: p >= 5 && p <= 15 ? "#000" : "#fff",
                      writingMode: "vertical-rl",
                    }}
                  >
                    {p}
                  </div>
                ))}
                {/* Bar */}
                <div style={{ background: T.label, height: 10, width: 80, borderRadius: 3, flexShrink: 0 }} />
                {/* Right side */}
                {result.plates.map((p, i) => (
                  <div
                    key={`right-${i}`}
                    style={{
                      background: plateColors[p] || T.label,
                      height: 32 + (p >= 20 ? 20 : p >= 10 ? 12 : p >= 5 ? 4 : 0),
                      width: p >= 20 ? 16 : p >= 10 ? 13 : p >= 5 ? 10 : 8,
                      borderRadius: 3,
                    }}
                  />
                ))}
              </div>

              {/* Plate list */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {result.plates.map((p, i) => (
                  <span
                    key={i}
                    className="chip"
                    style={{ background: plateColors[p] + "22", borderColor: plateColors[p], color: T.text, fontSize: 14, fontWeight: 700 }}
                  >
                    {p} {unit}
                  </span>
                ))}
              </div>
            </>
          ) : (
            <div style={{ color: T.label, fontSize: 13 }}>No plates needed — use bar only</div>
          )}

          {result.leftover > 0 && (
            <div style={{ color: T.red, fontSize: 13, marginTop: 8 }}>
              ⚠ Cannot make exact weight — {result.leftover} {unit} short
            </div>
          )}
        </div>
      )}

      {target <= barWeight && (
        <div className="panel" style={{ color: T.label, fontSize: 13 }}>
          Target weight must be greater than bar weight ({barWeight} {unit}).
        </div>
      )}
    </div>
  );
}

/* ── Percentages Calculator ── */
function PctCalc({ unit }) {
  const [oneRM, setOneRM] = useState(100);
  const [round, setRound] = useState(true);

  const percentages = [40, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100];
  const repGuide = { 40: "20+", 50: "15+", 55: "12", 60: "10", 65: "8", 70: "6", 75: "5", 80: "4", 85: "3", 90: "2", 95: "1-2", 100: "1" };

  const calcWeight = (pct) => {
    const raw = (oneRM * pct) / 100;
    return round ? round25(raw) : round1(raw);
  };

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div className="panel" style={{ display: "grid", gap: 12 }}>
        <Stepper
          label={`1RM (${unit})`} value={oneRM}
          onMinus={() => setOneRM((v) => Math.max(0, round1(v - 2.5)))}
          onPlus={() => setOneRM((v) => round1(v + 2.5))}
          onChange={(v) => setOneRM(Math.max(0, v))}
        />
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            className={`chip${round ? " active" : ""}`}
            onClick={() => setRound((o) => !o)}
          >
            Round to 2.5 {unit}
          </button>
        </div>
      </div>

      <div style={{ color: T.faint, fontSize: 12, letterSpacing: 1, textTransform: "uppercase" }}>
        Training weights
      </div>

      {percentages.map((pct) => {
        const weight = calcWeight(pct);
        const isMax = pct === 100;
        return (
          <div
            key={pct}
            className="setrow"
            style={{ background: isMax ? T.cardHi : T.card }}
          >
            <span style={{ color: T.faint, width: 38, fontSize: 13 }}>{pct}%</span>
            <span className="bignum" style={{ color: isMax ? T.accent : T.text }}>{weight}</span>
            <span style={{ color: T.label, marginLeft: 4 }}>{unit}</span>
            <span style={{ flex: 1 }} />
            <span style={{ color: T.faint, fontSize: 12 }}>{repGuide[pct]} reps</span>
          </div>
        );
      })}
    </div>
  );
}

/* ── Main Calculators Screen ── */
export default function CalculatorsScreen({ data, onBack }) {
  const [tab, setTab] = useState("1rm");
  const unit = data.unit;

  return (
    <div className="screen">
      <header className="header">
        <button className="ghostbtn" onClick={onBack}>‹ Back</button>
        <div style={{ fontWeight: 700, letterSpacing: 2, fontSize: 13 }}>CALCULATORS</div>
        <span style={{ width: 60 }} />
      </header>

      <div className="tabs">
        {[["1rm", "1RM"], ["plates", "PLATES"], ["pct", "% TABLE"]].map(([id, label]) => (
          <button
            key={id}
            className={`tab${tab === id ? " active" : ""}`}
            onClick={() => setTab(id)}
            style={{ borderBottomColor: tab === id ? T.accent : "transparent" }}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "1rm" && <OneRMCalc unit={unit} />}
      {tab === "plates" && <PlateCalc unit={unit} />}
      {tab === "pct" && <PctCalc unit={unit} />}
    </div>
  );
}
