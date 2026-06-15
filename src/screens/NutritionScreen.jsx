import { useState, useMemo } from "react";
import { T } from "../theme.js";
import { dkey, fmtDate, isToday } from "../utils.js";

const MEALS = [
  { id: "breakfast", label: "Breakfast", icon: "☀️" },
  { id: "lunch", label: "Lunch", icon: "🌤" },
  { id: "dinner", label: "Dinner", icon: "🌙" },
  { id: "snacks", label: "Snacks", icon: "🍎" },
];

const MACRO_COLORS = {
  protein: "#4A9E68",
  carbs: "#3878C8",
  fat: "#D8872A",
};

export default function NutritionScreen({ date, setDate, data, persist, setOverlay }) {
  const key = dkey(date);
  const todayMeals = data.meals?.[key] || [];
  const calorieGoal = data.calorieGoal ?? 2000;
  const macroGoals = data.macroGoals ?? { protein: 150, carbs: 200, fat: 65 };

  const [goalOpen, setGoalOpen] = useState(false);
  const [goalInput, setGoalInput] = useState(calorieGoal);
  const [macroInput, setMacroInput] = useState({ ...macroGoals });
  const [deletingId, setDeletingId] = useState(null);

  const totals = useMemo(
    () =>
      todayMeals.reduce(
        (acc, item) => ({
          cal: acc.cal + item.cal,
          p: acc.p + item.p,
          c: acc.c + item.c,
          f: acc.f + item.f,
        }),
        { cal: 0, p: 0, c: 0, f: 0 }
      ),
    [todayMeals]
  );

  const remaining = calorieGoal - totals.cal;
  const calPct = Math.min(totals.cal / calorieGoal, 1);
  const editable = isToday(date);

  const shift = (n) => {
    const d = new Date(date);
    d.setDate(d.getDate() + n);
    setDate(d);
  };

  const deleteFood = (id) => {
    const updated = todayMeals.filter((item) => item.id !== id);
    persist({ ...data, meals: { ...data.meals, [key]: updated } });
    setDeletingId(null);
  };

  const saveGoals = () => {
    persist({
      ...data,
      calorieGoal: Number(goalInput) || 2000,
      macroGoals: {
        protein: Number(macroInput.protein) || 150,
        carbs: Number(macroInput.carbs) || 200,
        fat: Number(macroInput.fat) || 65,
      },
    });
    setGoalOpen(false);
  };

  return (
    <div className="screen" onClick={() => deletingId && setDeletingId(null)}>
      {/* Header */}
      <header className="header">
        <div>
          <div className="brand">FITLOG</div>
          <div style={{ fontWeight: 700, fontSize: 17 }}>Nutrition</div>
        </div>
        <button
          className="ghostbtn"
          style={{ fontSize: 14 }}
          onClick={() => { setGoalOpen((o) => !o); setGoalInput(calorieGoal); setMacroInput({ ...macroGoals }); }}
        >
          Set Goals
        </button>
      </header>

      {/* Goal editor */}
      {goalOpen && (
        <div className="panel" style={{ display: "grid", gap: 12 }}>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 2 }}>Daily Goals</div>
          <div>
            <div style={{ fontSize: 12, color: T.label, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>
              Calories (kcal)
            </div>
            <input
              className="input"
              type="number"
              inputMode="numeric"
              value={goalInput}
              onChange={(e) => setGoalInput(e.target.value)}
            />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            {[
              { key: "protein", label: "Protein (g)", color: MACRO_COLORS.protein },
              { key: "carbs", label: "Carbs (g)", color: MACRO_COLORS.carbs },
              { key: "fat", label: "Fat (g)", color: MACRO_COLORS.fat },
            ].map(({ key: mk, label, color }) => (
              <div key={mk}>
                <div style={{ fontSize: 11, color, marginBottom: 6, fontWeight: 600 }}>{label}</div>
                <input
                  className="input"
                  type="number"
                  inputMode="numeric"
                  style={{ fontSize: 15 }}
                  value={macroInput[mk]}
                  onChange={(e) => setMacroInput((prev) => ({ ...prev, [mk]: e.target.value }))}
                />
              </div>
            ))}
          </div>
          <button className="primary" onClick={saveGoals}>Save Goals</button>
        </div>
      )}

      {/* Date navigation */}
      <div className="panel" style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px" }}>
        <button className="navbtn" style={{ height: 44 }} onClick={() => shift(-1)}>‹</button>
        <div style={{ flex: 1, textAlign: "center", fontWeight: 600, fontSize: 15 }}>
          {isToday(date) ? "Today" : fmtDate(date)}
        </div>
        <button className="navbtn" style={{ height: 44 }} onClick={() => shift(1)}>›</button>
      </div>

      {/* Calorie summary ring */}
      <div className="panel">
        {/* Numbers row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 11, color: T.label, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>Goal</div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>{calorieGoal}</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 11, color: T.label, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>Eaten</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: totals.cal > calorieGoal ? T.red : T.text }}>
              {Math.round(totals.cal)}
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 11, color: T.label, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>
              {remaining >= 0 ? "Remaining" : "Over"}
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: remaining < 0 ? T.red : T.accent }}>
              {Math.abs(Math.round(remaining))}
            </div>
          </div>
        </div>

        {/* Calorie bar */}
        <div className="progress-track" style={{ height: 10, marginBottom: 16 }}>
          <div
            className="progress-fill"
            style={{
              width: `${calPct * 100}%`,
              background: calPct >= 1 ? T.red : `linear-gradient(90deg, ${T.accent}, #D09060)`,
              height: "100%",
              borderRadius: 5,
            }}
          />
        </div>

        {/* Macro bars */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          {[
            { label: "Protein", value: totals.p, goal: macroGoals.protein, color: MACRO_COLORS.protein },
            { label: "Carbs", value: totals.c, goal: macroGoals.carbs, color: MACRO_COLORS.carbs },
            { label: "Fat", value: totals.f, goal: macroGoals.fat, color: MACRO_COLORS.fat },
          ].map(({ label, value, goal, color }) => (
            <div key={label}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 5 }}>
                <span style={{ fontSize: 11, color, fontWeight: 700 }}>{label}</span>
                <span style={{ fontSize: 10, color: T.label }}>
                  {Math.round(value)}<span style={{ opacity: 0.6 }}>/{goal}g</span>
                </span>
              </div>
              <div className="progress-track" style={{ height: 5 }}>
                <div
                  className="progress-fill"
                  style={{
                    width: `${Math.min(value / goal, 1) * 100}%`,
                    background: color,
                    height: "100%",
                    borderRadius: 3,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Meal sections */}
      {MEALS.map(({ id, label, icon }) => {
        const mealItems = todayMeals.filter((item) => item.meal === id);
        const mealCal = mealItems.reduce((a, item) => a + item.cal, 0);

        return (
          <div key={id} className="panel" style={{ display: "grid", gap: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{icon} {label}</div>
              {mealCal > 0 && (
                <span style={{ color: T.label, fontSize: 13 }}>{Math.round(mealCal)} kcal</span>
              )}
            </div>

            {mealItems.map((item) => {
              const isPendingDelete = deletingId === item.id;
              return (
                <div
                  key={item.id}
                  className="setrow"
                  style={{
                    padding: "10px 14px",
                    border: isPendingDelete ? `1.5px solid ${T.red}` : undefined,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: 15,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {item.name}
                    </div>
                    <div style={{ fontSize: 11, color: T.label, marginTop: 3 }}>
                      P {Math.round(item.p)}g · C {Math.round(item.c)}g · F {Math.round(item.f)}g
                    </div>
                  </div>
                  <span
                    style={{
                      fontWeight: 700,
                      fontSize: 15,
                      color: T.accent,
                      minWidth: 44,
                      textAlign: "right",
                      flexShrink: 0,
                    }}
                  >
                    {Math.round(item.cal)}
                  </span>
                  {editable && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isPendingDelete) deleteFood(item.id);
                        else setDeletingId(item.id);
                      }}
                      style={{
                        background: isPendingDelete ? T.red : "rgba(238,228,218,0.80)",
                        color: isPendingDelete ? "#fff" : T.faint,
                        border: "none",
                        borderRadius: 10,
                        width: 36,
                        height: 36,
                        fontSize: 16,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        flexShrink: 0,
                        marginLeft: 8,
                      }}
                    >
                      {isPendingDelete ? "✓" : "×"}
                    </button>
                  )}
                </div>
              );
            })}

            {editable && (
              <button
                className="ghostbtn"
                style={{ justifyContent: "flex-start", padding: "6px 2px", fontSize: 15 }}
                onClick={() => setOverlay({ name: "foodpick", meal: id })}
              >
                + Add food
              </button>
            )}

            {mealItems.length === 0 && !editable && (
              <div style={{ color: T.faint, fontSize: 14, paddingBottom: 4 }}>Nothing logged</div>
            )}
          </div>
        );
      })}
    </div>
  );
}
