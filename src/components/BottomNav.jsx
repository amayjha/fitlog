import { T } from "../theme.js";

const DumbbellIcon = ({ active }) => (
  <svg viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="1.5" y="9" width="4" height="8" rx="2" fill={active ? T.accent : T.faint} />
    <rect x="5.5" y="7" width="3" height="12" rx="1.5" fill={active ? T.accent : T.faint} />
    <rect x="8.5" y="11.5" width="9" height="3" rx="1.5" fill={active ? T.accent : T.faint} />
    <rect x="17.5" y="7" width="3" height="12" rx="1.5" fill={active ? T.accent : T.faint} />
    <rect x="20.5" y="9" width="4" height="8" rx="2" fill={active ? T.accent : T.faint} />
  </svg>
);

const CalendarIcon = ({ active }) => (
  <svg viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="5" width="20" height="18" rx="3" stroke={active ? T.accent : T.faint} strokeWidth="2" />
    <rect x="8" y="3" width="2.5" height="4.5" rx="1.25" fill={active ? T.accent : T.faint} />
    <rect x="15.5" y="3" width="2.5" height="4.5" rx="1.25" fill={active ? T.accent : T.faint} />
    <rect x="3" y="10" width="20" height="1.5" fill={active ? T.accent : T.faint} fillOpacity="0.5" />
    <circle cx="8.5" cy="16" r="1.5" fill={active ? T.accent : T.faint} />
    <circle cx="13" cy="16" r="1.5" fill={active ? T.accent : T.faint} />
    <circle cx="17.5" cy="16" r="1.5" fill={active ? T.accent : T.faint} />
    <circle cx="8.5" cy="20.5" r="1.5" fill={active ? T.accent : T.faint} />
    <circle cx="13" cy="20.5" r="1.5" fill={active ? T.accent : T.faint} />
  </svg>
);

const TrophyIcon = ({ active }) => (
  <svg viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M7 4h12v8a6 6 0 01-12 0V4z"
      stroke={active ? T.accent : T.faint} strokeWidth="2" fill="none"
    />
    <path
      d="M7 7H4a2 2 0 000 4h3M19 7h3a2 2 0 010 4h-3"
      stroke={active ? T.accent : T.faint} strokeWidth="2" strokeLinecap="round"
    />
    <path d="M13 18v4M9 22h8" stroke={active ? T.accent : T.faint} strokeWidth="2" strokeLinecap="round" />
    <circle cx="13" cy="10" r="2" fill={active ? T.accent : T.faint} />
  </svg>
);

const PersonIcon = ({ active }) => (
  <svg viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="13" cy="7" r="4" stroke={active ? T.accent : T.faint} strokeWidth="2" />
    <path
      d="M5 23c0-4.418 3.582-8 8-8s8 3.582 8 8"
      stroke={active ? T.accent : T.faint} strokeWidth="2" strokeLinecap="round"
    />
    <path d="M10 15.5l3 4 3-4" stroke={active ? T.accent : T.faint} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const FoodIcon = ({ active }) => (
  <svg viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M9 3v7a4 4 0 008 0V3"
      stroke={active ? T.accent : T.faint}
      strokeWidth="2"
      strokeLinecap="round"
    />
    <line x1="13" y1="13" x2="13" y2="23" stroke={active ? T.accent : T.faint} strokeWidth="2" strokeLinecap="round" />
    <path
      d="M4 7c0 0 0 4 4 4"
      stroke={active ? T.accent : T.faint}
      strokeWidth="2"
      strokeLinecap="round"
    />
    <line x1="4" y1="3" x2="4" y2="23" stroke={active ? T.accent : T.faint} strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const MoreIcon = ({ active }) => (
  <svg viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="6" cy="13" r="2.2" fill={active ? T.accent : T.faint} />
    <circle cx="13" cy="13" r="2.2" fill={active ? T.accent : T.faint} />
    <circle cx="20" cy="13" r="2.2" fill={active ? T.accent : T.faint} />
  </svg>
);

const TABS = [
  { id: "today", label: "TODAY", Icon: DumbbellIcon },
  { id: "calendar", label: "CALENDAR", Icon: CalendarIcon },
  { id: "prs", label: "PRs", Icon: TrophyIcon },
  { id: "body", label: "BODY", Icon: PersonIcon },
  { id: "nutrition", label: "FOOD", Icon: FoodIcon },
  { id: "more", label: "MORE", Icon: MoreIcon },
];

export default function BottomNav({ activeTab, onChange }) {
  return (
    <nav className="bottomnav">
      {TABS.map((tab) => {
        const active = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            className={`navitem${active ? " active" : ""}`}
            onClick={() => onChange(tab.id)}
          >
            <span className="navicon">
              <tab.Icon active={active} />
            </span>
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}
