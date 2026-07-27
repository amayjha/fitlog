import { T } from "../theme.js";
import { CARD_PALETTES } from "../utils/shareWorkout.js";

// Two render modes from the same { recap, stats } pair:
//  - "full"  — in-app view, full narrative + stats, themed with the app's live T tokens
//              so it matches whichever of Classic/Dark/Mono the user has picked.
//  - "share" — a live HTML/CSS mirror of the 1080×1920 PNG that recapShare.js exports
//              (same pattern as SharePreviewCard.jsx for workout shares), sized down to
//              fit the screen; the real export is drawn separately on a canvas at share time.
export default function RecapCard({ mode = "full", recap, stats, styleId = "classic" }) {
  if (mode === "share") return <RecapSharePreview recap={recap} stats={stats} styleId={styleId} />;
  return <RecapFullView recap={recap} stats={stats} />;
}

function StatBlock({ value, label }) {
  return (
    <div className="stat-block">
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

// RecapStats weights are always kg (see recapEngine.js) regardless of the user's current
// display unit, so labels here are hardcoded to "kg" rather than taking a unit prop.
function RecapFullView({ recap, stats }) {
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div>
        <div className="brand">IRON DIARY</div>
        <div style={{ fontSize: 24, fontWeight: 800, marginTop: 4 }}>{recap.headline}</div>
        <div style={{ color: T.accent, fontWeight: 700, fontSize: 15, marginTop: 6 }}>{recap.one_liner}</div>
      </div>

      <div className="panel" style={{ display: "grid", gap: 12 }}>
        {recap.narrative.split("\n\n").filter(Boolean).map((para, i) => (
          <p key={i} style={{ margin: 0, color: T.text, fontSize: 15, lineHeight: 1.6 }}>{para}</p>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <StatBlock value={stats.sessions} label="SESSIONS" />
        <StatBlock value={`${stats.totalVolumeKg.toLocaleString()} kg`} label="TOTAL VOLUME" />
        <StatBlock value={stats.currentStreakWeeks} label="WEEK STREAK" />
        <StatBlock value={stats.prCount} label="NEW PRS" />
      </div>

      {stats.topProgressions.length > 0 && (
        <div className="panel" style={{ display: "grid", gap: 10 }}>
          <div className="section-label">Top progressions</div>
          {stats.topProgressions.map((p) => (
            <div key={p.name} style={{ display: "flex", justifyContent: "space-between", fontSize: 15 }}>
              <span style={{ fontWeight: 600 }}>{p.name}</span>
              <span style={{ color: T.accent, fontWeight: 700 }}>{p.from} → {p.to} kg</span>
            </div>
          ))}
        </div>
      )}

      {stats.comeback && (
        <div className="panel" style={{ display: "grid", gap: 4 }}>
          <div className="section-label">The comeback</div>
          <div style={{ fontSize: 14, color: T.label, lineHeight: 1.5 }}>
            {stats.comeback.gapDays} days away, then back on {stats.comeback.returnDate} with {stats.comeback.returnExercise}.
          </div>
        </div>
      )}

      <div style={{ color: T.faint, fontSize: 13, textAlign: "center" }}>{recap.standout_stat}</div>
    </div>
  );
}

function RecapSharePreview({ recap, stats, styleId }) {
  const p = CARD_PALETTES[styleId] || CARD_PALETTES.classic;
  const sparkPoints = (stats.sessionVolumes || []).map((s) => s.volumeKg);
  const max = Math.max(...sparkPoints, 1);
  const sparkPath = sparkPoints.length > 1
    ? sparkPoints.map((v, i) => `${(i / (sparkPoints.length - 1)) * 100},${100 - (v / max) * 100}`).join(" ")
    : "";

  return (
    <div
      style={{
        background: p.bg, borderRadius: 20, padding: "26px 24px 28px",
        display: "grid", gap: 18, aspectRatio: "9 / 16", maxWidth: 320, margin: "0 auto",
        boxShadow: "0 14px 40px rgba(0,0,0,0.22)",
        border: p.divider ? `1px solid ${p.divider}` : "none",
      }}
    >
      <div style={{ color: p.accent, fontWeight: 800, fontSize: 11, letterSpacing: 2 }}>IRON DIARY</div>

      <div style={{ color: p.text, fontWeight: 800, fontSize: 22, lineHeight: 1.25 }}>{recap.headline}</div>
      <div style={{ color: p.accent, fontWeight: 700, fontSize: 14 }}>{recap.one_liner}</div>

      <div style={{ height: 1, background: p.divider }} />

      <div>
        <div style={{ color: p.subtext, fontSize: 11, letterSpacing: 1, fontWeight: 700 }}>STANDOUT</div>
        <div style={{ color: p.text, fontWeight: 800, fontSize: 18, marginTop: 4 }}>{stats.standoutStat}</div>
      </div>

      {stats.topProgressions.slice(0, 3).map((prog) => (
        <div key={prog.name}>
          <div style={{ color: p.text, fontWeight: 600, fontSize: 13 }}>{prog.name}</div>
          <div style={{ color: p.accent, fontWeight: 700, fontSize: 15 }}>{prog.from} → {prog.to} kg</div>
        </div>
      ))}

      {sparkPath && (
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: "100%", height: 50 }}>
          <polyline points={sparkPath} fill="none" stroke={p.accent} strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
        </svg>
      )}

      <div style={{ color: p.subtext, fontWeight: 700, fontSize: 11, textAlign: "right", marginTop: "auto" }}>FITLOG</div>
    </div>
  );
}
