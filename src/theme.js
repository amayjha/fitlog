/* Multi-theme support — Classic (warm rose-gold), Dark (navy/gold), Mono (black/white) */

// Colors that carry semantic meaning (muscle groups, macro breakdowns) stay constant
// across themes — desaturating them for "Mono" would remove information, not just style.
const FIXED = {
  red:    "#D4504A",
  orange: "#D8872A",
  yellow: "#C8A020",
  blue:   "#3878C8",
  purple: "#9855C8",
  teal:   "#3AAAC0",
  pink:   "#D84870",
  indigo: "#5252D0",
};

export const THEMES = {
  classic: {
    name: "Classic",
    ...FIXED,
    bg: "#F5EFE8",
    text: "#1C1008",
    label: "#5A4030",
    faint: "#7A5C44",
    accent: "#C07B52",
    accentSoft: "rgba(192,123,82,0.15)",
    card: "rgba(255,251,247,0.82)",
    cardHi: "rgba(255,255,255,0.94)",
    card2: "rgba(238,228,218,0.72)",
    cardBg: "rgba(255,251,247,0.91)",
    navBg: "rgba(253,248,244,0.96)",
    sep: "rgba(0,0,0,0.09)",
    cardBorder: "rgba(0,0,0,0.06)",
    cardShadow: "rgba(0,0,0,0.05)",
    scrim: "rgba(248,242,235,0.55)",
    chipBg: "rgba(255,251,247,0.90)",
    inputBg: "rgba(255,255,255,0.75)",
    stepBg: "rgba(238,228,218,0.80)",
    toastBg: "rgba(250,245,240,0.95)",
    primaryGradient: "linear-gradient(135deg, #D09060, #A05830)",
    primaryText: "#fff",
  },
  dark: {
    name: "Dark",
    ...FIXED,
    bg: "#0B1220",
    text: "#F1EDE6",
    label: "#B9C2D0",
    faint: "#7E8CA3",
    accent: "#D9B66B",
    accentSoft: "rgba(217,182,107,0.18)",
    card: "rgba(22,32,52,0.80)",
    cardHi: "rgba(32,44,68,0.92)",
    card2: "rgba(26,36,56,0.65)",
    cardBg: "rgba(18,26,44,0.86)",
    navBg: "rgba(10,16,28,0.94)",
    sep: "rgba(255,255,255,0.10)",
    cardBorder: "rgba(255,255,255,0.08)",
    cardShadow: "rgba(0,0,0,0.35)",
    scrim: "rgba(6,10,20,0.60)",
    chipBg: "rgba(22,32,52,0.85)",
    inputBg: "rgba(28,38,58,0.75)",
    stepBg: "rgba(30,40,60,0.80)",
    toastBg: "rgba(22,30,48,0.95)",
    primaryGradient: "linear-gradient(135deg, #C9A24A, #8A6A2A)",
    primaryText: "#fff",
  },
  mono: {
    name: "Mono",
    ...FIXED,
    bg: "#0A0A0A",
    text: "#FFFFFF",
    label: "#C9C9C9",
    faint: "#8A8A8A",
    accent: "#FFFFFF",
    accentSoft: "rgba(255,255,255,0.14)",
    card: "rgba(255,255,255,0.06)",
    cardHi: "rgba(255,255,255,0.12)",
    card2: "rgba(255,255,255,0.05)",
    cardBg: "rgba(255,255,255,0.05)",
    navBg: "rgba(0,0,0,0.92)",
    sep: "rgba(255,255,255,0.14)",
    cardBorder: "rgba(255,255,255,0.12)",
    cardShadow: "rgba(0,0,0,0.5)",
    scrim: "rgba(0,0,0,0.65)",
    chipBg: "rgba(255,255,255,0.08)",
    inputBg: "rgba(255,255,255,0.07)",
    stepBg: "rgba(255,255,255,0.08)",
    toastBg: "rgba(20,20,20,0.95)",
    primaryGradient: "linear-gradient(135deg, #FFFFFF, #D6D6D6)",
    primaryText: "#0A0A0A",
  },
};

export const DEFAULT_THEME = "classic";

// `T` is a single shared, mutable object — every screen imports this one reference and
// reads its properties fresh at render time, so mutating it in place (via applyTheme)
// re-themes the whole app without prop-drilling or touching every consuming file.
export const T = { ...THEMES[DEFAULT_THEME] };

