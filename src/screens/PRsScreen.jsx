import { useState, useMemo } from "react";
import { T, GROUP_COLORS } from "../theme.js";
import { e1rm, round1 } from "../utils.js";

/* ── Inline sparkline chart ── */
function TrendChart({ points, color, unit, label }) {
  if (!points || points.length < 2) return (
    <div style={{ color: T.faint, fontSize: 12, padding: "8px 0" }}>
      Log at least 2 sessions to see a trend.
    </div>
  );

  const W = 600, H = 150, padL = 42, padR = 10, padT = 10, padB = 24;
  const vals = points.map((p) => p.value);
  const min = Math.min(...vals), max = Math.max(...vals);
  const span = max - min || 1;
  const xW = W - padL - padR, yH = H - padT - padB;
  const px = (i) => padL + (i * xW) / (points.length - 1);
  const py = (v) => padT + yH - ((v - min) / span) * yH;
  const pathD = vals.map((v, i) => `${i ? "L" : "M"}${px(i).toFixed(1)},${py(v).toFixed(1)}`).join(" ");
  const areaD = pathD + ` L${px(points.length - 1).toFixed(1)},${H - padB} L${px(0).toFixed(1)},${H - padB} Z`;
  const gradId = `tg${color.replace(/[^a-z0-9]/gi, "")}${label.replace(/\s/g, "")}`;

  // Show first, mid, last x-labels
  const xTicks = [...new Set([0, Math.floor((points.length - 1) / 2), points.length - 1])];

  return (
    <div>
      <div style={{ color: T.faint, fontSize: 11, marginBottom: 2 }}>{label} ({unit})</div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.22" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {[min, (min + max) / 2, max].map((v, i) => (
          <g key={i}>
            <line x1={padL} x2={W - padR} y1={py(v)} y2={py(v)} stroke={T.sep} strokeDasharray="3 5" />
            <text x={padL - 4} y={py(v) + 4} fill={T.faint} fontSize="10" textAnchor="end">{round1(v)}</text>
          </g>
        ))}
        <path d={areaD} fill={`url(#${gradId})`} />
        <path d={pathD} fill="none" stroke={color} strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" />
        {vals.map((v, i) => (
          <circle key={i} cx={px(i)} cy={py(v)} r="3.5" fill={T.card} stroke={color} strokeWidth="1.8" />
        ))}
        {xTicks.map((i) => (
          <text key={i} x={px(i)} y={H - 5} fill={T.faint} fontSize="9" textAnchor="middle">
            {points[i].k}
          </text>
        ))}
      </svg>
    </div>
  );
}

/* ── Per-exercise session history ── */
function useExHistory(data, exId) {
  return useMemo(() => {
    const sessions = [];
    for (const [date, entries] of Object.entries(data.workouts)) {
      const en = entries.find((e) => e.exId === exId);
      if (en && en.sets.length > 0) {
        const best1rm = en.sets.reduce((m, s) => Math.max(m, e1rm(s.w, s.r)), 0);
        const volume = en.sets.reduce((a, s) => a + s.w * s.r, 0);
        sessions.push({ k: date, best1rm, volume, sets: en.sets.length, maxWeight: Math.max(...en.sets.map(s => s.w)) });
      }
    }
    return sessions.sort((a, b) => (a.k < b.k ? -1 : 1));
  }, [data.workouts, exId]);
}

