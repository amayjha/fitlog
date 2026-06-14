import { useState } from "react";
import { T, GROUP_COLORS } from "../theme.js";

export default function TemplatesScreen({
  data, todayEntries, exById, allExercises, saveTemplate, deleteTemplate, applyTemplate, onBack,
}) {
  const [creating, setCreating] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [selectedExIds, setSelectedExIds] = useState([]);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const startCreate = () => {
    setCreating(true);
    setTemplateName("");
    setSelectedExIds(todayEntries.map((en) => en.exId));
  };

  const toggleEx = (exId) => {
    setSelectedExIds((prev) =>
      prev.includes(exId) ? prev.filter((id) => id !== exId) : [...prev, exId]
    );
  };

  const handleSave = () => {
    if (!templateName.trim() || !selectedExIds.length) return;
    saveTemplate(templateName, selectedExIds);
    setCreating(false);
    showToast(`Template "${templateName.trim()}" saved`);
  };

  const handleApply = (tpl) => {
    const added = applyTemplate(tpl);
    if (added === 0) showToast("All exercises already added to today");
    else showToast(`Added ${added} exercise${added !== 1 ? "s" : ""} to today`);
  };

  const handleDelete = (id) => {
    if (confirmDelete === id) {
      deleteTemplate(id);
      setConfirmDelete(null);
    } else {
      setConfirmDelete(id);
      setTimeout(() => setConfirmDelete(null), 3000);
    }
  };

  return (
    <div className="screen">
      <header className="header">
        <button className="ghostbtn" onClick={onBack}>‹ Back</button>
        <div style={{ fontWeight: 700, letterSpacing: 2, fontSize: 13 }}>TEMPLATES</div>
        <button className="ghostbtn" onClick={startCreate} disabled={creating}>
          {creating ? "" : "+ New"}
        </button>
      </header>

      {toast && <div className="toast">{toast}</div>}

      {/* Create template form */}
      {creating && (
        <div className="panel" style={{ display: "grid", gap: 10 }}>
          <div style={{ color: T.faint, fontSize: 11, letterSpacing: 2, textTransform: "uppercase", fontWeight: 700 }}>
            New Template
          </div>
          <input
            className="input"
            placeholder="Template name (e.g. Push Day)"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            autoFocus
          />

          <div style={{ color: T.faint, fontSize: 12 }}>Select exercises:</div>

          {/* Show today's exercises first */}
          {todayEntries.length > 0 && (
            <div style={{ display: "grid", gap: 6 }}>
              <div style={{ color: T.label, fontSize: 12 }}>From today's workout:</div>
              {todayEntries.map((en) => {
                const ex = exById[en.exId];
                if (!ex) return null;
                const sel = selectedExIds.includes(en.exId);
                return (
                  <button key={en.exId} className="checkbox-row" onClick={() => toggleEx(en.exId)}>
                    <div className={`checkbox${sel ? " checked" : ""}`}>{sel ? "✓" : ""}</div>
                    <span className="plate sm" style={{ background: GROUP_COLORS[ex.group] || T.label }} />
                    <span style={{ flex: 1, fontWeight: 600, fontSize: 14 }}>{ex.name}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Add other exercises */}
          <details style={{ color: T.label, fontSize: 13 }}>
            <summary style={{ cursor: "pointer", padding: "4px 0" }}>Add other exercises ({selectedExIds.filter((id) => !todayEntries.find((en) => en.exId === id)).length} added)</summary>
            <div style={{ marginTop: 8, display: "grid", gap: 4, maxHeight: 200, overflowY: "auto" }}>
              {allExercises
                .filter((ex) => !todayEntries.find((en) => en.exId === ex.id))
                .map((ex) => {
                  const sel = selectedExIds.includes(ex.id);
                  return (
                    <button key={ex.id} className="checkbox-row" style={{ padding: "8px 10px" }} onClick={() => toggleEx(ex.id)}>
                      <div className={`checkbox${sel ? " checked" : ""}`}>{sel ? "✓" : ""}</div>
                      <span className="plate sm" style={{ background: GROUP_COLORS[ex.group] || T.label }} />
                      <span style={{ flex: 1, fontSize: 13 }}>{ex.name}</span>
                    </button>
                  );
                })}
            </div>
          </details>

          <div style={{ display: "flex", gap: 8 }}>
            <button className="primary" style={{ flex: 1 }} disabled={!templateName.trim() || !selectedExIds.length} onClick={handleSave}>
              Save template ({selectedExIds.length} exercises)
            </button>
            <button className="ghostbtn" onClick={() => setCreating(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Template list */}
      {(data.templates || []).length === 0 && !creating && (
        <div className="empty">
          <div>No templates yet.</div>
          <div style={{ fontSize: 13, marginTop: 6 }}>Create one to quickly start a workout.</div>
          <button className="primary" style={{ marginTop: 14 }} onClick={startCreate}>+ Create template</button>
        </div>
      )}

      {(data.templates || []).map((tpl) => {
        const exercises = (tpl.exIds || []).map((id) => exById[id]).filter(Boolean);
        const isDeleting = confirmDelete === tpl.id;
        return (
          <div key={tpl.id} className={`panel${isDeleting ? " danger" : ""}`} style={{ display: "grid", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{tpl.name}</div>
                <div style={{ color: T.faint, fontSize: 12, marginTop: 2 }}>
                  {exercises.length} exercise{exercises.length !== 1 ? "s" : ""}
                  {tpl.created ? ` · ${new Date(tpl.created).toLocaleDateString(undefined, { day: "numeric", month: "short" })}` : ""}
                </div>
              </div>
              <button
                className="ghostbtn"
                style={{ color: isDeleting ? T.red : T.faint, padding: "4px 8px" }}
                onClick={() => handleDelete(tpl.id)}
              >
                {isDeleting ? "Delete?" : "🗑"}
              </button>
            </div>

            {/* Exercise preview */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {exercises.slice(0, 6).map((ex) => (
                <span key={ex.id} className="chip" style={{ fontSize: 12, padding: "3px 10px" }}>
                  <span className="plate sm" style={{ background: GROUP_COLORS[ex.group] || T.label }} />
                  {ex.name}
                </span>
              ))}
              {exercises.length > 6 && (
                <span style={{ color: T.faint, fontSize: 12, alignSelf: "center" }}>+{exercises.length - 6} more</span>
              )}
            </div>

            <button className="primary secondary" onClick={() => handleApply(tpl)}>
              Apply to today's workout
            </button>
          </div>
        );
      })}
    </div>
  );
}
