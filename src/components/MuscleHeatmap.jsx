import { useState } from "react";
import { T, GROUP_COLORS } from "../theme.js";

// Front/back body renders (public/muscle/*.jpg) used as the base layer; regions below are
// overlaid on top in the same 1024x1024 pixel space the images were rendered at, tinted by
// each group's share of the max volume among trained groups this range. Untrained regions get
// no overlay at all — the image's own baked-in coloring already reads fine on its own.
const IMAGES = { front: "/muscle/front.jpg", back: "/muscle/back.jpg" };

const REGIONS = {
  front: [
    { group: "Shoulders", d: () => <rect x={320} y={175} width={140} height={90} rx={30} /> },
    { group: "Shoulders", d: () => <rect x={565} y={175} width={140} height={90} rx={30} />, key: "shoulders-r" },
    { group: "Chest", d: () => <rect x={445} y={190} width={140} height={155} rx={30} /> },
    { group: "Core", d: () => <rect x={410} y={345} width={205} height={150} rx={20} /> },
    { group: "Biceps", d: () => <rect x={320} y={195} width={95} height={320} rx={30} /> },
    { group: "Biceps", d: () => <rect x={610} y={195} width={95} height={320} rx={30} />, key: "biceps-r" },
    { group: "Legs", d: () => <rect x={415} y={498} width={88} height={400} rx={30} /> },
    { group: "Legs", d: () => <rect x={500} y={498} width={88} height={400} rx={30} />, key: "legs-r" },
  ],
  back: [
    { group: "Shoulders", d: () => <rect x={355} y={150} width={250} height={70} rx={25} /> },
    { group: "Back", d: () => <rect x={420} y={280} width={185} height={145} rx={20} /> },
    { group: "Triceps", d: () => <rect x={300} y={195} width={95} height={305} rx={30} /> },
    { group: "Triceps", d: () => <rect x={610} y={195} width={95} height={305} rx={30} />, key: "triceps-r" },
    { group: "Legs", d: () => <rect x={405} y={553} width={95} height={355} rx={30} /> },
    { group: "Legs", d: () => <rect x={500} y={553} width={95} height={355} rx={30} />, key: "legs-r" },
  ],
};

const ALL_BODY_GROUPS = new Set([...REGIONS.front, ...REGIONS.back].map((r) => r.group));

export default function MuscleHeatmap({ groups, unit }) {
  const [view, setView] = useState("front");
  const [selected, setSelected] = useState(null);

  const byGroup = Object.fromEntries(groups.map((g) => [g.group, g]));
  const maxVol = Math.max(...groups.map((g) => g.volume), 1);
  const offBody = groups.filter((g) => !ALL_BODY_GROUPS.has(g.group));

  const overlayFor = (group) => {
    const g = byGroup[group];
    if (!g) return null;
    const intensity = g.volume / maxVol;
    return { fill: GROUP_COLORS[group] || T.accent, opacity: 0.35 + intensity * 0.45 };
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

      <svg viewBox="0 0 1024 1024" style={{ width: "100%", maxWidth: 260, margin: "0 auto", display: "block" }}>
        <image href={IMAGES[view]} x={0} y={0} width={1024} height={1024} preserveAspectRatio="xMidYMid slice" />
        {REGIONS[view].map((r, i) => {
          const overlay = overlayFor(r.group);
          const isSel = selected === r.group;
          return (
            <g
              key={r.key || r.group + i}
              onClick={() => setSelected(isSel ? null : r.group)}
              style={{ cursor: "pointer" }}
              fill={overlay ? overlay.fill : "transparent"}
              opacity={overlay ? overlay.opacity : 1}
              stroke={isSel ? "#fff" : "transparent"}
              strokeWidth={6}
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
