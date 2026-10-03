// Automation — escalations opened by rules; acknowledge or resolve them.
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle2, Eye, ShieldAlert } from "lucide-react";
import { Page, PageHeader, Card, Button, Stats, StatTile, EmptyState, Toolbar, ToolbarSpacer, Segmented } from "@/components/inos";
import { useGetAutomationEscalationsQuery, useUpdateAutomationEscalationMutation } from "@/api/automation/automation.api";
import { autoCrumbs, EscStatus, PriorityPill, hoursText, fmtWhen } from "./_automation-ui";

export default function AutomationEscalations() {
  const nav = useNavigate();
  const [status, setStatus] = useState("ACTIVE");
  const { data: all = [], isLoading, isError, refetch } = useGetAutomationEscalationsQuery();
  const [update] = useUpdateAutomationEscalationMutation();
  const [busy, setBusy] = useState(null);

  const shown = all.filter((e) => (status === "ACTIVE" ? e.status !== "RESOLVED" : status === "ALL" || e.status === status));
  const open = all.filter((e) => e.status === "OPEN");

  const set = async (e, next) => {
    let notes;
    if (next === "RESOLVED") {
      notes = window.prompt("How was it resolved? (optional)") ?? undefined;
      if (notes === undefined) return;
    }
    setBusy(e.id);
    try {
      await update({ id: e.id, status: next, notes: notes || undefined }).unwrap();
      toast.success(next === "RESOLVED" ? "Escalation resolved" : "Escalation acknowledged");
    } catch (err) {
      toast.error(err?.data?.message || "Couldn't update the escalation");
    } finally {
      setBusy(null);
    }
  };

  return (
    <Page>
      <PageHeader
        crumbs={autoCrumbs({ label: "Escalations" })}
        title="Escalations"
        subtitle="Raised by rules when something needs a person's attention. A repeat match raises the level instead of opening a duplicate."
      />

      <Stats>
        <StatTile label="Open" value={open.length} tone="bad" icon={<AlertTriangle size={16} />} />
        <StatTile label="Critical" value={open.filter((e) => e.priority === "CRITICAL").length} tone="peach" icon={<ShieldAlert size={16} />} />
        <StatTile label="Acknowledged" value={all.filter((e) => e.status === "ACKNOWLEDGED").length} tone="warn" icon={<Eye size={16} />} />
        <StatTile label="Resolved" value={all.filter((e) => e.status === "RESOLVED").length} tone="ok" icon={<CheckCircle2 size={16} />} />
      </Stats>

      <Toolbar>
        <ToolbarSpacer />
        <Segmented
          value={status}
          onChange={setStatus}
          options={[
            { value: "ACTIVE", label: "Needs action" },
            { value: "RESOLVED", label: "Resolved" },
            { value: "ALL", label: "All" },
          ]}
        />
      </Toolbar>

      <Card flush title={`${shown.length} ${shown.length === 1 ? "escalation" : "escalations"}`}>
        {isError ? (
          <EmptyState icon={AlertTriangle} title="Couldn't load escalations" action={<Button onClick={refetch}>Retry</Button>} />
        ) : isLoading ? (
          <div style={{ padding: 24, color: "var(--text-3)" }}>Loading…</div>
        ) : !shown.length ? (
          <EmptyState icon={CheckCircle2} title={status === "ACTIVE" ? "Nothing needs attention" : "No escalations"} />
        ) : (
          <div className="inos-table-wrap">
            <table className="inos-table">
              <thead>
                <tr>
                  <th>Escalation</th>
                  <th>Project</th>
                  <th>Priority</th>
                  <th className="num">Level</th>
                  <th>With</th>
                  <th>Age</th>
                  <th>Status</th>
                  <th className="actions" aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {shown.map((e) => (
                  <tr key={e.id}>
                    <td style={{ maxWidth: 360 }}>
                      <div style={{ fontWeight: 600 }}>{e.title}</div>
                      <div style={{ fontSize: 12, color: "var(--text-3)" }}>
                        {e.rule ? (
                          <button type="button" className="inos-link" onClick={() => e.runId && nav(`/automation/runs/${e.runId}`)} style={{ all: "unset", cursor: "pointer", textDecoration: "underline" }}>
                            {e.rule}
                          </button>
                        ) : (
                          "Rule deleted"
                        )}
                        {" · opened "}
                        {fmtWhen(e.openedAt, { time: false })}
                      </div>
                      {e.notes && <div style={{ fontSize: 12, color: "var(--text-2)" }}>{e.notes}</div>}
                    </td>
                    <td>{e.project || "—"}</td>
                    <td>
                      <PriorityPill priority={e.priority} />
                    </td>
                    <td className="num">{e.level}</td>
                    <td>{e.assignedTo || "—"}</td>
                    <td className="muted">{hoursText(e.ageHours)}</td>
                    <td>
                      <EscStatus status={e.status} />
                    </td>
                    <td className="actions">
                      {e.status === "OPEN" && (
                        <Button variant="ghost" size="sm" disabled={busy === e.id} onClick={() => set(e, "ACKNOWLEDGED")}>
                          Acknowledge
                        </Button>
                      )}
                      {e.status !== "RESOLVED" && (
                        <Button variant="soft" size="sm" disabled={busy === e.id} onClick={() => set(e, "RESOLVED")}>
                          Resolve
                        </Button>
                      )}
                    </td>
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
