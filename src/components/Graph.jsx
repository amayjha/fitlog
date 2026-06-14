import { T } from "../theme.js";
import { round1 } from "../utils.js";

export default function Graph({ history, unit, color, label = "Estimated 1RM over time" }) {
  if (!history || history.length < 2) {
    return (
      <div className="empty" style={{ color: T.label }}>
        Log this exercise on at least two days to see a trend.
      </div>
    );
  }

  const W = 640, H = 240, pad = 40;
  const vals = history.map((h) => h.best);
  const min = Math.min(...vals), max = Math.max(...vals);
  const span = max - min || 1;
  const x = (i) => pad + (i * (W - pad * 2)) / (history.length - 1);
  const y = (v) => H - pad - ((v - min) / span) * (H - pad * 2);
  const path = vals.map((v, i) => `${i ? "L" : "M"}${x(i)},${y(v)}`).join(" ");
  const area = path + ` L${x(history.length - 1)},${H - pad} L${x(0)},${H - pad} Z`;

  return (
    <div className="panel">
      <div style={{ color: T.label, fontSize: 12, marginBottom: 6 }}>
        {label} ({unit})
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto" }}>
        {[min, (min + max) / 2, max].map((v, i) => (
          <g key={i}>
            <line x1={pad} x2={W - pad} y1={y(v)} y2={y(v)} stroke={T.sep} strokeDasharray="3 5" />
            <text x={6} y={y(v) + 4} fill={T.faint} fontSize="11">{round1(v)}</text>
          </g>
        ))}
        <defs>
          <linearGradient id={`grad-${color.replace("#","")}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <path d={area} fill={`url(#grad-${color.replace("#","")})`} />
        <path d={path} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {vals.map((v, i) => (
          <circle key={i} cx={x(i)} cy={y(v)} r="4.5" fill={T.card} stroke={color} strokeWidth="2" />
        ))}
      </svg>
      <div style={{ display: "flex", justifyContent: "space-between", color: T.faint, fontSize: 11 }}>
        <span>{history[0].k}</span>
        <span>{history[history.length - 1].k}</span>
      </div>
    </div>
  );
}
