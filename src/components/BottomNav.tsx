export type Page = "log" | "calendar" | "dashboard" | "task" | "category";

const NAV_ITEMS: { page: Page; label: string; icon: string }[] = [
  { page: "log",      label: "きろく",     icon: "📝" },
  { page: "calendar", label: "カレンダー", icon: "📅" },
  { page: "task",     label: "タスク",     icon: "✅" },
  { page: "dashboard",label: "ふりかえり", icon: "📊" },
  { page: "category", label: "せってい",   icon: "⚙️" },
];

interface Props {
  current: Page;
  onChange: (page: Page) => void;
}

export function BottomNav({ current, onChange }: Props) {
  return (
    <nav className="bottom-nav">
      {NAV_ITEMS.map(({ page, label, icon }) => (
        <button
          key={page}
          className={`nav-btn ${current === page ? "nav-btn--active" : ""}`}
          onClick={() => onChange(page)}
        >
          <span className="nav-btn-icon">{icon}</span>
          <span className="nav-btn-label">{label}</span>
        </button>
      ))}
    </nav>
  );
}
