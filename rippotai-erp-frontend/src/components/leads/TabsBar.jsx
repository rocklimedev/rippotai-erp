const TABS = [
  { id: "board", label: "Pipeline Board" },
  { id: "new", label: "Lead Capture" },
  { id: "contacts", label: "Contacts" },
  { id: "review", label: "Review" },
];

export default function TabsBar({ tab, onChange }) {
  return (
    <div className="flex items-center gap-1 px-7 pt-2.5 border-b border-[var(--stroke)] bg-paper overflow-x-auto">
      {TABS.map((t) => {
        const active = tab === t.id || (t.id === "board" && tab === "detail");
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            className={
              "relative px-3.5 pt-2 pb-2.5 text-[13px] whitespace-nowrap select-none transition-colors " +
              (active
                ? "font-semibold text-[var(--ink-green)]"
                : "font-medium text-[var(--muted)] hover:text-[var(--ink-green)]")
            }
          >
            {t.label}
            {active && (
              <span className="absolute left-2.5 right-2.5 bottom-0 h-[2px] rounded-full bg-[var(--ink-green)]" />
            )}
          </button>
        );
      })}
    </div>
  );
}
