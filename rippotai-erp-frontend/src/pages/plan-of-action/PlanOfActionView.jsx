// Plan of Action — how execution runs, phase by phase. Clean A4 document on the shared print kit.
import React, { useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Edit3, Trash2, Download, CheckCircle2, FileText } from "lucide-react";
import { Page, PageHeader, Button, EmptyState, StatusPill } from "@/components/inos";
import {
  PrintDocument, DocumentPreview, Stats, HtmlTerms, htmlToTerms, SubHead, usePdfDownload, pdfFileName,
  has, fmtDate, titleCase, bySort,
} from "@/components/print-document";
import {
  useGetPlanOfActionQuery,
  useDeletePlanOfActionMutation,
  usePublishPlanOfActionMutation,
} from "../../api/documents/plan-of-actions.api";
import { useGetClientByIdQuery } from "../../api/projects/client.api";

function durationLabel(min, max) {
  if (!has(min) && !has(max)) return "";
  if (!has(min) || !has(max) || Number(min) === Number(max)) return `${min ?? max} days`;
  return `${min}–${max} days`;
}

function daysOf(p) {
  const nums = [p.min, p.max].filter((n) => has(n)).map(Number);
  if (!nums.length) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

// Bars: use the planner's own Gantt offsets when given, otherwise let each phase start
// when the previous one is about half-way through (indicative overlap).
function bars(phases) {
  const useGantt = phases.some((p) => Number(p.ganttDuration) > 0);
  let cursor = 0;
  const raw = phases.map((p) => {
    if (useGantt) return { start: Number(p.ganttOffset) || 0, dur: Number(p.ganttDuration) || 0 };
    const dur = daysOf(p);
    const start = cursor;
    cursor += dur * 0.5;
    return { start, dur };
  });
  const span = Math.max(...raw.map((r) => r.start + r.dur), 1);
  return raw.map((r) =>
    r.dur > 0 ? { left: (r.start / span) * 100, width: Math.max(3, (r.dur / span) * 100) } : { left: (r.start / span) * 100, marker: true },
  );
}

function Timeline({ phases }) {
  const b = bars(phases);
  return (
    <div>
      <SubHead>Phase overlap — indicative</SubHead>
      <div className="pd-gantt">
        {phases.map((p, i) => (
          <div key={p.id} className="pd-gantt__row">
            <div className="pd-gantt__label">
              <small>{String(i + 1).padStart(2, "0")}</small>
              {p.title}
            </div>
            <div className="pd-gantt__track">
              <div
                className={`pd-gantt__bar ${b[i].marker ? "pd-gantt__bar--marker" : ""}`}
                style={{ left: `${Math.min(b[i].left, 97)}%`, width: b[i].marker ? undefined : `${Math.min(b[i].width, 100 - b[i].left)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export const normalizePoaPhases = (poa) =>
  [...(poa?.phases || [])]
    .map((phase) => {
      const link = phase.PlanOfActionPhase || {};
      return {
        id: phase.id,
        title: titleCase(phase.title),
        description: phase.description,
        min: link.duration_min_days,
        max: link.duration_max_days,
        parallel: link.parallel_work_note,
        inclusion: link.inclusion_note,
        ganttOffset: link.gantt_start_offset_days,
        ganttDuration: link.gantt_duration_days,
        sort: link.sort_order ?? phase.sort_order ?? 0,
      };
    })
    .sort((a, b) => a.sort - b.sort);

export function buildPoaSections(poa, phases) {
  const sections = [];
  const total =
    poa.total_duration_label ||
    durationLabel(poa.total_duration_min_days, poa.total_duration_max_days);
  const overview = [];
  if (has(poa.execution_description)) overview.push({ text: { value: poa.execution_description } });
  const stats = [
    { value: String(poa.total_phases || phases.length || "").padStart(2, "0"), label: "Execution phases, from site start to handover" },
    { value: total, label: "Indicative site duration with overlaps, subject to the terms" },
  ].filter((s) => has(s.value) && s.value !== "00");
  if (stats.length) overview.push(<Stats key="stats" items={stats} />);
  if (phases.length > 1) overview.push(<Timeline key="tl" phases={phases} />);
  if (overview.length) sections.push({ title: "How the execution runs", blocks: overview });

  if (phases.length)
    sections.push({
      title: "Phases",
      intro: "What happens in each phase and how long it usually takes on site.",
      rows: {
        cols: ["Phase", "What happens", "#Duration"],
        template: "32% 1fr 30mm",
        items: phases.map((p, i) => ({
          key: p.id,
          cells: [
            { text: `${String(i + 1).padStart(2, "0")}  ${p.title}` },
            { text: p.description || "", sub: [p.parallel, p.inclusion].filter(has).join(" · "), strong: false },
            durationLabel(p.min, p.max),
          ],
        })),
      },
    });

  if (poa.team_members?.length) {
    const team = bySort(poa.team_members, "sort_order").filter((m) => has(m.user?.name || m.name));
    if (team.length)
      sections.push({
        title: "Your team",
        rows: {
          cols: ["Name", "Role"],
          template: "40% 1fr",
          items: team.map((m, i) => ({ key: m.id || i, cells: [m.user?.name || m.name, [m.role_label, m.is_primary && "Primary contact"].filter(Boolean).join(" · ")] })),
        },
      });
  }

  if (htmlToTerms(poa.terms_content_snapshot).length)
    sections.push({ title: "Terms", blocks: [<HtmlTerms key="t" html={poa.terms_content_snapshot} />] });

  return sections;
}

export function PlanOfActionView() {
  const { id } = useParams();
  const nav = useNavigate();
  const docRef = useRef(null);
  const { download, downloading } = usePdfDownload(docRef);
  const { data: poa, isFetching, isError } = useGetPlanOfActionQuery(id, { skip: !id });
  const clientId = poa?.project?.client_id;
  const { data: client } = useGetClientByIdQuery({ id: clientId }, { skip: !clientId || !!poa?.project?.client });
  const [deletePlanOfAction, { isLoading: deleting }] = useDeletePlanOfActionMutation();
  const [publishPlanOfAction, { isLoading: publishing }] = usePublishPlanOfActionMutation();

  const phases = useMemo(() => normalizePoaPhases(poa), [poa]);
  const sections = useMemo(() => (poa ? buildPoaSections(poa, phases) : []), [poa, phases]);

  const crumbs = [{ label: "CRM", to: "/crm" }, { label: "Plans of action", to: "/crm/plan-of-action/all" }, { label: "Plan" }];

  const removePlan = async () => {
    if (!window.confirm("Delete this Plan of Action? This cannot be undone.")) return;
    try {
      await deletePlanOfAction(id).unwrap();
      toast.success("Plan of Action deleted");
      nav("/crm/plan-of-action/all");
    } catch (e) {
      toast.error(e?.data?.detail || e?.data?.message || "Failed to delete");
    }
  };
  const publishPlan = async () => {
    if (!window.confirm("Publish this Plan of Action? The client will be able to view it.")) return;
    try {
      await publishPlanOfAction(id).unwrap();
      toast.success("Plan of Action published");
    } catch (e) {
      toast.error(e?.data?.detail || e?.data?.message || "Failed to publish");
    }
  };

  if (isFetching && !poa)
    return (
      <Page>
        <PageHeader crumbs={crumbs} title="Plan of action" subtitle="Loading…" />
      </Page>
    );
  if (isError || !poa)
    return (
      <Page>
        <PageHeader crumbs={crumbs} title="Plan of action" />
        <div className="inos-card">
          <EmptyState icon={FileText} title="Plan of action not found" text="It may have been deleted, or you don't have access to it." />
        </div>
      </Page>
    );

  const project = poa.project || {};
  const cl = project.client || client || {};
  const projectName = project.name || "Project";
  const version = poa.version || 1;
  const date = fmtDate(poa.published_at || poa.updated_at || poa.created_at);
  const lead = (poa.team_members || []).find((m) => m.is_primary) || (poa.team_members || [])[0];

  return (
    <Page>
      <PageHeader
        crumbs={crumbs}
        title={projectName}
        subtitle={
          <span style={{ display: "inline-flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            Plan of action · version {version}
            {poa.status && <StatusPill status={poa.status} size="sm" />}
          </span>
        }
        actions={
          <>
            <Button variant="ghost" icon={Trash2} onClick={removePlan} disabled={deleting}>
              Delete
            </Button>
            <Button variant="secondary" icon={Edit3} onClick={() => nav(`/crm/forms/plan-of-action/${id}/edit`)}>
              Edit
            </Button>
            {poa.status !== "published" && (
              <Button variant="secondary" icon={CheckCircle2} onClick={publishPlan} loading={publishing}>
                Publish
              </Button>
            )}
            <Button
              variant="primary"
              icon={Download}
              loading={downloading}
              onClick={() => download(pdfFileName("Plan-of-Action", projectName, version), { title: `Plan of Action — ${projectName}`, label: "plan of action" })}
            >
              Download PDF
            </Button>
          </>
        }
      />
      <DocumentPreview>
        <PrintDocument
          ref={docRef}
          docType="Plan of Action"
          title={projectName}
          subtitle="How the work will run on site, phase by phase."
          coverDetails={[
            { label: "Prepared for", value: cl.name, sub: cl.phone },
            { label: "Project", value: projectName },
            { label: "Site", value: project.site_location },
            { label: "Date", value: date, sub: `Version ${version}` },
            { label: "Prepared by", value: lead?.user?.name || lead?.name || "Rippotai Architecture", sub: lead ? lead.role_label || "Rippotai Architecture" : "" },
          ]}
          preparedFor={cl.name || projectName}
          date={date}
          version={version}
          sections={sections}
        />
      </DocumentPreview>
    </Page>
  );
}

export default PlanOfActionView;
