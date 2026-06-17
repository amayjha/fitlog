export const DEFAULT_EXERCISES = [
  // Chest
  ["Flat Barbell Bench Press", "Chest"], ["Incline Dumbbell Press", "Chest"],
  ["Incline Barbell Bench Press", "Chest"], ["Cable Fly", "Chest"],
  ["Push Up", "Chest"], ["Dips", "Chest"], ["Pec Deck", "Chest"],
  ["Decline Barbell Bench Press", "Chest"], ["Decline Dumbbell Press", "Chest"],
  ["Flat Dumbbell Press", "Chest"], ["Dumbbell Fly", "Chest"],
  ["Incline Cable Fly", "Chest"], ["Low Cable Fly", "Chest"],
  ["Cable Crossover", "Chest"], ["Machine Chest Press", "Chest"],
  ["Incline Machine Press", "Chest"], ["Smith Machine Bench Press", "Chest"],
  ["Chest Dip", "Chest"], ["Svend Press", "Chest"], ["Decline Push Up", "Chest"],
  // Back
  ["Deadlift", "Back"], ["Barbell Row", "Back"], ["Lat Pulldown", "Back"],
  ["Pull Up", "Back"], ["Seated Cable Row", "Back"], ["T-Bar Row", "Back"],
  ["Single Arm Dumbbell Row", "Back"], ["Face Pull", "Back"],
  ["Chin Up", "Back"], ["Sumo Deadlift", "Back"], ["Rack Pull", "Back"],
  ["Hyperextension", "Back"], ["Dumbbell Pullover", "Back"],
  ["Cable Pullover", "Back"], ["Straight Arm Pulldown", "Back"],
  ["Wide Grip Lat Pulldown", "Back"], ["Close Grip Lat Pulldown", "Back"],
  ["Chest Supported Row", "Back"], ["Inverted Row", "Back"],
  ["Meadows Row", "Back"], ["Pendlay Row", "Back"],
  ["Smith Machine Row", "Back"], ["Seal Row", "Back"],
  // Legs
  ["Barbell Squat", "Legs"], ["Leg Press", "Legs"], ["Romanian Deadlift", "Legs"],
  ["Leg Extension", "Legs"], ["Lying Leg Curl", "Legs"], ["Standing Calf Raise", "Legs"],
  ["Hack Squat", "Legs"], ["Bulgarian Split Squat", "Legs"], ["Seated Calf Raise", "Legs"],
  ["Front Squat", "Legs"], ["Goblet Squat", "Legs"], ["Sumo Squat", "Legs"],
  ["Hip Thrust", "Legs"], ["Glute Bridge", "Legs"], ["Lunge", "Legs"],
  ["Walking Lunge", "Legs"], ["Reverse Lunge", "Legs"], ["Step Up", "Legs"],
  ["Box Jump", "Legs"], ["Leg Press Calf Raise", "Legs"],
  ["Smith Machine Squat", "Legs"], ["Seated Leg Curl", "Legs"],
  ["Nordic Hamstring Curl", "Legs"], ["Pistol Squat", "Legs"],
  ["Abductor Machine", "Legs"], ["Adductor Machine", "Legs"],
  ["Sissy Squat", "Legs"], ["Cable Kickback", "Legs"],
  ["Donkey Calf Raise", "Legs"], ["Single Leg Press", "Legs"],
  // Shoulders
  ["Overhead Press", "Shoulders"], ["Dumbbell Shoulder Press", "Shoulders"],
  ["Lateral Raise", "Shoulders"], ["Arnold Press", "Shoulders"],
  ["Rear Delt Fly", "Shoulders"], ["Upright Row", "Shoulders"],
  ["Cable Lateral Raise", "Shoulders"], ["Dumbbell Front Raise", "Shoulders"],
  ["Barbell Front Raise", "Shoulders"], ["Cable Front Raise", "Shoulders"],
  ["Machine Shoulder Press", "Shoulders"], ["Reverse Pec Deck", "Shoulders"],
  ["Bent Over Lateral Raise", "Shoulders"], ["Barbell Shrug", "Shoulders"],
  ["Dumbbell Shrug", "Shoulders"], ["Cable Shrug", "Shoulders"],
  ["Landmine Press", "Shoulders"], ["Push Press", "Shoulders"],
  ["Bradford Press", "Shoulders"],
  // Biceps
  ["Barbell Curl", "Biceps"], ["Dumbbell Curl", "Biceps"], ["Hammer Curl", "Biceps"],
  ["Preacher Curl", "Biceps"], ["Cable Curl", "Biceps"], ["Incline Dumbbell Curl", "Biceps"],
  ["Concentration Curl", "Biceps"], ["Spider Curl", "Biceps"],
  ["Zottman Curl", "Biceps"], ["Reverse Curl", "Biceps"],
  ["EZ Bar Curl", "Biceps"], ["Machine Curl", "Biceps"],
  ["Cable Rope Hammer Curl", "Biceps"], ["Cross Body Hammer Curl", "Biceps"],
  ["Scott Curl", "Biceps"], ["Bayesian Curl", "Biceps"],
  // Triceps
  ["Cable Pushdown", "Triceps"], ["Skull Crusher", "Triceps"],
  ["Overhead Triceps Extension", "Triceps"], ["Close-Grip Bench Press", "Triceps"],
  ["Diamond Push Up", "Triceps"], ["Tricep Kickback", "Triceps"],
  ["Tricep Dip", "Triceps"], ["JM Press", "Triceps"], ["Tate Press", "Triceps"],
  ["Reverse Grip Pushdown", "Triceps"], ["EZ Bar Skull Crusher", "Triceps"],
  ["Single Arm Cable Pushdown", "Triceps"],
  ["Cable Overhead Tricep Extension", "Triceps"],
  // Core
  ["Plank", "Core"], ["Hanging Leg Raise", "Core"], ["Cable Crunch", "Core"],
  ["Russian Twist", "Core"], ["Ab Rollout", "Core"], ["Sit Up", "Core"],
  ["Dead Bug", "Core"], ["Bird Dog", "Core"], ["Side Plank", "Core"],
  ["V-Up", "Core"], ["Leg Raise", "Core"], ["Bicycle Crunch", "Core"],
  ["Mountain Climbers", "Core"], ["Flutter Kicks", "Core"],
  ["Hollow Body Hold", "Core"], ["Dragon Flag", "Core"],
  ["Pallof Press", "Core"], ["Decline Sit Up", "Core"],
  ["Oblique Crunch", "Core"], ["Woodchop", "Core"],
  ["Toe Touch", "Core"], ["Windshield Wiper", "Core"],
  // Cardio
  ["Treadmill Run", "Cardio"], ["Stationary Bike", "Cardio"], ["Rowing Machine", "Cardio"],
  ["Jump Rope", "Cardio"], ["Stair Climber", "Cardio"], ["Elliptical", "Cardio"],
  ["Burpees", "Cardio"], ["Battle Ropes", "Cardio"], ["Assault Bike", "Cardio"],
  ["Sled Push", "Cardio"], ["Sled Pull", "Cardio"], ["Ski Erg", "Cardio"],
  ["Kettlebell Swing", "Cardio"], ["Swimming", "Cardio"], ["Walking", "Cardio"],
  ["Cycling", "Cardio"], ["Sprint", "Cardio"], ["Box Step", "Cardio"],
].map(([name, group], i) => ({ id: "d" + i, name, group }));

// Exercises where weight tracking doesn't apply — only reps (or duration) matter.
export const BODYWEIGHT_EXERCISES = new Set([
  // Chest
  "Push Up", "Decline Push Up", "Diamond Push Up", "Dips", "Chest Dip",
  // Back
  "Pull Up", "Chin Up", "Inverted Row", "Hyperextension",
  // Legs
  "Box Jump", "Pistol Squat", "Glute Bridge", "Lunge", "Walking Lunge", "Reverse Lunge",
  // Triceps
  "Tricep Dip",
  // Core
  "Plank", "Side Plank", "Hanging Leg Raise", "Sit Up", "Decline Sit Up",
  "Leg Raise", "V-Up", "Dead Bug", "Bird Dog", "Hollow Body Hold",
  "Flutter Kicks", "Mountain Climbers", "Bicycle Crunch", "Toe Touch",
  "Windshield Wiper", "Oblique Crunch", "Dragon Flag",
]);

export const EMPTY_DATA = {
  workouts: {},
  customExercises: [],
  templates: [],
  goals: [],
  body: [],
  unit: "kg",
  lastSet: {},
  workoutNotes: {},
  meals: {},
  calorieGoal: 2000,
  macroGoals: { protein: 150, carbs: 200, fat: 65 },
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
