import { useState, useEffect, useMemo } from "react";
import { T, GROUP_COLORS } from "../theme.js";
import {
  COMMUNITY_TABS, fetchFeed, fetchComments, addComment,
  fetchReactions, toggleReaction, fetchReactionCounts, REACTION_EMOJIS, MEAL_LABELS,
  shareTemplate, shareGoal, shareFoodPlan,
} from "../utils/community.js";
import { FOODS } from "../foods.js";

const MEAL_IDS = Object.keys(MEAL_LABELS);

/* ── Auth gate ── */
function AuthGate({ signUp, signIn, authBusy, authError, authNotice }) {
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");

  const canSubmit = email.trim() && password.length >= 6 && (mode === "signin" || username.trim());

  const submit = () => {
    if (!canSubmit || authBusy) return;
    if (mode === "signup") signUp(email.trim(), password, username.trim());
    else signIn(email.trim(), password);
  };

  return (
    <div className="panel" style={{ display: "grid", gap: 12 }}>
      <div className="section-label">{mode === "signin" ? "Sign in" : "Create an account"}</div>
      {mode === "signup" && (
        <input className="input" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
      )}
      <input className="input" placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input className="input" placeholder="Password (min. 6 characters)" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      {authNotice && (
        <div style={{ color: T.accent, fontSize: 13, lineHeight: 1.4 }}>✓ {authNotice}</div>
      )}
      {authError && <div style={{ color: T.red, fontSize: 13 }}>⚠ {authError}</div>}
      <button className="primary" disabled={!canSubmit || authBusy} onClick={submit}>
        {authBusy ? "Please wait…" : mode === "signin" ? "Sign In" : "Create Account"}
      </button>
      <button className="ghostbtn" style={{ justifySelf: "center", fontSize: 13 }} onClick={() => setMode(mode === "signin" ? "signup" : "signin")}>
        {mode === "signin" ? "New here? Create an account" : "Already have an account? Sign in"}
      </button>
    </div>
  );
}

