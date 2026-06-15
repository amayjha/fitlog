import { useState, useMemo } from "react";
import { T } from "../theme.js";
import { dkey } from "../utils.js";
import { FOODS, FOOD_CATEGORIES } from "../foods.js";

const MEAL_LABELS = { breakfast: "Breakfast", lunch: "Lunch", dinner: "Dinner", snacks: "Snacks" };

export default function FoodPickScreen({ onBack, meal, data, persist, date }) {
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("All");
  const [selected, setSelected] = useState(null);
  const [qty, setQty] = useState(1);
  const [customMode, setCustomMode] = useState(false);
  const [custom, setCustom] = useState({ name: "", cal: "", p: "", c: "", f: "" });

  const key = dkey(date);
  const mealLabel = MEAL_LABELS[meal] || meal;

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return FOODS.filter((f) => {
      const matchCat = cat === "All" || f.cat === cat;
      const matchSearch = !q || f.name.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [search, cat]);

  const saveEntry = (entry) => {
    const existing = data.meals?.[key] || [];
    persist({ ...data, meals: { ...data.meals, [key]: [...existing, entry] } });
    onBack();
  };

  const addFood = () => {
    if (!selected) return;
    saveEntry({
      id: "n" + Date.now(),
      meal,
      name: `${selected.name} (${selected.serving})`,
      cal: Math.round(selected.cal * qty),
      p: Math.round(selected.p * qty * 10) / 10,
      c: Math.round(selected.c * qty * 10) / 10,
      f: Math.round(selected.f * qty * 10) / 10,
      ts: Date.now(),
    });
  };

  const addCustomFood = () => {
    if (!custom.name || !custom.cal) return;
    saveEntry({
      id: "n" + Date.now(),
      meal,
      name: custom.name,
      cal: Number(custom.cal),
      p: Number(custom.p) || 0,
      c: Number(custom.c) || 0,
      f: Number(custom.f) || 0,
      ts: Date.now(),
    });
  };

  /* ── Serving detail view ── */
  if (selected) {
    return (
      <div className="screen">
        <header className="header">
          <button className="ghostbtn" onClick={() => setSelected(null)}>‹ Back</button>
          <div style={{ fontWeight: 700, fontSize: 17 }}>Add to {mealLabel}</div>
          <div style={{ width: 60 }} />
        </header>

        <div className="panel" style={{ display: "grid", gap: 14 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 19 }}>{selected.name}</div>
            <div style={{ color: T.label, fontSize: 14, marginTop: 2 }}>1 serving = {selected.serving}</div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8 }}>
            {[
              { label: "Calories", value: Math.round(selected.cal * qty), color: T.accent },
              { label: "Protein", value: `${Math.round(selected.p * qty)}g`, color: "#4A9E68" },
              { label: "Carbs", value: `${Math.round(selected.c * qty)}g`, color: T.blue },
              { label: "Fat", value: `${Math.round(selected.f * qty)}g`, color: T.orange },
            ].map(({ label, value, color }) => (
              <div key={label} className="stat-block" style={{ padding: "12px 8px", textAlign: "center" }}>
                <div style={{ fontSize: 17, fontWeight: 700, color }}>{value}</div>
                <div style={{ fontSize: 10, color: T.label, marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <button
              className="stepbtn"
              onClick={() => setQty((q) => Math.max(0.5, Math.round((q - 0.5) * 2) / 2))}
            >
              −
            </button>
            <div style={{ flex: 1, textAlign: "center", fontSize: 20, fontWeight: 700 }}>
              {qty} {qty === 1 ? "serving" : "servings"}
            </div>
            <button
              className="stepbtn"
              onClick={() => setQty((q) => Math.min(10, Math.round((q + 0.5) * 2) / 2))}
            >
              +
            </button>
          </div>

          <button className="primary" onClick={addFood}>
            Add to {mealLabel}
          </button>
        </div>
      </div>
    );
  }

  /* ── Custom food form ── */
  if (customMode) {
    return (
      <div className="screen">
        <header className="header">
          <button className="ghostbtn" onClick={() => setCustomMode(false)}>‹ Back</button>
          <div style={{ fontWeight: 700, fontSize: 17 }}>Custom Food</div>
          <div style={{ width: 60 }} />
        </header>

        <div className="panel" style={{ display: "grid", gap: 12 }}>
          <input
            className="input"
            placeholder="Food name *"
            value={custom.name}
            onChange={(e) => setCustom({ ...custom, name: e.target.value })}
          />
          <input
            className="input"
            type="number"
            inputMode="numeric"
            placeholder="Calories (kcal) *"
            value={custom.cal}
            onChange={(e) => setCustom({ ...custom, cal: e.target.value })}
          />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            <input
              className="input"
              type="number"
              inputMode="decimal"
              placeholder="Protein g"
              value={custom.p}
              onChange={(e) => setCustom({ ...custom, p: e.target.value })}
            />
            <input
              className="input"
              type="number"
              inputMode="decimal"
              placeholder="Carbs g"
              value={custom.c}
              onChange={(e) => setCustom({ ...custom, c: e.target.value })}
            />
            <input
              className="input"
              type="number"
              inputMode="decimal"
              placeholder="Fat g"
              value={custom.f}
              onChange={(e) => setCustom({ ...custom, f: e.target.value })}
            />
          </div>
          <button
            className="primary"
            disabled={!custom.name || !custom.cal}
            onClick={addCustomFood}
          >
            Add to {mealLabel}
          </button>
        </div>
      </div>
    );
  }

  /* ── Food list ── */
  return (
    <div className="screen">
      <header className="header">
        <button className="ghostbtn" onClick={onBack}>‹ Back</button>
        <div style={{ fontWeight: 700, fontSize: 17 }}>Add to {mealLabel}</div>
        <div style={{ width: 60 }} />
      </header>

      <input
        className="input"
        placeholder="Search foods..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        autoFocus
      />

      <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4, scrollbarWidth: "none" }}>
        {FOOD_CATEGORIES.map((c) => (
          <button
            key={c}
            className={`chip${cat === c ? " active" : ""}`}
            style={{ flexShrink: 0 }}
            onClick={() => setCat(c)}
          >
            {c}
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gap: 8 }}>
        {filtered.map((food) => (
          <button
            key={food.id}
            className="card"
            onClick={() => { setSelected(food); setQty(1); }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {food.name}
              </div>
              <div style={{ color: T.label, fontSize: 12, marginTop: 2 }}>
                {food.serving} · P {food.p}g · C {food.c}g · F {food.f}g
              </div>
            </div>
            <span style={{ fontWeight: 700, color: T.accent, fontSize: 16, minWidth: 44, textAlign: "right", flexShrink: 0 }}>
              {food.cal}
            </span>
          </button>
        ))}

        {filtered.length === 0 && (
          <div className="empty" style={{ padding: "24px 0" }}>No foods match "{search}"</div>
        )}
      </div>

      <button className="primary secondary" onClick={() => setCustomMode(true)}>
        + Create custom food
      </button>
    </div>
  );
}
