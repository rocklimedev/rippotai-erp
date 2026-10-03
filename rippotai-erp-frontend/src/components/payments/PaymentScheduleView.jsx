// Payment Schedule — milestones, shares and amounts, as a clean A4 document on the shared print kit.
import React, { forwardRef, useMemo } from "react";
import {
  PrintDocument, Stats, Totals, HtmlTerms, htmlToTerms, SignOff, Note, Pill,
  has, fmtDate, inr, money, titleCase,
} from "@/components/print-document";

const pct = (v) => `${Number(v || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}%`;
const STATUS_TONE = { PAID: "green", INVOICED: "sand", PARTIALLY_PAID: "sand", OVERDUE: "rose" };

export function buildScheduleSections(schedule) {
  const project = schedule.project || {};
  const client = project.client || {};
  const milestones = [...(schedule.milestones || [])].sort(
    (a, b) => Number(a.sortOrder ?? a.milestoneNumber ?? 0) - Number(b.sortOrder ?? b.milestoneNumber ?? 0),
  );
  const totalPct = milestones.reduce((s, m) => s + (Number(m.percentage) || 0), 0);
  const contract = Number(schedule.totalContractValue) || 0;
  const gst = Number(schedule.gstAmount) || (schedule.gstRate != null ? (contract * Number(schedule.gstRate)) / 100 : 0);
  const payable = Number(schedule.totalPayable) || contract + gst;
  const sections = [];

  const stats = [
    { value: inr(contract)?.short, label: "Contract value (before GST)" },
    { value: gst > 0 ? inr(gst)?.short : "", label: `GST${has(schedule.gstRate) ? ` @ ${pct(schedule.gstRate)}` : ""}` },
    { value: inr(payable)?.short, label: "Total payable" },
  ];
  const overview = [];
  if (stats.some((s) => has(s.value))) overview.push(<Stats key="s" items={stats} />);
  if (milestones.length > 1)
    overview.push(
      <div key="split">
        <span className="pd-label">How the payments are spread</span>
        <div className="pd-split">
          {milestones.map((m, i) => (
            <span key={m.id || i} style={{ flex: `${Number(m.percentage) || 0.5} 1 0` }}>
              {Number(m.percentage) >= 6 ? `M${m.milestoneNumber || i + 1} · ${pct(m.percentage)}` : ""}
            </span>
          ))}
        </div>
      </div>,
    );
  if (overview.length) sections.push({ title: "Summary", blocks: overview });

  if (milestones.length) {
    const blocks = [];
    if (Math.round(totalPct) !== 100)
      blocks.push(<Note key="chk">Milestone shares add up to {pct(totalPct)}, not 100%.</Note>);
    blocks.push({
      keep: (
      <Totals
        key="tot"
        lines={[
          { label: `Total of milestones (${pct(totalPct)})`, value: milestones.reduce((s, m) => s + (Number(m.amount) || 0), 0) || contract },
          gst > 0 && { label: `GST${has(schedule.gstRate) ? ` @ ${pct(schedule.gstRate)}` : ""}`, value: gst },
          { label: "Total payable", value: payable, grand: true },
        ].filter(Boolean)}
      />
      ),
    });
    sections.push({
      title: "Milestones",
      intro: "Each payment falls due when its milestone is reached. Amounts are before GST.",
      rows: {
        cols: ["No.", "Milestone", "Due", "#Share", "#Amount"],
        template: "11mm 1fr 38mm 15mm 30mm",
        items: milestones.map((m, i) => {
          const status = String(m.status || "").toUpperCase();
          return {
            key: m.id || i,
            cells: [
              { text: String(m.milestoneNumber || i + 1).padStart(2, "0"), strong: false },
              {
                text: (
                  <>
                    {m.title || "Milestone"}
                    {status && status !== "PENDING" && <Pill tone={STATUS_TONE[status] || "mute"}>{titleCase(status)}</Pill>}
                  </>
                ),
                sub: [m.description, status === "PAID" && m.paidAt ? `Paid on ${fmtDate(m.paidAt)}` : ""].filter(has).join("\n"),
                strong: true,
              },
              { text: [m.releaseTrigger, m.dueDate && `By ${fmtDate(m.dueDate, { short: true })}`].filter(has).join("\n"), strong: false },
              pct(m.percentage),
              money(m.amount),
            ],
          };
        }),
      },
      blocks,
    });
  }

  const termsHtml = schedule.termsTemplate?.content_html || schedule.terms_content_snapshot;
  if (htmlToTerms(termsHtml).length) sections.push({ title: "Terms", blocks: [<HtmlTerms key="t" html={termsHtml} />] });

  const architect =
    project.team_members?.find((m) => m.role_label === "Principal Architect")?.user?.name ||
    project.team_members?.find((m) => m.is_primary)?.user?.name;
  sections.push({
    title: "Acceptance",
    blocks: [
      <SignOff
        key="sign"
        note="The client confirms having read and accepted the milestones, shares and terms in this schedule, which forms part of the signed agreement for this project."
        left={{ name: architect || "Rippotai Architecture", role: "For Rippotai Architecture · Authorised signatory" }}
        right={{ name: client.name || "Client", role: `Client · ${schedule.acceptedAt ? fmtDate(schedule.acceptedAt) : "Date"}` }}
      />,
    ],
  });
  return sections;
}

const PaymentScheduleView = forwardRef(function PaymentScheduleView({ schedule }, ref) {
  const sections = useMemo(() => buildScheduleSections(schedule), [schedule]);
  const project = schedule.project || {};
  const client = project.client || {};
  const date = fmtDate(schedule.updatedAt || schedule.createdAt);
  const payable = Number(schedule.totalPayable) || 0;
  return (
    <PrintDocument
      ref={ref}
      docType="Payment Schedule"
      title={project.name || "Project"}
      subtitle="When each payment falls due, and how much."
      coverDetails={[
        { label: "Prepared for", value: client.name, sub: client.phone },
        { label: "Project", value: project.name },
        { label: "Site", value: project.site_location },
        { label: "Total payable", value: payable ? money(payable) : "", sub: "Including GST" },
        { label: "Date", value: date },
        { label: "Prepared by", value: "Rippotai Architecture" },
      ]}
      preparedFor={client.name || project.name}
      date={date}
      sections={sections}
    />
  );
});

export default PaymentScheduleView;
