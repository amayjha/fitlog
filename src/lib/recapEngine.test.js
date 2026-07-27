import { describe, it, expect } from "vitest";
import { computeRecap, getMilestones } from "./recapEngine.js";

const exById = {
  d1: { id: "d1", name: "Flat Barbell Bench Press", group: "Chest" },
  d2: { id: "d2", name: "Barbell Row", group: "Back" },
  d3: { id: "d3", name: "Pull Up", group: "Back" }, // bodyweight
};

const entry = (exId, sets) => ({ exId, sets, note: "" });
const set = (w, r) => ({ w, r, note: "", ts: 0 });

describe("computeRecap", () => {
  it("returns zeroed stats for an empty range", () => {
    const stats = computeRecap({}, exById, "kg", { startDate: "2026-07-01", endDate: "2026-07-31" });
    expect(stats.sessions).toBe(0);
    expect(stats.totalVolumeKg).toBe(0);
    expect(stats.longestGapDays).toBe(0);
    expect(stats.exercises).toEqual([]);
    expect(stats.comeback).toBeNull();
    expect(stats.period).toEqual({ start: "2026-07-01", end: "2026-07-31", days: 31 });
  });

  it("computes volume and progression for a single session", () => {
    const workouts = {
      "2026-07-15": [entry("d1", [set(60, 5), set(60, 5)])],
    };
    const stats = computeRecap(workouts, exById, "kg", { startDate: "2026-07-01", endDate: "2026-07-31" });
    expect(stats.sessions).toBe(1);
    expect(stats.totalVolumeKg).toBe(600); // 60*5 + 60*5
    expect(stats.exercises).toEqual([
      { name: "Flat Barbell Bench Press", firstWeightKg: 60, lastWeightKg: 60, deltaKg: 0, prHit: true },
    ]);
    expect(stats.prCount).toBe(1); // no pre-period history, so any weighted set is a first-time PR
  });

  it("flags an 11-day gap as a comeback", () => {
    const workouts = {
      "2026-07-01": [entry("d1", [set(60, 5)])],
      "2026-07-12": [entry("d2", [set(40, 8)])], // 11 days after 07-01
    };
    const stats = computeRecap(workouts, exById, "kg", { startDate: "2026-07-01", endDate: "2026-07-31" });
    expect(stats.longestGapDays).toBe(11);
    expect(stats.comeback).toEqual({ gapDays: 11, returnDate: "2026-07-12", returnExercise: "Barbell Row" });
  });

  it("does not flag a comeback under the 10-day threshold", () => {
    const workouts = {
      "2026-07-01": [entry("d1", [set(60, 5)])],
      "2026-07-09": [entry("d1", [set(62.5, 5)])], // 8 days later
    };
    const stats = computeRecap(workouts, exById, "kg", { startDate: "2026-07-01", endDate: "2026-07-31" });
    expect(stats.longestGapDays).toBe(8);
    expect(stats.comeback).toBeNull();
  });

  it("detects a PR against pre-period history, not just within-period deltas", () => {
    const workouts = {
      "2026-06-10": [entry("d1", [set(80, 3)])], // pre-period best: 80kg
      "2026-07-05": [entry("d1", [set(70, 5)])], // within period, but below history — no PR
      "2026-07-20": [entry("d1", [set(85, 3)])], // exceeds pre-period best — PR
    };
    const stats = computeRecap(workouts, exById, "kg", { startDate: "2026-07-01", endDate: "2026-07-31" });
    const bench = stats.exercises.find((e) => e.name === "Flat Barbell Bench Press");
    expect(bench.prHit).toBe(true);
    expect(bench.firstWeightKg).toBe(70);
    expect(bench.lastWeightKg).toBe(85);
    expect(bench.deltaKg).toBe(15);
  });

  it("excludes bodyweight-only exercises from weight progression tracking", () => {
    const workouts = {
      "2026-07-10": [entry("d3", [set(0, 12), set(0, 10)])],
    };
    const stats = computeRecap(workouts, exById, "kg", { startDate: "2026-07-01", endDate: "2026-07-31" });
    expect(stats.exercises).toEqual([]);
    expect(stats.sessions).toBe(1); // still counts as a trained session
    expect(stats.totalVolumeKg).toBe(0);
  });

  it("converts lbs to kg for volume math", () => {
    const workouts = {
      "2026-07-10": [entry("d1", [set(220.462, 5)])], // 100kg
    };
    const stats = computeRecap(workouts, exById, "lbs", { startDate: "2026-07-01", endDate: "2026-07-31" });
    expect(stats.totalVolumeKg).toBe(500); // 100kg * 5 reps
    expect(stats.exercises[0].firstWeightKg).toBe(100);
  });
});

describe("getMilestones", () => {
  it("returns all-false flags when there is no training history", () => {
    expect(getMilestones({}, exById, "kg")).toEqual({ newPr: false, roundVolumeCrossed: false, returnedFromGap: false });
  });

  it("flags a new PR on the most recent session", () => {
    const workouts = {
      "2026-07-01": [entry("d1", [set(60, 5)])],
      "2026-07-08": [entry("d1", [set(65, 5)])],
    };
    expect(getMilestones(workouts, exById, "kg").newPr).toBe(true);
  });

  it("flags crossing a 10,000kg round-number boundary", () => {
    const workouts = {
      "2026-07-01": [entry("d1", [set(495, 20)])], // 9,900kg
      "2026-07-08": [entry("d1", [set(50, 5)])],   // +250kg -> 10,150kg, crosses 10,000
    };
    expect(getMilestones(workouts, exById, "kg").roundVolumeCrossed).toBe(true);
  });

  it("flags a return from a gap of 10+ days", () => {
    const workouts = {
      "2026-07-01": [entry("d1", [set(60, 5)])],
      "2026-07-13": [entry("d1", [set(60, 5)])], // 12 days later
    };
    expect(getMilestones(workouts, exById, "kg").returnedFromGap).toBe(true);
  });
});
