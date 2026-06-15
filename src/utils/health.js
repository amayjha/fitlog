import { Health } from "@capgo/capacitor-health";

const LS_PERMITTED = "fitlog:health-permitted";

export async function isHealthAvailable() {
  try {
    const { available } = await Health.isAvailable();
    return available;
  } catch {
    return false;
  }
}

export function wasHealthPermitted() {
  return localStorage.getItem(LS_PERMITTED) === "1";
}

export async function requestHealthPermissions() {
  await Health.requestAuthorization({
    read: ["steps", "calories", "workouts"],
    write: [],
  });
  localStorage.setItem(LS_PERMITTED, "1");
}

export async function getDayActivity(date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  try {
    const [stepsRes, calsRes] = await Promise.all([
      Health.queryAggregated({
        dataType: "steps",
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        bucket: "day",
        aggregation: "sum",
      }),
      Health.queryAggregated({
        dataType: "calories",
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        bucket: "day",
        aggregation: "sum",
      }),
    ]);
    const steps = stepsRes.samples?.[0]?.value ?? null;
    const calories = calsRes.samples?.[0]?.value ?? null;
    return steps === null && calories === null ? null : { steps, calories };
  } catch {
    return null;
  }
}

// Workout types that users track natively in FitLog — skip on import
const SKIP_TYPES = new Set([
  "strengthTraining",
  "traditionalStrengthTraining",
  "functionalStrengthTraining",
  "weightlifting",
]);

// Human-readable name for each workout type
const WORKOUT_NAMES = {
  running: "Running",
  runningTreadmill: "Treadmill Run",
  cycling: "Cycling",
  bikingStationary: "Stationary Bike",
  swimming: "Swimming",
  swimmingPool: "Swimming",
  swimmingOpenWater: "Open Water Swim",
  walking: "Walking",
  hiking: "Hiking",
  elliptical: "Elliptical",
  rowing: "Rowing",
  rowingMachine: "Rowing Machine",
  yoga: "Yoga",
  pilates: "Pilates",
  highIntensityIntervalTraining: "HIIT",
  crossTraining: "Cross Training",
  stairClimbing: "Stair Climbing",
  stairClimbingMachine: "Stair Machine",
  jumpRope: "Jump Rope",
  boxing: "Boxing",
  kickboxing: "Kickboxing",
  dance: "Dance",
  coreTraining: "Core Training",
  flexibility: "Flexibility / Stretching",
  martialArts: "Martial Arts",
  tennis: "Tennis",
  soccer: "Soccer",
  basketball: "Basketball",
  golf: "Golf",
  skiing: "Skiing",
  snowboarding: "Snowboarding",
  barre: "Barre",
  bootCamp: "Boot Camp",
  calisthenics: "Calisthenics",
  stepTraining: "Step Training",
  mixedCardio: "Mixed Cardio",
  mindAndBody: "Mind & Body",
  other: "Workout",
};

const WORKOUT_GROUP = {
  Running: "Cardio",
  "Treadmill Run": "Cardio",
  Cycling: "Cardio",
  "Stationary Bike": "Cardio",
  Swimming: "Cardio",
  "Open Water Swim": "Cardio",
  Walking: "Cardio",
  Hiking: "Cardio",
  Elliptical: "Cardio",
  Rowing: "Cardio",
  "Rowing Machine": "Cardio",
  Yoga: "Core",
  Pilates: "Core",
  HIIT: "Cardio",
  "Cross Training": "Cardio",
  "Stair Climbing": "Legs",
  "Stair Machine": "Legs",
  "Jump Rope": "Cardio",
  Boxing: "Cardio",
  Kickboxing: "Cardio",
  Dance: "Cardio",
  "Core Training": "Core",
  "Flexibility / Stretching": "Core",
  "Martial Arts": "Cardio",
  Tennis: "Cardio",
  Soccer: "Cardio",
  Basketball: "Cardio",
  Golf: "Cardio",
  Skiing: "Cardio",
  Snowboarding: "Cardio",
  Barre: "Core",
  "Boot Camp": "Cardio",
  Calisthenics: "Cardio",
  "Step Training": "Legs",
  "Mixed Cardio": "Cardio",
  "Mind & Body": "Core",
  Workout: "Cardio",
};

function toDateKey(isoStr) {
  const d = new Date(isoStr);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export async function getRecentWorkouts(days = 30) {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - days);

  const all = [];
  let anchor;
  do {
    const res = await Health.queryWorkouts({
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      limit: 100,
      ...(anchor ? { anchor } : {}),
    });
    all.push(...(res.workouts || []));
    anchor = res.anchor;
  } while (anchor);

  return all
    .filter((w) => !SKIP_TYPES.has(w.workoutType))
    .map((w) => {
      const name =
        WORKOUT_NAMES[w.workoutType] ||
        w.workoutType
          .replace(/([A-Z])/g, " $1")
          .trim()
          .replace(/\b\w/g, (c) => c.toUpperCase());
      const group = WORKOUT_GROUP[name] || "Cardio";
      const durationMins = Math.max(1, Math.round((w.duration || 0) / 60));
      const calories = w.totalEnergyBurned ? Math.round(w.totalEnergyBurned) : null;
      const distanceKm = w.totalDistance
        ? Math.round(w.totalDistance / 100) / 10
        : null;
      return { name, group, dateKey: toDateKey(w.startDate), durationMins, calories, distanceKm };
    });
}
