import { useState, useMemo } from "react";
import { T, GROUP_COLORS } from "../theme.js";
import { fmtDate } from "../utils.js";
import { buildShareText, shareViaSheet } from "../utils/shareWorkout.js";

const PLATFORMS = [
  { id: "x", label: "X", sub: "Post as a tweet", bg: "#000000", fg: "#fff", glyph: "𝕏" },
  { id: "threads", label: "Threads", sub: "Post as a thread", bg: "#101010", fg: "#fff", glyph: "🧵" },
  { id: "facebook", label: "Facebook", sub: "Share via Facebook app", bg: "#1877F2", fg: "#fff", glyph: "f" },
  { id: "instagram", label: "Instagram", sub: "Share via Instagram app", bg: "linear-gradient(135deg,#F58529,#DD2A7B,#8134AF,#515BD4)", fg: "#fff", glyph: "📷" },
];

export default function ShareWorkoutScreen({ data, exById, date, todayEntries, onBack }) {
  const loggedEntries = useMemo(
    () => todayEntries.filter((en) => exById[en.exId] && en.sets.length > 0),
    [todayEntries, exById]
  );

  const [selected, setSelected] = useState(() => new Set(loggedEntries.map((en) => en.exId)));
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  const allSelected = selected.size === loggedEntries.length;

  const toggleEx = (exId) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(exId)) next.delete(exId); else next.add(exId);
      return next;
    });
  };

  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(loggedEntries.map((en) => en.exId)));

  const selectedEntries = loggedEntries.filter((en) => selected.has(en.exId));
  const caption = useMemo(
    () => buildShareText(date, selectedEntries, exById, data.unit),
    [date, selectedEntries, exById, data.unit]
  );
  const canShare = selectedEntries.length > 0 && !busy;

  const showMsg = (text) => {
    if (!text) return;
    setMsg(text);
    setTimeout(() => setMsg(null), 3000);
  };

  const openIntent = (url) => window.open(url, "_blank", "noopener,noreferrer");

  const shareToX = () => openIntent(`https://twitter.com/intent/tweet?text=${encodeURIComponent(caption)}`);
  const shareToThreads = () => openIntent(`https://www.threads.net/intent/post?text=${encodeURIComponent(caption)}`);

  const shareViaApp = async () => {
    if (!canShare) return;
    setBusy(true);
    try {
      const { msg: result } = await shareViaSheet(date, selectedEntries, exById, data.unit);
      showMsg(result);
    } catch {
      showMsg("Could not share — try again");
    } finally {
      setBusy(false);
    }
  };

  const copyCaption = async () => {
    try {
      await navigator.clipboard.writeText(caption);
      showMsg("Caption copied");
    } catch {
      showMsg("Could not copy");
    }
  };

  const handlePlatform = (id) => {
    if (!canShare) return;
    if (id === "x") return shareToX();
    if (id === "threads") return shareToThreads();
    return shareViaApp(); // Facebook / Instagram accept no reliable text+image web intent — the native share sheet is the real path
  };

  return (
    <div className="screen">
      <header className="header">
        <button className="ghostbtn" onClick={onBack}>‹ Back</button>
        <div style={{ fontWeight: 700, fontSize: 17 }}>Share Workout</div>
        <span style={{ width: 64 }} />
      </header>

      <div style={{ color: T.label, fontSize: 14 }}>{fmtDate(date)}</div>

      {loggedEntries.length === 0 ? (
        <div className="empty">Log a set today before sharing.</div>
      ) : (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span className="section-label">Exercises</span>
            <button className="ghostbtn" style={{ fontSize: 13, padding: "2px 8px", minHeight: 28 }} onClick={toggleAll}>
              {allSelected ? "Deselect all" : "Select all"}
            </button>
          </div>

          <div style={{ display: "grid", gap: 8 }}>
            {loggedEntries.map((en) => {
              const ex = exById[en.exId];
              const checked = selected.has(en.exId);
              return (
                <button key={en.exId} className="checkbox-row" onClick={() => toggleEx(en.exId)}>
                  <div className={`checkbox${checked ? " checked" : ""}`}>{checked && "✓"}</div>
                  <span className="plate" style={{ background: GROUP_COLORS[ex.group] || T.label }} />
                  <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                    <div style={{ fontWeight: 600 }}>{ex.name}</div>
                    <div style={{ color: T.label, fontSize: 12, marginTop: 1 }}>
                      {en.sets.map((s) => `${s.w}${data.unit}×${s.r}`).join(" · ")}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
              <span className="section-label">Caption</span>
              <button className="ghostbtn" style={{ fontSize: 13, padding: "2px 8px", minHeight: 28 }} disabled={!selectedEntries.length} onClick={copyCaption}>
                Copy
              </button>
            </div>
            <div className="panel" style={{ whiteSpace: "pre-wrap", fontSize: 14, color: T.text, lineHeight: 1.5 }}>
              {selectedEntries.length ? caption : "Select at least one exercise to build a caption."}
            </div>
          </div>

          <div>
            <span className="section-label">Share to</span>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 8 }}>
              {PLATFORMS.map((p) => (
                <button
                  key={p.id}
                  className="card"
                  disabled={!canShare}
                  style={{ flexDirection: "column", alignItems: "flex-start", gap: 8, minHeight: 80, opacity: canShare ? 1 : 0.5 }}
                  onClick={() => handlePlatform(p.id)}
                >
                  <span style={{
                    width: 36, height: 36, borderRadius: 10, background: p.bg, color: p.fg,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 17, fontWeight: 800, flexShrink: 0,
                  }}>
                    {p.glyph}
                  </span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{p.label}</div>
                    <div style={{ color: T.label, fontSize: 11 }}>{p.sub}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <button className="ghostbtn" style={{ fontSize: 13, justifySelf: "center" }} disabled={!canShare} onClick={shareViaApp}>
            {busy ? "Preparing…" : "More sharing options…"}
          </button>
        </>
      )}

      {msg && <div className="toast">{msg}</div>}
    </div>
  );
}
