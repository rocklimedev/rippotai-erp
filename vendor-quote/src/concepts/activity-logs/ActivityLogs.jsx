import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatDateTime } from "../../utils/helpers";
import { ClipboardList, ChevronLeft, ChevronRight } from "lucide-react";
import { useGetActivityLogsQuery } from "../../api/activity-logs.api";
import ActivityDetailsModal, {
  ACTION_COLORS,
  formatActionLabel,
} from "../../components/activity-logs/ActivityDetailsModal";

export default function ActivityLogs() {
  const navigate = useNavigate();

  const [page, setPage] = useState(1);
  const [entityType, setEntityType] = useState("");
  const [selectedLog, setSelectedLog] = useState(null);

  const limit = 30;

  const { data, isLoading, isFetching } = useGetActivityLogsQuery({
    entity_type: entityType || undefined,
  });

  // ⚠️ backend currently doesn't handle pagination via RTK query
  // so we fallback to slicing OR extend API later
  const logs = data || [];
  const total = data?.total || 0;

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-[#333333]" />
          <h1 className="text-2xl font-bold text-[#333333]">Activity Logs</h1>
        </div>
        <div className="text-sm text-gray-400">{total} total records</div>
      </div>

      {/* Filter */}
      <div className="flex gap-3 mb-4">
        <select
          value={entityType}
          onChange={(e) => {
            setEntityType(e.target.value);
            setPage(1);
          }}
          className="py-2 px-3 text-sm border border-[#E5E7EB] rounded-md focus:outline-none focus:border-[#1A3C34] text-gray-600"
        >
          <option value="">All Activities</option>
          <option value="quotation">Quotations</option>
          <option value="project">Projects</option>
          <option value="vendor">Vendors</option>
          <option value="settings">Settings</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden">
        {isLoading || isFetching ? (
          <div className="px-4 py-8 text-center text-sm text-gray-400">
            Loading...
          </div>
        ) : logs.length === 0 ? (
          <div className="px-4 py-12 text-center text-sm text-gray-400">
            No activity logs
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
              <tr>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">
                  Action
                </th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">
                  User
                </th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">
                  Entity
                </th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">
                  Details
                </th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">
                  Date & Time
                </th>
              </tr>
            </thead>

            <tbody>
              {logs.map((log) => {
                const actionLabel = formatActionLabel(log.action);
                const actionColor =
                  ACTION_COLORS[actionLabel] || "bg-gray-100 text-gray-600";

                return (
                  <tr
                    key={log.id}
                    className="border-b border-[#F3F4F6] hover:bg-gray-50"
                  >
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${actionColor}`}
                      >
                        {actionLabel}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <div className="text-[#333333] font-medium">
                        {log.user_email}
                      </div>
                      <div className="text-xs text-gray-400 capitalize">
                        {log.user_role}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="text-gray-600 capitalize">
                        {log.entity_type}
                      </div>

                      {log.entity_id &&
                        log.entity_type?.toLowerCase() === "quotation" && (
                          <button
                            onClick={() =>
                              navigate(`/quotations/${log.entity_id}`)
                            }
                            className="text-xs text-[#1A3C34] hover:underline"
                          >
                            View
                          </button>
                        )}
                    </td>

                    <td className="px-4 py-3 text-xs">
                      {log.changes ? (
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="text-[#1A3C34] hover:underline font-medium"
                        >
                          View Details
                        </button>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {formatDateTime(log.created_at)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* Pagination (still local for now) */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-[#E5E7EB] flex items-center justify-between">
            <span className="text-xs text-gray-500">
              Page {page} of {totalPages}
            </span>

            <div className="flex gap-1">
              <button
                onClick={() => setPage((p) => p - 1)}
                disabled={page === 1}
                className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= totalPages}
                className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <ActivityDetailsModal
        log={selectedLog}
        onClose={() => setSelectedLog(null)}
      />
    </div>
  );
}
