// Automation — audit trail: who created, changed, enabled, ran or resolved what.
import React, { useMemo, useState } from "react";
import { History } from "lucide-react";
import { Page, PageHeader, Card, Button, EmptyState, Toolbar, SearchInput, Pill, Avatar } from "@/components/inos";
import { useGetAutomationAuditQuery } from "@/api/automation/automation.api";
import { autoCrumbs, fmtWhen } from "./_automation-ui";

const ACTION = {
  CREATED_RULE: ["Created rule", "ok"],
  UPDATED_RULE: ["Edited rule", "info"],
  ENABLED_RULE: ["Enabled rule", "ok"],
  DISABLED_RULE: ["Disabled rule", "mute"],
  DELETED_RULE: ["Deleted rule", "bad"],
  RAN_RULE: ["Ran rule", "lilac"],
  RAN_ALL: ["Ran all rules", "lilac"],
  UPDATED_ESCALATION: ["Updated escalation", "warn"],
  RESOLVED_ESCALATION: ["Resolved escalation", "ok"],
};

export default function AutomationAudit() {
  const { data: rows = [], isLoading, isError, refetch } = useGetAutomationAuditQuery();
  const [q, setQ] = useState("");
  const shown = useMemo(() => {
    const s = q.trim().toLowerCase();
    return s ? rows.filter((r) => [r.user, r.target, r.description, r.action].some((x) => String(x || "").toLowerCase().includes(s))) : rows;
  }, [rows, q]);

  return (
    <Page>
      <PageHeader crumbs={autoCrumbs({ label: "Audit trail" })} title="Audit trail" subtitle="Every change to rules and escalations, and every manual run." />
      <Toolbar>
        <SearchInput value={q} onChange={setQ} placeholder="Search person, rule or change" />
      </Toolbar>
      <Card flush title={`${shown.length} ${shown.length === 1 ? "entry" : "entries"}`}>
        {isError ? (
          <EmptyState icon={History} title="Couldn't load the audit trail" action={<Button onClick={refetch}>Retry</Button>} />
        ) : isLoading ? (
          <div style={{ padding: 24, color: "var(--text-3)" }}>Loading…</div>
        ) : !shown.length ? (
          <EmptyState icon={History} title="Nothing recorded yet" />
        ) : (
          <div className="inos-table-wrap">
            <table className="inos-table">
              <thead>
                <tr>
                  <th>Who</th>
                  <th>What</th>
                  <th>Rule / item</th>
                  <th>Details</th>
                  <th>When</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((r) => {
                  const [label, tone] = ACTION[r.action] || [r.action, "mute"];
                  return (
                    <tr key={r.id}>
                      <td>
                        <span style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
                          <Avatar name={r.user} size={26} />
                          {r.user}
                        </span>
                      </td>
                      <td>
                        <Pill tone={tone} size="sm">
                          {label}
                        </Pill>
                      </td>
                      <td style={{ fontSize: 13 }}>{String(r.target || "").replace(/_/g, " ")}</td>
                      <td style={{ fontSize: 13, color: "var(--text-2)", maxWidth: 420 }}>{r.description}</td>
                      <td className="muted">{fmtWhen(r.timestamp)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </Page>
  );
}
