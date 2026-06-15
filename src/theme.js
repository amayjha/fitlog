/* Warm luxury theme — rose gold + cream dumbbell background */

export const T = {
  bg:      "transparent",           // image shows through
  card:    "rgba(255,251,247,0.82)", // frosted warm white
  cardHi:  "rgba(255,255,255,0.94)",
  card2:   "rgba(238,228,218,0.72)",
  sep:     "rgba(0,0,0,0.09)",
  text:    "#1C1008",               // deep warm brown
  label:   "#7A6450",               // warm taupe
  faint:   "#A89070",               // sandy muted
  accent:  "#C07B52",               // rose gold / copper
  red:     "#D4504A",
  orange:  "#D8872A",
  yellow:  "#C8A020",
  blue:    "#3878C8",
  purple:  "#9855C8",
  teal:    "#3AAAC0",
  pink:    "#D84870",
  indigo:  "#5252D0",
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

const CARD_BG  = "rgba(255,251,247,0.82)";
const CARD_BLR = "blur(20px)";
const NAV_BG   = "rgba(253,248,244,0.92)";

export const css = `
  /* ── Reset & base ── */
  html { -webkit-text-size-adjust: 100%; }
  *, *::before, *::after { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
  body { margin: 0; background: #F5EFE8; }
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
    font-size: 17px; line-height: 1.4;
    overscroll-behavior-y: none;
  }
  /* Soft warm scrim so image doesn't overpower text */
  .app::before {
    content: '';
    position: fixed; inset: 0;
    background: rgba(248, 242, 235, 0.28);
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
    color: ${T.label}; font-size: 13px; letter-spacing: 0.5px;
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

  /* ── Primary buttons — rose gold gradient ── */
  .primary {
    background: linear-gradient(135deg, #D09060, #A05830);
    color: #fff; font-weight: 700; letter-spacing: 0.3px;
    padding: 16px 24px; border-radius: 16px; font-size: 17px; width: 100%;
    border: none; cursor: pointer; display: block; text-align: center;
    min-height: 54px; box-shadow: 0 4px 20px rgba(192,123,82,0.35);
  }
  .primary:disabled { opacity: .35; cursor: default; box-shadow: none; }
  .primary:active:not(:disabled) { opacity: 0.8; transform: scale(0.98); }
  .primary.big { font-size: 19px; padding: 18px 24px; min-height: 58px; }
  .primary.danger {
    background: linear-gradient(135deg, #E06060, #B03030);
    box-shadow: 0 4px 20px rgba(212,80,74,0.3);
  }
  .primary.secondary {
    background: ${CARD_BG};
    backdrop-filter: ${CARD_BLR}; -webkit-backdrop-filter: ${CARD_BLR};
    color: ${T.text}; box-shadow: none;
    border: 1px solid ${T.sep};
  }
  .primary.secondary:active:not(:disabled) { background: rgba(255,255,255,0.94); transform: none; }
  .primary.blue {
    background: linear-gradient(135deg, #4888D8, #2050A8);
    box-shadow: 0 4px 20px rgba(56,120,200,0.3);
  }

  /* ── Chips / filter pills ── */
  .chip {
    background: rgba(255,251,247,0.72); border: 1px solid rgba(0,0,0,0.08);
    color: ${T.label}; padding: 8px 16px; border-radius: 999px;
    font-size: 14px; font-weight: 600;
    display: inline-flex; align-items: center; gap: 6px; cursor: pointer;
    min-height: 36px; touch-action: manipulation;
    backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
  }
  .chip:active { opacity: 0.65; }
  .chip.active {
    background: rgba(192,123,82,0.15); border-color: ${T.accent};
    color: ${T.accent};
  }

  /* ── Nav prev/next buttons ── */
  .navbtn {
    background: ${CARD_BG}; color: ${T.label}; width: 38px; height: 54px;
    border-radius: 12px; font-size: 22px; flex-shrink: 0; border: 1px solid ${T.sep};
    cursor: pointer;
    backdrop-filter: ${CARD_BLR}; -webkit-backdrop-filter: ${CARD_BLR};
  }
  .navbtn:active { background: rgba(255,255,255,0.94); }

  /* ── Stepper buttons ── */
  .stepbtn {
    background: rgba(238,228,218,0.80); color: ${T.text};
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
    background: ${CARD_BG};
    backdrop-filter: ${CARD_BLR}; -webkit-backdrop-filter: ${CARD_BLR};
    border-radius: 16px; border: 1px solid rgba(0,0,0,0.06);
    box-shadow: 0 2px 12px rgba(0,0,0,0.05);
    padding: 16px 16px; color: ${T.text}; font-size: 16px; text-align: left; cursor: pointer;
    min-height: 60px;
  }
  .card:active { background: rgba(255,255,255,0.94); }
  .card.sub {
    background: transparent; border-left: 2px solid rgba(0,0,0,0.1);
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
    background: ${CARD_BG};
    backdrop-filter: ${CARD_BLR}; -webkit-backdrop-filter: ${CARD_BLR};
    border-radius: 16px; padding: 16px;
    border: 1px solid rgba(0,0,0,0.06); box-shadow: 0 2px 12px rgba(0,0,0,0.05);
    overflow: hidden;
  }
  .panel-group {
    background: ${CARD_BG};
    backdrop-filter: ${CARD_BLR}; -webkit-backdrop-filter: ${CARD_BLR};
    border-radius: 16px; overflow: hidden;
    border: 1px solid rgba(0,0,0,0.06); box-shadow: 0 2px 12px rgba(0,0,0,0.05);
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
    background: rgba(255,255,255,0.75); border: 1px solid rgba(0,0,0,0.08);
    color: ${T.text}; padding: 14px 16px; border-radius: 14px;
    font-size: 16px; width: 100%;
    -webkit-appearance: none; appearance: none;
    backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
  }
  .input:focus { outline: 2px solid ${T.accent}; outline-offset: 0; border-color: transparent; }
  textarea.input { resize: none; min-height: 80px; line-height: 1.5; }

  .numinput {
    background: rgba(238,228,218,0.80); border: none; color: ${T.text};
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
    background: ${CARD_BG};
    backdrop-filter: ${CARD_BLR}; -webkit-backdrop-filter: ${CARD_BLR};
    border-radius: 14px; border: 1px solid rgba(0,0,0,0.06);
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
  .set-action:active { background: rgba(238,228,218,0.80); opacity: 0.7; }
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
    background: ${NAV_BG};
    backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
    border-top: 1px solid ${T.sep}; z-index: 90;
  }
  .timerfill { position: absolute; left: 0; top: 0; bottom: 0; transition: width 1s linear; }
  @media (prefers-reduced-motion: reduce) { .timerfill { transition: none; } }

  /* ── Bottom nav ── */
  .bottomnav {
    position: fixed; bottom: 0; left: 0; right: 0;
    display: flex;
    background: ${NAV_BG};
    backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
    border-top: 1px solid rgba(0,0,0,0.08);
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
    background: rgba(238,228,218,0.72); color: ${T.label}; font-size: 12px;
    padding: 3px 10px; border-radius: 999px; display: inline-block; font-weight: 600;
  }

  /* ── Utilities ── */
  .empty { text-align: center; padding: 48px 20px; color: ${T.label}; font-size: 16px; line-height: 1.5; }
  .toast {
    position: fixed; left: 50%; transform: translateX(-50%); bottom: 140px;
    background: rgba(250,245,240,0.95);
    backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
    color: ${T.text}; padding: 13px 22px; border-radius: 999px; font-size: 15px; font-weight: 600;
    z-index: 200; box-shadow: 0 8px 30px rgba(0,0,0,0.12); white-space: nowrap;
    border: 1px solid rgba(0,0,0,0.07);
  }
  .progress-track { height: 8px; border-radius: 4px; background: rgba(238,228,218,0.72); overflow: hidden; flex: 1; }
  .progress-fill { height: 100%; border-radius: 4px; transition: width 0.4s ease; }
  .divider { height: 1px; background: ${T.sep}; margin: 4px 0; }
  .row { display: flex; align-items: center; gap: 10px; }
  .flex1 { flex: 1; }
  .truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

  /* ── Stat block ── */
  .stat-block {
    background: ${CARD_BG};
    backdrop-filter: ${CARD_BLR}; -webkit-backdrop-filter: ${CARD_BLR};
    border-radius: 16px; padding: 16px 18px;
    display: grid; gap: 4px;
    border: 1px solid rgba(0,0,0,0.06); box-shadow: 0 2px 12px rgba(0,0,0,0.05);
  }
  .stat-value { font-size: 32px; font-weight: 700; letter-spacing: -0.5px; font-variant-numeric: tabular-nums; }
  .stat-label { font-size: 13px; color: ${T.label}; font-weight: 500; }

  /* ── Calendar ── */
  .cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 3px; }
  .cal-cell {
    display: flex; flex-direction: column; align-items: center; gap: 4px;
    padding: 6px 0; border-radius: 12px; font-size: 15px;
    border: none; cursor: pointer; background: none;
    min-height: 52px; justify-content: center; font-weight: 500;
  }
  .cal-cell:active:not(.selected) { background: rgba(255,255,255,0.55); }
  .cal-cell.selected { background: ${T.accent}; color: #fff; font-weight: 700; }
  .cal-cell.today:not(.selected) { color: ${T.accent}; font-weight: 700; }
  .cal-cell.other-month { color: ${T.faint}; }

  /* ── More items ── */
  .more-item {
    display: flex; align-items: center; gap: 14px;
    padding: 18px 18px;
    background: ${CARD_BG};
    backdrop-filter: ${CARD_BLR}; -webkit-backdrop-filter: ${CARD_BLR};
    border-radius: 16px; border: 1px solid rgba(0,0,0,0.06);
    box-shadow: 0 2px 12px rgba(0,0,0,0.05);
    color: ${T.text}; width: 100%; text-align: left; cursor: pointer; min-height: 68px;
  }
  .more-item:active { background: rgba(255,255,255,0.94); }
  .more-icon {
    width: 46px; height: 46px; border-radius: 12px;
    display: flex; align-items: center; justify-content: center; font-size: 22px; flex-shrink: 0;
  }

  /* ── Checkbox rows ── */
  .checkbox-row {
    display: flex; align-items: center; gap: 14px;
    padding: 14px 16px; border-radius: 14px;
    background: ${CARD_BG};
    backdrop-filter: ${CARD_BLR}; -webkit-backdrop-filter: ${CARD_BLR};
    border: 1px solid rgba(0,0,0,0.06);
    cursor: pointer; min-height: 52px; width: 100%;
  }
  .checkbox-row:active { background: rgba(255,255,255,0.94); }
  .checkbox {
    width: 24px; height: 24px; border-radius: 12px;
    border: 2px solid ${T.faint}; background: transparent;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; font-size: 13px; font-weight: 900; color: #fff;
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
