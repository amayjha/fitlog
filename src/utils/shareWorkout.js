import { dkey, fmtDate, round1, wrapText } from "../utils.js";

export const buildShareText = (date, entries, exById, unit) => {
  const lines = [`Workout — ${fmtDate(date)}`, ""];
  let vol = 0;
  for (const en of entries) {
    const ex = exById[en.exId];
    if (!ex || !en.sets.length) continue;
    vol += en.sets.reduce((a, s) => a + s.w * s.r, 0);
    lines.push(`${ex.name}: ${en.sets.map((s) => `${s.w}${unit}×${s.r}`).join(", ")}`);
  }
  lines.push("", `Total volume: ${round1(vol).toLocaleString()} ${unit}`);
  return lines.join("\n");
};

// Pure image generation — no download/share side effects, so callers can decide how to deliver it.
export const renderWorkoutImage = async (date, entries, exById, unit) => {
  const rows = entries.filter((en) => exById[en.exId] && en.sets.length);
  if (!rows.length) return null;
  const scale = 2, W = 680, padX = 36, setFont = "400 16px system-ui, sans-serif";
  const m = document.createElement("canvas").getContext("2d");
  m.font = setFont;
  let vol = 0;
  const prepared = rows.map((en) => {
    const ex = exById[en.exId];
    vol += en.sets.reduce((a, s) => a + s.w * s.r, 0);
    const setsStr = en.sets.map((s) => `${s.w}×${s.r}`).join("   ");
    return { ex, lines: wrapText(m, setsStr, W - padX * 2 - 26) };
  });
  const H = 132 + prepared.reduce((a, p) => a + 34 + p.lines.length * 24 + 16, 0) + 84;
  const c = document.createElement("canvas");
  c.width = W * scale; c.height = H * scale;
  const ctx = c.getContext("2d");
  ctx.scale(scale, scale);
  ctx.fillStyle = "#F5EFE8"; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#C07B52"; ctx.font = "800 13px -apple-system, system-ui, sans-serif";
  ctx.fillText("F I T L O G", padX, 46);
  ctx.fillStyle = "#1C1008"; ctx.font = "800 26px -apple-system, system-ui, sans-serif";
  ctx.fillText(fmtDate(date), padX, 84);
  let y = 138;
  const groupColors = { Chest: "#D4504A", Back: "#3878C8", Legs: "#D8872A", Shoulders: "#4A9E68", Biceps: "#9855C8", Triceps: "#D85050", Core: "#C8A020", Cardio: "#3AAAC0" };
  for (const p of prepared) {
    ctx.fillStyle = groupColors[p.ex.group] || "#A89070";
    ctx.beginPath(); ctx.arc(padX + 7, y - 6, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#1C1008"; ctx.font = "700 18px -apple-system, system-ui, sans-serif";
    ctx.fillText(p.ex.name, padX + 26, y);
    ctx.fillStyle = "#7A6450"; ctx.font = setFont;
    p.lines.forEach((ln, i) => ctx.fillText(ln, padX + 26, y + 26 + i * 24));
    y += 34 + p.lines.length * 24 + 16;
  }
  ctx.strokeStyle = "rgba(0,0,0,0.09)"; ctx.beginPath();
  ctx.moveTo(padX, y); ctx.lineTo(W - padX, y); ctx.stroke();
  ctx.fillStyle = "#7A6450"; ctx.font = "400 14px -apple-system, system-ui, sans-serif";
  ctx.fillText("TOTAL VOLUME", padX, y + 32);
  ctx.fillStyle = "#C07B52"; ctx.font = "800 22px -apple-system, system-ui, sans-serif";
  ctx.fillText(`${round1(vol).toLocaleString()} ${unit}`, padX, y + 60);
  return new Promise((res) => c.toBlob(res, "image/png"));
};

export const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
};

// Facebook/Instagram have no reliable web intent for prefilling a custom caption + image, so the
// correct move is the native share sheet (where both apps show up as targets on a real device),
// with the caption also copied to the clipboard as a safety net for whichever field doesn't carry it over.
export const shareViaSheet = async (date, entries, exById, unit) => {
  const text = buildShareText(date, entries, exById, unit);
  try { await navigator.clipboard?.writeText(text); } catch {}

  const blob = await renderWorkoutImage(date, entries, exById, unit);
  const file = blob ? new File([blob], `workout-${dkey(date)}.png`, { type: "image/png" }) : null;

  if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], text });
      return { msg: "Shared" };
    } catch (e) {
      if (e.name === "AbortError") return { msg: null };
    }
  }
  if (navigator.share) {
    try {
      await navigator.share({ text });
      if (blob) downloadBlob(blob, `workout-${dkey(date)}.png`);
      return { msg: blob ? "Caption copied, image saved — attach it to your post" : "Caption copied" };
    } catch (e) {
      if (e.name === "AbortError") return { msg: null };
    }
  }
  if (blob) downloadBlob(blob, `workout-${dkey(date)}.png`);
  return { msg: "Caption copied and image saved — paste them into the app" };
};
