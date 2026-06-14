import { T } from "../theme.js";
import { fmtSecs } from "../utils.js";

export default function TimerBar({ timer, onDismiss }) {
  if (!timer) return null;

  const pct = (timer.remaining / timer.total) * 100;
  const isDone = timer.done;
  const bg = isDone ? "rgba(192,123,82,0.15)" : "rgba(253,248,244,0.92)";

  let label = "";
  if (isDone) {
    label = timer.type === "rest" ? "Rest over — next set!" : "Done!";
  } else if (timer.type === "rest") {
    label = fmtSecs(timer.remaining);
  } else if (timer.type === "emom") {
    label = `EMOM · Minute ${timer.currentMinute}/${timer.totalMinutes} · ${fmtSecs(timer.remaining)}`;
  } else if (timer.type === "amrap") {
    label = `AMRAP · ${fmtSecs(timer.remaining)}`;
  } else if (timer.type === "tabata") {
    const phase = timer.phase === "work" ? "WORK" : "REST";
    label = `Tabata · ${phase} · Round ${timer.currentRound}/${timer.totalRounds} · ${fmtSecs(timer.remaining)}`;
  }

  const fillColor = isDone
    ? "rgba(192,123,82,0.2)"
    : timer.type === "tabata" && timer.phase === "work"
    ? "rgba(192,123,82,0.18)"
    : timer.type === "tabata"
    ? "rgba(212,80,74,0.15)"
    : timer.type === "rest"
    ? "rgba(56,120,200,0.15)"
    : "rgba(192,123,82,0.15)";

  return (
    <div className="timerbar" style={{ background: bg }}>
      {!isDone && (
        <div
          className="timerfill"
          style={{ width: `${pct}%`, background: fillColor }}
        />
      )}
      <span style={{ position: "relative", fontWeight: 700, fontSize: 15, fontVariantNumeric: "tabular-nums", color: isDone ? T.accent : T.text }}>
        {label}
      </span>
      <button className="ghostbtn" style={{ position: "relative", padding: "6px 10px", color: T.label }} onClick={onDismiss}>
        ✕
      </button>
    </div>
  );
}
