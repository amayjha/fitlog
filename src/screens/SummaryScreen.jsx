import { useState, useMemo } from "react";
import { T, GROUP_COLORS } from "../theme.js";
import { round1, wrapText } from "../utils.js";

const fmt = (d) => d.toISOString().slice(0, 10);

const fmtRangeDate = (key) =>
  new Date(key + "T12:00:00").toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

const fmtVol = (v) => (v >= 1000 ? `${round1(v / 1000)}k` : `${round1(v)}`);

const MAX_EXERCISE_ROWS = 12;

const shareSummaryImage = async (from, to, stats, unit) => {
  if (!stats.workouts) return "Nothing to export for this range";

  const scale = 2, W = 680, padX = 36;
  const m = document.createElement("canvas").getContext("2d");

  const exerciseRows = stats.exercises.slice(0, MAX_EXERCISE_ROWS);
  const overflow = stats.exercises.length - exerciseRows.length;

  m.font = "600 15px -apple-system, system-ui, sans-serif";
  const prepared = exerciseRows.map((ex) => {
    const meta = `${ex.sessions} session${ex.sessions !== 1 ? "s" : ""} · ${ex.sets} sets · best ${ex.bestW > 0 ? `${ex.bestW}${unit}` : "—"}`;
    const nameLines = wrapText(m, ex.name, W - padX * 2 - 100);
    return { ex, nameLines, meta };
  });

  const headerH = 150;
  const statsH = 90;
  const groupsH = stats.groups.length ? 40 + stats.groups.length * 34 : 0;
  const exercisesHeaderH = prepared.length ? 40 : 0;
  const exercisesH = prepared.reduce((a, p) => a + Math.max(p.nameLines.length * 20, 20) + 20, 0) + (overflow > 0 ? 24 : 0);
  const footerH = 40;
  const H = headerH + statsH + groupsH + exercisesHeaderH + exercisesH + footerH;

  const c = document.createElement("canvas");
  c.width = W * scale; c.height = H * scale;
  const ctx = c.getContext("2d");
  ctx.scale(scale, scale);

  ctx.fillStyle = "#F5EFE8"; ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = T.accent; ctx.font = "800 13px -apple-system, system-ui, sans-serif";
  ctx.fillText("F I T L O G", padX, 46);

  ctx.fillStyle = T.text; ctx.font = "800 26px -apple-system, system-ui, sans-serif";
  ctx.fillText("Workout Summary", padX, 84);

  ctx.fillStyle = T.faint; ctx.font = "600 14px -apple-system, system-ui, sans-serif";
  ctx.fillText(from === to ? fmtRangeDate(from) : `${fmtRangeDate(from)} – ${fmtRangeDate(to)}`, padX, 108);

  let y = headerH;

  // Headline stats
  const cols = [
    { v: stats.workouts, l: "WORKOUTS" },
    { v: stats.totalSets, l: "SETS" },
    { v: `${fmtVol(stats.totalVolume)} ${unit}`, l: "VOLUME" },
  ];
  const colW = (W - padX * 2) / 3;
  cols.forEach((col, i) => {
    const cx = padX + colW * i + colW / 2;
    ctx.textAlign = "center";
    ctx.fillStyle = T.accent; ctx.font = "800 24px -apple-system, system-ui, sans-serif";
    ctx.fillText(String(col.v), cx, y + 30);
    ctx.fillStyle = T.faint; ctx.font = "700 11px -apple-system, system-ui, sans-serif";
    ctx.fillText(col.l, cx, y + 50);
    ctx.textAlign = "left";
  });
  y += statsH;

  // Muscle groups
  if (stats.groups.length) {
    ctx.fillStyle = T.faint; ctx.font = "700 12px -apple-system, system-ui, sans-serif";
    ctx.fillText("MUSCLE GROUPS", padX, y);
    y += 22;
    const barW = W - padX * 2 - 190;
    for (const g of stats.groups) {
      const color = GROUP_COLORS[g.group] || T.accent;
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.arc(padX + 6, y - 4, 6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = T.text; ctx.font = "700 14px -apple-system, system-ui, sans-serif";
      ctx.fillText(g.group, padX + 20, y);
      ctx.fillStyle = T.faint; ctx.font = "400 12px -apple-system, system-ui, sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(`${g.sets} sets · ${fmtVol(g.volume)} ${unit}`, W - padX, y);
      ctx.textAlign = "left";
      const trackY = y + 8;
      ctx.fillStyle = "rgba(0,0,0,0.08)";
      ctx.fillRect(padX + 20, trackY, barW, 6);
      ctx.fillStyle = color;
      ctx.fillRect(padX + 20, trackY, barW * (g.volume / stats.maxGroupVol), 6);
      y += 34;
    }
  }

  // Exercises
  if (prepared.length) {
    ctx.fillStyle = T.faint; ctx.font = "700 12px -apple-system, system-ui, sans-serif";
    ctx.fillText("EXERCISES", padX, y);
    y += 22;
    for (const { ex, nameLines, meta } of prepared) {
      ctx.fillStyle = T.text; ctx.font = "700 15px -apple-system, system-ui, sans-serif";
      nameLines.forEach((ln, i) => ctx.fillText(ln, padX, y + i * 20));
      y += nameLines.length * 20;
      ctx.fillStyle = T.faint; ctx.font = "400 12px -apple-system, system-ui, sans-serif";
      ctx.fillText(meta, padX, y + 16);
      y += 20;
    }
    if (overflow > 0) {
      ctx.fillStyle = T.faint; ctx.font = "italic 12px -apple-system, system-ui, sans-serif";
      ctx.fillText(`+${overflow} more exercise${overflow !== 1 ? "s" : ""}`, padX, y + 16);
    }
  }

  const blob = await new Promise((res) => c.toBlob(res, "image/png"));
  if (!blob) return "Could not create image";
  const file = new File([blob], `fitlog-summary-${from}-to-${to}.png`, { type: "image/png" });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file] }); return "Shared"; }
    catch (e) { if (e.name === "AbortError") return null; }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `fitlog-summary-${from}-to-${to}.png`; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  return "Image downloaded";
};

