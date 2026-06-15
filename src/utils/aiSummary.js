const LS_KEY = "fitlog:ai-api-key";

export function getAiApiKey() {
  return localStorage.getItem(LS_KEY) || "";
}

export function saveAiApiKey(key) {
  if (key) localStorage.setItem(LS_KEY, key);
  else localStorage.removeItem(LS_KEY);
}

export async function generateWorkoutSummary(apiKey, entries, exById, unit) {
  const lines = entries
    .filter((en) => en.sets.length > 0)
    .map((en) => {
      const ex = exById[en.exId];
      if (!ex) return null;
      const sets = en.sets.map((s) => `${s.w}×${s.r}`).join(", ");
      const vol = en.sets.reduce((a, s) => a + s.w * s.r, 0);
      return `${ex.name} (${ex.group}): ${sets} — ${vol} ${unit} volume`;
    })
    .filter(Boolean);

  if (!lines.length) throw new Error("No sets to summarize");

  const totalVol = entries.reduce(
    (a, en) => a + en.sets.reduce((b, s) => b + s.w * s.r, 0),
    0
  );

  const prompt = `You are a concise, encouraging fitness coach. Write a 2-3 sentence workout summary covering the muscle groups targeted and one key highlight. End with a brief motivating note. Keep it under 80 words.

Workout (${unit}):
${lines.join("\n")}
Total volume: ${totalVol.toLocaleString()} ${unit}`;

  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 200,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.error?.message || `API error (${resp.status})`);
  }

  const result = await resp.json();
  return result.content?.[0]?.text?.trim() || "";
}
