import { useState, useMemo } from "react";
import { T, GROUP_COLORS } from "../theme.js";
import { e1rm, round1 } from "../utils.js";

const GOAL_TYPES = [
  { id: "1rm", label: "Est. 1RM", desc: "Target an estimated one-rep max" },
  { id: "weight", label: "Max weight", desc: "Lift a target weight for any reps" },
];

export default function GoalsScreen({ data, allExercises, exById, bestByExercise, addGoal, deleteGoal, markGoalAchieved, onBack }) {
  const [adding, setAdding] = useState(false);
  const [goalExId, setGoalExId] = useState(allExercises[0]?.id || "");
  const [goalType, setGoalType] = useState("1rm");
  const [goalTarget, setGoalTarget] = useState(100);
  const [showAchieved, setShowAchieved] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const unit = data.unit;

  // Best weight per exercise (not 1RM)
  const bestWeightByExercise = useMemo(() => {
    const best = {};
    for (const entries of Object.values(data.workouts)) {
      for (const en of entries) {
        for (const s of en.sets) {
          if (!best[en.exId] || s.w > best[en.exId]) best[en.exId] = s.w;
        }
      }
    }
    return best;
  }, [data.workouts]);

  const getCurrent = (goal) => {
    if (goal.type === "1rm") return bestByExercise[goal.exId] || 0;
    return bestWeightByExercise[goal.exId] || 0;
  };

  const handleAdd = () => {
    if (!goalExId || !goalTarget) return;
    addGoal(goalExId, goalType, goalTarget);
    setAdding(false);
    setGoalTarget(100);
  };

  const handleDelete = (id) => {
    if (confirmDelete === id) { deleteGoal(id); setConfirmDelete(null); }
    else { setConfirmDelete(id); setTimeout(() => setConfirmDelete(null), 3000); }
  };

  const activeGoals = (data.goals || []).filter((g) => !g.achieved);
  const achievedGoals = (data.goals || []).filter((g) => g.achieved);

  const GoalCard = ({ goal }) => {
    const ex = exById[goal.exId];
    if (!ex) return null;
    const current = getCurrent(goal);
    const pct = Math.min(100, goal.target > 0 ? (current / goal.target) * 100 : 0);
    const isComplete = pct >= 100;
    const isDeleting = confirmDelete === goal.id;
    const typeLabel = goal.type === "1rm" ? "Est. 1RM" : "Max weight";
    const color = GROUP_COLORS[ex.group] || T.label;

    return (
      <div className={`panel${isDeleting ? " danger" : ""}`} style={{ display: "grid", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
          <span className="plate" style={{ background: color, marginTop: 4 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700 }}>{ex.name}</div>
            <div style={{ color: T.faint, fontSize: 12, marginTop: 2 }}>{typeLabel}</div>
          </div>
          {!goal.achieved && isComplete && (
            <button
              className="chip"
              style={{ borderColor: T.accent, color: T.accent, fontSize: 12 }}
              onClick={() => markGoalAchieved(goal.id)}
            >
              ✓ Mark done
            </button>
          )}
          <button
            className="ghostbtn"
            style={{ color: isDeleting ? T.red : T.faint, padding: "4px 8px" }}
            onClick={() => handleDelete(goal.id)}
          >
            {isDeleting ? "Delete?" : "🗑"}
          </button>
        </div>

        {/* Progress */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${pct}%`, background: isComplete ? T.accent : color }}
            />
          </div>
          <span style={{ fontSize: 13, color: T.label, flexShrink: 0 }}>{Math.round(pct)}%</span>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
          <span style={{ color: T.label }}>
            Current: <strong style={{ color: T.text }}>{round1(current)} {unit}</strong>
          </span>
          <span style={{ color: T.label }}>
            Target: <strong style={{ color: T.text }}>{round1(goal.target)} {unit}</strong>
          </span>
        </div>

        {goal.achieved && (
          <div style={{ color: T.accent, fontSize: 12 }}>
            ✓ Achieved {new Date(goal.achieved).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="screen">
      <header className="header">
        <button className="ghostbtn" onClick={onBack}>‹ Back</button>
        <div style={{ fontWeight: 700, letterSpacing: 2, fontSize: 13 }}>GOALS</div>
        <button className="ghostbtn" onClick={() => setAdding((o) => !o)}>{adding ? "✕" : "+ Add"}</button>
      </header>

      {/* Add goal form */}
      {adding && (
        <div className="panel" style={{ display: "grid", gap: 10 }}>
          <div style={{ color: T.faint, fontSize: 11, letterSpacing: 2, textTransform: "uppercase", fontWeight: 700 }}>
            New Goal
          </div>

          <div>
            <div style={{ color: T.faint, fontSize: 12, marginBottom: 6 }}>Exercise</div>
            <select
              className="input"
              value={goalExId}
              onChange={(e) => setGoalExId(e.target.value)}
            >
              {allExercises.map((ex) => (
                <option key={ex.id} value={ex.id}>{ex.name} ({ex.group})</option>
              ))}
            </select>
          </div>

          <div>
            <div style={{ color: T.faint, fontSize: 12, marginBottom: 6 }}>Goal type</div>
            <div style={{ display: "flex", gap: 6 }}>
              {GOAL_TYPES.map((t) => (
                <button
                  key={t.id}
                  className={`chip${goalType === t.id ? " active" : ""}`}
                  onClick={() => setGoalType(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div style={{ color: T.faint, fontSize: 12, marginTop: 6 }}>
              {GOAL_TYPES.find((t) => t.id === goalType)?.desc}
            </div>
          </div>

          <div>
            <div style={{ color: T.faint, fontSize: 12, marginBottom: 6 }}>Target ({unit})</div>
            <input
              className="input"
              type="number"
              inputMode="decimal"
              value={goalTarget}
              onChange={(e) => setGoalTarget(parseFloat(e.target.value) || 0)}
              min={0}
            />
            {goalExId && (
              <div style={{ color: T.label, fontSize: 12, marginTop: 6 }}>
                Current best:{" "}
                <strong>
                  {goalType === "1rm"
                    ? `${round1(bestByExercise[goalExId] || 0)} ${unit} est. 1RM`
                    : `${round1(bestWeightByExercise[goalExId] || 0)} ${unit}`}
                </strong>
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button className="primary" style={{ flex: 1 }} disabled={!goalExId || !goalTarget} onClick={handleAdd}>
              Add goal
            </button>
            <button className="ghostbtn" onClick={() => setAdding(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Active goals */}
      {activeGoals.length === 0 && !adding && achievedGoals.length === 0 && (
        <div className="empty">
          <div>No goals set yet.</div>
          <div style={{ fontSize: 13, marginTop: 6 }}>Set a target to track your progress.</div>
          <button className="primary" style={{ marginTop: 14 }} onClick={() => setAdding(true)}>+ Add goal</button>
        </div>
      )}

      {activeGoals.length > 0 && (
        <>
          <div style={{ color: T.faint, fontSize: 11, letterSpacing: 2, textTransform: "uppercase", fontWeight: 700 }}>
            Active ({activeGoals.length})
          </div>
          {activeGoals.map((g) => <GoalCard key={g.id} goal={g} />)}
        </>
      )}

      {/* Achieved goals */}
      {achievedGoals.length > 0 && (
        <>
          <button
            className="ghostbtn"
            style={{ fontSize: 13, color: T.faint, padding: "6px 0" }}
            onClick={() => setShowAchieved((o) => !o)}
          >
            {showAchieved ? "▾" : "▸"} Achieved ({achievedGoals.length})
          </button>
          {showAchieved && achievedGoals.map((g) => <GoalCard key={g.id} goal={g} />)}
        </>
      )}
    </div>
  );
}