/* ── Share flow: publish something you already have locally ── */
function SharePanel({ tabId, data, exById, keyToday, userId, onDone, onCancel }) {
  const [sourceId, setSourceId] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  // Food plans: share what's already logged today, or compose a new plan from scratch.
  const [foodMode, setFoodMode] = useState("today"); // "today" | "new"
  const [draftMeal, setDraftMeal] = useState("breakfast");
  const [draftItems, setDraftItems] = useState([]); // { meal, name, qty, cal, p, c, f }
  const [foodSearch, setFoodSearch] = useState("");
  const [customOpen, setCustomOpen] = useState(false);
  const [customFood, setCustomFood] = useState({ name: "", cal: "", p: "", c: "", f: "" });

  const templates = data.templates || [];
  const goals = data.goals || [];
  const todayMeals = data.meals?.[keyToday] || [];

  const selectedTemplate = tabId === "templates" ? templates.find((t) => t.id === sourceId) : null;
  const selectedGoal = tabId === "goals" ? goals.find((g) => g.id === sourceId) : null;

  useEffect(() => {
    if (tabId === "templates" && selectedTemplate) setTitle(selectedTemplate.name);
    if (tabId === "goals" && selectedGoal) setTitle(selectedGoal.exId && exById[selectedGoal.exId] ? `${exById[selectedGoal.exId].name} goal` : "Goal");
    if (tabId === "food_plans") setTitle((t) => t || "My meal plan");
  }, [tabId, selectedTemplate, selectedGoal]); // eslint-disable-line

  const foodItemsToShare = foodMode === "today" ? todayMeals : draftItems;

  const filteredFoods = useMemo(() => {
    const q = foodSearch.trim().toLowerCase();
    if (!q) return [];
    return FOODS.filter((f) => f.name.toLowerCase().includes(q)).slice(0, 20);
  }, [foodSearch]);

  const addDraftFood = (food) => {
    setDraftItems((prev) => [...prev, { meal: draftMeal, name: `${food.name} (${food.serving})`, cal: food.cal, p: food.p, c: food.c, f: food.f }]);
    setFoodSearch("");
  };

  const addDraftCustom = () => {
    if (!customFood.name.trim() || !customFood.cal) return;
    setDraftItems((prev) => [...prev, {
      meal: draftMeal, name: customFood.name.trim(),
      cal: Number(customFood.cal) || 0, p: Number(customFood.p) || 0, c: Number(customFood.c) || 0, f: Number(customFood.f) || 0,
    }]);
    setCustomFood({ name: "", cal: "", p: "", c: "", f: "" });
    setCustomOpen(false);
  };

  const removeDraftItem = (idx) => setDraftItems((prev) => prev.filter((_, i) => i !== idx));

  const canPublish =
    title.trim() &&
    ((tabId === "templates" && selectedTemplate) ||
      (tabId === "goals" && selectedGoal) ||
      (tabId === "food_plans" && foodItemsToShare.length > 0));

  const publish = async () => {
    if (!canPublish || busy) return;
    setBusy(true);
    setError(null);
    try {
      if (tabId === "templates") await shareTemplate(userId, title.trim(), description.trim(), selectedTemplate, exById);
      else if (tabId === "goals") await shareGoal(userId, title.trim(), description.trim(), selectedGoal, exById, data.unit);
      else await shareFoodPlan(userId, title.trim(), description.trim(), foodItemsToShare);
      onDone();
    } catch (e) {
      setError(e.message || "Could not publish");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="panel" style={{ display: "grid", gap: 12 }}>
      <div className="section-label">Share to community</div>

      {tabId === "templates" && (
        templates.length === 0 ? (
          <div className="empty" style={{ padding: "16px 8px" }}>No saved templates yet — create one first from More → Templates.</div>
        ) : (
          <div style={{ display: "grid", gap: 6 }}>
            {templates.map((t) => (
              <button key={t.id} className="checkbox-row" onClick={() => setSourceId(t.id)}>
                <div className={`checkbox${sourceId === t.id ? " checked" : ""}`}>{sourceId === t.id && "✓"}</div>
                <div style={{ flex: 1, textAlign: "left" }}>
                  <div style={{ fontWeight: 600 }}>{t.name}</div>
                  <div style={{ color: T.label, fontSize: 12 }}>{(t.exIds || []).length} exercises</div>
                </div>
              </button>
            ))}
          </div>
        )
      )}

      {tabId === "goals" && (
        goals.length === 0 ? (
          <div className="empty" style={{ padding: "16px 8px" }}>No goals yet — set one first from More → Goals.</div>
        ) : (
          <div style={{ display: "grid", gap: 6 }}>
            {goals.map((g) => {
              const ex = exById[g.exId];
              if (!ex) return null;
              return (
                <button key={g.id} className="checkbox-row" onClick={() => setSourceId(g.id)}>
                  <div className={`checkbox${sourceId === g.id ? " checked" : ""}`}>{sourceId === g.id && "✓"}</div>
                  <div style={{ flex: 1, textAlign: "left" }}>
                    <div style={{ fontWeight: 600 }}>{ex.name}</div>
                    <div style={{ color: T.label, fontSize: 12 }}>
                      {g.type === "1rm" ? "Est. 1RM" : "Max weight"} target: {g.target} {data.unit}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )
      )}

      {tabId === "food_plans" && (
        <div style={{ display: "grid", gap: 10 }}>
          <div style={{ display: "flex", gap: 6 }}>
            <button className={`chip${foodMode === "today" ? " active" : ""}`} onClick={() => setFoodMode("today")}>Today's log</button>
            <button className={`chip${foodMode === "new" ? " active" : ""}`} onClick={() => setFoodMode("new")}>Create new</button>
          </div>

          {foodMode === "today" ? (
            todayMeals.length === 0 ? (
              <div className="empty" style={{ padding: "16px 8px" }}>Nothing logged today — log some meals first from the Food tab, or switch to "Create new".</div>
            ) : (
              <div style={{ color: T.label, fontSize: 13 }}>
                Sharing today's {todayMeals.length} logged food item{todayMeals.length !== 1 ? "s" : ""}.
              </div>
            )
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {MEAL_IDS.map((m) => (
                  <button key={m} className={`chip${draftMeal === m ? " active" : ""}`} onClick={() => setDraftMeal(m)}>
                    {MEAL_LABELS[m]}
                  </button>
                ))}
              </div>

              <input
                className="input"
                style={{ padding: "10px 12px", fontSize: 14 }}
                placeholder={`Search foods to add to ${MEAL_LABELS[draftMeal]}…`}
                value={foodSearch}
                onChange={(e) => setFoodSearch(e.target.value)}
              />

              {filteredFoods.length > 0 && (
                <div style={{ display: "grid", gap: 4, maxHeight: 180, overflowY: "auto" }}>
                  {filteredFoods.map((f) => (
                    <button key={f.id} className="card" style={{ padding: "10px 12px", minHeight: 44 }} onClick={() => addDraftFood(f)}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{f.name}</div>
                        <div style={{ color: T.label, fontSize: 11 }}>{f.serving}</div>
                      </div>
                      <span style={{ color: T.accent, fontWeight: 700, fontSize: 14 }}>{f.cal} cal</span>
                    </button>
                  ))}
                </div>
              )}

              <button className="ghostbtn" style={{ fontSize: 13, justifySelf: "start", padding: "4px 0" }} onClick={() => setCustomOpen((o) => !o)}>
                {customOpen ? "▾" : "▸"} Add a custom food
              </button>
              {customOpen && (
                <div style={{ display: "grid", gap: 8 }}>
                  <input className="input" style={{ padding: "10px 12px", fontSize: 14 }} placeholder="Food name" value={customFood.name} onChange={(e) => setCustomFood({ ...customFood, name: e.target.value })} />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6 }}>
                    <input className="input" style={{ padding: "10px 8px", fontSize: 13 }} type="number" placeholder="Cal" value={customFood.cal} onChange={(e) => setCustomFood({ ...customFood, cal: e.target.value })} />
                    <input className="input" style={{ padding: "10px 8px", fontSize: 13 }} type="number" placeholder="P g" value={customFood.p} onChange={(e) => setCustomFood({ ...customFood, p: e.target.value })} />
                    <input className="input" style={{ padding: "10px 8px", fontSize: 13 }} type="number" placeholder="C g" value={customFood.c} onChange={(e) => setCustomFood({ ...customFood, c: e.target.value })} />
                    <input className="input" style={{ padding: "10px 8px", fontSize: 13 }} type="number" placeholder="F g" value={customFood.f} onChange={(e) => setCustomFood({ ...customFood, f: e.target.value })} />
                  </div>
                  <button className="chip" disabled={!customFood.name.trim() || !customFood.cal} onClick={addDraftCustom}>
                    Add to {MEAL_LABELS[draftMeal]}
                  </button>
                </div>
              )}

              {draftItems.length > 0 ? (
                <div style={{ display: "grid", gap: 6 }}>
                  {MEAL_IDS.filter((m) => draftItems.some((it) => it.meal === m)).map((m) => (
                    <div key={m}>
                      <div style={{ fontWeight: 600, fontSize: 12, color: T.faint, textTransform: "uppercase", letterSpacing: 0.5 }}>{MEAL_LABELS[m]}</div>
                      {draftItems.map((item, i) => item.meal !== m ? null : (
                        <div key={i} className="row" style={{ justifyContent: "space-between", padding: "6px 0" }}>
                          <span style={{ fontSize: 13 }}>{item.name} — {item.cal} cal</span>
                          <button className="set-action red" onClick={() => removeDraftItem(i)}>✕</button>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ color: T.faint, fontSize: 13 }}>Search or add a custom food above to build your plan.</div>
              )}
            </div>
          )}
        </div>
      )}

      <input className="input" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
      <textarea className="input" placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} />

      {error && <div style={{ color: T.red, fontSize: 13 }}>⚠ {error}</div>}

      <div style={{ display: "flex", gap: 8 }}>
        <button className="primary" style={{ flex: 1 }} disabled={!canPublish || busy} onClick={publish}>
          {busy ? "Publishing…" : "Publish"}
        </button>
        <button className="ghostbtn" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

/* ── Detail view for a single shared item, with comments ── */
function ItemDetail({ tabId, item, userId, onBack }) {
  const { itemType } = COMMUNITY_TABS[tabId];
  const [comments, setComments] = useState([]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [reactions, setReactions] = useState({});
  const [reactionBusy, setReactionBusy] = useState(null); // emoji currently toggling

  const load = () => {
    setLoading(true);
    fetchComments(itemType, item.id)
      .then(setComments)
      .catch(() => setComments([]))
      .finally(() => setLoading(false));
    fetchReactions(itemType, item.id, userId)
      .then(setReactions)
      .catch(() => {});
  };

  useEffect(() => { load(); }, [item.id]); // eslint-disable-line

  const handleReact = async (emoji) => {
    if (reactionBusy) return;
    const wasActive = !!reactions[emoji]?.reactedByMe;
    setReactionBusy(emoji);
    // optimistic update — feels instant, corrected on reload if the request fails
    setReactions((prev) => ({
      ...prev,
      [emoji]: { count: (prev[emoji]?.count || 0) + (wasActive ? -1 : 1), reactedByMe: !wasActive },
    }));
    try {
      await toggleReaction(userId, itemType, item.id, emoji, wasActive);
    } catch {
      fetchReactions(itemType, item.id, userId).then(setReactions).catch(() => {});
    } finally {
      setReactionBusy(null);
    }
  };

  const submitComment = async () => {
    if (!body.trim() || busy) return;
    setBusy(true);
    try {
      await addComment(userId, itemType, item.id, body.trim());
      setBody("");
      load();
    } catch {
      // swallow — comment box keeps the text so the user can retry
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <button className="ghostbtn" style={{ justifySelf: "start", padding: "4px 0" }} onClick={onBack}>‹ Back to feed</button>

      <div className="panel" style={{ display: "grid", gap: 10 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 18 }}>{item.title}</div>
          <div style={{ color: T.faint, fontSize: 12, marginTop: 2 }}>
            by {item.profiles?.username || "someone"} · {new Date(item.created_at).toLocaleDateString()}
          </div>
        </div>
        {item.description && <div style={{ color: T.label, fontSize: 14 }}>{item.description}</div>}

        {tabId === "templates" && (
          <div style={{ display: "grid", gap: 6 }}>
            {(item.exercises || []).map((ex, i) => (
              <div key={i} className="row">
                <span className="plate sm" style={{ background: GROUP_COLORS[ex.group] || T.label }} />
                <span>{ex.name}</span>
              </div>
            ))}
          </div>
        )}

        {tabId === "food_plans" && (
          <div style={{ display: "grid", gap: 10 }}>
            {Object.entries(item.meals || {}).filter(([, foods]) => foods.length).map(([meal, foods]) => (
              <div key={meal}>
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{meal}</div>
                {foods.map((f, i) => (
                  <div key={i} style={{ color: T.label, fontSize: 13 }}>
                    {f.name} {f.qty ? `(${f.qty})` : ""} — {f.cal} cal
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {tabId === "goals" && item.target && (
          <div style={{ color: T.label, fontSize: 14 }}>
            <strong>{item.target.exerciseName}</strong> — {item.target.goalType === "1rm" ? "Est. 1RM" : "Max weight"} target: {item.target.value} {item.target.unit}
          </div>
        )}

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
          {REACTION_EMOJIS.map((emoji) => {
            const r = reactions[emoji] || { count: 0, reactedByMe: false };
            return (
              <button
                key={emoji}
                className={`chip${r.reactedByMe ? " active" : ""}`}
                style={{ padding: "6px 12px" }}
                disabled={reactionBusy === emoji}
                onClick={() => handleReact(emoji)}
              >
                {emoji} {r.count > 0 ? r.count : ""}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div className="section-label" style={{ marginBottom: 8 }}>Comments</div>
        {loading ? (
          <div style={{ color: T.faint, fontSize: 13 }}>Loading…</div>
        ) : comments.length === 0 ? (
          <div style={{ color: T.faint, fontSize: 13 }}>No comments yet — be the first.</div>
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            {comments.map((c) => (
              <div key={c.id} className="panel" style={{ padding: "10px 12px" }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{c.profiles?.username || "someone"}</div>
                <div style={{ color: T.label, fontSize: 14, marginTop: 2 }}>{c.body}</div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <input
            className="input"
            placeholder="Add a comment…"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitComment()}
          />
          <button className="chip" disabled={!body.trim() || busy} onClick={submitComment}>Post</button>
        </div>
      </div>
    </div>
  );
}

/* ── Main screen ── */
export default function CommunityScreen({
  session, profile, authBusy, authError, authNotice, signUp, signIn, signOut,
  data, exById, key, onBack,
}) {
  const [tab, setTab] = useState("templates");
  const [feed, setFeed] = useState([]);
  const [reactionCounts, setReactionCounts] = useState({});
  const [loading, setLoading] = useState(false);
  const [feedError, setFeedError] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [shareOpen, setShareOpen] = useState(false);

  const isMember = !!session;
  const isPaid = !!profile?.is_paid;

  const loadFeed = () => {
    setLoading(true);
    setFeedError(null);
    fetchFeed(tab)
      .then((items) => {
        setFeed(items);
        const { itemType } = COMMUNITY_TABS[tab];
        fetchReactionCounts(itemType, items.map((i) => i.id)).then(setReactionCounts).catch(() => setReactionCounts({}));
      })
      .catch((e) => setFeedError(e.message || "Could not load community feed"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (isMember && isPaid) loadFeed();
  }, [tab, isMember, isPaid]); // eslint-disable-line

  const tabIds = useMemo(() => Object.keys(COMMUNITY_TABS), []);

  return (
    <div className="screen">
      <header className="header">
        <button className="ghostbtn" onClick={onBack}>‹ Back</button>
        <div style={{ fontWeight: 700, fontSize: 17 }}>Community</div>
        {isMember ? (
          <button className="ghostbtn" style={{ fontSize: 13 }} onClick={signOut}>Sign out</button>
        ) : (
          <span style={{ width: 64 }} />
        )}
      </header>

      {!isMember && <AuthGate signUp={signUp} signIn={signIn} authBusy={authBusy} authError={authError} authNotice={authNotice} />}

      {isMember && !isPaid && (
        <div className="panel" style={{ textAlign: "center", padding: "28px 20px", display: "grid", gap: 8 }}>
          <div style={{ fontSize: 32 }}>🔒</div>
          <div style={{ fontWeight: 700, fontSize: 16 }}>Community is a paid feature</div>
          <div style={{ color: T.label, fontSize: 14 }}>
            Subscribe to unlock sharing and discussing workout templates, food plans, and goals with other members.
          </div>
        </div>
      )}

      {isMember && isPaid && !selectedItem && (
        <>
          <div style={{ display: "flex", gap: 6 }}>
            {tabIds.map((id) => (
              <button
                key={id}
                className={`tab${tab === id ? " active" : ""}`}
                onClick={() => { setTab(id); setShareOpen(false); }}
              >
                {COMMUNITY_TABS[id].label}
              </button>
            ))}
          </div>

          {shareOpen ? (
            <SharePanel
              tabId={tab}
              data={data}
              exById={exById}
              keyToday={key}
              userId={session.user.id}
              onDone={() => { setShareOpen(false); loadFeed(); }}
              onCancel={() => setShareOpen(false)}
            />
          ) : (
            <button className="primary" onClick={() => setShareOpen(true)}>+ Share {COMMUNITY_TABS[tab].label.toLowerCase()}</button>
          )}

          {loading ? (
            <div style={{ color: T.faint, fontSize: 13, textAlign: "center", padding: 20 }}>Loading…</div>
          ) : feedError ? (
            <div style={{ color: T.red, fontSize: 13, textAlign: "center", padding: 20 }}>⚠ {feedError}</div>
          ) : feed.length === 0 ? (
            <div className="empty">Nothing shared yet — be the first!</div>
          ) : (
            <div style={{ display: "grid", gap: 8 }}>
              {feed.map((item) => (
                <button key={item.id} className="card" style={{ flexDirection: "column", alignItems: "flex-start", gap: 4 }} onClick={() => setSelectedItem(item)}>
                  <div style={{ fontWeight: 700 }}>{item.title}</div>
                  {item.description && (
                    <div style={{ color: T.label, fontSize: 13 }}>{item.description}</div>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "baseline" }}>
                    <div style={{ color: T.faint, fontSize: 12 }}>
                      by {item.profiles?.username || "someone"} · {new Date(item.created_at).toLocaleDateString()}
                    </div>
                    {reactionCounts[item.id] > 0 && (
                      <span className="badge" style={{ fontSize: 11 }}>❤️ {reactionCounts[item.id]}</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {isMember && isPaid && selectedItem && (
        <ItemDetail tabId={tab} item={selectedItem} userId={session.user.id} onBack={() => setSelectedItem(null)} />
      )}
    </div>
  );
}
