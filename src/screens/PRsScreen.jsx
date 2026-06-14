import { useState, useMemo } from "react";
import { T, GROUP_COLORS } from "../theme.js";
import { e1rm, round1 } from "../utils.js";

export default function PRsScreen({ allExercises, data, exById }) {
  const [groupFilter, setGroupFilter] = useState("All");
  const [sortBy, setSortBy] = useState("group"); // group | name | best1rm | date

  const groups = ["All", ...Object.keys(GROUP_COLORS)];

  // Compute per-exercise PRs
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
    else if (sortBy === "date") list = [...list].sort((a, b) => (prs[b.id]?.date || "") > (prs[a.id]?.date || "") ? 1 : -1);
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
            onClick={() => setGroupFilter(g)}
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
        const dateStr = pr.date
          ? new Date(pr.date + "T12:00:00").toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })
          : "";
        return (
          <div key={ex.id} className="panel">
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <span className="plate" style={{ background: color }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700 }}>{ex.name}</div>
                <div style={{ color: T.faint, fontSize: 11, marginTop: 2 }}>{ex.group}</div>
              </div>
              {dateStr && <span style={{ color: T.faint, fontSize: 12 }}>{dateStr}</span>}
            </div>
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
          </div>
        );
      })}

      {displayed.length === 0 && totalPRs > 0 && (
        <div className="empty">No records in this category yet.</div>
      )}
    </div>
  );
}
