# Ironlog Recap Engine — Implementation Spec

Build a "monthly recap / Iron Diary" feature for Ironlog, an existing React + Vite
workout-tracker PWA that stores all data in `localStorage` (no accounts). The feature
has three parts: a client-side stats aggregator, a serverless proxy that calls the
Anthropic API, and a shareable recap card component.

**First step: inspect the existing codebase.** Locate the actual localStorage schema
for workouts/sets and the app's design tokens (colors, fonts). The schema below is an
assumption — adapt field names to what actually exists rather than migrating data.

---

## Assumed data model (adapt to actual)

```js
// localStorage key: "ironlog_workouts" (verify)
[
  {
    date: "2026-07-17",            // ISO date
    exercises: [
      {
        name: "Incline Bench Press",
        muscleGroup: "Chest",
        sets: [ { weightKg: 25, reps: 12 }, ... ]
      }
    ]
  }
]
// Body weight entries may exist under a separate key — include if present.
```

---

## Module 1 — `src/lib/recapEngine.js` (pure, no side effects)

### `computeRecap(workouts, { startDate, endDate })` → `RecapStats`

Filters workouts to the date range and returns:

```ts
interface RecapStats {
  period: { start: string; end: string; days: number };
  sessions: number;
  totalVolumeKg: number;              // Σ weight × reps across all sets
  longestGapDays: number;             // max gap between consecutive sessions
  currentStreakWeeks: number;         // consecutive calendar weeks with ≥1 session
  exercises: Array<{
    name: string;
    firstWeightKg: number;            // top set weight in first session of period
    lastWeightKg: number;             // top set weight in last session of period
    deltaKg: number;
    prHit: boolean;                   // exceeded all-time top weight during period
  }>;
  topProgressions: Array<{ name: string; from: number; to: number }>; // top 3 by deltaKg
  prCount: number;
  comeback: null | { gapDays: number; returnDate: string; returnExercise: string };
                                      // populated when longestGapDays >= 10
  standoutStat: string;               // one computed line, e.g. "47,969 kg total volume"
}
```

Rules:
- All computation client-side; the raw set log never leaves the device.
- Round volume to whole kg. Ignore sets with weight 0 unless every set is bodyweight.
- Export a second helper `getMilestones(workouts)` returning flags:
  `{ newPr, roundVolumeCrossed, returnedFromGap }` for trigger logic (Module 4).

### Tests
Vitest unit tests: empty range, single session, an 11-day gap producing a `comeback`,
PR detection against pre-period history, volume math.

---

## Module 2 — Backend proxy `POST /api/recap`

A single serverless/Express endpoint deployed alongside the app on Railway.
Reads `ANTHROPIC_API_KEY` from env — never expose it to the client.

Request body: `{ stats: RecapStats }` (validate shape; reject > 8 KB).

Call the Anthropic Messages API, model `claude-sonnet-4-6`, `max_tokens: 1000`,
with this system prompt:

```
You are a sports-documentary narrator writing a short training recap. Voice:
understated, warm, a little literary — David Attenborough meets a lifting log.
Never mock the lifter. Treat small weights with the same respect as big ones.
Celebrate consistency and comebacks over raw numbers. Use kg only.

Respond ONLY with valid JSON, no markdown fences, matching:
{
  "headline": string,        // max 8 words
  "narrative": string,       // 120-220 words, 2-4 paragraphs
  "standout_stat": string,   // one number-led line
  "one_liner": string        // max 12 words, shareable, e.g. "48 tonnes in 79 days"
}
```

User message: `JSON.stringify(stats)`.

Server behavior:
- Strip accidental ``` fences before `JSON.parse`; on parse failure retry once,
  then return 502 with a friendly error.
- Return `{ recap, generatedAt }`.
- Rate limit: max 5 recaps per client per day (in-memory or IP-based is fine).

---

## Module 3 — `src/components/RecapCard.jsx`

Two render modes from the same recap object:

1. **In-app view**: full `narrative` + stats, matching existing app styling
   (dark iron grey `#16181C`, accent yellow `#E8B43A`, muted grey `#9AA0AA` —
   verify against actual tokens).
2. **Share card**: fixed 1080×1920 hidden node containing:
   - `headline` large, `one_liner` in accent yellow
   - `standout_stat` and 2–3 top progressions ("Barbell Row 15 → 30 kg")
   - a minimal volume-per-session sparkline (inline SVG, no chart lib)
   - small Ironlog wordmark bottom-right

Export flow: `html-to-image` → PNG blob → `navigator.share({ files })` when
supported, else download fallback. No `<form>` tags; standard onClick handlers.

---

## Module 4 — Triggers & caching

- Cache each generated recap in localStorage keyed by period
  (`ironlog_recap_2026-07`); "Regenerate" allowed once per period.
- Gate: require ≥ 5 sessions in the period, else show "log a few more sessions" state.
- Auto-offer (dismissible banner, never a modal mid-workout) when:
  monthly rollover with ≥5 sessions, `newPr`, `roundVolumeCrossed` (every 10,000 kg),
  or `returnedFromGap` (≥10 days) — the comeback recap is the priority trigger.

---

## Acceptance criteria

1. Full flow works offline-first: stats compute without network; only the
   generate step needs connectivity, with a clear offline error state.
2. Generated PNG is legible at Instagram-story size on a phone.
3. Raw workout log never sent to any server — only `RecapStats`.
4. Unit tests in Module 1 pass; no regressions to existing logging screens.
5. Total added bundle weight < 100 KB gzipped (html-to-image is the main cost).
