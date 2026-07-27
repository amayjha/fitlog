import { useState } from "react";
import { T, GROUP_COLORS } from "../theme.js";

// Stylized front/back body silhouette, blocky rather than anatomical — consistent with the
// rest of the app's hand-drawn SVG (Graph.jsx, recap sparkline) rather than an image asset.
// Each region maps to one muscle group and is tinted by that group's share of the max volume
// among trained groups this range, mirroring Hevy's "Body View" muscle distribution.
const REGIONS = {
  front: [
    { group: "Shoulders", d: () => <rect x={55} y={58} width={90} height={24} rx={12} /> },
    { group: "Chest", d: () => <rect x={62} y={84} width={76} height={48} rx={14} /> },
    { group: "Core", d: () => <rect x={70} y={134} width={60} height={48} rx={12} /> },
    { group: "Biceps", d: () => <rect x={30} y={88} width={20} height={68} rx={10} /> },
    { group: "Biceps", d: () => <rect x={150} y={88} width={20} height={68} rx={10} />, key: "biceps-r" },
    { group: "Legs", d: () => <rect x={68} y={184} width={28} height={128} rx={14} /> },
    { group: "Legs", d: () => <rect x={104} y={184} width={28} height={128} rx={14} />, key: "legs-r" },
  ],
  back: [
    { group: "Shoulders", d: () => <rect x={55} y={58} width={90} height={24} rx={12} /> },
    { group: "Back", d: () => <rect x={58} y={84} width={84} height={68} rx={16} /> },
    { group: "Triceps", d: () => <rect x={30} y={88} width={20} height={68} rx={10} /> },
    { group: "Triceps", d: () => <rect x={150} y={88} width={20} height={68} rx={10} />, key: "triceps-r" },
    { group: "Legs", d: () => <rect x={68} y={184} width={28} height={128} rx={14} /> },
    { group: "Legs", d: () => <rect x={104} y={184} width={28} height={128} rx={14} />, key: "legs-r" },
  ],
};

const ALL_BODY_GROUPS = new Set([...REGIONS.front, ...REGIONS.back].map((r) => r.group));

export default function MuscleHeatmap({ groups, unit }) {
  const [view, setView] = useState("front");
  const [selected, setSelected] = useState(null);

  const byGroup = Object.fromEntries(groups.map((g) => [g.group, g]));
  const maxVol = Math.max(...groups.map((g) => g.volume), 1);
  const offBody = groups.filter((g) => !ALL_BODY_GROUPS.has(g.group));

  const fillFor = (group) => {
    const g = byGroup[group];
    if (!g) return { fill: T.card2, opacity: 1 };
    const intensity = g.volume / maxVol;
    return { fill: GROUP_COLORS[group] || T.accent, opacity: 0.22 + intensity * 0.78 };
  };

  const sel = selected ? byGroup[selected] : null;

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
        {["front", "back"].map((v) => (
          <button
            key={v}
            className={`chip${view === v ? " active" : ""}`}
            onClick={() => { setView(v); setSelected(null); }}
          >
            {v === "front" ? "Front" : "Back"}
          </button>
        ))}
      </div>

      <svg viewBox="0 0 200 320" style={{ width: "100%", maxWidth: 220, margin: "0 auto", display: "block" }}>
        {/* Head + neck, decorative only */}
        <circle cx={100} cy={30} r={20} fill={T.card2} />
        <rect x={92} y={48} width={16} height={14} fill={T.card2} />
        {REGIONS[view].map((r, i) => {
          const { fill, opacity } = fillFor(r.group);
          const isSel = selected === r.group;
          return (
            <g
              key={r.key || r.group + i}
              onClick={() => setSelected(isSel ? null : r.group)}
              style={{ cursor: "pointer" }}
              fill={fill}
              opacity={opacity}
              stroke={isSel ? T.text : "transparent"}
              strokeWidth={2}
            >
              {r.d()}
            </g>
          );
        })}
      </svg>

      <div style={{ textAlign: "center", color: T.faint, fontSize: 12 }}>Tap a region for its stats</div>

      {sel && (
        <div className="panel" style={{ textAlign: "center", padding: "10px 14px" }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>{selected}</div>
          <div style={{ color: T.label, fontSize: 13, marginTop: 2 }}>
            {sel.sets} sets · {sel.volume.toLocaleString()} {unit}
            {sel.sessions != null ? ` · ${sel.sessions} session${sel.sessions !== 1 ? "s" : ""}` : ""}
          </div>
        </div>
      )}

      {offBody.length > 0 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap" }}>
          {offBody.map((g) => (
            <span key={g.group} className="badge" style={{ background: (GROUP_COLORS[g.group] || T.accent) + "22", color: GROUP_COLORS[g.group] || T.accent }}>
              {g.group} · {g.sets} sets
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