/* ── Expanded detail section ── */
function ExerciseDetail({ ex, data, pr, color }) {
  const history = useExHistory(data, ex.id);

  const stats = useMemo(() => {
    if (!history.length) return null;
    const totalSets = history.reduce((a, h) => a + h.sets, 0);
    const totalVol = history.reduce((a, h) => a + h.volume, 0);
    const avgVol = totalVol / history.length;

    // Trend: recent 3 avg 1RM vs prev 3 avg 1RM
    let trend = "stable", trendPct = 0;
    if (history.length >= 4) {
      const recent = history.slice(-3);
      const earlier = history.slice(-6, -3);
      if (earlier.length) {
        const rAvg = recent.reduce((a, h) => a + h.best1rm, 0) / recent.length;
        const eAvg = earlier.reduce((a, h) => a + h.best1rm, 0) / earlier.length;
        trendPct = eAvg > 0 ? ((rAvg - eAvg) / eAvg) * 100 : 0;
        if (trendPct > 3) trend = "up";
        else if (trendPct < -3) trend = "down";
      }
    }

    // Consistency: sessions in last 28 days
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 28);
    const cutoffKey = cutoff.toISOString().slice(0, 10);
    const recentSessions = history.filter((h) => h.k >= cutoffKey).length;

    return { totalSets, totalVol, avgVol, trend, trendPct, recentSessions };
  }, [history]);

  if (!stats) return null;

  const unit = data.unit;
  const trendColor = stats.trend === "up" ? "#4A9E68" : stats.trend === "down" ? T.red : T.label;
  const trendLabel = stats.trend === "up"
    ? `↑ ${Math.abs(stats.trendPct).toFixed(1)}% improving`
    : stats.trend === "down"
    ? `↓ ${Math.abs(stats.trendPct).toFixed(1)}% declining`
    : "→ Stable";

  const oneRMPoints = history.map((h) => ({ k: h.k, value: h.best1rm }));
  const volPoints = history.map((h) => ({ k: h.k, value: h.volume }));

  return (
    <div style={{ display: "grid", gap: 14, paddingTop: 12, borderTop: `1px solid ${T.sep}`, marginTop: 12 }}>
      {/* Summary stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
        <div style={{ background: T.card2, borderRadius: 10, padding: "8px 10px", textAlign: "center" }}>
          <div style={{ fontWeight: 800, fontSize: 20, color: T.accent }}>{history.length}</div>
          <div style={{ color: T.faint, fontSize: 10, marginTop: 2, textTransform: "uppercase", letterSpacing: 0.5 }}>Sessions</div>
        </div>
        <div style={{ background: T.card2, borderRadius: 10, padding: "8px 10px", textAlign: "center" }}>
          <div style={{ fontWeight: 800, fontSize: 20, color: T.accent }}>{stats.totalSets}</div>
          <div style={{ color: T.faint, fontSize: 10, marginTop: 2, textTransform: "uppercase", letterSpacing: 0.5 }}>Total Sets</div>
        </div>
        <div style={{ background: T.card2, borderRadius: 10, padding: "8px 10px", textAlign: "center" }}>
          <div style={{ fontWeight: 800, fontSize: 20, color: T.accent }}>{stats.recentSessions}</div>
          <div style={{ color: T.faint, fontSize: 10, marginTop: 2, textTransform: "uppercase", letterSpacing: 0.5 }}>Last 4 wks</div>
        </div>
      </div>

      {/* Trend badge */}
      {history.length >= 4 && (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: stats.trend === "up" ? "rgba(74,158,104,0.12)" : stats.trend === "down" ? "rgba(212,80,74,0.10)" : "rgba(0,0,0,0.05)",
            color: trendColor, borderRadius: 20, padding: "5px 12px", fontSize: 13, fontWeight: 600,
          }}>
            {trendLabel}
          </div>
          <span style={{ color: T.faint, fontSize: 12 }}>vs prior 3 sessions</span>
        </div>
      )}

      {/* Total volume */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span style={{ color: T.label, fontSize: 13 }}>Total volume</span>
        <span style={{ fontWeight: 700, fontSize: 15 }}>
          {round1(stats.totalVol).toLocaleString()} {unit}
        </span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span style={{ color: T.label, fontSize: 13 }}>Avg volume / session</span>
        <span style={{ fontWeight: 700, fontSize: 15 }}>
          {round1(stats.avgVol).toLocaleString()} {unit}
        </span>
      </div>

      {/* 1RM Chart */}
      <TrendChart points={oneRMPoints} color={color} unit={unit} label="Est. 1RM over time" />

      {/* Volume Chart */}
      <TrendChart points={volPoints} color={T.accent} unit={unit} label="Session volume over time" />
    </div>
  );
}

