export const DEFAULT_EXERCISES = [
  // Chest
  ["Flat Barbell Bench Press", "Chest"], ["Incline Dumbbell Press", "Chest"],
  ["Incline Barbell Bench Press", "Chest"], ["Cable Fly", "Chest"],
  ["Push Up", "Chest"], ["Dips", "Chest"], ["Pec Deck", "Chest"],
  // Back
  ["Deadlift", "Back"], ["Barbell Row", "Back"], ["Lat Pulldown", "Back"],
  ["Pull Up", "Back"], ["Seated Cable Row", "Back"], ["T-Bar Row", "Back"],
  ["Single Arm Dumbbell Row", "Back"], ["Face Pull", "Back"],
  // Legs
  ["Barbell Squat", "Legs"], ["Leg Press", "Legs"], ["Romanian Deadlift", "Legs"],
  ["Leg Extension", "Legs"], ["Lying Leg Curl", "Legs"], ["Standing Calf Raise", "Legs"],
  ["Hack Squat", "Legs"], ["Bulgarian Split Squat", "Legs"], ["Seated Calf Raise", "Legs"],
  // Shoulders
  ["Overhead Press", "Shoulders"], ["Dumbbell Shoulder Press", "Shoulders"],
  ["Lateral Raise", "Shoulders"], ["Arnold Press", "Shoulders"],
  ["Rear Delt Fly", "Shoulders"], ["Upright Row", "Shoulders"],
  // Biceps
  ["Barbell Curl", "Biceps"], ["Dumbbell Curl", "Biceps"], ["Hammer Curl", "Biceps"],
  ["Preacher Curl", "Biceps"], ["Cable Curl", "Biceps"], ["Incline Dumbbell Curl", "Biceps"],
  // Triceps
  ["Cable Pushdown", "Triceps"], ["Skull Crusher", "Triceps"],
  ["Overhead Triceps Extension", "Triceps"], ["Close-Grip Bench Press", "Triceps"],
  ["Diamond Push Up", "Triceps"],
  // Core
  ["Plank", "Core"], ["Hanging Leg Raise", "Core"], ["Cable Crunch", "Core"],
  ["Russian Twist", "Core"], ["Ab Rollout", "Core"], ["Sit Up", "Core"],
  // Cardio
  ["Treadmill Run", "Cardio"], ["Stationary Bike", "Cardio"], ["Rowing Machine", "Cardio"],
  ["Jump Rope", "Cardio"], ["Stair Climber", "Cardio"], ["Elliptical", "Cardio"],
].map(([name, group], i) => ({ id: "d" + i, name, group }));

export const EMPTY_DATA = {
  workouts: {},
  customExercises: [],
  templates: [],
  goals: [],
  body: [],
  unit: "kg",
  lastSet: {},
  workoutNotes: {},
};

export const STORAGE_KEY = "fitlog:v1";

export const loadData = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...EMPTY_DATA, ...JSON.parse(raw) };
  } catch (e) {
    console.error("Could not load saved data", e);
  }
  return EMPTY_DATA;
};
