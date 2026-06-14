import { useState } from "react";
import { T, GROUP_COLORS } from "../theme.js";

export default function PickScreen({ allExercises, addCustomExercise, onPick, onBack }) {
  const [q, setQ] = useState("");
  const [openGroup, setOpenGroup] = useState(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newGroup, setNewGroup] = useState("Chest");

  const groups = Object.keys(GROUP_COLORS);
  const filtered = q ? allExercises.filter((e) => e.name.toLowerCase().includes(q.toLowerCase())) : null;

  const handleCreate = () => {
    if (!newName.trim()) return;
    const exId = addCustomExercise(newName, newGroup);
    onPick(exId);
  };

  return (
    <div className="screen">
      <header className="header">
        <button className="ghostbtn" onClick={onBack}>‹ Back</button>
        <div style={{ fontWeight: 700, letterSpacing: 2, fontSize: 13 }}>SELECT EXERCISE</div>
        <button className="ghostbtn" onClick={() => setCreating((c) => !c)}>{creating ? "✕" : "+ New"}</button>
      </header>

      {creating && (
        <div className="panel" style={{ display: "grid", gap: 10 }}>
          <input
            className="input"
            placeholder="Exercise name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            autoFocus
          />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {groups.map((g) => (
              <button
                key={g}
                className="chip"
                onClick={() => setNewGroup(g)}
                style={{ borderColor: newGroup === g ? GROUP_COLORS[g] : T.sep, color: newGroup === g ? T.text : T.label }}
              >
                <span className="plate sm" style={{ background: GROUP_COLORS[g] }} />
                {g}
              </button>
            ))}
          </div>
          <button className="primary" disabled={!newName.trim()} onClick={handleCreate}>
            Create and add to workout
          </button>
        </div>
      )}

      <input
        className="input"
        placeholder="Search exercises…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      {filtered ? (
        filtered.length ? (
          filtered.map((e) => (
            <button key={e.id} className="card" onClick={() => onPick(e.id)}>
              <span className="plate" style={{ background: GROUP_COLORS[e.group] || T.label }} />
              <div style={{ flex: 1, fontWeight: 600 }}>{e.name}</div>
              <span style={{ color: T.faint, fontSize: 12 }}>{e.group}</span>
            </button>
          ))
        ) : (
          <div className="empty">No match — create it with "+ New".</div>
        )
      ) : (
        groups.map((g) => {
          const list = allExercises.filter((e) => e.group === g);
          const open = openGroup === g;
          return (
            <div key={g}>
              <button className="card" onClick={() => setOpenGroup(open ? null : g)}>
                <span className="plate" style={{ background: GROUP_COLORS[g] }} />
                <div style={{ flex: 1, fontWeight: 700 }}>{g}</div>
                <span style={{ color: T.faint }}>{list.length} {open ? "▾" : "▸"}</span>
              </button>
              {open &&
                list.map((e) => (
                  <button key={e.id} className="card sub" onClick={() => onPick(e.id)}>
                    <div style={{ flex: 1 }}>{e.name}</div>
                    <span style={{ color: T.faint }}>+</span>
                  </button>
                ))}
            </div>
          );
        })
      )}
    </div>
  );
}