/* ════════════════════════════════════
   Main PRs Screen
════════════════════════════════════ */
export default function PRsScreen({ allExercises, data, exById }) {
  const [groupFilter, setGroupFilter] = useState("All");
  const [sortBy, setSortBy] = useState("group");
  const [selected, setSelected] = useState(null);

  const groups = ["All", ...Object.keys(GROUP_COLORS)];

  const prs = useMemo(() => {
    const map = {};
    for (const [date, entries] of Object.entries(data.workouts)) {
      for (const en of entries) {
        for (const s of en.sets) {
          const v = e1rm(s.w, s.r);
          if (!map[en.exId] || v > map[en.exId].best1rm) {
            map[en.exId] = { best1rm: v, bestWeight: s.w, bestReps: s.r, date };
          }
          if (map[en.exId] && s.w > (map[en.exId].bestWeight || 0)) {
            map[en.exId] = { ...map[en.exId], bestWeight: s.w, bestWeightReps: s.r };
          }
        }
      }
    }
    return map;
  }, [data.workouts]);

  const displayed = useMemo(() => {
    let list = allExercises.filter((ex) => prs[ex.id]);
    if (groupFilter !== "All") list = list.filter((ex) => ex.group === groupFilter);
    if (sortBy === "name") list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    else if (sortBy === "best1rm") list = [...list].sort((a, b) => (prs[b.id]?.best1rm || 0) - (prs[a.id]?.best1rm || 0));
    else if (sortBy === "date") list = [...list].sort((a, b) => ((prs[b.id]?.date || "") > (prs[a.id]?.date || "") ? 1 : -1));
    else list = [...list].sort((a, b) => {
      const ga = Object.keys(GROUP_COLORS).indexOf(a.group);
      const gb = Object.keys(GROUP_COLORS).indexOf(b.group);
      return ga !== gb ? ga - gb : a.name.localeCompare(b.name);
    });
    return list;
  }, [allExercises, prs, groupFilter, sortBy]);

  const totalPRs = Object.keys(prs).length;

  return (
    <div className="screen">
      <header className="header">
        <div>
          <div className="brand">FITLOG</div>
          <div style={{ fontWeight: 700, fontSize: 17 }}>Personal Records</div>
        </div>
        <span style={{ color: T.label, fontSize: 13 }}>{totalPRs} exercises</span>
      </header>

      {/* Group filter */}
      <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }}>
        {groups.map((g) => (
          <button
            key={g}
            className={`chip${groupFilter === g ? " active" : ""}`}
            onClick={() => { setGroupFilter(g); setSelected(null); }}
            style={{ flexShrink: 0 }}
          >
            {g !== "All" && <span className="plate sm" style={{ background: GROUP_COLORS[g] }} />}
            {g}
          </button>
        ))}
      </div>

      {/* Sort controls */}
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <span style={{ color: T.faint, fontSize: 12 }}>Sort:</span>
        {[["group", "Group"], ["name", "Name"], ["best1rm", "Best 1RM"], ["date", "Recent"]].map(([v, label]) => (
          <button
            key={v}
            className={`chip${sortBy === v ? " active" : ""}`}
            style={{ fontSize: 12, padding: "4px 10px" }}
            onClick={() => setSortBy(v)}
          >
            {label}
          </button>
        ))}
      </div>

      {totalPRs === 0 && (
        <div className="empty">
          <div>No personal records yet.</div>
          <div style={{ fontSize: 13, marginTop: 6 }}>Start logging workouts to see your PRs here.</div>
        </div>
      )}

      {displayed.map((ex) => {
        const pr = prs[ex.id];
        if (!pr) return null;
        const color = GROUP_COLORS[ex.group] || T.label;
        const isOpen = selected === ex.id;
        const dateStr = pr.date
          ? new Date(pr.date + "T12:00:00").toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })
          : "";

        return (
          <div key={ex.id} className="panel" style={{ cursor: "pointer" }}
            onClick={() => setSelected(isOpen ? null : ex.id)}
          >
            {/* Header row */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <span className="plate" style={{ background: color }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700 }}>{ex.name}</div>
                <div style={{ color: T.faint, fontSize: 11, marginTop: 2 }}>{ex.group}</div>
              </div>
              {dateStr && <span style={{ color: T.faint, fontSize: 12 }}>{dateStr}</span>}
              <span style={{ color: T.faint, fontSize: 16, marginLeft: 2 }}>{isOpen ? "▾" : "›"}</span>
            </div>

            {/* PR stats */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <div style={{ background: T.card2, borderRadius: 8, padding: "8px 10px" }}>
                <div style={{ color: T.faint, fontSize: 11, marginBottom: 3 }}>EST. 1RM</div>
                <div style={{ fontWeight: 800, fontSize: 18, fontVariantNumeric: "tabular-nums" }}>
                  {round1(pr.best1rm)} <span style={{ fontSize: 12, fontWeight: 400, color: T.label }}>{data.unit}</span>
                </div>
              </div>
              <div style={{ background: T.card2, borderRadius: 8, padding: "8px 10px" }}>
                <div style={{ color: T.faint, fontSize: 11, marginBottom: 3 }}>BEST SET</div>
                <div style={{ fontWeight: 800, fontSize: 18, fontVariantNumeric: "tabular-nums" }}>
                  {pr.bestWeight}×{pr.bestReps}
                  <span style={{ fontSize: 11, fontWeight: 400, color: T.label }}> {data.unit}</span>
                </div>
              </div>
            </div>

            {/* Expanded detail */}
            {isOpen && (
              <ExerciseDetail ex={ex} data={data} pr={pr} color={color} />
            )}
          </div>
        );
      })}

      {displayed.length === 0 && totalPRs > 0 && (
        <div className="empty">No records in this category yet.</div>
      )}
    </div>
  );
}
