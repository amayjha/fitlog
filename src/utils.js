export const dkey = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export const parseDate = (key) => new Date(key + "T12:00:00");

export const fmtDate = (d) =>
  d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short", year: "numeric" });

export const fmtShortDate = (d) =>
  d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

export const isToday = (d) => dkey(d) === dkey(new Date());

// 1RM formulas
export const e1rm = (w, r) => (r <= 1 ? w : w * (1 + r / 30));            // Epley
export const e1rmBrzycki = (w, r) => (r <= 1 ? w : w * 36 / (37 - r));    // Brzycki
export const e1rmLander = (w, r) => (r <= 1 ? w : (100 * w) / (101.3 - 2.67123 * r));
export const e1rmLombardi = (w, r) => w * Math.pow(r, 0.1);
export const e1rmOConner = (w, r) => w * (1 + r / 40);

export const round1 = (n) => Math.round(n * 10) / 10;
export const round25 = (n) => Math.round(n / 2.5) * 2.5;
export const round5 = (n) => Math.round(n / 5) * 5;

export const fmtSecs = (s) =>
  `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
