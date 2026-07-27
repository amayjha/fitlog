import { useEffect, useMemo, useState } from "react";
import { T } from "../theme.js";
import { dkey } from "../utils.js";
import { computeRecap } from "../lib/recapEngine.js";
import { CARD_STYLES } from "../utils/shareWorkout.js";
import { shareRecapImage } from "../utils/recapShare.js";
import RecapCard from "../components/RecapCard.jsx";

const cacheKey = (periodKey) => `fitlog:recap:${periodKey}`;

const monthPeriod = (offset) => {
  const now = new Date();
  const base = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const end = new Date(base.getFullYear(), base.getMonth() + 1, 0);
  return {
    startDate: dkey(base),
    endDate: dkey(end),
    periodKey: `${base.getFullYear()}-${String(base.getMonth() + 1).padStart(2, "0")}`,
    label: base.toLocaleDateString(undefined, { month: "long", year: "numeric" }),
  };
};

export default function RecapScreen({ data, exById, session, profile, onBack }) {
  const isMember = !!session;
  const isPaid = !!profile?.is_paid;

  const [monthOffset, setMonthOffset] = useState(0);
  const [cardStyle, setCardStyle] = useState("classic");
  const [cached, setCached] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [msg, setMsg] = useState(null);

  const period = useMemo(() => monthPeriod(monthOffset), [monthOffset]);

  const stats = useMemo(
    () => computeRecap(data.workouts, exById, data.unit, { startDate: period.startDate, endDate: period.endDate }),
    [data.workouts, exById, data.unit, period]
  );

  useEffect(() => {
    setError(null);
    try {
      const raw = localStorage.getItem(cacheKey(period.periodKey));
      setCached(raw ? JSON.parse(raw) : null);
    } catch {
      setCached(null);
    }
  }, [period.periodKey]);

  const showMsg = (text) => {
    if (!text) return;
    setMsg(text);
    setTimeout(() => setMsg(null), 3000);
  };

  const generate = async () => {
    if (busy) return;
    if (!navigator.onLine) {
      setError("You're offline — connect to generate a recap.");
      return;
    }
    setBusy(true);
    setError(null);
    const wasCached = !!cached;
    try {
      const res = await fetch("/api/recap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stats }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Couldn't generate your recap.");
      const entry = { recap: json.recap, generatedAt: json.generatedAt, regenerated: wasCached };
      localStorage.setItem(cacheKey(period.periodKey), JSON.stringify(entry));
      setCached(entry);
    } catch (err) {
      setError(err.message || "Something went wrong — try again.");
    } finally {
      setBusy(false);
    }
  };

  const share = async () => {
    if (!cached) return;
    setBusy(true);
    try {
      const { msg: result } = await shareRecapImage(cached.recap, stats, cardStyle);
      showMsg(result);
    } catch {
      showMsg("Could not share — try again");
    } finally {
      setBusy(false);
    }
  };

  if (!isMember) {
    return (
      <div className="screen">
        <Header onBack={onBack} />
        <div className="panel" style={{ textAlign: "center", padding: "28px 20px", display: "grid", gap: 8 }}>
          <div style={{ fontSize: 32 }}>📖</div>
          <div style={{ fontWeight: 700, fontSize: 16 }}>Iron Diary is a paid feature</div>
          <div style={{ color: T.label, fontSize: 14 }}>Sign in and subscribe to unlock your monthly training recap.</div>
        </div>
      </div>
    );
  }

  if (!isPaid) {
    return (
      <div className="screen">
        <Header onBack={onBack} />
        <div className="panel" style={{ textAlign: "center", padding: "28px 20px", display: "grid", gap: 8 }}>
          <div style={{ fontSize: 32 }}>🔒</div>
          <div style={{ fontWeight: 700, fontSize: 16 }}>Iron Diary is a paid feature</div>
          <div style={{ color: T.label, fontSize: 14 }}>Subscribe to unlock your monthly training recap.</div>
        </div>
      </div>
    );
  }

  const meetsThreshold = stats.sessions >= 5;
  const canRegenerate = cached && !cached.regenerated;

  return (
    <div className="screen">
      <Header onBack={onBack} />

      <div className="panel" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px" }}>
        <button className="navbtn" style={{ height: 40, borderRadius: 10 }} onClick={() => setMonthOffset((o) => o - 1)}>‹</button>
        <div style={{ fontWeight: 700 }}>{period.label}</div>
        <button
          className="navbtn"
          style={{ height: 40, borderRadius: 10, opacity: monthOffset >= 0 ? 0.3 : 1 }}
          disabled={monthOffset >= 0}
          onClick={() => setMonthOffset((o) => Math.min(0, o + 1))}
        >
          ›
        </button>
      </div>

      {!meetsThreshold && !cached ? (
        <div className="empty">Log a few more sessions this month to unlock your recap ({stats.sessions}/5).</div>
      ) : !cached ? (
        <div className="panel" style={{ display: "grid", gap: 12, textAlign: "center", padding: "24px 20px" }}>
          <div style={{ fontSize: 15, color: T.label }}>
            {stats.sessions} sessions · {stats.totalVolumeKg.toLocaleString()} kg logged this month.
          </div>
          <button className="primary" disabled={busy} onClick={generate}>
            {busy ? "Writing your recap…" : "Generate Recap"}
          </button>
          {error && <div style={{ color: T.red, fontSize: 13 }}>⚠ {error}</div>}
        </div>
      ) : (
        <>
          <RecapCard mode="full" recap={cached.recap} stats={stats} />

          <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
            {CARD_STYLES.map((s) => (
              <button key={s.id} className={`chip${cardStyle === s.id ? " active" : ""}`} onClick={() => setCardStyle(s.id)}>
                {s.label}
              </button>
            ))}
          </div>

          <RecapCard mode="share" recap={cached.recap} stats={stats} styleId={cardStyle} />

          <button className="primary secondary" disabled={busy} onClick={share}>
            {busy ? "Preparing…" : "Share"}
          </button>

          {canRegenerate && (
            <button className="ghostbtn" style={{ justifySelf: "center" }} disabled={busy} onClick={generate}>
              Regenerate (once per month)
            </button>
          )}
          {error && <div style={{ color: T.red, fontSize: 13, textAlign: "center" }}>⚠ {error}</div>}
        </>
      )}

      {msg && <div className="toast">{msg}</div>}
    </div>
  );
}

function Header({ onBack }) {
  return (
    <header className="header">
      <button className="ghostbtn" onClick={onBack}>‹ Back</button>
      <div style={{ fontWeight: 700, fontSize: 17 }}>Iron Diary</div>
      <span style={{ width: 64 }} />
    </header>
  );
}
