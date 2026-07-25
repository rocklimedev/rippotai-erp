import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { ShieldCheck, Activity } from "lucide-react";
import { useGetActivityLogsQuery } from "../../api/activity-logs.api";
import { fmtDateTime } from "../../lib/settings.utils";

export default function SuperAdmin() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "ADMIN";

  const [logFilters, setLogFilters] = useState({
    user_id: "",
    action: "",
    entity_type: "",
    entity_id: "",
  });

  const {
    data: activityLogs = [],
    isFetching: loadingLogs,
    refetch: refetchLogs,
  } = useGetActivityLogsQuery(logFilters, { skip: !isSuperAdmin });

  const onLogFilterChange = (e) => {
    setLogFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const clearLogFilters = () =>
    setLogFilters({ user_id: "", action: "", entity_type: "", entity_id: "" });

  // `changes` is an object like { name: "...", email: "...", is_active: true, ... }
  // Render it as a compact "key: value" list instead of raw JSON.
  const formatChanges = (changes) => {
    if (!changes || typeof changes !== "object") return "—";
    const entries = Object.entries(changes).filter(([, v]) => v !== null);
    if (entries.length === 0) return "—";
    return entries
      .map(
        ([key, value]) =>
          `${key}: ${typeof value === "boolean" ? (value ? "true" : "false") : value}`,
      )
      .join(", ");
  };

  if (!isSuperAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <ShieldCheck size={28} className="text-[#1F453B] mb-4" />
        <div className="text-xl font-semibold mb-2">
          Super Admin Access Required
        </div>
        <p className="text-[#6B7B7C]">
          This console is restricted to super administrators.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Activity size={22} style={{ color: "#1F453B" }} />
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#333333" }}>
            Activity Logs
          </h1>
          <p className="text-sm text-[#6B7B7C]">
            Audit trail of actions taken across the workspace.
          </p>
        </div>
      </div>

      <div className="bg-white border border-[#E8EAF0] rounded-2xl p-4 mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <input
            name="user_id"
            value={logFilters.user_id}
            onChange={onLogFilterChange}
            placeholder="User ID"
            className="h-9 px-3 rounded-lg border border-[#DDD8CE] bg-[#FAF8F5] text-sm"
          />
          <input
            name="action"
            value={logFilters.action}
            onChange={onLogFilterChange}
            placeholder="Action (e.g. update)"
            className="h-9 px-3 rounded-lg border border-[#DDD8CE] bg-[#FAF8F5] text-sm"
          />
          <input
            name="entity_type"
            value={logFilters.entity_type}
            onChange={onLogFilterChange}
            placeholder="Entity type"
            className="h-9 px-3 rounded-lg border border-[#DDD8CE] bg-[#FAF8F5] text-sm"
          />
          <input
            name="entity_id"
            value={logFilters.entity_id}
            onChange={onLogFilterChange}
            placeholder="Entity ID"
            className="h-9 px-3 rounded-lg border border-[#DDD8CE] bg-[#FAF8F5] text-sm"
          />
        </div>
        <div className="flex justify-end gap-2 mt-3">
          <button
            onClick={clearLogFilters}
            className="h-9 px-4 rounded-lg border border-[#DDD8CE] text-sm font-semibold text-[#333333] hover:bg-[#F7F7F5]"
          >
            Clear
          </button>
          <button
            onClick={() => refetchLogs()}
            className="h-9 px-4 rounded-lg text-white text-sm font-semibold"
            style={{ backgroundColor: "#1F453B" }}
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="bg-white border border-[#E8EAF0] rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#F7F7F5] text-xs uppercase tracking-widest text-[#6B7B7C]">
            <tr>
              <th className="text-left px-4 py-3">When</th>
              <th className="text-left px-4 py-3">Actor</th>
              <th className="text-left px-4 py-3">Action</th>
              <th className="text-left px-4 py-3">Entity</th>
              <th className="text-left px-4 py-3">Changes</th>
            </tr>
          </thead>
          <tbody>
            {loadingLogs ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-[#6B7B7C]">
                  Loading…
                </td>
              </tr>
            ) : activityLogs.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-[#6B7B7C]">
                  No activity found.
                </td>
              </tr>
            ) : (
              activityLogs.map((log) => (
                <tr
                  key={log.id}
                  className="border-t border-[#E8EAF0] align-top"
                >
                  <td className="px-4 py-3 text-xs text-[#6B7B7C] whitespace-nowrap">
                    {fmtDateTime(log.created_at)}
                  </td>
                  <td className="px-4 py-3 text-[#333333]">
                    <div>{log.user_email || "—"}</div>
                    {log.user_role && (
                      <div className="text-xs text-[#6B7B7C] uppercase tracking-wide">
                        {log.user_role}
                      </div>
                    )}
                    {log.ip_address && (
                      <div className="text-xs text-[#6B7B7C]">
                        {log.ip_address}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 rounded-full text-xs font-semibold bg-[#EAF0EC] text-[#1F453B]">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#333333]">
                    <div>{log.entity_type}</div>
                    <div className="text-xs text-[#6B7B7C]">
                      {log.entity_label || log.entity_id || "—"}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[#6B7B7C] max-w-[320px]">
                    {formatChanges(log.changes)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
