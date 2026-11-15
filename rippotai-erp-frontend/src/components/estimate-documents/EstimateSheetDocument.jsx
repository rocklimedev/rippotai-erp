// Budget Estimate PDF — replica of the original ESTIMATE TEMPLATE (Google Sheets → PDF): logo +
// Date box, ESTIMATE title, Vendor / Project block, green S.NO / PARTICULAR / RATE (₹) / QUANTITY /
// AMOUNT (₹) / REMARKS table (20 rows min), Subtotal / Grand Total, Payment Terms table,
// Terms & Conditions, APPROVED BY / CONTRACTOR'S SIGNATURE. Geometry: PDF points from
// ESTIMATE TEMPLATE.pdf (the sheet printed fit-to-page, Arial throughout).
import { forwardRef, useMemo } from "react";
import { SheetDocument } from "../template-documents/sheet";
import { at, padRows, sheetDate, txt } from "../template-documents/sheet-utils";
import estimateLogo from "../../assets/templates/estimate-logo.png";
import { ESTIMATE_MIN_ROWS, ESTIMATE_PAYMENT_ROWS } from "./estimateModel";

const W = 558.4;
const C = [128, 190.1, 43, 74.8, 66]; // A B C D E | F = rest
const COLS = [...C, W - C.reduce((a, b) => a + b, 0)];
const X = (from, to) => COLS.slice(from, to + 1).reduce((a, b) => a + b, 0);
const INK = "#1f1f1f";

const fmt = (v, dp = 2) => {
  if (v === null || v === undefined || v === "") return "";
  const n = Number(v);
  const whole = Math.abs(n - Math.round(n)) < 1e-9;
  return n.toLocaleString("en-IN", { minimumFractionDigits: whole || dp > 2 ? 0 : 2, maximumFractionDigits: dp });
};

/** One sheet row: cells = [{ span: [from,to], text, size, bold, align, fill, color, sub }] */
function Row({ cells, h, minH, top = false, className = "" }) {
  return (
    <div className={`ts-row ts-b ${top ? "ts-t" : ""} ts-arial ${className}`} style={{ ...(h ? { height: `${h}pt` } : {}), minHeight: `${minH || h}pt` }}>
      {cells.map((c, i) => (
        <div
          key={i}
          className={`ts-cell ${c.v === "top" ? "ts-cell--top" : c.v === "mid" ? "ts-cell--mid" : ""} ${i < cells.length - 1 ? "ts-r" : ""}`}
          style={{
            width: `${X(c.span[0], c.span[1])}pt`,
            fontSize: `${c.size || 8.3}pt`,
            fontWeight: c.bold ? 700 : 400,
            justifyContent: c.align === "center" ? "center" : c.align === "right" ? "flex-end" : "flex-start",
            textAlign: c.align || "left",
            background: c.fill || "transparent",
            color: c.color || "#000",
            padding: c.pad ?? "0.6pt 2pt 0.8pt",
            lineHeight: 1.12,
          }}
        >
          <span className="ts-in">
            {c.text}
            {txt(c.sub) ? <span className="ts-sub" style={{ fontSize: "0.82em" }}>{c.sub}</span> : null}
          </span>
        </div>
      ))}
    </div>
  );
}

const span6 = (texts, opts = {}) => texts.map((text, i) => ({ span: [i, i], text, ...opts }));

