import { labelStyle, card } from "../constants/stages";
import { useGetReviewQuery } from "../api/leadsApi";

export default function ReviewView({ onOpenLead }) {
  const { data, isLoading } = useGetReviewQuery(7);
  if (isLoading || !data)
    return (
      <div style={{ padding: "28px", color: "#6E7F8D", fontSize: "13px" }}>
        Crunching the numbers…
      </div>
    );

  const maxAvg = 14;
  const maxSource = Math.max(1, ...data.sourceRows.map((s) => s.count));

  return (
    <div
      style={{
        padding: "20px 28px 40px",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
          gap: "16px",
        }}
      >
        {data.kpis.map((k) => (
          <div
            key={k.label}
            style={{
              ...card,
              padding: "20px 22px",
              display: "flex",
              flexDirection: "column",
              gap: "6px",
            }}
          >
            <span style={labelStyle}>{k.label}</span>
            <span
              style={{ fontSize: "30px", fontWeight: 300, color: "#161B1D" }}
            >
              {k.value}
            </span>
            <span style={{ fontSize: "12px", color: "#6E7F8D" }}>{k.sub}</span>
          </div>
        ))}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(340px,1fr))",
          gap: "16px",
          alignItems: "start",
        }}
      >
        <div
          style={{
            ...card,
            padding: "20px 22px",
            display: "flex",
            flexDirection: "column",
            gap: "14px",
          }}
        >
          <div style={{ fontSize: "16px", fontWeight: 700 }}>
            Conversion Rate by Stage
          </div>
          {data.convBars.map((b) => (
            <div
              key={b.label}
              style={{ display: "flex", flexDirection: "column", gap: "5px" }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "12px",
                }}
              >
                <span style={{ color: "#6E7F8D" }}>{b.label}</span>
                <span style={{ fontWeight: 400, color: "#161B1D" }}>
                  {b.pct}%
                </span>
              </div>
              <div
                style={{
                  height: "8px",
                  background: "#E4EBF1",
                  borderRadius: "4px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: b.pct + "%",
                    height: "100%",
                    background: "#161B1D",
                    borderRadius: "4px",
                  }}
                ></div>
              </div>
            </div>
          ))}
        </div>
        <div
          style={{
            ...card,
            padding: "20px 22px",
            display: "flex",
            flexDirection: "column",
            gap: "14px",
          }}
        >
          <div style={{ fontSize: "16px", fontWeight: 700 }}>
            Average Time in Stage
          </div>
          {data.timeBars.map((b) => {
            const warn = b.avgDays > 9;
            return (
              <div
                key={b.label}
                style={{ display: "flex", flexDirection: "column", gap: "5px" }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "12px",
                  }}
                >
                  <span style={{ color: "#6E7F8D" }}>{b.label}</span>
                  <span
                    style={{
                      fontWeight: 400,
                      color: warn ? "#B07A1E" : "#161B1D",
                    }}
                  >
                    {b.avgDays} d
                  </span>
                </div>
                <div
                  style={{
                    height: "8px",
                    background: "#E4EBF1",
                    borderRadius: "4px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: Math.min(100, (b.avgDays / maxAvg) * 100) + "%",
                      height: "100%",
                      background: warn ? "#B07A1E" : "#161B1D",
                      borderRadius: "4px",
                    }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(340px,1fr))",
          gap: "16px",
          alignItems: "start",
        }}
      >
        <div
          style={{
            ...card,
            padding: "20px 22px",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          <div
            style={{ fontSize: "16px", fontWeight: 700, marginBottom: "6px" }}
          >
            Stuck Leads (&gt;7 days)
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1.6fr 1fr 1fr",
              gap: "10px",
              padding: "0 2px 8px",
              borderBottom: "1px solid #E4EBF1",
            }}
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
              className="row-hover"
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1.6fr 1fr 1fr",
                gap: "10px",
                padding: "9px 2px",
                borderBottom: "1px solid #E4EBF1",
                cursor: "pointer",
                alignItems: "center",
              }}
            >
              <span
                style={{ fontSize: "13px", fontWeight: 700, color: "#161B1D" }}
              >
                {r.name}
              </span>
              <span style={{ fontSize: "12px", color: "#6E7F8D" }}>
                {r.stage}
              </span>
              <span
                style={{ fontSize: "12px", fontWeight: 400, color: "#B07A1E" }}
              >
                {r.days} d
              </span>
              <span style={{ fontSize: "12px", color: "#6E7F8D" }}>
                {r.owner}
              </span>
            </div>
          ))}
        </div>
        <div
          style={{
            ...card,
            padding: "20px 22px",
            display: "flex",
            flexDirection: "column",
            gap: "14px",
          }}
        >
          <div style={{ fontSize: "16px", fontWeight: 700 }}>
            Leads by Source
          </div>
          {data.sourceRows.map((s) => (
            <div
              key={s.label}
              style={{ display: "flex", flexDirection: "column", gap: "5px" }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "12px",
                }}
              >
                <span style={{ color: "#6E7F8D" }}>{s.label}</span>
                <span style={{ color: "#161B1D", fontWeight: 400 }}>
                  {s.count} leads · {s.won} won
                </span>
              </div>
              <div
                style={{
                  height: "8px",
                  background: "#E4EBF1",
                  borderRadius: "4px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: (s.count / maxSource) * 100 + "%",
                    height: "100%",
                    background: "#161B1D",
                    borderRadius: "4px",
                  }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
