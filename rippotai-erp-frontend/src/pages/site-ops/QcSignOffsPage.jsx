import React, { useMemo, useState } from "react";
import {
  ClipboardCheck,
  Search,
  Filter,
  Plus,
  Eye,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Clock3,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";

import {
  useGetQcProjectHistoryQuery,
  useGetQcHandoffStatusQuery,
} from "@/api/site-ops.api";

const STATUS_META = {
  PASS: {
    label: "Passed",
    icon: CheckCircle2,
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  FAIL: {
    label: "Failed",
    icon: XCircle,
    className: "bg-red-50 text-red-700 border-red-200",
  },
  REWORK: {
    label: "Rework",
    icon: RotateCcw,
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
};

const formatDate = (value) => {
  if (!value) return "—";

  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (value) => {
  if (!value) return "—";

  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

function StatusBadge({ status }) {
  const meta = STATUS_META[status] || {
    label: status || "Unknown",
    icon: Clock3,
    className: "bg-slate-50 text-slate-700 border-slate-200",
  };

  const Icon = meta.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${meta.className}`}
    >
      <Icon size={13} />
      {meta.label}
    </span>
  );
}

function StatCard({ icon: Icon, label, value, description }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
            {value}
          </p>
          {description && (
            <p className="mt-1 text-xs text-slate-400">{description}</p>
          )}
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1F453B]/10 text-[#1F453B]">
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

export default function QcSignOffsPage() {
  const [projectId, setProjectId] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedQc, setSelectedQc] = useState(null);

  const {
    data: historyResponse,
    isLoading,
    isFetching,
    refetch,
  } = useGetQcProjectHistoryQuery(projectId, {
    skip: !projectId,
  });

  const { data: handoffResponse } = useGetQcHandoffStatusQuery(projectId, {
    skip: !projectId,
  });

  const history = useMemo(() => {
    if (Array.isArray(historyResponse)) return historyResponse;

    return (
      historyResponse?.data ||
      historyResponse?.history ||
      historyResponse?.items ||
      []
    );
  }, [historyResponse]);

  const handoffStatus = useMemo(() => {
    if (Array.isArray(handoffResponse)) return handoffResponse;

    return (
      handoffResponse?.data ||
      handoffResponse?.items ||
      handoffResponse?.handoffs ||
      []
    );
  }, [handoffResponse]);

  const filteredHistory = useMemo(() => {
    return history.filter((item) => {
      const matchesStatus =
        statusFilter === "ALL" || item.result === statusFilter;

      const searchValue = search.trim().toLowerCase();

      if (!searchValue) return matchesStatus;

      const haystack = [
        item.id,
        item.result,
        item.checkedBy,
        item.tradeTeam?.name,
        item.tradeTeamName,
        item.step?.name,
        item.stepName,
        item.checklistTemplate?.name,
        item.checklistTemplateName,
        item.notes,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return matchesStatus && haystack.includes(searchValue);
    });
  }, [history, search, statusFilter]);

  const stats = useMemo(() => {
    const total = history.length;

    return {
      total,
      passed: history.filter((x) => x.result === "PASS").length,
      failed: history.filter((x) => x.result === "FAIL").length,
      rework: history.filter((x) => x.result === "REWORK").length,
    };
  }, [history]);

  return (
    <div className="min-h-screen bg-[#F7F8F7] px-6 py-6 lg:px-8">
      {/* Header */}
      <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
            <ShieldCheck size={16} className="text-[#1F453B]" />
            Site Operations
            <span>/</span>
            QC Sign-Offs
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            QC Sign-Offs
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Review quality checks, rework cycles, and trade handoffs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            disabled={!projectId || isFetching}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw size={16} className={isFetching ? "animate-spin" : ""} />
            Refresh
          </button>

          <button className="inline-flex items-center gap-2 rounded-xl bg-[#1F453B] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-[#17372F]">
            <Plus size={17} />
            New QC Sign-Off
          </button>
        </div>
      </div>

      {/* Project selector */}
      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="flex flex-1 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1F453B]/10 text-[#1F453B]">
              <ClipboardCheck size={19} />
            </div>

            <div>
              <p className="text-sm font-medium text-slate-900">
                Project QC History
              </p>
              <p className="text-xs text-slate-500">
                Enter a project ID to load its QC records.
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <input
              type="number"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              placeholder="Project ID"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-[#1F453B] focus:ring-2 focus:ring-[#1F453B]/10 lg:w-48"
            />
          </div>
        </div>
      </div>

      {!projectId ? (
        <div className="flex min-h-[420px] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white">
          <div className="max-w-sm text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1F453B]/10 text-[#1F453B]">
              <ClipboardCheck size={27} />
            </div>

            <h2 className="mt-4 text-base font-semibold text-slate-900">
              Select a project
            </h2>

            <p className="mt-1 text-sm leading-6 text-slate-500">
              Enter a project ID above to view QC sign-offs and current trade
              handoff status.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              icon={ClipboardCheck}
              label="Total Checks"
              value={stats.total}
              description="Recorded QC sign-offs"
            />

            <StatCard
              icon={CheckCircle2}
              label="Passed"
              value={stats.passed}
              description="Clear for handoff"
            />

            <StatCard
              icon={XCircle}
              label="Failed"
              value={stats.failed}
              description="Failed inspections"
            />

            <StatCard
              icon={RotateCcw}
              label="Rework"
              value={stats.rework}
              description="Requires another check"
            />
          </div>

          {/* Handoff */}
          {handoffStatus.length > 0 && (
            <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-slate-900">
                    Trade Handoff Status
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Latest QC state for each phase and trade.
                  </p>
                </div>

                <ArrowRight size={18} className="text-slate-400" />
              </div>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {handoffStatus.map((item, index) => {
                  const passed =
                    item.result === "PASS" ||
                    item.status === "PASS" ||
                    item.handoffReady === true ||
                    item.isReady === true;

                  return (
                    <div
                      key={item.id || index}
                      className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            {item.step?.name ||
                              item.stepName ||
                              `Step ${item.stepId || "—"}`}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {item.tradeTeam?.name ||
                              item.tradeTeamName ||
                              `Trade ${item.tradeTeamId || "—"}`}
                          </p>
                        </div>

                        {passed ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
                            <CheckCircle2 size={13} />
                            Ready
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700">
                            <AlertTriangle size={13} />
                            Blocked
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="relative flex-1">
                <Search
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search checks, steps, trades, inspectors..."
                  className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-[#1F453B] focus:ring-2 focus:ring-[#1F453B]/10"
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter size={16} className="text-slate-400" />

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-[#1F453B]"
                >
                  <option value="ALL">All Results</option>
                  <option value="PASS">Passed</option>
                  <option value="FAIL">Failed</option>
                  <option value="REWORK">Rework</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="font-semibold text-slate-900">
                QC Sign-Off History
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                {filteredHistory.length} record
                {filteredHistory.length === 1 ? "" : "s"}
              </p>
            </div>

            {isLoading ? (
              <div className="flex h-72 items-center justify-center">
                <RefreshCw size={22} className="animate-spin text-[#1F453B]" />
              </div>
            ) : filteredHistory.length === 0 ? (
              <div className="flex h-72 flex-col items-center justify-center px-6 text-center">
                <ClipboardCheck size={30} className="text-slate-300" />

                <p className="mt-3 text-sm font-medium text-slate-700">
                  No QC records found
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Try changing the filters or create a new QC sign-off.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-left">
                  <thead className="bg-slate-50">
                    <tr className="border-b border-slate-200">
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Check
                      </th>
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Step / Phase
                      </th>
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Trade
                      </th>
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Result
                      </th>
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Attempt
                      </th>
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Checked By
                      </th>
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Date
                      </th>
                      <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {filteredHistory.map((item) => (
                      <tr
                        key={item.id}
                        className="transition hover:bg-slate-50/70"
                      >
                        <td className="px-5 py-4">
                          <div>
                            <p className="text-sm font-medium text-slate-900">
                              {item.checklistTemplate?.name ||
                                item.checklistTemplateName ||
                                `QC #${item.id}`}
                            </p>

                            <p className="mt-1 max-w-[240px] truncate text-xs text-slate-400">
                              {item.notes || "No notes"}
                            </p>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <span className="text-sm text-slate-700">
                            {item.step?.name ||
                              item.stepName ||
                              `Step ${item.stepId || "—"}`}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <span className="text-sm text-slate-700">
                            {item.tradeTeam?.name ||
                              item.tradeTeamName ||
                              `Team ${item.tradeTeamId || "—"}`}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <StatusBadge status={item.result} />
                        </td>

                        <td className="px-5 py-4">
                          <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                            #{item.attemptNumber || 1}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-700">
                          {item.checkedBy || "—"}
                        </td>

                        <td className="px-5 py-4">
                          <p className="text-sm text-slate-700">
                            {formatDate(item.checkedAt)}
                          </p>
                          <p className="mt-1 text-xs text-slate-400">
                            {formatDateTime(item.checkedAt)}
                          </p>
                        </td>

                        <td className="px-5 py-4 text-right">
                          <button
                            onClick={() => setSelectedQc(item)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-[#1F453B]/30 hover:bg-[#1F453B]/5 hover:text-[#1F453B]"
                          >
                            <Eye size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Details modal */}
      {selectedQc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedQc(null);
            }
          }}
        >
          <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-200 p-5">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  QC Sign-Off #{selectedQc.id}
                </p>

                <h2 className="mt-1 text-lg font-semibold text-slate-900">
                  {selectedQc.checklistTemplate?.name ||
                    selectedQc.checklistTemplateName ||
                    "Quality Check"}
                </h2>
              </div>

              <button
                onClick={() => setSelectedQc(null)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <XCircle size={20} />
              </button>
            </div>

            <div className="grid gap-4 p-5 sm:grid-cols-2">
              <div>
                <p className="text-xs text-slate-400">Result</p>
                <div className="mt-1">
                  <StatusBadge status={selectedQc.result} />
                </div>
              </div>

              <div>
                <p className="text-xs text-slate-400">Attempt</p>
                <p className="mt-1 text-sm font-medium text-slate-800">
                  #{selectedQc.attemptNumber || 1}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-400">Step</p>
                <p className="mt-1 text-sm font-medium text-slate-800">
                  {selectedQc.step?.name ||
                    selectedQc.stepName ||
                    `Step ${selectedQc.stepId || "—"}`}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-400">Trade</p>
                <p className="mt-1 text-sm font-medium text-slate-800">
                  {selectedQc.tradeTeam?.name ||
                    selectedQc.tradeTeamName ||
                    `Team ${selectedQc.tradeTeamId || "—"}`}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-400">Checked By</p>
                <p className="mt-1 text-sm font-medium text-slate-800">
                  {selectedQc.checkedBy || "—"}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-400">Checked At</p>
                <p className="mt-1 text-sm font-medium text-slate-800">
                  {formatDateTime(selectedQc.checkedAt)}
                </p>
              </div>

              <div className="sm:col-span-2">
                <p className="text-xs text-slate-400">Notes</p>
                <div className="mt-2 rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                  {selectedQc.notes || "No notes recorded."}
                </div>
              </div>
            </div>

            {Array.isArray(selectedQc.itemResults) &&
              selectedQc.itemResults.length > 0 && (
                <div className="border-t border-slate-200 p-5">
                  <h3 className="mb-3 text-sm font-semibold text-slate-900">
                    Checklist Results
                  </h3>

                  <div className="space-y-2">
                    {selectedQc.itemResults.map((result) => (
                      <div
                        key={result.id}
                        className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 p-3"
                      >
                        <div>
                          <p className="text-sm text-slate-800">
                            {result.templateItem?.text ||
                              result.text ||
                              `Checklist Item #${result.templateItemId}`}
                          </p>

                          {result.remark && (
                            <p className="mt-1 text-xs text-slate-500">
                              {result.remark}
                            </p>
                          )}
                        </div>

                        <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                          {result.result}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </div>
        </div>
      )}
    </div>
  );
}