const EstimateSheetDocument = forwardRef(function EstimateSheetDocument({ model }, ref) {
  const sheet = useMemo(() => {
    if (!model) return null;
    const m = model;

    // ---- header (37.1 → 106.0)
    const header = (
      <div style={{ position: "relative", height: "68.9pt" }} className="ts-b ts-arial">
        <img src={estimateLogo} alt="Rippotai" style={{ position: "absolute", left: "16.7pt", top: "4.9pt", width: "41pt", height: "51pt" }} />
        <div className="ts-l ts-b" style={{ position: "absolute", left: `${X(0, 3)}pt`, top: 0, width: `${X(4, 5)}pt`, height: "35.7pt" }}>
          <div className="ts-b ts-bold" style={{ height: "17.8pt", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "8.8pt" }}>
            Date
          </div>
          <div className="ts-bold" style={{ height: "17.9pt", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "8.8pt" }}>
            {sheetDate(m.date, "dmy")}
          </div>
        </div>
        <div className="ts-abs ts-bold" style={{ left: 0, right: 0, textAlign: "center", top: `${at(41.2, 15.5)}pt`, fontSize: "15.5pt", color: INK }}>
          {m.title || "ESTIMATE"}
        </div>
        {(txt(m.number) || m.version > 1) && (
          <div className="ts-abs" style={{ left: 0, right: 0, textAlign: "center", top: `${at(58.5, 7)}pt`, fontSize: "7pt", color: INK }}>
            {[m.number, m.version ? `Version ${m.version}` : ""].filter(Boolean).join(" · ")}
          </div>
        )}
      </div>
    );

    // ---- vendor | project (106.0 → 182.5)
    const vRow = (label, value) => (
      <div className="ts-row ts-b" style={{ minHeight: "19.1pt" }}>
        <div className="ts-cell ts-cell--mid ts-r" style={{ width: `${COLS[0]}pt`, justifyContent: "center", fontSize: "10pt", color: INK }}>
          {label}
        </div>
        <div className="ts-cell ts-cell--mid" style={{ width: `${COLS[1]}pt`, fontSize: "9.4pt", color: INK, padding: "1pt 3pt", lineHeight: 1.15 }}>
          <span className="ts-in">{value}</span>
        </div>
      </div>
    );
    const pRow = (label, value, sub) => (
      <div className="ts-row ts-b" style={{ minHeight: "38.25pt", flex: 1 }}>
        <div className="ts-cell ts-cell--mid ts-r" style={{ width: `${X(2, 3)}pt`, justifyContent: "center", fontSize: "11.1pt", color: INK }}>
          {label}
        </div>
        <div className="ts-cell ts-cell--mid" style={{ width: `${X(4, 5)}pt`, justifyContent: "center", textAlign: "center", fontSize: "11.1pt", color: INK, padding: "2pt 3pt", lineHeight: 1.15 }}>
          <span className="ts-in">
            {value}
            {txt(sub) ? <span className="ts-sub" style={{ fontSize: "7.5pt" }}>{sub}</span> : null}
          </span>
        </div>
      </div>
    );
    const parties = (
      <div className="ts-row ts-arial">
        <div className="ts-r" style={{ width: `${X(0, 1)}pt` }}>
          {vRow("Vendor Name", m.vendor.name)}
          {vRow("Vendor Type", m.vendor.type)}
          {vRow("Phone Number", String(m.vendor.phone || "").replace(/^\+91\s*/, "").replace(/\s/g, ""))}
          {vRow("Address", m.vendor.address)}
        </div>
        <div style={{ width: `${X(2, 5)}pt`, display: "flex", flexDirection: "column" }}>
          {pRow("Project Name", m.project.name, m.project.client ? `Client: ${m.project.client}` : "")}
          {pRow("Project Address", m.project.address)}
        </div>
      </div>
    );
    const blank = <Row h={9} cells={span6(["", "", "", "", "", ""])} />;
    const thead = (
      <Row
        h={10.6}
        cells={span6(["S.NO", "PARTICULAR", "RATE (₹)", "QUANTITY", "AMOUNT (₹)", "REMARKS"], {
          size: 8.8,
          align: "center",
          v: "mid",
          fill: "#6aa84f",
          pad: "0",
        })}
      />
    );

    // ---- item rows (12.75 pt)
    const itemRow = (r) =>
      r?.type === "category" ? (
        <Row minH={12.75} cells={[{ span: [0, 0], text: "" }, { span: [1, 1], text: r.name, bold: true }, ...span6(["", "", "", ""]).map((c, i) => ({ ...c, span: [i + 2, i + 2] }))]} />
      ) : (
        <Row
          minH={12.75}
          cells={[
            { span: [0, 0], text: r ? r.n : "", align: "center" },
            { span: [1, 1], text: r?.particular, sub: r?.detail },
            { span: [2, 2], text: r ? fmt(r.rate) : "", align: "right" },
            { span: [3, 3], text: r && r.quantity !== null ? `${fmt(r.quantity, 3)}${r.unit ? ` ${r.unit}` : ""}` : "", size: 9.4, align: "right" },
            { span: [4, 4], text: r ? fmt(r.amount) : "", size: 9.4, align: "right" },
            { span: [5, 5], text: r?.remarks, size: 7.5 },
          ]}
        />
      );
    const rows = padRows(m.rows, ESTIMATE_MIN_ROWS).map((r, i) => ({
      key: `r${i}`,
      table: "items",
      filler: i >= m.rows.length,
      node: itemRow(r),
    }));

    // ---- totals (11.1 pt rows)
    const totRow = (t, grand) => (
      <Row
        minH={11.1}
        cells={[
          { span: [0, 0], text: "" },
          { span: [1, 1], text: t.key === "subtotal" ? " " : grand ? "" : t.detail },
          { span: [2, 2], text: "" },
          { span: [3, 3], text: t.label, bold: true, size: 9.4, align: "center" },
          { span: [4, 4], text: fmt(t.value), bold: true, size: 9.4, align: "right", fill: grand ? "#f2f2f2" : undefined },
          { span: [5, 5], text: "" },
        ]}
      />
    );
    const totals = [
      ...m.totals.map((t, i) => ({ key: `t${i}`, node: totRow(t) })),
      { key: "grand", node: totRow({ label: "Grand Total", value: m.grandTotal }, true) },
    ];

    // ---- payment terms
    const pay = (cells, opts = {}) => (
      <Row
        minH={13.6}
        cells={[
          { span: [0, 0], text: cells[0], ...opts },
          { span: [1, 1], text: cells[1], ...opts },
          { span: [2, 3], text: cells[2], ...opts },
          { span: [4, 5], text: cells[3], ...opts },
        ]}
      />
    );
    const payment = [
      {
        key: "pay-title",
        keepNext: 2,
        node: <Row h={11.1} cells={[{ span: [0, 5], text: "Payment Terms :", bold: true, size: 9.4, pad: "0 1.5pt 0.8pt" }]} />,
      },
      { key: "pay-head", isHead: true, table: "pay", keepNext: 1, node: pay(["Stages", "Date", "Amount ", "Remarks"], { bold: true, size: 9.4, align: "center", v: "mid" }) },
      ...padRows(m.payment, ESTIMATE_PAYMENT_ROWS).map((p, i) => ({
        key: `p${i}`,
        table: "pay",
        node: pay(p ? [p.stage, sheetDate(p.date), fmt(p.amount), p.remarks] : ["", "", "", ""], { size: 9.4, align: "center", v: "mid" }),
      })),
    ];

    // ---- terms + signatures
    const terms = (
      <div className="ts-arial">
        <Row h={10.7} cells={[{ span: [0, 5], text: "Terms & Conditions:", bold: true, size: 8.8, pad: "0 1.5pt 0.6pt" }]} />
        <div className="ts-b" style={{ minHeight: "26.8pt", fontSize: "5.5pt", padding: "1pt 1.5pt", lineHeight: 1.3 }}>
          {m.terms.map((t, i) => (
            <div key={i}>
              {i + 1}. {t}
            </div>
          ))}
        </div>
      </div>
    );
    const sign = (
      <div className="ts-arial">
        <div className="ts-row ts-b" style={{ height: "62.5pt" }}>
          <div className="ts-r" style={{ width: `${X(0, 1)}pt`, position: "relative" }}>
            {m.approvedBy && (
              <div style={{ position: "absolute", left: "4pt", bottom: "4pt", fontSize: "8pt", color: INK }}>
                {[m.approvedBy.name, sheetDate(m.approvedBy.date)].filter(Boolean).join(" · ")}
              </div>
            )}
          </div>
          <div style={{ width: `${X(2, 5)}pt`, position: "relative" }}>
            {(txt(m.contractor.name) || txt(m.contractor.company)) && (
              <div style={{ position: "absolute", left: "4pt", bottom: "4pt", fontSize: "8pt", color: INK }}>
                {[m.contractor.name, m.contractor.company].filter(Boolean).join(" · ")}
              </div>
            )}
          </div>
        </div>
        <Row
          h={10.6}
          cells={[
            { span: [0, 1], text: "APPROVED BY", bold: true, size: 8.8, align: "center", v: "mid", pad: 0 },
            { span: [2, 5], text: "CONTRACTOR'S SIGNATURE", bold: true, size: 8.8, align: "center", v: "mid", pad: 0 },
          ]}
        />
        <div style={{ height: "26.8pt" }} />
      </div>
    );

    const segments = [
      { key: "head", node: <div>{header}{parties}{blank}</div> },
      { key: "thead", isHead: true, table: "items", keepNext: 1, node: thead },
      ...rows,
      ...totals,
      ...payment,
      { key: "terms", keepNext: 1, node: terms },
      { key: "sign", node: sign },
    ];
    return { segments, heads: { items: thead, pay: payment[1].node } };
  }, [model]);

  if (!sheet) return null;
  return (
    <SheetDocument
      ref={ref}
      className="ts-estimate"
      frame={{ left: 18.3, top: 37.1, width: W, height: 770, border: true }}
      segments={sheet.segments}
      heads={sheet.heads}
    />
  );
});

export default EstimateSheetDocument;
