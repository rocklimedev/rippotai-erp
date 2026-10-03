// Automation — rule registry: search/filter, run now, test, edit, duplicate, enable/disable, delete.
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Copy, GitBranch, Pencil, PlayCircle, Plus, Power, TestTube2, Trash2 } from "lucide-react";
import { Page, PageHeader, Card, Button, Stats, StatTile, EmptyState, Toolbar, ToolbarSpacer, SearchInput, Segmented } from "@/components/inos";
import { RowMenu } from "@/pages/settings/_admin-ui";
import {
  useGetAutomationRulesQuery,
  useToggleAutomationRuleMutation,
  useDuplicateAutomationRuleMutation,
  useDeleteAutomationRuleMutation,
  useRunAutomationRuleMutation,
} from "@/api/automation/automation.api";
import { autoCrumbs, RuleStatus, actionText, ago, runSummary } from "./_automation-ui";

export default function AutomationRules() {
  const nav = useNavigate();
  const { data: rules = [], isLoading, isError, refetch } = useGetAutomationRulesQuery();
  const [toggle] = useToggleAutomationRuleMutation();
  const [duplicate] = useDuplicateAutomationRuleMutation();
  const [remove] = useDeleteAutomationRuleMutation();
  const [run] = useRunAutomationRuleMutation();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("ALL");
  const [busy, setBusy] = useState(null);

  const shown = useMemo(() => {
    const s = q.trim().toLowerCase();
    return rules.filter(
      (r) =>
        (status === "ALL" || r.status === status) &&
        (!s || [r.name, r.description, r.trigger, r.phase].some((x) => String(x || "").toLowerCase().includes(s))),
    );
  }, [rules, q, status]);

  const count = (st) => rules.filter((r) => r.status === st).length;

  const act = async (id, fn, ok) => {
    setBusy(id);
    try {
      const res = await fn();
      if (ok) toast.success(typeof ok === "function" ? ok(res) : ok);
      return res;
    } catch (e) {
      toast.error(e?.data?.message || "Something went wrong");
    } finally {
      setBusy(null);
    }
  };

  return (
    <Page>
      <PageHeader
        crumbs={autoCrumbs({ label: "Rules" })}
        title="Rules"
        subtitle="Every automation: what triggers it, the conditions it checks and what it does."
        actions={
          <Button variant="primary" icon={Plus} onClick={() => nav("/automation/rules/new")}>
            New rule
          </Button>
        }
      />

      <Stats>
        <StatTile label="All rules" value={rules.length} icon={<GitBranch size={16} />} onClick={() => setStatus("ALL")} active={status === "ALL"} />
        <StatTile label="Active" value={count("ACTIVE")} tone="ok" icon={<Power size={16} />} onClick={() => setStatus("ACTIVE")} active={status === "ACTIVE"} />
        <StatTile label="Draft" value={count("DRAFT")} tone="warn" icon={<Pencil size={16} />} onClick={() => setStatus("DRAFT")} active={status === "DRAFT"} />
        <StatTile label="Disabled" value={count("DISABLED")} icon={<Power size={16} />} onClick={() => setStatus("DISABLED")} active={status === "DISABLED"} />
      </Stats>

      <Toolbar>
        <SearchInput value={q} onChange={setQ} placeholder="Search rules, triggers, areas" />
        <ToolbarSpacer />
        <Segmented
          value={status}
          onChange={setStatus}
          options={[
            { value: "ALL", label: "All" },
            { value: "ACTIVE", label: "Active" },
            { value: "DRAFT", label: "Draft" },
            { value: "DISABLED", label: "Disabled" },
          ]}
        />
      </Toolbar>

      <Card flush title={`${shown.length} ${shown.length === 1 ? "rule" : "rules"}`}>
        {isError ? (
          <EmptyState icon={GitBranch} title="Couldn't load rules" action={<Button onClick={refetch}>Retry</Button>} />
        ) : isLoading ? (
          <div style={{ padding: 24, color: "var(--text-3)" }}>Loading…</div>
        ) : !shown.length ? (
          <EmptyState
            icon={GitBranch}
            title={rules.length ? "No rules match" : "No rules yet"}
            text={rules.length ? "Clear the search or pick another status." : "Create a rule to start automating follow-ups."}
            action={!rules.length && <Button variant="primary" icon={Plus} onClick={() => nav("/automation/rules/new")}>New rule</Button>}
          />
        ) : (
          <div className="inos-table-wrap">
            <table className="inos-table">
              <thead>
                <tr>
                  <th>Rule</th>
                  <th>Trigger</th>
                  <th>Does</th>
                  <th className="num">Runs</th>
                  <th>Last run</th>
                  <th>Status</th>
                  <th className="actions" aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {shown.map((r) => (
                  <tr key={r.id} className="is-clickable" onClick={() => nav(`/automation/rules/${r.id}/edit`)}>
                    <td style={{ maxWidth: 320 }}>
                      <div style={{ fontWeight: 600 }}>{r.name}</div>
                      <div style={{ fontSize: 12, color: "var(--text-3)", lineHeight: 1.45 }}>{r.description}</div>
                    </td>
                    <td>
                      <div>{r.trigger}</div>
                      <div style={{ fontSize: 12, color: "var(--text-3)" }}>
                        {r.phase}
                        {r.conditions?.length ? ` · ${r.conditions.length} ${r.conditions.length === 1 ? "condition" : "conditions"}` : ""}
                      </div>
                    </td>
                    <td style={{ fontSize: 13 }}>
                      {(r.actions || []).map((a, i) => (
                        <div key={i}>{actionText(a)}</div>
                      ))}
                    </td>
                    <td className="num">
                      <div style={{ fontWeight: 600 }}>{r.runs}</div>
                      {r.failed > 0 && <div style={{ fontSize: 12, color: "var(--bad-fg)" }}>{r.failed} failed</div>}
                    </td>
                    <td className="muted">{ago(r.lastRunAt)}</td>
                    <td>
                      <RuleStatus status={r.status} />
                    </td>
                    <td className="actions" onClick={(e) => e.stopPropagation()}>
                      <RowMenu
                        busy={busy === r.id}
                        items={[
                          {
                            label: "Run now",
                            icon: PlayCircle,
                            disabled: r.status !== "ACTIVE",
                            onClick: () => act(r.id, () => run({ id: r.id }).unwrap(), (res) => `${r.name}: ${runSummary(res)}`),
                          },
                          {
                            label: "Test (no changes)",
                            icon: TestTube2,
                            onClick: () =>
                              act(r.id, () => run({ id: r.id, dryRun: true }).unwrap(), (res) => `Test: ${res.candidates} records checked, ${res.matched} would match`),
                          },
                          { label: "Edit", icon: Pencil, onClick: () => nav(`/automation/rules/${r.id}/edit`) },
                          { label: "Duplicate", icon: Copy, onClick: () => act(r.id, () => duplicate(r.id).unwrap(), "Copy created as a draft") },
                          {
                            label: r.status === "ACTIVE" ? "Disable" : "Enable",
                            icon: Power,
                            onClick: () => act(r.id, () => toggle(r.id).unwrap(), r.status === "ACTIVE" ? "Rule disabled" : "Rule enabled"),
                          },
                          {
                            label: "Delete",
                            icon: Trash2,
                            danger: true,
                            onClick: () => window.confirm(`Delete “${r.name}”? Its run history is kept.`) && act(r.id, () => remove(r.id).unwrap(), "Rule deleted"),
                          },
                        ]}
                      />
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