export const applyTheme = (name) => {
  Object.assign(T, THEMES[name] || THEMES[DEFAULT_THEME]);
};

export const GROUP_COLORS = {
  Chest:     "#D4504A",
  Back:      "#3878C8",
  Legs:      "#D8872A",
  Shoulders: "#4A9E68",
  Biceps:    "#9855C8",
  Triceps:   "#D85050",
  Core:      "#C8A020",
  Cardio:    "#3AAAC0",
};

const CARD_BLR = "blur(20px)";

// A function, not a static string — called fresh whenever the theme changes so the
// injected <style> tag always reflects the current T values.
export const buildCss = () => `
  /* ── Reset & base ── */
  html { -webkit-text-size-adjust: 100%; }
  *, *::before, *::after { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
  body { margin: 0; background: ${T.bg}; }
  button {
    font-family: inherit; cursor: pointer; border: none; background: none;
    touch-action: manipulation; -webkit-user-select: none; user-select: none;
  }
  input, select, textarea { font-family: inherit; }

  /* ── App shell — image background ── */
  .app {
    min-height: 100vh; min-height: 100dvh;
    background-image: url('/bg.jpg');
    background-size: cover; background-position: center top;
    background-attachment: fixed;
    color: ${T.text};
    font-family: -apple-system, 'SF Pro Display', 'Helvetica Neue', system-ui, sans-serif;
    font-size: 17px; line-height: 1.55;
    overscroll-behavior-y: none;
  }
  /* Scrim so the background image doesn't overpower text — tinted per theme */
  .app::before {
    content: '';
    position: fixed; inset: 0;
    background: ${T.scrim};
    pointer-events: none; z-index: 0;
  }

  /* ── Screen container ── */
  .screen {
    position: relative; z-index: 1;
    max-width: 560px; margin: 0 auto;
    padding: 20px 20px 180px;
    display: grid; gap: 14px; align-content: start;
  }

  /* ── Headings / brand ── */
  .brand { font-size: 13px; letter-spacing: 0.5px; color: ${T.accent}; font-weight: 700; }
  .screen-title { font-size: 28px; font-weight: 700; letter-spacing: 0.2px; }
  .section-title { font-size: 20px; font-weight: 700; margin-bottom: 2px; }
  .section-label {
    color: ${T.label}; font-size: 14px; letter-spacing: 0.4px;
    text-transform: uppercase; font-weight: 600;
  }

  /* ── Header ── */
  .header {
    display: flex; justify-content: space-between; align-items: flex-start;
    gap: 8px; margin-bottom: 4px;
  }
  /* ── Ghost / text buttons ── */
  .ghostbtn {
    color: ${T.accent}; padding: 10px 12px; border-radius: 12px; font-size: 16px;
    font-weight: 600; min-height: 44px; display: inline-flex;
    align-items: center; justify-content: center; gap: 4px;
  }
  .ghostbtn:active { opacity: 0.5; }
  .ghostbtn.muted { color: ${T.label}; }
  .ghostbtn.red { color: ${T.red}; }
  .ghostbtn.dim { color: ${T.label}; font-size: 15px; font-weight: 500; }

  /* ── Primary buttons ── */
  .primary {
    background: ${T.primaryGradient};
    color: ${T.primaryText}; font-weight: 700; letter-spacing: 0.3px;
    padding: 16px 24px; border-radius: 16px; font-size: 17px; width: 100%;
    border: none; cursor: pointer; display: block; text-align: center;
    min-height: 54px; box-shadow: 0 4px 20px ${T.cardShadow};
  }
  .primary:disabled { opacity: .35; cursor: default; box-shadow: none; }
  .primary:active:not(:disabled) { opacity: 0.8; transform: scale(0.98); }
  .primary.big { font-size: 19px; padding: 18px 24px; min-height: 58px; }
  .primary.danger {
    background: linear-gradient(135deg, #E06060, #B03030);
    color: #fff;
    box-shadow: 0 4px 20px rgba(212,80,74,0.3);
  }
  .primary.secondary {
    background: ${T.cardBg};
    backdrop-filter: ${CARD_BLR}; -webkit-backdrop-filter: ${CARD_BLR};
    color: ${T.text}; box-shadow: none;
    border: 1px solid ${T.sep};
  }
  .primary.secondary:active:not(:disabled) { background: ${T.cardHi}; transform: none; }
  .primary.blue {
    background: linear-gradient(135deg, #4888D8, #2050A8);
    color: #fff;
    box-shadow: 0 4px 20px rgba(56,120,200,0.3);
  }

  /* ── Chips / filter pills ── */
  .chip {
    background: ${T.chipBg}; border: 1px solid ${T.cardBorder};
    color: ${T.label}; padding: 8px 16px; border-radius: 999px;
    font-size: 14px; font-weight: 600;
    display: inline-flex; align-items: center; gap: 6px; cursor: pointer;
    min-height: 36px; touch-action: manipulation;
    backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
  }
  .chip:active { opacity: 0.65; }
  .chip.active {
    background: ${T.accentSoft}; border-color: ${T.accent};
    color: ${T.accent};
  }

  /* ── Nav prev/next buttons ── */
  .navbtn {
    background: ${T.cardBg}; color: ${T.label}; width: 38px; height: 54px;
    border-radius: 12px; font-size: 22px; flex-shrink: 0; border: 1px solid ${T.sep};
    cursor: pointer;
    backdrop-filter: ${CARD_BLR}; -webkit-backdrop-filter: ${CARD_BLR};
  }
  .navbtn:active { background: ${T.cardHi}; }

  /* ── Stepper buttons ── */
  .stepbtn {
    background: ${T.stepBg}; color: ${T.text};
    width: 48px; height: 48px; min-width: 48px; flex-shrink: 0;
    border-radius: 14px; font-size: 26px; border: none; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    font-weight: 300; line-height: 1;
    backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
  }
  .stepbtn:active { opacity: 0.6; }

  /* ── Cards ── */
  .card {
    display: flex; align-items: center; gap: 14px; width: 100%;
    background: ${T.cardBg};
    backdrop-filter: ${CARD_BLR}; -webkit-backdrop-filter: ${CARD_BLR};
    border-radius: 16px; border: 1px solid ${T.cardBorder};
    box-shadow: 0 2px 12px ${T.cardShadow};
    padding: 16px 16px; color: ${T.text}; font-size: 16px; text-align: left; cursor: pointer;
    min-height: 60px;
  }
  .card:active { background: ${T.cardHi}; }
  .card.sub {
    background: transparent; border-left: 2px solid ${T.sep};
    border-top: none; border-right: none; border-bottom: none;
    box-shadow: none; backdrop-filter: none; -webkit-backdrop-filter: none;
    border-radius: 0;
    margin-left: 20px; padding: 12px 14px; width: calc(100% - 20px);
    color: ${T.label}; min-height: 44px;
  }
  .card.sub:active { color: ${T.text}; }
  .card.danger { border: 1.5px solid ${T.red}; }

  /* ── Panels / surfaces ── */
  .panel {
    background: ${T.cardBg};
    backdrop-filter: ${CARD_BLR}; -webkit-backdrop-filter: ${CARD_BLR};
    border-radius: 16px; padding: 16px;
    border: 1px solid ${T.cardBorder}; box-shadow: 0 2px 12px ${T.cardShadow};
    overflow: hidden;
  }
  .panel-group {
    background: ${T.cardBg};
    backdrop-filter: ${CARD_BLR}; -webkit-backdrop-filter: ${CARD_BLR};
    border-radius: 16px; overflow: hidden;
    border: 1px solid ${T.cardBorder}; box-shadow: 0 2px 12px ${T.cardShadow};
  }
  .panel-group .panel-row {
    padding: 14px 16px; display: flex; align-items: center; gap: 12px;
  }
  .panel-group .panel-row + .panel-row {
    border-top: 1px solid ${T.sep};
  }

  /* ── Plate dot ── */
  .plate { width: 13px; height: 13px; border-radius: 50%; flex-shrink: 0; display: inline-block; }
  .plate.sm { width: 9px; height: 9px; }

  /* ── Inputs ── */
  .input {
    background: ${T.inputBg}; border: 1px solid ${T.cardBorder};
    color: ${T.text}; padding: 14px 16px; border-radius: 14px;
    font-size: 16px; width: 100%;
    -webkit-appearance: none; appearance: none;
    backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
  }
  .input:focus { outline: 2px solid ${T.accent}; outline-offset: 0; border-color: transparent; }
  textarea.input { resize: none; min-height: 80px; line-height: 1.5; }

  .numinput {
    background: ${T.stepBg}; border: none; color: ${T.text};
    width: 80px; min-width: 56px; flex: 0 0 auto;
    text-align: center; font-size: 28px; font-weight: 700;
    padding: 10px 4px; border-radius: 14px; font-variant-numeric: tabular-nums;
    -webkit-appearance: none;
  }
  .numinput:focus { outline: 2px solid ${T.accent}; }

  /* ── Date strip ── */
  .strip {
    display: flex; gap: 4px; overflow-x: auto; scrollbar-width: none;
    flex: 1; -webkit-overflow-scrolling: touch;
  }
  .strip::-webkit-scrollbar { display: none; }
  .daystrip-btn {
    display: flex; flex-direction: column; align-items: center; gap: 4px;
    padding: 8px 0; border-radius: 12px; min-width: 42px;
    border: none; cursor: pointer; background: none; flex-shrink: 0;
    min-height: 58px; justify-content: center;
  }
  .daystrip-btn:active { opacity: 0.6; }
  .dot { width: 5px; height: 5px; border-radius: 50%; display: block; flex-shrink: 0; }

  /* ── Set rows ── */
  .setrow {
    display: flex; align-items: center; gap: 10px;
    background: ${T.cardBg};
    backdrop-filter: ${CARD_BLR}; -webkit-backdrop-filter: ${CARD_BLR};
    border-radius: 14px; border: 1px solid ${T.cardBorder};
    padding: 12px 14px; margin-bottom: 8px; min-height: 56px;
  }
  .bignum { font-size: 22px; font-weight: 700; font-variant-numeric: tabular-nums; }

  /* Set action buttons */
  .set-action {
    color: ${T.label}; font-size: 14px; font-weight: 600;
    min-width: 44px; min-height: 44px;
    display: flex; align-items: center; justify-content: center;
    border-radius: 10px; flex-shrink: 0;
  }
  .set-action:active { background: ${T.stepBg}; opacity: 0.7; }
  .set-action.red { color: ${T.red}; }

  /* ── Tabs ── */
  .tabs { display: flex; border-bottom: 1px solid ${T.sep}; gap: 0; }
  .tab {
    background: none; flex: 1; padding: 14px 0; font-size: 13px; letter-spacing: 0.5px;
    font-weight: 700; text-transform: uppercase;
    border-bottom: 2px solid transparent;
    border-left: none; border-right: none; border-top: none;
    cursor: pointer; color: ${T.label};
    min-height: 48px; display: flex; align-items: center; justify-content: center;
  }
  .tab.active { color: ${T.text}; }

  /* ── Timer bar ── */
  .timerbar {
    position: fixed; left: 0; right: 0; bottom: 68px;
    display: flex; align-items: center; justify-content: center; gap: 14px;
    padding: 14px 20px;
    background: ${T.navBg};
    backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
    border-top: 1px solid ${T.sep}; z-index: 90;
  }
  .timerfill { position: absolute; left: 0; top: 0; bottom: 0; transition: width 1s linear; }
  @media (prefers-reduced-motion: reduce) { .timerfill { transition: none; } }

  /* ── Bottom nav ── */
  .bottomnav {
    position: fixed; bottom: 0; left: 0; right: 0;
    display: flex;
    background: ${T.navBg};
    backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
    border-top: 1px solid ${T.cardBorder};
    padding-bottom: env(safe-area-inset-bottom); z-index: 100;
  }
  .navitem {
    flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px;
    padding: 12px 0 10px; font-size: 9px; letter-spacing: 0.3px; font-weight: 600;
    border: none; background: none; cursor: pointer; color: ${T.faint};
    min-height: 56px; touch-action: manipulation;
    transition: color 0.15s;
  }
  .navitem:active { opacity: 0.6; }
  .navitem.active { color: ${T.accent}; }
  .navicon { font-size: 0; line-height: 1; display: block; }
  .navicon svg { width: 26px; height: 26px; display: block; }

  /* ── Badges ── */
  .pr {
    background: ${T.red}; color: #fff; font-size: 10px; font-weight: 700;
    letter-spacing: 0.5px; padding: 3px 8px; border-radius: 6px; margin-left: 8px;
    vertical-align: middle; display: inline-block;
  }
  .badge {
    background: ${T.card2}; color: ${T.label}; font-size: 12px;
    padding: 3px 10px; border-radius: 999px; display: inline-block; font-weight: 600;
  }

  /* ── Utilities ── */
  .empty { text-align: center; padding: 48px 20px; color: ${T.label}; font-size: 16px; line-height: 1.5; }
  .toast {
    position: fixed; left: 50%; transform: translateX(-50%); bottom: 140px;
    background: ${T.toastBg};
    backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
    color: ${T.text}; padding: 13px 22px; border-radius: 999px; font-size: 15px; font-weight: 600;
    z-index: 200; box-shadow: 0 8px 30px ${T.cardShadow}; white-space: nowrap;
    border: 1px solid ${T.cardBorder};
  }
  .progress-track { height: 8px; border-radius: 4px; background: ${T.card2}; overflow: hidden; flex: 1; }
  .progress-fill { height: 100%; border-radius: 4px; transition: width 0.4s ease; }
  .divider { height: 1px; background: ${T.sep}; margin: 4px 0; }
  .row { display: flex; align-items: center; gap: 10px; }
  .flex1 { flex: 1; }
  .truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

  /* ── Stat block ── */
  .stat-block {
    background: ${T.cardBg};
    backdrop-filter: ${CARD_BLR}; -webkit-backdrop-filter: ${CARD_BLR};
    border-radius: 16px; padding: 16px 18px;
    display: grid; gap: 4px;
    border: 1px solid ${T.cardBorder}; box-shadow: 0 2px 12px ${T.cardShadow};
  }
  .stat-value { font-size: 32px; font-weight: 700; letter-spacing: -0.5px; font-variant-numeric: tabular-nums; }
  .stat-label { font-size: 14px; color: ${T.label}; font-weight: 500; }

  /* ── Calendar ── */
  .cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 3px; }
  .cal-cell {
    display: flex; flex-direction: column; align-items: center; gap: 4px;
    padding: 6px 0; border-radius: 12px; font-size: 15px;
    border: none; cursor: pointer; background: none;
    min-height: 52px; justify-content: center; font-weight: 500;
  }
  .cal-cell:active:not(.selected) { background: ${T.cardHi}; }
  .cal-cell.selected { background: ${T.accent}; color: ${T.primaryText}; font-weight: 700; }
  .cal-cell.today:not(.selected) { color: ${T.accent}; font-weight: 700; }
  .cal-cell.other-month { color: ${T.faint}; }

  /* ── More items ── */
  .more-item {
    display: flex; align-items: center; gap: 14px;
    padding: 18px 18px;
    background: ${T.cardBg};
    backdrop-filter: ${CARD_BLR}; -webkit-backdrop-filter: ${CARD_BLR};
    border-radius: 16px; border: 1px solid ${T.cardBorder};
    box-shadow: 0 2px 12px ${T.cardShadow};
    color: ${T.text}; width: 100%; text-align: left; cursor: pointer; min-height: 68px;
  }
  .more-item:active { background: ${T.cardHi}; }
  .more-icon {
    width: 46px; height: 46px; border-radius: 12px;
    display: flex; align-items: center; justify-content: center; font-size: 22px; flex-shrink: 0;
  }

  /* ── Checkbox rows ── */
  .checkbox-row {
    display: flex; align-items: center; gap: 14px;
    padding: 14px 16px; border-radius: 14px;
    background: ${T.cardBg};
    backdrop-filter: ${CARD_BLR}; -webkit-backdrop-filter: ${CARD_BLR};
    border: 1px solid ${T.cardBorder};
    cursor: pointer; min-height: 52px; width: 100%;
  }
  .checkbox-row:active { background: ${T.cardHi}; }
  .checkbox {
    width: 24px; height: 24px; border-radius: 12px;
    border: 2px solid ${T.faint}; background: transparent;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; font-size: 13px; font-weight: 900; color: ${T.primaryText};
  }
  .checkbox.checked { background: ${T.accent}; border-color: ${T.accent}; }

  /* ── Responsive narrow phones ── */
  @media (max-width: 390px) {
    .screen { padding: 14px 14px 180px; gap: 12px; }
    .numinput { font-size: 24px; width: 68px; min-width: 50px; }
    .stepbtn { width: 44px; height: 44px; min-width: 44px; font-size: 22px; }
    .chip { padding: 8px 12px; font-size: 13px; }
    .datebtn { font-size: 24px; }
    .stat-value { font-size: 26px; }
  }

  /* ── Smooth active transitions ── */
  .card, .more-item, .chip, .primary, .ghostbtn {
    transition: opacity 0.1s, transform 0.1s;
  }
`;
