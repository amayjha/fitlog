// Pure stats engine for the monthly "Iron Diary" recap — no side effects, no network,
// no localStorage access. Everything here is computed straight from the app's actual
// data shape (see src/data.js): `workouts` is an object keyed by zero-padded ISO date
// ("2026-07-17"), each value an array of { exId, sets: [{ w, r, ts }], note }.
//
// The spec this implements assumed `computeRecap(workouts, range)` with weightKg/reps
// fields already in kg. The real log stores raw `w`/`r` in whatever unit the user has
// selected (`data.unit`), and exercise names/groups live behind an `exById` lookup — so
// both functions take `exById` and `unit` as extra parameters to resolve that.
import { BODYWEIGHT_EXERCISES } from "../data.js";

const LBS_PER_KG = 2.20462;

const toKg = (w, unit) => (unit === "lbs" ? w / LBS_PER_KG : w);

const roundKg = (n) => Math.round(n);

// Trained days are entries with at least one logged set — an exercise added but not yet
// filled in (`sets: []`) doesn't count as a session.
const isTrainedDay = (entries) => entries.some((en) => en.sets.length > 0);

const trainedDayKeys = (workouts) =>
  Object.keys(workouts).filter((k) => isTrainedDay(workouts[k] || [])).sort();

const dayDiff = (aKey, bKey) => {
  const a = new Date(aKey + "T12:00:00");
  const b = new Date(bKey + "T12:00:00");
  return Math.round((b - a) / 86400000);
};