const PRESETS = [
  { label: "7d",  days: 7 },
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
  { label: "1yr", days: 365 },
  { label: "All", days: null },
];

export default function SummaryScreen({ data, exById, onBack }) {
  const today = new Date();

  const [from, setFrom] = useState(fmt(new Date(Date.now() - 29 * 86400000)));
  const [to,   setTo]   = useState(fmt(today));
  const [activePreset, setActivePreset] = useState(1);
  const [exporting, setExporting] = useState(false);
  const [exportMsg, setExportMsg] = useState(null);

  const applyPreset = (idx, days) => {
    setActivePreset(idx);
    if (days === null) {
      const keys = Object.keys(data.workouts).sort();
      setFrom(keys[0] || fmt(today));
    } else {
      setFrom(fmt(new Date(Date.now() - (days - 1) * 86400000)));
    }
    setTo(fmt(today));
  };

  const stats = useMemo(() => {
    const workouts = [];
    let totalSets = 0, totalVolume = 0;
    const exMap = {}; // exId → { name, group, sessions, sets, volume, bestW }
    const groupMap = {}; // group → { volume, sets }

    for (const [k, entries] of Object.entries(data.workouts)) {
      if (k < from || k > to) continue;
      const daySets = entries.reduce((a, en) => a + en.sets.length, 0);
      if (!daySets) continue;
      workouts.push(k);

      for (const en of entries) {
        if (!en.sets.length) continue;
        const ex = exById[en.exId];
        if (!ex) continue;

        if (!exMap[en.exId]) {
          exMap[en.exId] = { name: ex.name, group: ex.group, sessions: 0, sets: 0, volume: 0, bestW: 0 };
        }
        exMap[en.exId].sessions += 1;

        for (const s of en.sets) {
          const vol = s.w * s.r;
          exMap[en.exId].sets    += 1;
          exMap[en.exId].volume  += vol;
          if (s.w > exMap[en.exId].bestW) exMap[en.exId].bestW = s.w;
          totalSets   += 1;
          totalVolume += vol;

          if (!groupMap[ex.group]) groupMap[ex.group] = { volume: 0, sets: 0 };
          groupMap[ex.group].volume += vol;
          groupMap[ex.group].sets   += 1;
        }
      }
    }

    const exercises = Object.entries(exMap)
      .map(([id, v]) => ({ id, ...v }))
      .sort((a, b) => b.sessions - a.sessions);

    const groups = Object.entries(groupMap)
      .map(([group, v]) => ({ group, ...v }))
      .sort((a, b) => b.volume - a.volume);

    const maxGroupVol = groups[0]?.volume || 1;

    return { workouts: workouts.length, totalSets, totalVolume, exercises, groups, maxGroupVol };
  }, [data.workouts, exById, from, to]);

  const unit = data.unit;

  const handleExport = async () => {
    if (exporting) return;
    setExporting(true);
    const msg = await shareSummaryImage(from, to, stats, unit);
    setExporting(false);
    if (msg) { setExportMsg(msg); setTimeout(() => setExportMsg(null), 2500); }
  };

  return (
    <div className="screen">
      <header className="header">
        <button className="ghostbtn" onClick={onBack}>‹ Back</button>
        <div style={{ fontWeight: 700, fontSize: 17 }}>Summary</div>
        <button className="ghostbtn" onClick={handleExport} disabled={exporting} title="Export summary as image">
          {exporting ? "…" : "Export"}
        </button>
      </header>

      {exportMsg && <div className="toast">{exportMsg}</div>}

      {/* Preset chips */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {PRESETS.map((p, i) => (
          <button
            key={p.label}
            className={`chip${activePreset === i ? " active" : ""}`}
            onClick={() => applyPreset(i, p.days)}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Custom date range */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div>
          <div style={{ color: T.faint, fontSize: 11, fontWeight: 700, marginBottom: 4 }}>FROM</div>
          <input
            type="date"
            className="input"
            style={{ padding: "10px 12px", fontSize: 14 }}
            value={from}
            max={to}
            onChange={(e) => { setFrom(e.target.value); setActivePreset(null); }}
          />
        </div>
        <div>
          <div style={{ color: T.faint, fontSize: 11, fontWeight: 700, marginBottom: 4 }}>TO</div>
          <input
            type="date"
            className="input"
            style={{ padding: "10px 12px", fontSize: 14 }}
            value={to}
            min={from}
            max={fmt(today)}
            onChange={(e) => { setTo(e.target.value); setActivePreset(null); }}
          />
        </div>
      </div>

      {/* Headline stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
        {[
          { val: stats.workouts, label: "WORKOUTS" },
          { val: stats.totalSets, label: "SETS" },
          { val: stats.totalVolume > 0 ? (stats.totalVolume >= 1000 ? `${round1(stats.totalVolume / 1000)}k` : round1(stats.totalVolume)) : "0", label: `VOL (${unit})` },
        ].map(({ val, label }) => (
          <div key={label} className="stat-block" style={{ textAlign: "center" }}>
            <div className="stat-value" style={{ color: T.accent, fontSize: 26 }}>{val}</div>
            <div className="stat-label" style={{ fontSize: 10 }}>{label}</div>
          </div>
        ))}
      </div>

      {stats.workouts === 0 && (
        <div className="empty">No workouts found in this date range.</div>
      )}

      {/* Muscle group breakdown */}
      {stats.groups.length > 0 && (
        <div>
          <div style={{ color: T.faint, fontSize: 11, letterSpacing: 2, fontWeight: 700, marginBottom: 8 }}>
            MUSCLE GROUPS
          </div>
          <div className="panel" style={{ display: "grid", gap: 12 }}>
            {stats.groups.map(({ group, volume, sets }) => (
              <div key={group}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span className="plate" style={{ background: GROUP_COLORS[group] || T.accent }} />
                    <span style={{ fontWeight: 600, fontSize: 15 }}>{group}</span>
                  </div>
                  <div style={{ display: "flex", gap: 12, color: T.label, fontSize: 13 }}>
                    <span>{sets} sets</span>
                    <span style={{ color: T.faint }}>
                      {volume >= 1000 ? `${round1(volume / 1000)}k` : round1(volume)} {unit}
                    </span>
                  </div>
                </div>
                <div className="progress-track">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${(volume / stats.maxGroupVol) * 100}%`,
                      background: GROUP_COLORS[group] || T.accent,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Per-exercise breakdown */}
      {stats.exercises.length > 0 && (
        <div>
          <div style={{ color: T.faint, fontSize: 11, letterSpacing: 2, fontWeight: 700, marginBottom: 8 }}>
            EXERCISES
          </div>
          <div style={{ display: "grid", gap: 8 }}>
            {stats.exercises.map((ex) => (
              <div key={ex.id} className="panel" style={{ padding: "12px 14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{ex.name}</div>
                    <div style={{ color: GROUP_COLORS[ex.group] || T.accent, fontSize: 12, fontWeight: 600, marginTop: 1 }}>
                      {ex.group}
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, textAlign: "center", marginLeft: 12 }}>
                    {[
                      { v: ex.sessions, l: "sessions" },
                      { v: ex.sets, l: "sets" },
                      { v: ex.bestW > 0 ? `${ex.bestW}${unit}` : "—", l: "best" },
                    ].map(({ v, l }) => (
                      <div key={l}>
                        <div style={{ fontWeight: 700, fontSize: 16 }}>{v}</div>
                        <div style={{ color: T.faint, fontSize: 10 }}>{l}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
