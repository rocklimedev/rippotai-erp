import { labelStyle } from "../../hooks/stages";
import { useGetReviewQuery } from "../../api/leads.api";

export default function ReviewView({ onOpenLead }) {
  const { data, isLoading } = useGetReviewQuery(7);
  if (isLoading || !data)
    return (
      <div className="p-7 text-[var(--muted)] text-[13px]">
        Crunching the numbers…
      </div>
    );

  const maxAvg = 14;
  const maxSource = Math.max(1, ...data.sourceRows.map((s) => s.count));

  const bar = (pct, warn) => (
    <div
      className="h-2 rounded-[4px] overflow-hidden"
      style={{ background: "var(--mist)" }}
    >
      <div
        className="h-full rounded-[4px]"
        style={{
          width: pct + "%",
          background: warn ? "#c98f2b" : "var(--ink-green)",
        }}
      ></div>
    </div>
  );

  return (
    <div className="flex flex-col gap-4 px-7 pt-5 pb-10">
      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))" }}
      >
        {data.kpis.map((k) => (
          <div key={k.label} className="bc-card p-5 flex flex-col gap-1.5">
            <span style={labelStyle}>{k.label}</span>
            <span className="text-[30px] font-light text-[var(--ink-green)]">
              {k.value}
            </span>
            <span className="text-[12px] text-[var(--muted)]">{k.sub}</span>
          </div>
        ))}
      </div>

      <div
        className="grid gap-4 items-start"
        style={{ gridTemplateColumns: "repeat(auto-fit,minmax(340px,1fr))" }}
      >
        <div className="bc-card p-5 flex flex-col gap-3.5">
          <div className="text-[16px] font-semibold text-[var(--ink-green)]">
            Conversion Rate by Stage
          </div>
          {data.convBars.map((b) => (
            <div key={b.label} className="flex flex-col gap-1.5">
              <div className="flex justify-between text-[12px]">
                <span className="text-[var(--muted)]">{b.label}</span>
                <span className="font-medium text-[var(--ink-green)]">
                  {b.pct}%
                </span>
              </div>
              {bar(b.pct, false)}
            </div>
          ))}
        </div>

        <div className="bc-card p-5 flex flex-col gap-3.5">
          <div className="text-[16px] font-semibold text-[var(--ink-green)]">
            Average Time in Stage
          </div>
          {data.timeBars.map((b) => {
            const warn = b.avgDays > 9;
            return (
              <div key={b.label} className="flex flex-col gap-1.5">
                <div className="flex justify-between text-[12px]">
                  <span className="text-[var(--muted)]">{b.label}</span>
                  <span
                    className="font-medium"
                    style={{ color: warn ? "#a3701a" : "var(--ink-green)" }}
                  >
                    {b.avgDays} d
                  </span>
                </div>
                {bar(Math.min(100, (b.avgDays / maxAvg) * 100), warn)}
              </div>
            );
          })}
        </div>
      </div>

      <div
        className="grid gap-4 items-start"
        style={{ gridTemplateColumns: "repeat(auto-fit,minmax(340px,1fr))" }}
      >
        <div className="bc-card p-5 flex flex-col gap-2">
          <div className="text-[16px] font-semibold text-[var(--ink-green)] mb-1.5">
            Stuck Leads (&gt;7 days)
          </div>
          <div
            className="grid gap-2.5 px-0.5 pb-2 border-b border-[var(--stroke)]"
            style={{ gridTemplateColumns: "2fr 1.6fr 1fr 1fr" }}
          >
            <span style={labelStyle}>Lead</span>
            <span style={labelStyle}>Stage</span>
            <span style={labelStyle}>Days</span>
            <span style={labelStyle}>Owner</span>
          </div>
          {data.stuckRows.map((r) => (
            <div
              key={r.id}
              onClick={() => onOpenLead(r)}
              className="grid gap-2.5 px-0.5 py-2.5 border-b border-[var(--stroke)] cursor-pointer items-center hover:bg-[var(--mist-soft)]"
              style={{ gridTemplateColumns: "2fr 1.6fr 1fr 1fr" }}
            >
              <span className="text-[13px] font-semibold text-[var(--ink-green)] truncate">
                {r.name}
              </span>
              <span className="text-[12px] text-[var(--muted)] truncate">
                {r.stage}
              </span>
              <span
                className="text-[12px] font-medium"
                style={{ color: "#a3701a" }}
              >
                {r.days} d
              </span>
              <span className="text-[12px] text-[var(--muted)] truncate">
                {r.owner}
              </span>
            </div>
          ))}
        </div>

        <div className="bc-card p-5 flex flex-col gap-3.5">
          <div className="text-[16px] font-semibold text-[var(--ink-green)]">
            Leads by Source
          </div>
          {data.sourceRows.map((s) => (
            <div key={s.label} className="flex flex-col gap-1.5">
              <div className="flex justify-between text-[12px]">
                <span className="text-[var(--muted)]">{s.label}</span>
                <span className="text-[var(--ink-green)] font-medium">
                  {s.count} leads · {s.won} won
                </span>
              </div>
              {bar((s.count / maxSource) * 100, false)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
