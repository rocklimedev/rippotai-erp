export default function TopBar({ onNewLead }) {
  return (
    <div className="flex items-center justify-between gap-3 px-7 py-4 bg-paper border-b border-[var(--stroke)] flex-wrap">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-[10px] bg-[var(--ink-green)] flex items-center justify-center shrink-0 relative overflow-hidden">
          {/* faint blueprint cross-hair, the module's recurring mark */}
          <span
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                "linear-gradient(var(--sage) 1px, transparent 1px), linear-gradient(90deg, var(--sage) 1px, transparent 1px)",
              backgroundSize: "6px 6px",
            }}
          />
          <svg
            width="17"
            height="17"
            viewBox="0 0 16 16"
            fill="none"
            stroke="#ffffff"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="relative"
          >
            <path d="M2 8l6-5.5L14 8"></path>
            <path d="M3.5 6.8V13h9V6.8"></path>
          </svg>
        </div>
        <div className="flex flex-col leading-tight min-w-0">
          <span className="text-[15.5px] font-semibold text-[var(--ink-green)] truncate">
            Lead Pipeline
          </span>
          <span className="eyebrow text-[10px]">Client Acquisition</span>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <button onClick={onNewLead} className="bc-btn-primary">
          <svg
            width="13"
            height="13"
            viewBox="0 0 16 16"
            fill="none"
            stroke="#ffffff"
            strokeWidth="1.8"
            strokeLinecap="round"
          >
            <path d="M8 3v10M3 8h10"></path>
          </svg>
          New Lead
        </button>
      </div>
    </div>
  );
}