// Monday-start week key for grouping the "current streak in weeks" calculation.
const weekKey = (dateKey) => {
  const d = new Date(dateKey + "T12:00:00");
  const dow = (d.getDay() + 6) % 7; // 0 = Monday
  d.setDate(d.getDate() - dow);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const addDaysKey = (dateKey, delta) => {
  const d = new Date(dateKey + "T12:00:00");
  d.setDate(d.getDate() + delta);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

// Heaviest single set weight (kg) logged for `exId` on a given day, ignoring 0kg sets —
// a 0-weight set can't represent a meaningful "top set" for a weighted exercise. Bodyweight
// exercises are excluded from weight-progression tracking entirely (see computeRecap), so
// this filtering never hides real bodyweight training.
const topSetKgForDay = (entries, exId, unit) => {
  const entry = entries.find((en) => en.exId === exId);
  if (!entry) return 0;
  return entry.sets.reduce((max, s) => {
    const kg = toKg(s.w, unit);
    return kg > 0 ? Math.max(max, kg) : max;
  }, 0);
};

/**
 * @param {Record<string, Array<{exId:string, sets:Array<{w:number,r:number}>}>>} workouts
 * @param {Record<string, {id:string,name:string,group:string}>} exById
 * @param {"kg"|"lbs"} unit
 * @param {{startDate:string, endDate:string}} range  zero-padded ISO dates, inclusive
 */
export function computeRecap(workouts, exById, unit, { startDate, endDate }) {
  const allDayKeys = trainedDayKeys(workouts);
  const periodDayKeys = allDayKeys.filter((k) => k >= startDate && k <= endDate);

  const days = dayDiff(startDate, endDate) + 1;
  const sessions = periodDayKeys.length;

  // ── Volume ──
  let totalVolumeRaw = 0;
  for (const k of periodDayKeys) {
    for (const en of workouts[k]) {
      for (const s of en.sets) totalVolumeRaw += toKg(s.w, unit) * s.r;
    }
  }
  const totalVolumeKg = roundKg(totalVolumeRaw);

  // Per-session volume series, oldest first — used by the share-card sparkline.
  const sessionVolumes = periodDayKeys.map((k) => {
    let vol = 0;
    for (const en of workouts[k]) for (const s of en.sets) vol += toKg(s.w, unit) * s.r;
    return { date: k, volumeKg: roundKg(vol) };
  });

  // ── Longest gap between consecutive sessions within the period ──
  let longestGapDays = 0;
  let gapReturnIdx = -1;
  for (let i = 1; i < periodDayKeys.length; i++) {
    const gap = dayDiff(periodDayKeys[i - 1], periodDayKeys[i]);
    if (gap > longestGapDays) { longestGapDays = gap; gapReturnIdx = i; }
  }

  // ── Current streak in consecutive calendar weeks (Mon–Sun), counting back from endDate,
  //    using the full history so a streak isn't artificially cut off by the period start ──
  const trainedWeeks = new Set(allDayKeys.filter((k) => k <= endDate).map(weekKey));
  let currentStreakWeeks = 0;
  let cursor = weekKey(endDate);
  while (trainedWeeks.has(cursor)) {
    currentStreakWeeks++;
    cursor = addDaysKey(cursor, -7);
  }

  // ── Per-exercise progression (weighted exercises only — bodyweight movements have no
  //    meaningful weight to track, since they're always logged at 0) ──
  const exIdsInPeriod = new Set();
  for (const k of periodDayKeys) for (const en of workouts[k]) if (en.sets.length) exIdsInPeriod.add(en.exId);

  const exercises = [];
  for (const exId of exIdsInPeriod) {
    const ex = exById[exId];
    if (!ex || BODYWEIGHT_EXERCISES.has(ex.name)) continue;

    const daysForEx = periodDayKeys.filter((k) => topSetKgForDay(workouts[k], exId, unit) > 0);
    if (!daysForEx.length) continue;

    const firstWeightKg = topSetKgForDay(workouts[daysForEx[0]], exId, unit);
    const lastWeightKg = topSetKgForDay(workouts[daysForEx[daysForEx.length - 1]], exId, unit);

    const prePeriodBest = allDayKeys
      .filter((k) => k < startDate)
      .reduce((max, k) => Math.max(max, topSetKgForDay(workouts[k], exId, unit)), 0);
    const inPeriodBest = daysForEx.reduce((max, k) => Math.max(max, topSetKgForDay(workouts[k], exId, unit)), 0);

    exercises.push({
      name: ex.name,
      firstWeightKg: roundKg(firstWeightKg),
      lastWeightKg: roundKg(lastWeightKg),
      deltaKg: roundKg(lastWeightKg - firstWeightKg),
      prHit: inPeriodBest > prePeriodBest,
    });
  }

  const prCount = exercises.filter((e) => e.prHit).length;
  const topProgressions = [...exercises]
    .sort((a, b) => b.deltaKg - a.deltaKg)
    .slice(0, 3)
    .map((e) => ({ name: e.name, from: e.firstWeightKg, to: e.lastWeightKg }));

  // ── Comeback: populated only when the longest gap crosses the 10-day threshold ──
  let comeback = null;
  if (longestGapDays >= 10 && gapReturnIdx >= 0) {
    const returnDate = periodDayKeys[gapReturnIdx];
    const returnEntry = workouts[returnDate].find((en) => en.sets.length && exById[en.exId]);
    comeback = {
      gapDays: longestGapDays,
      returnDate,
      returnExercise: returnEntry ? exById[returnEntry.exId].name : "",
    };
  }

  const standoutStat = `${totalVolumeKg.toLocaleString()} kg total volume`;

  return {
    period: { start: startDate, end: endDate, days },
    sessions,
    totalVolumeKg,
    longestGapDays,
    currentStreakWeeks,
    exercises,
    topProgressions,
    prCount,
    comeback,
    standoutStat,
    sessionVolumes,
  };
}

/**
 * Real-time milestone flags evaluated against the most recently trained day in the log —
 * used to decide whether to auto-offer a recap banner right after a workout is saved.
 * @param {Record<string, Array<{exId:string, sets:Array<{w:number,r:number}>}>>} workouts
 * @param {Record<string, {id:string,name:string,group:string}>} exById
 * @param {"kg"|"lbs"} unit
 */
export function getMilestones(workouts, exById, unit) {
  const dayKeys = trainedDayKeys(workouts);
  const last = dayKeys[dayKeys.length - 1];
  if (!last) return { newPr: false, roundVolumeCrossed: false, returnedFromGap: false };

  const priorKeys = dayKeys.slice(0, -1);

  let newPr = false;
  for (const en of workouts[last]) {
    if (!en.sets.length || !exById[en.exId]) continue;
    const bestOnLast = topSetKgForDay(workouts[last], en.exId, unit);
    const priorBest = priorKeys.reduce((max, k) => Math.max(max, topSetKgForDay(workouts[k], en.exId, unit)), 0);
    if (bestOnLast > priorBest && bestOnLast > 0) { newPr = true; break; }
  }

  const volumeThrough = (keys) => {
    let vol = 0;
    for (const k of keys) for (const en of workouts[k]) for (const s of en.sets) vol += toKg(s.w, unit) * s.r;
    return vol;
  };
  const totalBefore = volumeThrough(priorKeys);
  const totalThrough = volumeThrough(dayKeys);
  const roundVolumeCrossed = Math.floor(totalThrough / 10000) > Math.floor(totalBefore / 10000);

  const prevDay = priorKeys[priorKeys.length - 1];
  const returnedFromGap = prevDay ? dayDiff(prevDay, last) >= 10 : false;

  return { newPr, roundVolumeCrossed, returnedFromGap };
}
