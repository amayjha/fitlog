import { useState, useMemo, useEffect } from "react";
import { T, GROUP_COLORS } from "../theme.js";
import { buildShareText, buildWorkoutInsights, computeStreak, shareViaSheet, CARD_STYLES } from "../utils/shareWorkout.js";
import SharePreviewCard from "../components/SharePreviewCard.jsx";

const PLATFORMS = [
  { id: "x", label: "X", sub: "Post as a tweet", bg: "#000000", fg: "#fff", glyph: "𝕏" },
  { id: "threads", label: "Threads", sub: "Post as a thread", bg: "#101010", fg: "#fff", glyph: "🧵" },
  { id: "facebook", label: "Facebook", sub: "Share via Facebook app", bg: "#1877F2", fg: "#fff", glyph: "f" },
  { id: "instagram", label: "Instagram", sub: "Share via Instagram app", bg: "linear-gradient(135deg,#F58529,#DD2A7B,#8134AF,#515BD4)", fg: "#fff", glyph: "📷" },
];

export default function ShareWorkoutScreen({ data, exById, date, todayEntries, bestByExercise, onBack }) {
  const loggedEntries = useMemo(
    () => todayEntries.filter((en) => exById[en.exId] && en.sets.length > 0),
    [todayEntries, exById]
  );

  const [cardStyle, setCardStyle] = useState("classic");
  const [selected, setSelected] = useState(() => new Set(loggedEntries.map((en) => en.exId)));
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const [caption, setCaption] = useState("");
  const [captionEdited, setCaptionEdited] = useState(false);

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

  const streak = useMemo(() => computeStreak(data.workouts, date), [data.workouts, date]);

  const insights = useMemo(
    () => buildWorkoutInsights(selectedEntries, exById, bestByExercise, streak),
    [selectedEntries, exById, bestByExercise, streak]
  );

  const generatedCaption = useMemo(() => {
    if (!selectedEntries.length) return "";
    return buildShareText(date, selectedEntries, exById, data.unit, insights);
  }, [date, selectedEntries, exById, data.unit, insights]);

  // Keep the caption in sync with the selection until the user starts typing their own edits.
  useEffect(() => {
    if (!captionEdited) setCaption(generatedCaption);
  }, [generatedCaption, captionEdited]);

  const canShare = selectedEntries.length > 0 && !busy && caption.trim().length > 0;

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
      const { msg: result } = await shareViaSheet(date, selectedEntries, exById, data.unit, caption, insights, cardStyle);
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

  const resetCaption = () => {
    setCaption(generatedCaption);
    setCaptionEdited(false);
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

      {loggedEntries.length === 0 ? (
        <div className="empty">Log a set today before sharing.</div>
      ) : (
        <>
          {/* Card style — swipe-style pick like Strava's stat-card templates */}
          <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
            {CARD_STYLES.map((s) => (
              <button
                key={s.id}
                className={`chip${cardStyle === s.id ? " active" : ""}`}
                onClick={() => setCardStyle(s.id)}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* The card itself is the centerpiece — everything below just customizes and sends it */}
          <SharePreviewCard
            styleId={cardStyle}
            date={date}
            entries={selectedEntries.length ? selectedEntries : loggedEntries}
            exById={exById}
            unit={data.unit}
            insights={selectedEntries.length ? insights : []}
          />

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span className="section-label">Include in card</span>
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
              <div style={{ display: "flex", gap: 4 }}>
                {captionEdited && (
                  <button className="ghostbtn" style={{ fontSize: 13, padding: "2px 8px", minHeight: 28 }} onClick={resetCaption}>
                    Reset
                  </button>
                )}
                <button className="ghostbtn" style={{ fontSize: 13, padding: "2px 8px", minHeight: 28 }} disabled={!caption.trim()} onClick={copyCaption}>
                  Copy
                </button>
              </div>
            </div>
            <textarea
              className="input"
              style={{ whiteSpace: "pre-wrap", fontSize: 14, color: T.text, lineHeight: 1.5, minHeight: 120, resize: "vertical" }}
              value={caption}
              placeholder="Select at least one exercise to build a caption."
              disabled={!selectedEntries.length}
              onChange={(e) => { setCaption(e.target.value); setCaptionEdited(true); }}
            />
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
