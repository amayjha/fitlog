import { useMemo, useState } from "react";
import { T } from "../theme.js";
import { dkey } from "../utils.js";
import { getMilestones } from "../lib/recapEngine.js";

const seenKey = (id) => `fitlog:recap:seen:${id}`;

// Dismissible banner only — never a modal, and never shown mid-workout since it lives on
// HomeScreen's day view rather than any logging flow. Priority: comeback > new PR >
// round-number volume > monthly rollover, each shown at most once (tracked in localStorage).
export default function RecapBanner({ data, exById, session, profile, setOverlay }) {
  const isPaid = !!session && !!profile?.is_paid;
  const [dismissedId, setDismissedId] = useState(null);

  const trigger = useMemo(() => {
    if (!isPaid) return null;
    const dayKeys = Object.keys(data.workouts)
      .filter((k) => data.workouts[k].some((en) => en.sets.length))
      .sort();
    const lastDay = dayKeys[dayKeys.length - 1];
    if (!lastDay) return null;

    const milestones = getMilestones(data.workouts, exById, data.unit);
    const candidates = [];
    if (milestones.returnedFromGap) {
      candidates.push({ id: `gap-${lastDay}`, label: "Welcome back — your comeback recap is ready." });
    }
    if (milestones.newPr) {
      candidates.push({ id: `newpr-${lastDay}`, label: "New PR! See it in your Iron Diary recap." });
    }
    if (milestones.roundVolumeCrossed) {
      candidates.push({ id: `roundvol-${lastDay}`, label: "You just crossed a big volume milestone." });
    }

    const today = new Date();
    if (today.getDate() <= 5) {
      const prevMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const periodKey = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, "0")}`;
      const prevStart = dkey(prevMonth);
      const prevEnd = dkey(new Date(prevMonth.getFullYear(), prevMonth.getMonth() + 1, 0));
      const prevSessions = dayKeys.filter((k) => k >= prevStart && k <= prevEnd).length;
      if (prevSessions >= 5) {
        candidates.push({
          id: `rollover-${periodKey}`,
          label: `Your ${prevMonth.toLocaleDateString(undefined, { month: "long" })} recap is ready.`,
        });
      }
    }

    return candidates.find((c) => c.id !== dismissedId && !localStorage.getItem(seenKey(c.id))) || null;
  }, [isPaid, data.workouts, exById, data.unit, dismissedId]);

  if (!trigger) return null;

  const dismiss = () => {
    localStorage.setItem(seenKey(trigger.id), "1");
    setDismissedId(trigger.id);
  };

  return (
    <div className="panel" style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px" }}>
      <span style={{ fontSize: 22, flexShrink: 0 }}>📖</span>
      <div style={{ flex: 1, fontSize: 14, fontWeight: 600, color: T.text }}>{trigger.label}</div>
      <button className="chip active" onClick={() => { dismiss(); setOverlay({ name: "recap" }); }}>View</button>
      <button className="ghostbtn dim" style={{ fontSize: 16, padding: "4px 6px", minHeight: 28 }} onClick={dismiss}>✕</button>
    </div>
  );
}
