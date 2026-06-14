import { T } from "../theme.js";

export default function Stepper({ label, value, onMinus, onPlus, onChange, min = 0 }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ color: T.faint, fontSize: 11, letterSpacing: 2, marginBottom: 10, fontWeight: 700 }}>
        {label}
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
        <button className="stepbtn" onClick={onMinus} type="button">−</button>
        <input
          className="numinput"
          inputMode="decimal"
          value={value}
          onChange={(e) => {
            const v = parseFloat(e.target.value);
            if (!isNaN(v)) onChange(Math.max(min, v));
            else if (e.target.value === "") onChange(min);
          }}
        />
        <button className="stepbtn" onClick={onPlus} type="button">+</button>
      </div>
    </div>
  );
}
