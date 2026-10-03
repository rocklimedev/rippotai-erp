import React, { useState } from "react";
import { Activity, X } from "lucide-react";

import { Page, PageHeader, Card, Button, Toolbar, ToolbarSpacer, SelectInput, TextInput, Pill, EmptyState, Avatar, prettyStatus } from "@/components/inos";
import { Skeleton } from "@/components/projects/_projects-ui";
import { useGetActivityLogByEntityLabelQuery } from "../../api/engagement/activity-logs.api";

const EMPTY = { user: "", action: "", date_from: "", date_to: "" };

export function ProjectActivity() {
  const [filters, setFilters] = useState(EMPTY);

  const { data: rows = [], isLoading } = useGetActivityLogByEntityLabelQuery({
    ...(filters.user && { user: filters.user }),
    ...(filters.action && { action: filters.action }),
    ...(filters.date_from && { date_from: filters.date_from }),
    ...(filters.date_to && { date_to: filters.date_to }),
  });

  // Two shapes arrive here: lead rows { text, lead: { name, owner, stage } }
  // and audit rows { action, entity_label, entity_type, user_email, changes, created_at }.
  const summariseChanges = (changes) => {
    try {
      const obj = typeof changes === "string" ? JSON.parse(changes) : changes;
      if (!obj || typeof obj !== "object") return null;
      return Object.entries(obj)
        .slice(0, 3)
        .map(([k, v]) => `${k.replace(/_/g, " ")}: ${typeof v === "object" ? JSON.stringify(v) : v}`)
        .join(" · ");
    } catch {
      return null;
    }
  };

  const activities = (Array.isArray(rows) ? rows : []).map((r) => ({
    id: r.id,
    createdAt: r.createdAt || r.created_at,
    user: r.lead?.owner || r.user_email || r.user_name || "System",
    action: r.text ? r.text.split(" ").slice(0, 3).join(" ") : r.action ? prettyStatus(r.action) : undefined,
    target: r.lead?.name || r.entity_label || "—",
    details: r.text || summariseChanges(r.changes) || (r.entity_type ? prettyStatus(String(r.entity_type).toLowerCase()) : "—"),
    stage: r.lead?.stage,
  }));

  const actions = Array.from(new Set(activities.map((r) => r.action).filter(Boolean)));
  const users = Array.from(new Set(activities.map((r) => r.user).filter(Boolean)));
  const set = (key, value) => setFilters((f) => ({ ...f, [key]: value }));
  const filtered = Object.values(filters).some(Boolean);

  return (
    <Page>
      <div data-testid="leads-activity-page" style={{ display: "contents" }}>
        <PageHeader
          crumbs={[{ label: "Projects", to: "/projects" }, { label: "Activity" }]}
          title="Activity"
          subtitle="Every recorded change — notes, stage changes, follow-ups, proposals and updates."
        />

        <Toolbar>
          <SelectInput value={filters.user} onChange={(e) => set("user", e.target.value)} aria-label="User" style={{ width: 180 }}>
            <option value="">All users</option>
            {users.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </SelectInput>
          <SelectInput value={filters.action} onChange={(e) => set("action", e.target.value)} aria-label="Action" style={{ width: 200 }}>
            <option value="">All actions</option>
            {actions.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </SelectInput>
          <TextInput type="date" value={filters.date_from} onChange={(e) => set("date_from", e.target.value)} aria-label="From date" style={{ width: 160 }} />
          <TextInput type="date" value={filters.date_to} onChange={(e) => set("date_to", e.target.value)} aria-label="To date" style={{ width: 160 }} />
          {filtered && (
            <Button variant="ghost" size="sm" icon={X} onClick={() => setFilters(EMPTY)}>
              Clear
            </Button>
          )}
          <ToolbarSpacer />
          {!isLoading && <span className="pj-muted" style={{ fontSize: 13 }}>{activities.length} entries</span>}
        </Toolbar>

        <Card flush>
          {isLoading ? (
            <div style={{ padding: 20, display: "grid", gap: 8 }}>
              <Skeleton height={44} />
              <Skeleton height={44} />
              <Skeleton height={44} />
            </div>
          ) : activities.length === 0 ? (
            <EmptyState
              icon={Activity}
              title={filtered ? "No activity matches" : "No activity yet"}
              text={filtered ? "Try widening the date range or clearing filters." : "Changes made across the workspace will be logged here."}
            />
          ) : (
            <div className="inos-table-wrap">
              <table className="inos-table">
                <thead>
                  <tr>
                    <th>When</th>
                    <th>User</th>
                    <th>Action</th>
                    <th>Record</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {activities.map((r) => (
                    <tr key={r.id}>
                      <td className="muted tabular" style={{ whiteSpace: "nowrap" }}>
                        {r.createdAt && !Number.isNaN(new Date(r.createdAt).getTime())
                          ? new Date(r.createdAt).toLocaleString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                          : "—"}
                      </td>
                      <td>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                          <Avatar name={r.user} size={26} />
                          {r.user}
                        </span>
                      </td>
                      <td>
                        <Pill tone="brand" dot={false} size="sm">
                          {r.action || "Update"}
                        </Pill>
                      </td>
                      <td style={{ fontWeight: 600 }}>{r.target}</td>
                      <td className="muted" style={{ maxWidth: 420 }}>
                        {r.details}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </Page>
  );
}

export default ProjectActivity;
