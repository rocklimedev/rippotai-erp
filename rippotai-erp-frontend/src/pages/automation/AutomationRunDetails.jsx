// Automation — one run: the record it matched, conditions checked, actions taken.
import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Activity, CheckCircle2, Circle, XCircle } from "lucide-react";
import { Page, PageHeader, Card, Button, EmptyState, Pill } from "@/components/inos";
import { useGetAutomationRunQuery } from "@/api/automation/automation.api";
import { autoCrumbs, RunStatus, fmtWhen } from "./_automation-ui";

const ICON = {
  SUCCESS: <CheckCircle2 size={18} style={{ color: "var(--ok-dot)" }} aria-label="Done" />,
  FAILED: <XCircle size={18} style={{ color: "var(--bad-dot)" }} aria-label="Failed" />,
  SKIPPED: <Circle size={18} style={{ color: "var(--line-strong)" }} aria-label="Skipped" />,
};
const SOURCE = { schedule: "Scheduled check", event: "Event hook", manual: "Run now", test: "Test" };

const Row = ({ label, children }) => (
  <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 12, fontSize: 14, padding: "6px 0" }}>
    <span style={{ color: "var(--text-3)" }}>{label}</span>
    <span>{children ?? "—"}</span>
  </div>
);

const pretty = (k) => k.replace(/_/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^\w/, (c) => c.toUpperCase());

export default function AutomationRunDetails() {
  const { id } = useParams();
  const nav = useNavigate();
  const { data: run, isLoading, isError } = useGetAutomationRunQuery(id);

  if (isLoading)
    return (
      <Page width="narrow">
        <PageHeader crumbs={autoCrumbs({ label: "Run log", to: "/automation/runs" }, { label: "Run" })} title="Run" subtitle="Loading…" />
      </Page>
    );
  if (isError || !run)
    return (
      <Page width="narrow">
        <PageHeader crumbs={autoCrumbs({ label: "Run log", to: "/automation/runs" }, { label: "Run" })} title="Run" />
        <Card>
          <EmptyState icon={Activity} title="Run not found" action={<Button onClick={() => nav("/automation/runs")}>Back to run log</Button>} />
        </Card>
      </Page>
    );

  const payload = Object.entries(run.payload || {}).filter(
    ([k, v]) => v !== null && v !== "" && !["entity_id", "project_id", "assigneeId", "entity_label"].includes(k),
  );

  return (
    <Page width="narrow">
      <PageHeader
        crumbs={autoCrumbs({ label: "Run log", to: "/automation/runs" }, { label: run.number })}
        title={run.rule || "Deleted rule"}
        subtitle={
          <span style={{ display: "inline-flex", gap: 10, alignItems: "center" }}>
            {run.number} · {run.entity} <RunStatus status={run.status} />
          </span>
        }
        actions={
          run.ruleId && (
            <Button variant="secondary" onClick={() => nav(`/automation/rules/${run.ruleId}/edit`)}>
              Open rule
            </Button>
          )
        }
      />

      {run.error && (
        <Card inset>
          <div style={{ color: "var(--bad-fg)", fontSize: 14 }}>
            <b>Error:</b> {run.error}
          </div>
        </Card>
      )}

      <Card title="Summary">
        <Row label="Trigger">{run.trigger}</Row>
        <Row label="Record">{run.entity}</Row>
        <Row label="Project">{run.project}</Row>
        <Row label="Started by">{SOURCE[run.source] || run.source}</Row>
        <Row label="When">{fmtWhen(run.startedAt)}</Row>
        <Row label="Duration">{run.durationMs != null ? `${run.durationMs} ms` : "—"}</Row>
      </Card>

      <Card title="Conditions" subtitle={run.conditions?.length ? "All must pass." : "No conditions — every matching record runs."}>
        {(run.conditions || []).map((c, i) => (
          <div key={i} style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 14, padding: "6px 0" }}>
            {c.passed ? ICON.SUCCESS : ICON.FAILED}
            {c.label}
          </div>
        ))}
      </Card>

      <Card title="Actions">
        {(run.actions || []).map((a, i) => (
          <div key={i} style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 14, padding: "6px 0" }}>
            {ICON[a.status] || ICON.SKIPPED}
            <span style={{ flex: 1 }}>{a.label}</span>
            {a.detail && !/^[0-9a-f-]{36}$/.test(a.detail) && <span style={{ color: "var(--text-3)", fontSize: 13 }}>{a.detail}</span>}
            <Pill size="sm" tone={a.status === "SUCCESS" ? "ok" : a.status === "FAILED" ? "bad" : "mute"}>
              {String(a.status).toLowerCase()}
            </Pill>
          </div>
        ))}
      </Card>

      {payload.length > 0 && (
        <Card title="Record data" subtitle="The values the conditions and messages used.">
          {payload.map(([k, v]) => (
            <Row key={k} label={pretty(k)}>
              {typeof v === "object" ? JSON.stringify(v) : String(v)}
            </Row>
          ))}
        </Card>
      )}
    </Page>
  );
}
