import { T } from "../theme.js";

const NavImage = (src) => ({ active }) => (
  <img
    src={src}
    alt=""
    style={{
      width: 26, height: 26, display: "block", borderRadius: 6,
      opacity: active ? 1 : 0.55,
      transform: active ? "scale(1.08)" : "scale(1)",
      transition: "opacity 0.15s, transform 0.15s",
    }}
  />
);

const TodayIcon = NavImage("/icons/today.jpg");
const CalendarIcon = NavImage("/icons/calendar.jpg");
const TrophyIcon = NavImage("/icons/prs.jpg");
const BodyIcon = NavImage("/icons/body.jpg");
const FoodIcon = NavImage("/icons/food.jpg");

const MoreIcon = ({ active }) => (
  <svg viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="6" cy="13" r="2.2" fill={active ? T.accent : T.faint} />
    <circle cx="13" cy="13" r="2.2" fill={active ? T.accent : T.faint} />
    <circle cx="20" cy="13" r="2.2" fill={active ? T.accent : T.faint} />
  </svg>
);

const TABS = [
  { id: "today", label: "TODAY", Icon: TodayIcon },
  { id: "calendar", label: "CALENDAR", Icon: CalendarIcon },
  { id: "prs", label: "PRs", Icon: TrophyIcon },
  { id: "body", label: "BODY", Icon: BodyIcon },
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
            data-tour={`nav-${tab.id}`}
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
