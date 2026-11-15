// Site Visit report — replica of the original SITE VISIT TEMPLATE (.docx / .pdf): three US-Letter
// pages (612 × 792 pt). Page 1: logo, DATE, PROJECT NAME / SITE LOCATION / TEAM/TEAM MEMBER / INTENT,
// TASK lines. Page 2: LIST OF MATERIAL REQUIRED and TEAM LINEUP (IF REQUIRED) tables. Page 3:
// ISSUES ON SITE(URGENT) and NOTES lines. Coordinates are the template PDF's points.
import { forwardRef, useMemo } from "react";
import "@fontsource/lato/400.css";
import "../template-documents/sheet.css";
import "../business-proposal/proposal-deck/deck.css";
import logo from "@/assets/templates/site-visit-logo.png";
import bar from "@/assets/templates/site-visit-bar.png";

const INK = "#353744";
const LIGHT = "#e5e5e5";
const pt = (n) => `${n}pt`;
const FONT = "'Proxima Nova', 'Montserrat', 'Lato', Arial, sans-serif";
const has = (v) => v !== null && v !== undefined && String(v).trim() !== "";

function T({ x, y, s = 10.8, c = INK, w, align, children, style }) {
  return (
    <div
      className="bp-t"
      style={{ left: pt(x), top: pt(y - 0.1 * s), fontSize: pt(s), color: c, fontFamily: FONT, ...(w ? { width: pt(w), whiteSpace: "normal" } : {}), ...(align ? { textAlign: align } : {}), ...style }}
    >
      {children}
    </div>
  );
}
const Rule = ({ y, c = LIGHT, sw = 0.75, x1 = 72, x2 = 540 }) => (
  <div className="bp-box" style={{ left: pt(x1), top: pt(y - sw / 2), width: pt(x2 - x1), height: pt(sw), background: c }} />
);
const Page = ({ children }) => (
  <div className="pd-page bp-page" style={{ width: "612pt", height: "792pt", background: "#fff" }}>
    {children}
  </div>
);
const fmt = (v, time) => {
  if (!has(v)) return "";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v);
  const date = d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  return time ? `${date}, ${d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}` : date;
};
const human = (s) => String(s || "").replaceAll("_", " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());

/** Written lines: each entry sits just above its rule (template rows are 16.1 pt apart). */
function Lines({ tops, entries = [], c = LIGHT, sw = 0.75, size = 10 }) {
  return tops.map((y, i) => (
    <div key={y}>
      {has(entries[i]) && (
        <T x={74} y={y - 13} s={size} w={464} style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {entries[i]}
        </T>
      )}
      <Rule y={y} c={c} sw={sw} />
    </div>
  ));
}

/** Break free text into ~84-character lines to sit on the ruled lines. */
const wrap = (text, width = 84) =>
  String(text || "")
    .split(/\n+/)
    .flatMap((para) => {
      const out = [];
      let cur = "";
      para.split(/\s+/).forEach((w) => {
        if ((cur + " " + w).trim().length > width) {
          out.push(cur.trim());
          cur = w;
        } else cur = `${cur} ${w}`;
      });
      if (cur.trim()) out.push(cur.trim());
      return out;
    });

function Table({ top, head, rows }) {
  const rowH = 29.75;
  return (
    <>
      <div className="bp-box" style={{ left: pt(72), top: pt(top), width: pt(468), height: pt(rowH * 8), border: "1pt solid #000" }} />
      <div className="bp-box" style={{ left: pt(440.4), top: pt(top), width: pt(0.9), height: pt(rowH * 8), background: "#000" }} />
      {Array.from({ length: 7 }, (_, i) => (
        <Rule key={i} y={top + rowH * (i + 1)} c="#000" sw={0.9} />
      ))}
      <T x={72} y={top + 18.6} c="#000" w={368.4} align="center">
        <b>{head}</b>
      </T>
      <T x={440.4} y={top + 18.6} c="#000" w={99.6} align="center">
        <b>DATE/TIME</b>
      </T>
      {rows.slice(0, 7).map((r, i) => (
        <div key={i}>
          <T x={77.8} y={top + rowH * (i + 1) + 10} s={10} w={358}>
            {r[0]}
          </T>
          <T x={442} y={top + rowH * (i + 1) + 10} s={8.5} w={96} align="center">
            {r[1]}
          </T>
        </div>
      ))}
    </>
  );
}

const TASK_LINES = [244.8, 260.6, 276.5, 341.3, 357.1, 373, 437.8, 453.6, 469.4, 517, 534.2, 550.1, 565.9, 630.7, 646.6, 662.4, 678.2, 709.9];
const ISSUE_LINES = Array.from({ length: 11 }, (_, i) => 115.5 + 16.07 * i);
const NOTE_LINES = Array.from({ length: 11 }, (_, i) => 432.6 + 16.07 * i);

/** visit: site-visit log ({ project, visitorType, visitorName, scheduledDate, actualVisitAt, status, purpose, notes, loggedBy, visitAssignment }) */
const SiteVisitDocument = forwardRef(function SiteVisitDocument({ visit }, ref) {
  const m = useMemo(() => {
    const v = visit || {};
    const a = v.visitAssignment || {};
    const when = v.actualVisitAt || v.scheduledDate;
    const tasks = [
      a.stageName && `Stage: ${a.stageName}`,
      ...wrap(a.checksPurpose),
      a.visitType && `Visit type: ${human(a.visitType)}`,
      a.purpose && a.purpose !== v.purpose && a.purpose,
      `Status: ${human(v.status)}${v.actualVisitAt ? ` · checked in ${fmt(v.actualVisitAt, true)}` : ` · scheduled ${fmt(v.scheduledDate)}`}`,
    ].filter(has);
    return {
      date: fmt(when),
      project: v.project?.name || v.projectName || "",
      site: v.project?.site_location || "",
      team: [v.visitorName, v.visitorType ? `(${human(v.visitorType)})` : ""].filter(has).join(" "),
      intent: v.purpose || a.purpose || "",
      tasks,
      teamRows: [
        [`${v.visitorName || ""}${v.visitorType ? ` — ${human(v.visitorType)}` : ""}`, fmt(when, !!v.actualVisitAt)],
        ...(has(v.loggedBy) && v.loggedBy !== v.visitorName ? [[`${v.loggedBy} — logged the visit`, fmt(v.createdAt)]] : []),
      ],
      notes: wrap(v.notes),
    };
  }, [visit]);

  return (
    <div ref={ref} className="ts-doc bp-deck sv-doc" data-page-width="612" data-page-height="792">
      <Page>
        <img className="bp-img" src={logo} alt="Rippotai" style={{ left: pt(292), top: pt(39), width: pt(54), height: pt(65) }} />
        <T x={434.8} y={91.7} s={8.9}>
          <b>DATE:</b> {m.date}
        </T>
        <T x={72} y={122.3}><b>PROJECT&nbsp; NAME :</b> {m.project}</T>
        <T x={72} y={135.7} s={9.9}>
          <b>SITE LOCATION :</b> <span style={{ color: "#666" }}>{m.site}</span>
        </T>
        <T x={72} y={148}><b>TEAM/TEAM MEMBER :</b> {m.team}</T>
        <T x={72} y={161.4} w={468}>
          <b>INTENT :</b> {m.intent}
        </T>
        <T x={72} y={204.4}><b>TASK</b></T>
        <Lines tops={TASK_LINES} entries={m.tasks} />
      </Page>
      <Page>
        <img className="bp-img" src={bar} alt="" style={{ left: pt(72), top: pt(48), width: pt(468), height: pt(5) }} />
        <T x={72} y={74.3}><b>LIST OF MATERIAL REQUIRED:</b></T>
        <Table top={104.2} head="MATERIAL" rows={[]} />
        <T x={72} y={378.2}><b>TEAM LINEUP (IF REQUIRED):</b></T>
        <Table top={408} head="TEAM" rows={m.teamRows} />
      </Page>
      <Page>
        <img className="bp-img" src={bar} alt="" style={{ left: pt(72), top: pt(48), width: pt(468), height: pt(5) }} />
        <T x={72} y={74.3}><b>ISSUES ON SITE(URGENT):</b></T>
        <Lines tops={ISSUE_LINES} c="#000" sw={1.1} />
        <T x={72} y={412} s={11.8}>
          <b>NOTES:</b>
        </T>
        <Lines tops={NOTE_LINES} entries={["", ...m.notes]} />
        <Rule y={711.7} c="#000" sw={1.1} />
      </Page>
    </div>
  );
});

export default SiteVisitDocument;
