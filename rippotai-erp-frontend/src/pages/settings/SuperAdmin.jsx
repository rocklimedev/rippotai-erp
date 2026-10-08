import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Activity, RefreshCw, SearchX, ShieldCheck, X } from "lucide-react";
import {
  Page,
  PageHeader,
  Card,
  Button,
  Field,
  TextInput,
  Pill,
  Avatar,
} from "@/components/inos";
import { useGetActivityLogsQuery } from "../../api/engagement/activity-logs.api";
import { fmtDateTime } from "../../lib/settings.utils";
import {
  AdminAccessDenied,
  SkeletonRows,
  TableEmpty,
  actionTone,
  adminCrumbs,
  changeEntries,
  fmtValue,
  humanize,
  plural,
} from "./_admin-ui";

export default function SuperAdmin() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "ADMIN" || user?.role === "SUPERADMIN";
  const [logFilters, setLogFilters] = useState({
    user_id: "",
    action: "",
    entity_type: "",
    entity_id: "",
  });

  const {
    data: activityLogs = [],
    isFetching: loadingLogs,
    isError,
    refetch: refetchLogs,
  } = useGetActivityLogsQuery(logFilters, { skip: !isSuperAdmin });

  const onLogFilterChange = (e) => {
    setLogFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const clearLogFilters = () =>
    setLogFilters({ user_id: "", action: "", entity_type: "", entity_id: "" });

  const hasFilters = Object.values(logFilters).some(Boolean);
  const logs = Array.isArray(activityLogs) ? activityLogs : [];

  if (!isSuperAdmin) {
    return (
      <AdminAccessDenied
        crumb="Super admin"
        title="Super admin access required"
        text="This console is restricted to super administrators."
      />
    );
  }

  return (
    <Page>
      <PageHeader
        crumbs={adminCrumbs("Super admin")}
        title="Activity log"
        subtitle="An audit trail of every change made across the workspace — who did what, and when."
        actions={
          <Button
            variant="secondary"
            icon={RefreshCw}
            onClick={() => refetchLogs()}
            disabled={loadingLogs}
          >
            {loadingLogs ? "Refreshing…" : "Refresh"}
          </Button>
        }
      />

      <Card>
        <div className="adm-filters">
          <Field label="Action" htmlFor="f-action">
            <TextInput
              id="f-action"
              name="action"
              value={logFilters.action}
              onChange={onLogFilterChange}
              placeholder="e.g. vendor_created"
            />
          </Field>
          <Field label="Entity type" htmlFor="f-etype">
            <TextInput
              id="f-etype"
              name="entity_type"
              value={logFilters.entity_type}
              onChange={onLogFilterChange}
              placeholder="e.g. VENDOR"
            />
          </Field>
          <Field label="Entity ID" htmlFor="f-eid">
            <TextInput
              id="f-eid"
              name="entity_id"
              value={logFilters.entity_id}
              onChange={onLogFilterChange}
              placeholder="Paste a record ID"
            />
          </Field>
          <Field label="User ID" htmlFor="f-uid">
            <TextInput
              id="f-uid"
              name="user_id"
              value={logFilters.user_id}
              onChange={onLogFilterChange}
              placeholder="Paste a user ID"
            />
          </Field>
          <div style={{ display: "flex", gap: 8 }}>
            <Button
              variant="ghost"
              icon={X}
              onClick={clearLogFilters}
              disabled={!hasFilters}
              style={{ height: 40 }}
            >
              Clear
            </Button>
          </div>
        </div>
      </Card>

      <Card flush>
        <div className="inos-table-wrap">
          <table className="inos-table">
            <thead>
              <tr>
                <th>When</th>
                <th>Actor</th>
                <th>Action</th>
                <th>Record</th>
                <th className="adm-hide-sm">Changes</th>
              </tr>
            </thead>
            <tbody>
              {loadingLogs && logs.length === 0 ? (
                <SkeletonRows cols={5} rows={4} />
              ) : logs.length === 0 ? (
                <TableEmpty
                  cols={5}
                  icon={hasFilters ? SearchX : isError ? ShieldCheck : Activity}
                  title={
                    hasFilters
                      ? "No activity matches these filters"
                      : isError
                        ? "Couldn't load the activity log"
                        : "No activity yet"
                  }
                  text={
                    hasFilters
                      ? "Clear a filter or try a broader value."
                      : isError
                        ? "The activity service didn't respond. Try refreshing."
                        : "Changes made by your team will appear here."
                  }
                  action={
                    hasFilters && (
                      <Button variant="soft" icon={X} onClick={clearLogFilters}>
                        Clear filters
                      </Button>
                    )
                  }
                />
              ) : (
                logs.map((log) => {
                  const entries = changeEntries(log.changes);
                  return (
                    <tr key={log.id} style={{ verticalAlign: "top" }}>
                      <td
                        className="adm-cell-2 tabular"
                        style={{ whiteSpace: "nowrap", fontSize: 13 }}
                      >
                        {fmtDateTime(log.created_at)}
                      </td>
                      <td>
                        <div className="adm-cell-main">
                          <Avatar name={log.user_email || "?"} size={30} />
                          <div style={{ minWidth: 0 }}>
                            <div
                              className="adm-cell-title"
                              style={{ fontWeight: 550 }}
                            >
                              {log.user_email || "System"}
                            </div>
                            <div className="adm-cell-sub">
                              {[
                                log.user_role && humanize(log.user_role),
                                log.ip_address,
                              ]
                                .filter(Boolean)
                                .join(" · ") || "—"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <Pill tone={actionTone(log.action)}>
                          {humanize(log.action)}
                        </Pill>
                      </td>
                      <td>
                        <div
                          className="adm-cell-title"
                          style={{ fontWeight: 550 }}
                        >
                          {log.entity_label || log.entity_id || "—"}
                        </div>
                        <div className="adm-cell-sub">
                          {humanize(log.entity_type) || "—"}
                        </div>
                      </td>
                      <td className="adm-hide-sm" style={{ maxWidth: 380 }}>
                        {entries.length === 0 ? (
                          <span className="muted">—</span>
                        ) : (
                          <div
                            style={{
                              display: "flex",
                              flexWrap: "wrap",
                              gap: 6,
                            }}
                          >
                            {entries.slice(0, 4).map(([k, v]) => (
                              <span
                                key={k}
                                className="adm-code"
                                title={`${k}: ${fmtValue(v)}`}
                                style={{
                                  maxWidth: 260,
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                }}
                              >
                                {k ? `${humanize(k)}: ` : ""}
                                {fmtValue(v)}
                              </span>
                            ))}
                            {entries.length > 4 && (
                              <span className="adm-cell-sub">
                                +{entries.length - 4} more
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {logs.length > 0 && (
          <div className="adm-table-foot">{plural(logs.length, "event")}</div>
        )}
      </Card>
    </Page>
  );
}
