// Daily site report — read view + A4 PDF (print kit). Tabs: Report | PDF preview.
import React, { useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  Pencil,
  Download,
  Trash2,
  Share2,
  FileText,
  Users,
  ClipboardList,
  Camera,
  AlertTriangle,
  MapPin,
  CalendarDays,
  User,
} from "lucide-react";
import { Page, PageHeader, Card, Button, Pill, StatusPill, EmptyState, Tabs, Progress, Stats, StatTile } from "@/components/inos";
import { DocumentPreview, usePdfDownload, pdfFileName } from "@/components/print-document";
import { waitForPages } from "@/components/print-document/commerce";
import {
  useGetDailySiteReportQuery,
  useShareDailySiteReportMutation,
  useDeleteDailySiteReportMutation,
} from "@/api/procuerment/site-ops.api";
import DailyReportDocument, { reportRef } from "./DailyReportDocument";
import {
  weatherLabel,
  weatherIcon,
  siteConditionLabel,
  tradeLabel,
  issueTypeLabel,
  impactLabel,
  impactTone,
  fmtDate,
  fmtWeekday,
  manpowerTotal,
} from "./reportModel";
import "./daily-reports.css";

const BASE = "/site-operations/daily-reports";

function ListRows({ rows, empty }) {
  if (!rows.length) return <p className="dsr-muted">{empty}</p>;
  return (
    <div className="dsr-list">
      {rows.map((r, i) => (
        <div className="dsr-list__row" key={i}>
          <div style={{ minWidth: 0 }}>
            <div className="dsr-list__title">{r.title}</div>
            {r.sub && <div className="dsr-list__sub">{r.sub}</div>}
          </div>
          <div>{r.right}</div>
        </div>
      ))}
    </div>
  );
}

