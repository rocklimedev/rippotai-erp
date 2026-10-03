// Daily Site Report — A4 PDF built on the shared print kit.
// Sections mirror the form 1:1 (basics, manpower, work, materials, equipment, issues, safety, photos, plan).
import React, { forwardRef, useMemo } from "react";
import { PrintDocument, KV, Stats, Pill, Note } from "@/components/print-document";
import {
  weatherLabel,
  siteConditionLabel,
  tradeLabel,
  issueTypeLabel,
  impactLabel,
  fmtDate,
  fmtWeekday,
  manpowerTotal,
} from "./reportModel";

export const reportRef = (r) =>
  r ? `RA/DSR/${String(r.reportDate).slice(0, 10).replace(/-/g, "")}/${String(r.id).padStart(3, "0")}` : "";

const qtyText = (m) => `${Number(m.quantity).toLocaleString("en-IN")} ${m.unit || ""}`.trim();

export function buildDailyReportSections(r) {
  const project = r.project || {};
  const total = manpowerTotal(r);
  const received = (r.materials || []).filter((m) => m.direction === "RECEIVED");
  const used = (r.materials || []).filter((m) => m.direction === "USED");
  const issues = r.issueItems || [];
  const flagged = issues.filter((i) => i.needsAttention).length;
  const avgProgress = (r.workItems || []).filter((w) => w.progress != null);

  const matTable = (rows, heading) => ({
    table: {
      heading,
      cols: ["Material", "#Quantity", "Remarks"],
      template: "1fr 34mm 55mm",
      items: rows.map((m, i) => ({ key: `${heading}-${i}`, cells: [m.name, qtyText(m), m.remarks || "—"] })),
    },
  });

  return [
    {
      title: "Day at a glance",
      blocks: [
        <Stats
          key="s"
          items={[
            { value: String(total), label: "Workers on site" },
            { value: String((r.workItems || []).length), label: "Activities" },
            { value: String(issues.length), label: flagged ? `Issues · ${flagged} flagged` : "Issues" },
            { value: String((r.photos || []).length), label: "Photos" },
          ]}
        />,
        <KV
          key="kv"
          cols={3}
          items={[
            { label: "Project", value: project.name, strong: true },
            { label: "Site", value: project.site_location },
            { label: "Date", value: `${fmtDate(r.reportDate)}`, sub: fmtWeekday(r.reportDate) },
            { label: "Weather", value: r.weatherCondition ? weatherLabel(r.weatherCondition) : null, sub: r.weatherNotes || undefined },
            { label: "Site condition", value: r.siteCondition ? siteConditionLabel(r.siteCondition) : null },
            { label: "Reported by", value: r.reportedBy },
          ]}
        />,
      ],
    },
    {
      title: "Manpower",
      rows: (r.manpower || []).length
        ? {
            cols: ["Trade", "Contractor / agency", "#Headcount"],
            template: "1fr 1fr 30mm",
            items: [
              ...(r.manpower || []).map((m, i) => ({ key: `m${i}`, cells: [tradeLabel(m.trade), m.contractorName || "—", String(m.headcount)] })),
              { key: "total", variant: "total", cells: ["Total on site", "", String(total)] },
            ],
          }
        : undefined,
    },
    {
      title: "Work done today",
      intro: avgProgress.length ? "Progress is the cumulative % complete for each activity." : undefined,
      rows: (r.workItems || []).length
        ? {
            cols: ["Activity", "Location / area", "#Progress"],
            template: "1fr 50mm 24mm",
            items: (r.workItems || []).map((w, i) => ({
              key: `w${i}`,
              cells: [w.activity, w.location || "—", w.progress != null ? `${w.progress}%` : "—"],
            })),
          }
        : undefined,
      blocks: [r.workCompleted ? { text: { label: "Summary", value: r.workCompleted } } : null],
    },
    {
      title: "Materials",
      blocks: [received.length ? matTable(received, "Received on site") : null, used.length ? matTable(used, "Used / consumed") : null],
    },
    {
      title: "Equipment",
      rows: (r.equipment || []).length
        ? {
            cols: ["Equipment", "#Count", "#Hours"],
            template: "1fr 26mm 26mm",
            items: (r.equipment || []).map((e, i) => ({ key: `e${i}`, cells: [e.name, e.count != null ? String(e.count) : "—", e.hours != null ? String(e.hours) : "—"] })),
          }
        : undefined,
    },
    {
      title: "Issues & delays",
      rows: issues.length
        ? {
            cols: ["Type", "Description", "Impact"],
            template: "34mm 1fr 34mm",
            items: issues.map((it, i) => ({
              key: `i${i}`,
              cells: [
                issueTypeLabel(it.type),
                it.description,
                <span key="p" style={{ display: "inline-flex", gap: "1.5mm", flexWrap: "wrap" }}>
                  {impactLabel(it.impact)}
                  {it.needsAttention ? <Pill tone="rose">Needs attention</Pill> : null}
                </span>,
              ],
            })),
          }
        : undefined,
      blocks: [!issues.length && r.issues ? { text: { label: "Issues", value: r.issues } } : null],
    },
    {
      title: "Safety",
      blocks: [
        r.safetyIncident ? (
          <Note key="n">Safety incident reported on this day.</Note>
        ) : r.safetyNotes ? null : null,
        r.safetyNotes ? { text: { label: r.safetyIncident ? "Incident details" : "Safety notes", value: r.safetyNotes } } : null,
        !r.safetyIncident && !r.safetyNotes ? <KV key="k" cols={1} items={[{ label: "Status", value: "No incidents reported" }]} /> : null,
      ],
    },
    {
      title: "Site photos",
      blocks: (r.photos || []).length
        ? [
            <div key="ph" className="pd-photos">
              {(r.photos || []).map((p, i) => (
                <figure key={i}>
                  <img src={p.url} alt={p.caption || `Photo ${i + 1}`} crossOrigin="anonymous" />
                  <figcaption>{p.caption || `Photo ${i + 1}`}</figcaption>
                </figure>
              ))}
            </div>,
          ]
        : [],
    },
    {
      title: "Plan for tomorrow",
      blocks: [r.nextDayPlan ? { text: { label: "", value: r.nextDayPlan } } : null],
    },
  ];
}

const DailyReportDocument = forwardRef(function DailyReportDocument({ report }, ref) {
  const sections = useMemo(() => (report ? buildDailyReportSections(report) : []), [report]);
  if (!report) return null;
  const project = report.project || {};
  const client = project.client?.name;
  return (
    <PrintDocument
      ref={ref}
      docType="Daily Site Report"
      title={project.name || "Project"}
      subtitle={`${fmtWeekday(report.reportDate)}, ${fmtDate(report.reportDate)}`}
      coverDetails={[
        { label: "Project", value: project.name },
        { label: "Site", value: project.site_location },
        { label: "Client", value: client },
        { label: "Report date", value: fmtDate(report.reportDate), sub: fmtWeekday(report.reportDate) },
        { label: "Reference no.", value: reportRef(report), sub: report.status === "SUBMITTED" ? "Submitted" : "Draft" },
        { label: "Reported by", value: report.reportedBy, sub: "Rippotai Architecture" },
      ]}
      preparedFor={client}
      reference={reportRef(report)}
      date={fmtDate(report.reportDate)}
      sections={sections}
    />
  );
});

export default DailyReportDocument;
