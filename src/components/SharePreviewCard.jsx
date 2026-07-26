import { fmtDate, round1 } from "../utils.js";
import { CARD_PALETTES, GROUP_DOT_COLORS } from "../utils/shareWorkout.js";

// Live on-screen mirror of what renderWorkoutImage() will export — HTML/CSS so it updates
// instantly as the user toggles exercises or style, no canvas re-encode needed until share-time.
export default function SharePreviewCard({ styleId, date, entries, exById, unit, insights }) {
  const p = CARD_PALETTES[styleId] || CARD_PALETTES.classic;
  const vol = entries.reduce((a, en) => a + en.sets.reduce((b, s) => b + s.w * s.r, 0), 0);

  return (
    <div
      style={{
        background: p.bg, borderRadius: 20, padding: "22px 22px 24px",
        display: "grid", gap: 16,
        boxShadow: "0 14px 40px rgba(0,0,0,0.22)",
        border: p.divider ? `1px solid ${p.divider}` : "none",
      }}
    >
      <div>
        <div style={{ color: p.accent, fontWeight: 800, fontSize: 12, letterSpacing: 2 }}>F I T L O G</div>
        <div style={{ color: p.text, fontWeight: 800, fontSize: 21, marginTop: 4 }}>{fmtDate(date)}</div>
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        {entries.map((en) => {
          const ex = exById[en.exId];
          if (!ex || !en.sets.length) return null;
          return (
            <div key={en.exId}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: GROUP_DOT_COLORS[ex.group] || p.subtext, flexShrink: 0 }} />
                <span style={{ color: p.text, fontWeight: 700, fontSize: 15 }}>{ex.name}</span>
              </div>
              <div style={{ color: p.subtext, fontSize: 13, marginLeft: 18, marginTop: 2 }}>
                {en.sets.map((s) => `${s.w}${unit}×${s.r}`).join("   ")}
              </div>
            </div>
          );
        })}
      </div>

      {insights.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {insights.map((line, i) => (
            <span
              key={i}
              style={{
                color: p.accent, fontWeight: 700, fontSize: 12,
                padding: "4px 10px", borderRadius: 999,
                background: styleId === "mono" ? "rgba(255,255,255,0.1)" : `${p.accent}22`,
                border: `1px solid ${p.accent}55`,
              }}
            >
              {line}
            </span>
          ))}
        </div>
      )}

      <div style={{ height: 1, background: p.divider }} />

      <div>
        <div style={{ color: p.subtext, fontSize: 11, letterSpacing: 1, fontWeight: 600 }}>TOTAL VOLUME</div>
        <div style={{ color: p.accent, fontWeight: 800, fontSize: 24, marginTop: 2 }}>
          {round1(vol).toLocaleString()} {unit}
        </div>
      </div>
    </div>
  );
}
