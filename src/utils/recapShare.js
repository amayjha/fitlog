// Share-card renderer for the Iron Diary recap — same approach as renderWorkoutImage in
// shareWorkout.js (hand-drawn Canvas 2D, no html-to-image), reusing its palettes so the
// recap card matches the existing share-card look across Classic/Dark/Mono.
import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { wrapText } from "../utils.js";
import { CARD_PALETTES, downloadBlob } from "./shareWorkout.js";

const blobToBase64 = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

const FONT = "-apple-system, 'SF Pro Display', system-ui, sans-serif";

const drawSparkline = (ctx, sessionVolumes, x, y, w, h, color) => {
  if (sessionVolumes.length < 2) return;
  const max = Math.max(...sessionVolumes.map((s) => s.volumeKg), 1);
  const stepX = w / (sessionVolumes.length - 1);
  ctx.beginPath();
  sessionVolumes.forEach((s, i) => {
    const px = x + i * stepX;
    const py = y + h - (s.volumeKg / max) * h;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  });
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.lineJoin = "round";
  ctx.stroke();
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x, y + h);
  ctx.closePath();
  ctx.fillStyle = color + "22";
  ctx.fill();
};

// Pure image generation — 1080×1920 (9:16, Instagram-story size), no download/share side effects.
export const renderRecapImage = async (recap, stats, styleId = "classic") => {
  const palette = CARD_PALETTES[styleId] || CARD_PALETTES.classic;
  const scale = 2, W = 540, H = 960, padX = 40;
  const c = document.createElement("canvas");
  c.width = W * scale;
  c.height = H * scale;
  const ctx = c.getContext("2d");
  ctx.scale(scale, scale);

  ctx.fillStyle = palette.bg;
  ctx.fillRect(0, 0, W, H);

  let y = 90;

  ctx.fillStyle = palette.accent;
  ctx.font = "800 13px " + FONT;
  ctx.fillText("IRON DIARY", padX, y);
  y += 44;

  ctx.fillStyle = palette.text;
  ctx.font = "800 32px " + FONT;
  const headlineLines = wrapText(ctx, recap.headline || "", W - padX * 2);
  headlineLines.forEach((ln, i) => ctx.fillText(ln, padX, y + i * 40));
  y += headlineLines.length * 40 + 16;

  ctx.fillStyle = palette.accent;
  ctx.font = "700 19px " + FONT;
  const oneLinerLines = wrapText(ctx, recap.one_liner || "", W - padX * 2);
  oneLinerLines.forEach((ln, i) => ctx.fillText(ln, padX, y + i * 26));
  y += oneLinerLines.length * 26 + 48;

  ctx.strokeStyle = palette.divider;
  ctx.beginPath(); ctx.moveTo(padX, y); ctx.lineTo(W - padX, y); ctx.stroke();
  y += 40;

  ctx.fillStyle = palette.subtext;
  ctx.font = "700 13px " + FONT;
  ctx.fillText("STANDOUT", padX, y);
  y += 30;
  ctx.fillStyle = palette.text;
  ctx.font = "800 26px " + FONT;
  const standoutLines = wrapText(ctx, stats.standoutStat || "", W - padX * 2);
  standoutLines.forEach((ln, i) => ctx.fillText(ln, padX, y + i * 32));
  y += standoutLines.length * 32 + 44;

  const progressions = (stats.topProgressions || []).slice(0, 3);
  if (progressions.length) {
    ctx.fillStyle = palette.subtext;
    ctx.font = "700 13px " + FONT;
    ctx.fillText("TOP PROGRESSIONS", padX, y);
    y += 30;
    ctx.font = "600 17px " + FONT;
    for (const p of progressions) {
      ctx.fillStyle = palette.text;
      ctx.fillText(p.name, padX, y);
      ctx.fillStyle = palette.accent;
      ctx.font = "700 17px " + FONT;
      const line = `${p.from} → ${p.to} kg`;
      ctx.fillText(line, padX, y + 22);
      ctx.font = "600 17px " + FONT;
      y += 54;
    }
    y += 8;
  }

  const sessionVolumes = stats.sessionVolumes || [];
  if (sessionVolumes.length >= 2) {
    ctx.fillStyle = palette.subtext;
    ctx.font = "700 13px " + FONT;
    ctx.fillText("VOLUME PER SESSION", padX, y);
    y += 20;
    drawSparkline(ctx, sessionVolumes, padX, y, W - padX * 2, 110, palette.accent);
    y += 110 + 20;
  }

  ctx.fillStyle = palette.subtext;
  ctx.font = "600 13px " + FONT;
  ctx.textAlign = "right";
  ctx.fillText("FITLOG", W - padX, H - 36);
  ctx.textAlign = "left";

  return new Promise((res) => c.toBlob(res, "image/png"));
};

// Native: write the PNG into the cache dir and hand its file:// URI to the native share
// sheet — navigator.share's file support is inconsistent across WebViews, so this is the
// reliable path once wrapped in a native shell. Web: unchanged share-sheet-first,
// download-fallback flow (same pattern as shareViaSheet in shareWorkout.js).
export const shareRecapImage = async (recap, stats, styleId = "classic") => {
  const blob = await renderRecapImage(recap, stats, styleId);
  if (!blob) return { msg: null };
  const filename = `fitlog-recap-${stats.period.start}.png`;

  if (Capacitor.isNativePlatform()) {
    try {
      const base64Data = await blobToBase64(blob);
      const written = await Filesystem.writeFile({ path: filename, data: base64Data, directory: Directory.Cache });
      await Share.share({ title: recap.headline, text: recap.one_liner, url: written.uri });
      return { msg: "Shared" };
    } catch (e) {
      if (e?.message?.toLowerCase().includes("cancel")) return { msg: null }; // user dismissed the share sheet
      return { msg: "Could not share — try again" };
    }
  }

  const file = new File([blob], filename, { type: "image/png" });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], text: recap.one_liner });
      return { msg: "Shared" };
    } catch (e) {
      if (e.name === "AbortError") return { msg: null };
    }
  }
  downloadBlob(blob, filename);
  return { msg: "Image saved — attach it to your post" };
};
