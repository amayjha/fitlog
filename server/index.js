// Minimal server for the Iron Diary recap feature. Serves the built Vite app (same as the
// old `serve -s dist` start script) and adds the one endpoint that needs a server: /api/recap,
// which calls the Anthropic API with the ANTHROPIC_API_KEY secret. That key must never reach
// the client, which is the whole reason this proxy exists — the app is otherwise static.
import express from "express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.join(__dirname, "..", "dist");
const PORT = process.env.PORT || 8787;
const MAX_RECAPS_PER_DAY = 5;
const DAY_MS = 24 * 60 * 60 * 1000;

const SYSTEM_PROMPT = `You are a sports-documentary narrator writing a short training recap. Voice:
understated, warm, a little literary — David Attenborough meets a lifting log.
Never mock the lifter. Treat small weights with the same respect as big ones.
Celebrate consistency and comebacks over raw numbers. Use kg only.

Respond ONLY with valid JSON, no markdown fences, matching:
{
  "headline": string,        // max 8 words
  "narrative": string,       // 120-220 words, 2-4 paragraphs
  "standout_stat": string,   // one number-led line
  "one_liner": string        // max 12 words, shareable, e.g. "48 tonnes in 79 days"
}`;

const app = express();
app.use(express.json({ limit: "8kb" }));

// In-memory per-IP rate limiter — good enough for a single Railway instance with no
// accounts; resets 24h after each IP's first request in the current window.
const rateLimits = new Map();
function checkRateLimit(ip) {
  const now = Date.now();
  const entry = rateLimits.get(ip);
  if (!entry || now - entry.windowStart > DAY_MS) {
    rateLimits.set(ip, { count: 1, windowStart: now });
    return true;
  }
  if (entry.count >= MAX_RECAPS_PER_DAY) return false;
  entry.count++;
  return true;
}

function isValidStats(stats) {
  return (
    stats &&
    typeof stats === "object" &&
    stats.period &&
    typeof stats.sessions === "number" &&
    typeof stats.totalVolumeKg === "number" &&
    Array.isArray(stats.exercises)
  );
}

function stripFences(text) {
  return text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
}

async function callAnthropic(stats) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: JSON.stringify(stats) }],
    }),
  });
  if (!res.ok) throw new Error(`Anthropic API returned ${res.status}`);
  const data = await res.json();
  const text = data.content?.[0]?.text || "";
  return JSON.parse(stripFences(text));
}

app.post("/api/recap", async (req, res) => {
  const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.socket.remoteAddress;
  if (!checkRateLimit(ip)) {
    return res.status(429).json({ error: "Daily recap limit reached — try again tomorrow." });
  }

  const { stats } = req.body || {};
  if (!isValidStats(stats)) {
    return res.status(400).json({ error: "Invalid stats payload." });
  }

  try {
    let recap;
    try {
      recap = await callAnthropic(stats);
    } catch {
      recap = await callAnthropic(stats); // one retry on parse/API failure
    }
    return res.json({ recap, generatedAt: new Date().toISOString() });
  } catch (err) {
    console.error("Recap generation failed", err);
    return res.status(502).json({ error: "Couldn't generate your recap right now — please try again." });
  }
});

app.use((err, _req, res, next) => {
  if (err?.type === "entity.too.large") {
    return res.status(413).json({ error: "Stats payload too large." });
  }
  next(err);
});

// Serve the static build in production (Railway); in local dev `dist` won't exist yet —
// run the Vite dev server separately and let its proxy forward /api to this process.
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
  app.get("*", (_req, res) => res.sendFile(path.join(DIST_DIR, "index.html")));
}

app.listen(PORT, () => console.log(`Server listening on :${PORT}`));
