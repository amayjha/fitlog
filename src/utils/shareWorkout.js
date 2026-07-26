import { dkey, e1rm, fmtDate, round1, wrapText } from "../utils.js";

// Card style palettes for the shareable graphic — picked the same way Strava lets you swipe
// through a few looks for the stat card before you send it.
export const CARD_STYLES = [
  { id: "classic", label: "Classic" },
  { id: "dark", label: "Dark" },
  { id: "mono", label: "Mono" },
];

export const CARD_PALETTES = {
  classic: { bg: "#F5EFE8", accent: "#C07B52", text: "#1C1008", subtext: "#7A6450", divider: "rgba(0,0,0,0.09)" },
  dark: { bg: "#0F1A2E", accent: "#D9B66B", text: "#F5EFE8", subtext: "#93A0B8", divider: "rgba(255,255,255,0.12)" },
  mono: { bg: "#0A0A0A", accent: "#FFFFFF", text: "#FFFFFF", subtext: "#9A9A9A", divider: "rgba(255,255,255,0.15)" },
};

export const GROUP_DOT_COLORS = { Chest: "#D4504A", Back: "#3878C8", Legs: "#D8872A", Shoulders: "#4A9E68", Biceps: "#9855C8", Triceps: "#D85050", Core: "#C8A020", Cardio: "#3AAAC0" };

// Consecutive trained days ending at `date` (inclusive).
export const computeStreak = (workouts, date) => {
  const trainedDays = new Set(Object.keys(workouts).filter((k) => workouts[k].length));
  const sorted = [...trainedDays].sort().reverse();
  if (!sorted.length) return 0;
  let streak = 0;
  let current = dkey(date);
  for (const k of sorted) {
    if (k === current) {
      streak++;
      const d = new Date(k + "T12:00:00");
      d.setDate(d.getDate() - 1);
      current = dkey(d);
    } else if (k < current) {
      break;
    }
  }
  return streak;
};

// Short highlight lines derived from the selected entries — PRs, current streak, and the
// heaviest single set (when more than one exercise is selected, so it isn't just a repeat).
export const buildWorkoutInsights = (entries, exById, bestByExercise, streak) => {
  const insights = [];
  const prNames = [];
  let topSet = null;
  for (const en of entries) {
    const ex = exById[en.exId];
    if (!ex || !en.sets.length) continue;
    const best = en.sets.reduce((m, s) => Math.max(m, e1rm(s.w, s.r)), 0);
    const allTimeBest = bestByExercise?.[en.exId] || 0;
    if (best > 0 && Math.abs(best - allTimeBest) < 0.001) prNames.push(ex.name);
    for (const s of en.sets) {
      const vol = s.w * s.r;
      if (!topSet || vol > topSet.vol) topSet = { name: ex.name, w: s.w, r: s.r, vol };
    }
  }
  if (prNames.length) insights.push(`🏆 New PR${prNames.length > 1 ? "s" : ""}: ${prNames.join(", ")}`);
  if (streak > 1) insights.push(`🔥 ${streak}-day streak`);
  if (topSet && entries.length > 1) insights.push(`💪 Top set: ${topSet.name} ${topSet.w}×${topSet.r}`);
  return insights;
};

export const buildShareText = (date, entries, exById, unit, insights = []) => {
  const lines = [`Workout — ${fmtDate(date)}`, ""];
  let vol = 0;
  for (const en of entries) {
    const ex = exById[en.exId];
    if (!ex || !en.sets.length) continue;
    vol += en.sets.reduce((a, s) => a + s.w * s.r, 0);
    lines.push(`${ex.name}: ${en.sets.map((s) => `${s.w}${unit}×${s.r}`).join(", ")}`);
  }
  if (insights.length) lines.push("", ...insights);
  lines.push("", `Total volume: ${round1(vol).toLocaleString()} ${unit}`);
  return lines.join("\n");
};

// Pure image generation — no download/share side effects, so callers can decide how to deliver it.
export const renderWorkoutImage = async (date, entries, exById, unit, insights = [], styleId = "classic") => {
  const rows = entries.filter((en) => exById[en.exId] && en.sets.length);
  if (!rows.length) return null;
  const palette = CARD_PALETTES[styleId] || CARD_PALETTES.classic;
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
  m.font = "700 14px -apple-system, system-ui, sans-serif";
  const insightLines = insights.length ? wrapText(m, insights.join("   ·   "), W - padX * 2) : [];
  const insightsH = insightLines.length ? 16 + insightLines.length * 22 : 0;
  const H = 132 + prepared.reduce((a, p) => a + 34 + p.lines.length * 24 + 16, 0) + insightsH + 84;
  const c = document.createElement("canvas");
  c.width = W * scale; c.height = H * scale;
  const ctx = c.getContext("2d");
  ctx.scale(scale, scale);
  ctx.fillStyle = palette.bg; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = palette.accent; ctx.font = "800 13px -apple-system, system-ui, sans-serif";
  ctx.fillText("F I T L O G", padX, 46);
  ctx.fillStyle = palette.text; ctx.font = "800 26px -apple-system, system-ui, sans-serif";
  ctx.fillText(fmtDate(date), padX, 84);
  let y = 138;
  for (const p of prepared) {
    ctx.fillStyle = GROUP_DOT_COLORS[p.ex.group] || palette.subtext;
    ctx.beginPath(); ctx.arc(padX + 7, y - 6, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = palette.text; ctx.font = "700 18px -apple-system, system-ui, sans-serif";
    ctx.fillText(p.ex.name, padX + 26, y);
    ctx.fillStyle = palette.subtext; ctx.font = setFont;
    p.lines.forEach((ln, i) => ctx.fillText(ln, padX + 26, y + 26 + i * 24));
    y += 34 + p.lines.length * 24 + 16;
  }
  if (insightLines.length) {
    y += 6;
    ctx.fillStyle = palette.accent; ctx.font = "700 14px -apple-system, system-ui, sans-serif";
    insightLines.forEach((ln, i) => ctx.fillText(ln, padX, y + i * 22));
    y += insightLines.length * 22 + 10;
  }
  ctx.strokeStyle = palette.divider; ctx.beginPath();
  ctx.moveTo(padX, y); ctx.lineTo(W - padX, y); ctx.stroke();
  ctx.fillStyle = palette.subtext; ctx.font = "400 14px -apple-system, system-ui, sans-serif";
  ctx.fillText("TOTAL VOLUME", padX, y + 32);
  ctx.fillStyle = palette.accent; ctx.font = "800 22px -apple-system, system-ui, sans-serif";
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
// `text` is the caller's final caption (including any manual edits) — this never regenerates it.
export const shareViaSheet = async (date, entries, exById, unit, text, insights = [], styleId = "classic") => {
  try { await navigator.clipboard?.writeText(text); } catch {}

  const blob = await renderWorkoutImage(date, entries, exById, unit, insights, styleId);
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
