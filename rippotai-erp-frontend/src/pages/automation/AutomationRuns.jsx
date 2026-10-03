// Automation — run log: every time a rule matched a record and acted on it.
import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Activity, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Page, PageHeader, Card, Button, Stats, StatTile, EmptyState, Toolbar, ToolbarSpacer, SearchInput, Segmented, Pill } from "@/components/inos";
import { useGetAutomationRunsQuery } from "@/api/automation/automation.api";
import { autoCrumbs, RunStatus, fmtWhen } from "./_automation-ui";

const SOURCE = { schedule: "Scheduled", event: "Event", manual: "Run now", test: "Test" };

export default function AutomationRuns() {
  const nav = useNavigate();
  const [params, setParams] = useSearchParams();
  const status = params.get("status") || "ALL";
  const [q, setQ] = useState("");
  const { data: runs = [], isLoading, isError, refetch } = useGetAutomationRunsQuery({ status, search: q || undefined, limit: 300 });
  const { data: all = [] } = useGetAutomationRunsQuery({ limit: 500 });

  const setStatus = (v) => setParams(v === "ALL" ? {} : { status: v });
  const n = (st) => all.filter((r) => r.status === st).length;

  return (
    <Page>
      <PageHeader crumbs={autoCrumbs({ label: "Run log" })} title="Run log" subtitle="Each row is one rule acting on one record — what it checked and what it did." />

      <Stats>
        <StatTile label="Runs" value={all.length} icon={<Activity size={16} />} active={status === "ALL"} onClick={() => setStatus("ALL")} />
        <StatTile label="Succeeded" value={n("SUCCESS")} tone="ok" icon={<CheckCircle2 size={16} />} active={status === "SUCCESS"} onClick={() => setStatus("SUCCESS")} />
        <StatTile label="Failed" value={n("FAILED")} tone="bad" icon={<AlertTriangle size={16} />} active={status === "FAILED"} onClick={() => setStatus("FAILED")} />
      </Stats>

      <Toolbar>
        <SearchInput value={q} onChange={setQ} placeholder="Search rule, record or project" />
        <ToolbarSpacer />
        <Segmented
          value={status}
          onChange={setStatus}
          options={[
            { value: "ALL", label: "All" },
            { value: "SUCCESS", label: "Succeeded" },
            { value: "FAILED", label: "Failed" },
          ]}
        />
      </Toolbar>

      <Card flush title={`${runs.length} ${runs.length === 1 ? "run" : "runs"}`}>
        {isError ? (
          <EmptyState icon={Activity} title="Couldn't load the run log" action={<Button onClick={refetch}>Retry</Button>} />
        ) : isLoading ? (
          <div style={{ padding: 24, color: "var(--text-3)" }}>Loading…</div>
        ) : !runs.length ? (
          <EmptyState icon={Activity} title="No runs" text={q || status !== "ALL" ? "Nothing matches these filters." : "Runs appear here once an active rule matches something."} />
        ) : (
          <div className="inos-table-wrap">
            <table className="inos-table">
              <thead>
                <tr>
                  <th>Run</th>
                  <th>Rule</th>
                  <th>Record</th>
                  <th>Project</th>
                  <th>Source</th>
                  <th>Status</th>
                  <th>When</th>
                </tr>
              </thead>
              <tbody>
                {runs.map((r) => (
                  <tr key={r.id} className="is-clickable" onClick={() => nav(`/automation/runs/${r.id}`)}>
                    <td className="muted tabular">{r.number}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{r.rule}</div>
                      <div style={{ fontSize: 12, color: "var(--text-3)" }}>{r.trigger}</div>
                    </td>
                    <td>{r.entity}</td>
                    <td>{r.project || "—"}</td>
                    <td>
                      <Pill size="sm" dot={false}>
                        {SOURCE[r.source] || r.source}
                      </Pill>
                    </td>
                    <td>
                      <RunStatus status={r.status} />
                    </td>
                    <td className="muted">{fmtWhen(r.startedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </Page>
  );
}