export default function DailyReportDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const [tab, setTab] = useState("report");
  const docRef = useRef(null);
  const { download, downloading } = usePdfDownload(docRef);

  const { data: r, isFetching, isError } = useGetDailySiteReportQuery(id, { skip: !id });
  const [share, { isLoading: sharing }] = useShareDailySiteReportMutation();
  const [remove, { isLoading: deleting }] = useDeleteDailySiteReportMutation();

  const crumbs = [
    { label: "Site Operations", to: "/site-operations" },
    { label: "Daily reports", to: BASE },
    { label: "Report" },
  ];

  if (isFetching && !r) {
    return (
      <Page>
        <PageHeader crumbs={crumbs} title="Daily site report" subtitle="Loading…" />
      </Page>
    );
  }
  if (isError || !r) {
    return (
      <Page>
        <PageHeader crumbs={crumbs} title="Daily site report" />
        <div className="inos-card">
          <EmptyState icon={FileText} title="Report not found" text="It may have been deleted." action={<Button onClick={() => nav(BASE)}>Back to reports</Button>} />
        </div>
      </Page>
    );
  }

  const project = r.project || {};
  const total = manpowerTotal(r);
  const issues = r.issueItems || [];
  const flagged = issues.filter((i) => i.needsAttention).length;
  const received = (r.materials || []).filter((m) => m.direction === "RECEIVED");
  const used = (r.materials || []).filter((m) => m.direction === "USED");
  const WIcon = weatherIcon(r.weatherCondition);
  const qty = (m) => `${Number(m.quantity).toLocaleString("en-IN")} ${m.unit || ""}`;

  const downloadPdf = async () => {
    if (tab !== "pdf") setTab("pdf");
    // wait for the preview to mount and paginate before capturing
    const t0 = Date.now();
    while (!docRef.current && Date.now() - t0 < 3000) await new Promise((res) => setTimeout(res, 60));
    await waitForPages(docRef.current);
    download(pdfFileName("Daily-Site-Report", `${project.name || "project"}-${r.reportDate}`, 1), {
      title: `Daily Site Report — ${project.name || ""} — ${fmtDate(r.reportDate)}`,
      label: "daily site report",
    });
  };

  const doShare = async () => {
    try {
      await share(r.id).unwrap();
      toast.success("Marked as shared with client");
    } catch {
      toast.error("Could not share the report");
    }
  };

  const doDelete = async () => {
    if (!window.confirm("Delete this daily report? This cannot be undone.")) return;
    try {
      await remove(r.id).unwrap();
      toast.success("Report deleted");
      nav(BASE);
    } catch {
      toast.error("Could not delete the report");
    }
  };

  return (
    <Page className="dsr-page">
      <PageHeader
        crumbs={crumbs}
        title={`${fmtWeekday(r.reportDate)}, ${fmtDate(r.reportDate)}`}
        subtitle={
          <span style={{ display: "inline-flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            {project.name}
            <StatusPill status={r.status} size="sm" />
            {r.isShared ? <Pill tone="ok" size="sm">Shared with client</Pill> : null}
            {flagged ? <Pill tone="bad" size="sm">{flagged} need attention</Pill> : null}
          </span>
        }
        actions={
          <>
            <Button variant="ghost" icon={Trash2} onClick={doDelete} disabled={deleting} aria-label="Delete report" />
            {!r.isShared && r.status === "SUBMITTED" && (
              <Button variant="secondary" icon={Share2} onClick={doShare} loading={sharing}>Share with client</Button>
            )}
            <Button variant="secondary" icon={Pencil} onClick={() => nav(`${BASE}/${r.id}/edit`)}>Edit</Button>
            <Button variant="primary" icon={Download} onClick={downloadPdf} loading={downloading}>Download PDF</Button>
          </>
        }
      />

      <Tabs
        value={tab}
        onChange={setTab}
        options={[
          { value: "report", label: "Report", icon: ClipboardList },
          { value: "pdf", label: "PDF preview", icon: FileText },
        ]}
      />

      {tab === "pdf" ? (
        <DocumentPreview>
          <DailyReportDocument ref={docRef} report={r} />
        </DocumentPreview>
      ) : (
        <>
          <Stats>
            <StatTile label="Workers on site" value={total} icon={<Users />} />
            <StatTile label="Activities" value={(r.workItems || []).length} icon={<ClipboardList />} />
            <StatTile label="Issues" value={issues.length} meta={flagged ? `${flagged} need attention` : "none flagged"} icon={<AlertTriangle />} tone={flagged ? "bad" : issues.length ? "warn" : "ok"} />
            <StatTile label="Photos" value={(r.photos || []).length} icon={<Camera />} />
          </Stats>

          <div className="dsr-detail">
            <div className="dsr-detail__main">
              <Card title="Work done today">
                <ListRows
                  empty="No activities recorded."
                  rows={(r.workItems || []).map((w) => ({
                    title: w.activity,
                    sub: w.location || undefined,
                    right:
                      w.progress != null ? (
                        <div className="dsr-prog">
                          <Progress value={w.progress} />
                          <span>{w.progress}%</span>
                        </div>
                      ) : null,
                  }))}
                />
                {r.workCompleted && <p className="dsr-text" style={{ marginTop: 12 }}>{r.workCompleted}</p>}
              </Card>

              <Card title="Issues & delays">
                <ListRows
                  empty={r.issues || "No issues reported."}
                  rows={issues.map((it) => ({
                    title: it.description,
                    sub: `${issueTypeLabel(it.type)} · ${impactLabel(it.impact)} impact`,
                    right: it.needsAttention ? <Pill tone="bad" size="sm">Needs attention</Pill> : <Pill tone={impactTone(it.impact)} size="sm">{impactLabel(it.impact)}</Pill>,
                  }))}
                />
              </Card>

              <Card title="Materials">
                <p className="dsr-sub">Received</p>
                <ListRows empty="Nothing received." rows={received.map((m) => ({ title: m.name, sub: m.remarks, right: <span className="dsr-list__num">{qty(m)}</span> }))} />
                <p className="dsr-sub" style={{ marginTop: 12 }}>Used / consumed</p>
                <ListRows empty="Nothing recorded as used." rows={used.map((m) => ({ title: m.name, sub: m.remarks, right: <span className="dsr-list__num">{qty(m)}</span> }))} />
              </Card>

              <Card title="Photos">
                {(r.photos || []).length ? (
                  <div className="dsr-photos">
                    {r.photos.map((p, i) => (
                      <figure className="dsr-photo" key={i} style={{ margin: 0 }}>
                        <a className="dsr-photo__img" href={p.url} target="_blank" rel="noreferrer">
                          <img src={p.url} alt={p.caption || `Photo ${i + 1}`} />
                        </a>
                        <figcaption>{p.caption || `Photo ${i + 1}`}</figcaption>
                      </figure>
                    ))}
                  </div>
                ) : (
                  <p className="dsr-muted">No photos attached.</p>
                )}
              </Card>

              <Card title="Tomorrow's plan">
                {r.nextDayPlan ? <p className="dsr-text">{r.nextDayPlan}</p> : <p className="dsr-muted">No plan recorded.</p>}
              </Card>
            </div>

            <div className="dsr-detail__side">
              <Card title="Details">
                <dl className="inos-kv">
                  <dt><span className="dsr-meta"><MapPin />Site</span></dt>
                  <dd>{project.site_location || "—"}</dd>
                  <dt><span className="dsr-meta"><CalendarDays />Date</span></dt>
                  <dd>{fmtDate(r.reportDate)}</dd>
                  <dt><span className="dsr-meta"><WIcon />Weather</span></dt>
                  <dd>{r.weatherCondition ? weatherLabel(r.weatherCondition) : "—"}{r.weatherNotes ? <div className="dsr-list__sub">{r.weatherNotes}</div> : null}</dd>
                  <dt>Site condition</dt>
                  <dd>{r.siteCondition ? siteConditionLabel(r.siteCondition) : "—"}</dd>
                  <dt><span className="dsr-meta"><User />Reported by</span></dt>
                  <dd>{r.reportedBy}</dd>
                  <dt>Reference</dt>
                  <dd>{reportRef(r)}</dd>
                  <dt>Client</dt>
                  <dd>{project.client?.name || "—"}</dd>
                </dl>
              </Card>

              <Card title="Manpower" subtitle={`${total} on site`}>
                <ListRows
                  empty="No manpower recorded."
                  rows={(r.manpower || []).map((m) => ({ title: tradeLabel(m.trade), sub: m.contractorName || undefined, right: <span className="dsr-list__num">{m.headcount}</span> }))}
                />
              </Card>

              <Card title="Equipment">
                <ListRows
                  empty="No equipment recorded."
                  rows={(r.equipment || []).map((e) => ({
                    title: e.name,
                    sub: e.hours != null ? `${e.hours} h used` : undefined,
                    right: e.count != null ? <span className="dsr-list__num">× {e.count}</span> : null,
                  }))}
                />
              </Card>

              <Card title="Safety">
                {r.safetyIncident ? <Pill tone="bad">Incident reported</Pill> : <Pill tone="ok">No incidents</Pill>}
                {r.safetyNotes && <p className="dsr-text" style={{ marginTop: 10 }}>{r.safetyNotes}</p>}
              </Card>
            </div>
          </div>
        </>
      )}
    </Page>
  );
}
