import { useState, useEffect, useLayoutEffect } from "react";
import { T } from "../theme.js";

const STEPS = [
  {
    title: "Welcome to FitLog",
    text: "Let's take a quick tour of the app before you get started.",
  },
  {
    tab: "today",
    target: "date-strip",
    title: "Pick a day",
    text: "Swipe or tap through dates here to log workouts for any day.",
    placement: "bottom",
  },
  {
    tab: "today",
    target: "add-exercise",
    title: "Log a workout",
    text: "Tap here to pick an exercise and start recording sets, weight, and reps.",
    placement: "top",
  },
  {
    tab: "today",
    target: "summary-card",
    title: "Workout Summary",
    text: "Pick a date range and tap here (or the count) to see your volume, sets, and trends.",
    placement: "top",
  },
  {
    tab: "calendar",
    target: "nav-calendar",
    title: "Calendar",
    text: "Browse your full training history and jump to any past workout.",
    placement: "top",
  },
  {
    tab: "prs",
    target: "nav-prs",
    title: "Personal records",
    text: "See your best lift for every exercise, estimated automatically as you log sets.",
    placement: "top",
  },
  {
    tab: "body",
    target: "nav-body",
    title: "Body tracking",
    text: "Log weight and measurements to watch your body change over time.",
    placement: "top",
  },
  {
    tab: "nutrition",
    target: "nav-nutrition",
    title: "Nutrition",
    text: "Track meals, calories, and macros against your daily goals.",
    placement: "top",
  },
  {
    tab: "more",
    target: "nav-more",
    title: "More",
    text: "Templates, goals, backups, and settings live here — including this tutorial.",
    placement: "top",
  },
  {
    title: "You're all set",
    text: "Head to Today and log your first set. You can restart this tour anytime from More → Settings.",
  },
];

export default function Walkthrough({ active, activeTab, setActiveTab, onFinish }) {
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState(null);

  useEffect(() => {
    if (active) setStep(0);
  }, [active]);

  const s = STEPS[step] || STEPS[0];

  // Switch to the tab this step needs.
  useEffect(() => {
    if (!active || !s.tab) return;
    if (activeTab !== s.tab) setActiveTab(s.tab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, step]);

  // Measure the target element after the tab/DOM has settled.
  useLayoutEffect(() => {
    if (!active) return;
    if (!s.target) { setRect(null); return; }
    let raf1, raf2;
    const measure = () => {
      const el = document.querySelector(`[data-tour="${s.target}"]`);
      setRect(el ? el.getBoundingClientRect() : null);
    };
    raf1 = requestAnimationFrame(() => { raf2 = requestAnimationFrame(measure); });
    return () => { cancelAnimationFrame(raf1); cancelAnimationFrame(raf2); };
  }, [active, step, activeTab]);

  useEffect(() => {
    if (!active) return;
    const onResize = () => {
      if (!s.target) return;
      const el = document.querySelector(`[data-tour="${s.target}"]`);
      if (el) setRect(el.getBoundingClientRect());
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [active, step]);

  if (!active) return null;

  const pad = 8;
  const last = step === STEPS.length - 1;
  const cardWidth = 280;

  let cardStyle = { left: "50%", top: "50%", transform: "translate(-50%, -50%)" };
  if (rect) {
    const placement = s.placement || (rect.top > window.innerHeight / 2 ? "top" : "bottom");
    const left = Math.max(16, Math.min(rect.left, window.innerWidth - cardWidth - 16));
    cardStyle = placement === "top"
      ? { left, bottom: window.innerHeight - rect.top + pad + 8, transform: "none" }
      : { left, top: rect.bottom + pad + 8, transform: "none" };
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500 }}>
      {rect ? (
        <div
          style={{
            position: "fixed",
            top: rect.top - pad, left: rect.left - pad,
            width: rect.width + pad * 2, height: rect.height + pad * 2,
            borderRadius: 16,
            boxShadow: "0 0 0 9999px rgba(10,6,2,0.72)",
            border: `2px solid ${T.accent}`,
            transition: "all 0.35s ease",
            pointerEvents: "none",
          }}
        />
      ) : (
        <div style={{ position: "fixed", inset: 0, background: "rgba(10,6,2,0.72)" }} />
      )}

      <div
        className="panel"
        style={{
          position: "fixed", width: cardWidth, maxWidth: "calc(100vw - 32px)",
          ...cardStyle,
          display: "grid", gap: 10, zIndex: 501,
        }}
      >
        <div style={{ fontWeight: 800, fontSize: 17 }}>{s.title}</div>
        <div style={{ color: T.label, fontSize: 14, lineHeight: 1.5 }}>{s.text}</div>

        <div style={{ display: "flex", gap: 5, justifyContent: "center", margin: "2px 0" }}>
          {STEPS.map((_, i) => (
            <span
              key={i}
              style={{
                width: i === step ? 16 : 6, height: 6, borderRadius: 3,
                background: i === step ? T.accent : T.sep, transition: "all 0.2s",
              }}
            />
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {!last && (
            <button className="ghostbtn dim" style={{ padding: "10px 4px" }} onClick={onFinish}>
              Skip
            </button>
          )}
          <div style={{ flex: 1 }} />
          {step > 0 && (
            <button className="ghostbtn" onClick={() => setStep((v) => v - 1)}>Back</button>
          )}
          <button
            className="primary"
            style={{ width: "auto", padding: "10px 20px", minHeight: 40 }}
            onClick={() => (last ? onFinish() : setStep((v) => v + 1))}
          >
            {last ? "Done" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
