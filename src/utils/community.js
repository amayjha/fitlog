import { supabase } from "./supabaseClient.js";

// tab id → { table, itemType } — itemType is what comments.item_type expects.
export const COMMUNITY_TABS = {
  templates:  { table: "shared_templates",  itemType: "template",  label: "Templates" },
  food_plans: { table: "shared_food_plans", itemType: "food_plan", label: "Food Plans" },
  goals:      { table: "shared_goals",      itemType: "goal",      label: "Goals" },
};

export const fetchFeed = async (tabId) => {
  const { table } = COMMUNITY_TABS[tabId];
  const { data, error } = await supabase
    .from(table)
    .select("*, profiles(username)")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return data;
};

export const fetchComments = async (itemType, itemId) => {
  const { data, error } = await supabase
    .from("comments")
    .select("*, profiles(username)")
    .eq("item_type", itemType)
    .eq("item_id", itemId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data;
};

export const addComment = async (userId, itemType, itemId, body) => {
  const { error } = await supabase
    .from("comments")
    .insert({ user_id: userId, item_type: itemType, item_id: itemId, body });
  if (error) throw error;
};

// ── Reactions ──
export const REACTION_EMOJIS = ["👍", "🔥", "💪", "❤️"];

// Returns { [emoji]: { count, reactedByMe } } for a single item.
export const fetchReactions = async (itemType, itemId, userId) => {
  const { data, error } = await supabase
    .from("reactions")
    .select("emoji, user_id")
    .eq("item_type", itemType)
    .eq("item_id", itemId);
  if (error) throw error;
  const summary = {};
  for (const emoji of REACTION_EMOJIS) summary[emoji] = { count: 0, reactedByMe: false };
  for (const row of data) {
    if (!summary[row.emoji]) summary[row.emoji] = { count: 0, reactedByMe: false };
    summary[row.emoji].count += 1;
    if (row.user_id === userId) summary[row.emoji].reactedByMe = true;
  }
  return summary;
};

// Total reaction count per item, for a lightweight badge on feed list cards.
export const fetchReactionCounts = async (itemType, itemIds) => {
  if (!itemIds.length) return {};
  const { data, error } = await supabase
    .from("reactions")
    .select("item_id")
    .eq("item_type", itemType)
    .in("item_id", itemIds);
  if (error) throw error;
  const counts = {};
  for (const row of data) counts[row.item_id] = (counts[row.item_id] || 0) + 1;
  return counts;
};

export const toggleReaction = async (userId, itemType, itemId, emoji, isActive) => {
  if (isActive) {
    const { error } = await supabase
      .from("reactions")
      .delete()
      .eq("user_id", userId)
      .eq("item_type", itemType)
      .eq("item_id", itemId)
      .eq("emoji", emoji);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("reactions")
      .insert({ user_id: userId, item_type: itemType, item_id: itemId, emoji });
    if (error) throw error;
  }
};

// ── Mapping local (device-only) data into the portable shapes the community tables expect ──

export const templateToShareable = (template, exById) =>
  (template.exIds || [])
    .map((id) => exById[id])
    .filter(Boolean)
    .map((ex) => ({ name: ex.name, group: ex.group }));

export const shareTemplate = async (userId, title, description, template, exById) => {
  const exercises = templateToShareable(template, exById);
  const { error } = await supabase
    .from("shared_templates")
    .insert({ user_id: userId, title, description: description || null, exercises });
  if (error) throw error;
};

export const goalToShareable = (goal, exById, unit) => ({
  exerciseName: exById[goal.exId]?.name || "Unknown exercise",
  goalType: goal.type,
  value: goal.target,
  unit,
});

export const shareGoal = async (userId, title, description, goal, exById, unit) => {
  const target = goalToShareable(goal, exById, unit);
  const { error } = await supabase
    .from("shared_goals")
    .insert({ user_id: userId, title, description: description || null, goal_type: goal.type, target });
  if (error) throw error;
};

export const MEAL_LABELS = { breakfast: "Breakfast", lunch: "Lunch", dinner: "Dinner", snacks: "Snacks" };

export const mealsToShareable = (mealItems) => {
  const grouped = { Breakfast: [], Lunch: [], Dinner: [], Snacks: [] };
  for (const item of mealItems) {
    const label = MEAL_LABELS[item.meal] || "Snacks";
    grouped[label].push({ name: item.name, qty: item.qty, cal: item.cal, p: item.p, c: item.c, f: item.f });
  }
  return grouped;
};

export const shareFoodPlan = async (userId, title, description, mealItems) => {
  const meals = mealsToShareable(mealItems);
  const { error } = await supabase
    .from("shared_food_plans")
    .insert({ user_id: userId, title, description: description || null, meals });
  if (error) throw error;
};
