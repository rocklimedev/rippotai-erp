// Automation — overview: health, coverage by area, most active rules, latest runs.
import React from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Activity, AlertTriangle, CheckCircle2, GitBranch, PlayCircle, Plus, Zap } from "lucide-react";
import { Page, PageHeader, Card, Button, Stats, StatTile, EmptyState, Progress } from "@/components/inos";
import { useGetAutomationOverviewQuery, useRunAllAutomationMutation } from "@/api/automation/automation.api";
import { autoCrumbs, RunStatus, RuleStatus, fmtWhen, runSummary } from "./_automation-ui";

export default function AutomationOverview() {
  const nav = useNavigate();
  const { data, isLoading, isError, refetch } = useGetAutomationOverviewQuery();
  const [runAll, { isLoading: running }] = useRunAllAutomationMutation();
  const s = data?.stats || {};

  const onRunAll = async () => {
    try {
      const r = await runAll().unwrap();
      toast.success(`Rules evaluated — ${runSummary(r)}`);
    } catch (e) {
      toast.error(e?.data?.message || "Couldn't run the rules");
    }
  };

  const maxRuns = Math.max(1, ...(data?.phases || []).map((p) => p.runs));

  return (
    <Page>
      <PageHeader
        crumbs={autoCrumbs({ label: "Overview" })}
        title="Automation"
        subtitle={`Rules watch payments, site QC, RFIs and project progress, then notify, create tasks or escalate. Active rules run every ${data?.scheduleMinutes || 30} minutes and on key events.`}
        actions={
          <>
            <Button variant="secondary" icon={PlayCircle} loading={running} onClick={onRunAll}>
              Run all now
            </Button>
            <Button variant="primary" icon={Plus} onClick={() => nav("/automation/rules/new")}>
              New rule
            </Button>
          </>
        }
      />

      <Stats>
        <StatTile label="Active rules" value={isLoading ? "…" : s.activeRules} meta={s.draftRules ? `${s.draftRules} in draft` : null} icon={<GitBranch size={16} />} tone="brand" onClick={() => nav("/automation/rules")} />
        <StatTile label="Runs today" value={isLoading ? "…" : s.runsToday} meta={`${s.runs30d ?? 0} in 30 days`} icon={<Activity size={16} />} tone="info" onClick={() => nav("/automation/runs")} />
        <StatTile label="Failed (30 days)" value={isLoading ? "…" : s.failed30d} icon={<AlertTriangle size={16} />} tone="bad" onClick={() => nav("/automation/runs?status=FAILED")} />
        <StatTile label="Open escalations" value={isLoading ? "…" : s.openEscalations} meta={s.criticalEscalations ? `${s.criticalEscalations} critical` : null} icon={<Zap size={16} />} tone="peach" onClick={() => nav("/automation/escalations")} />
        <StatTile label="Success rate" value={s.successRate == null ? "—" : `${s.successRate}%`} meta="Last 30 days" icon={<CheckCircle2 size={16} />} tone="ok" />
      </Stats>

      {isError ? (
        <Card>
          <EmptyState icon={Zap} title="Couldn't load automation" action={<Button onClick={refetch}>Retry</Button>} />
        </Card>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
            <Card title="Coverage by area" subtitle="Rules per area and how often they have run.">
              {!data?.phases?.length ? (
                <EmptyState icon={GitBranch} title="No rules yet" />
              ) : (
                <div style={{ display: "grid", gap: 14 }}>
                  {data.phases.map((p) => (
                    <div key={p.phase} style={{ display: "grid", gap: 6 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                        <span style={{ fontWeight: 600 }}>{p.phase}</span>
                        <span className="tabular" style={{ color: "var(--text-3)" }}>
                          {p.active}/{p.rules} active · {p.runs} runs
                        </span>
                      </div>
                      <Progress value={(p.runs / maxRuns) * 100} />
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card title="Most active rules" flush>
              {!data?.topRules?.length ? (
                <EmptyState icon={GitBranch} title="No rules yet" />
              ) : (
                <table className="inos-table">
                  <tbody>
                    {data.topRules.map((r) => (
                      <tr key={r.id} className="is-clickable" onClick={() => nav(`/automation/rules/${r.id}/edit`)}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{r.name}</div>
                          <div style={{ fontSize: 12, color: "var(--text-3)" }}>{r.trigger}</div>
                        </td>
                        <td className="num">
                          <div style={{ fontWeight: 600 }}>{r.runs}</div>
                          <div style={{ fontSize: 12, color: "var(--text-3)" }}>{r.successRate == null ? "—" : `${r.successRate}% ok`}</div>
                        </td>
                        <td className="actions">
                          <RuleStatus status={r.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>
          </div>

          <Card
            title="Latest runs"
            flush
            actions={
              <Button variant="ghost" size="sm" onClick={() => nav("/automation/runs")}>
                View run log
              </Button>
            }
          >
            {!data?.recentRuns?.length ? (
              <EmptyState icon={Activity} title="No runs yet" text="Press “Run all now” to evaluate the active rules." />
            ) : (
              <div className="inos-table-wrap">
                <table className="inos-table">
                  <thead>
                    <tr>
                      <th>Rule</th>
                      <th>Record</th>
                      <th>Project</th>
                      <th>Status</th>
                      <th>When</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentRuns.map((r) => (
                      <tr key={r.id} className="is-clickable" onClick={() => nav(`/automation/runs/${r.id}`)}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{r.rule}</div>
                          <div style={{ fontSize: 12, color: "var(--text-3)" }}>{r.number}</div>
                        </td>
                        <td>{r.entity}</td>
                        <td>{r.project || "—"}</td>
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
        </>
      )}
    </Page>
  );
}
