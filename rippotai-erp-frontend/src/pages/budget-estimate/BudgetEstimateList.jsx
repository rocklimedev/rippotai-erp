import React, { useMemo, useState } from "react";
import {
  Eye,
  Edit,
  Trash2,
  Plus,
  Search,
  Filter,
  FileText,
  MoreVertical,
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

import {
  useGetBudgetEstimatesQuery,
  useDeleteBudgetEstimateMutation,
} from "../../api/budget-estimates.api";

// ============================================================
// STATUS
// ============================================================

const STATUS_OPTIONS = [
  "all",
  "draft",
  "in_progress",
  "submitted",
  "approved",
  "rejected",
  "revised",
  "cancelled",
];

const STATUS_LABELS = {
  draft: "Draft",
  in_progress: "In Progress",
  submitted: "Submitted",
  approved: "Approved",
  rejected: "Rejected",
  revised: "Revised",
  cancelled: "Cancelled",
};

const STATUS_CLASSES = {
  draft: "bg-gray-100 text-gray-700",
  in_progress: "bg-blue-100 text-blue-700",
  submitted: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  revised: "bg-purple-100 text-purple-700",
  cancelled: "bg-gray-200 text-gray-600",
};

// ============================================================
// HELPERS
// ============================================================

const formatCurrency = (value) => {
  const amount = Number(value || 0);

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
};

const formatDate = (date) => {
  if (!date) return "-";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "-";
  }

  return parsedDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// ============================================================
// COMPONENT
// ============================================================

const BudgetEstimateList = ({ projectId }) => {
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  // ============================================================
  // API
  // ============================================================

  const { data, isLoading, isFetching, isError, error, refetch } =
    useGetBudgetEstimatesQuery(projectId);

  const [deleteBudgetEstimate, { isLoading: isDeleting }] =
    useDeleteBudgetEstimateMutation();

  // ============================================================
  // NORMALIZE RESPONSE
  // ============================================================

  const estimates = useMemo(() => {
    if (Array.isArray(data)) {
      return data;
    }

    if (Array.isArray(data?.data)) {
      return data.data;
    }

    if (Array.isArray(data?.estimates)) {
      return data.estimates;
    }

    return [];
  }, [data]);

  // ============================================================
  // FILTER
  // ============================================================

  const filteredEstimates = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return estimates.filter((estimate) => {
      const matchesStatus = status === "all" || estimate.status === status;

      if (!matchesStatus) {
        return false;
      }

      if (!searchValue) {
        return true;
      }

      return (
        String(estimate.estimate_number || "")
          .toLowerCase()
          .includes(searchValue) ||
        String(estimate.title || "")
          .toLowerCase()
          .includes(searchValue) ||
        String(estimate.client_name || "")
          .toLowerCase()
          .includes(searchValue) ||
        String(estimate.location || "")
          .toLowerCase()
          .includes(searchValue) ||
        String(estimate.project?.name || "")
          .toLowerCase()
          .includes(searchValue)
      );
    });
  }, [estimates, search, status]);

  // ============================================================
  // CREATE
  // ============================================================

  const handleCreate = () => {
    if (projectId) {
      navigate(`/budget-estimates/create?projectId=${projectId}`);
    } else {
      navigate("/budget-estimates/create");
    }
  };

  // ============================================================
  // VIEW
  // ============================================================

  const handleView = (estimate) => {
    navigate(`/ledger/budget-estimate/${estimate.id}`);
  };

  // ============================================================
  // EDIT
  // ============================================================

  const handleEdit = (estimate) => {
    navigate(`/budget-estimates/${estimate.id}/edit`);
  };

  // ============================================================
  // DELETE
  // ============================================================

  const handleDelete = async (estimate) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${estimate.title}"?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteBudgetEstimate(estimate.id).unwrap();

      toast.success("Budget estimate deleted successfully");
    } catch (error) {
      toast.error(
        error?.data?.message ||
          error?.message ||
          "Failed to delete budget estimate",
      );
    }
  };

  // ============================================================
  // ERROR
  // ============================================================

  if (isError) {
    return (
      <div className="w-full rounded-xl border border-red-200 bg-red-50 p-6">
        <div className="flex flex-col items-center justify-center text-center">
          <FileText className="mb-3 h-10 w-10 text-red-300" />

          <p className="text-sm font-semibold text-red-700">
            Failed to load budget estimates
          </p>

          <p className="mt-1 text-sm text-red-500">
            {error?.data?.message ||
              error?.message ||
              "Something went wrong while loading estimates."}
          </p>

          <button
            type="button"
            onClick={refetch}
            className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="w-full space-y-6">
      {/* =====================================================
          HEADER
      ====================================================== */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <FileText className="h-5 w-5 text-primary" />
            </div>

            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                Budget Estimates
              </h1>

              <p className="text-sm text-gray-500">
                Manage and track project budget estimates
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleCreate}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Create Estimate
        </button>
      </div>

      {/* =====================================================
          FILTERS
      ====================================================== */}

      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          {/* Search */}

          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search estimate number, title, client or location..."
              className="h-10 w-full rounded-lg border border-gray-200 bg-white pl-10 pr-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
            />
          </div>

          {/* Status */}

          <div className="relative">
            <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="h-10 min-w-[180px] appearance-none rounded-lg border border-gray-200 bg-white pl-10 pr-8 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option === "all" ? "All Statuses" : STATUS_LABELS[option]}
                </option>
              ))}
            </select>
          </div>

          {/* Refresh */}

          <button
            type="button"
            onClick={refetch}
            disabled={isFetching}
            className="h-10 rounded-lg border border-gray-200 px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
          >
            {isFetching ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* =====================================================
          SUMMARY
      ====================================================== */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Total Estimates
          </p>

          <p className="mt-1 text-2xl font-semibold text-gray-900">
            {estimates.length}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Approved
          </p>

          <p className="mt-1 text-2xl font-semibold text-green-600">
            {
              estimates.filter((estimate) => estimate.status === "approved")
                .length
            }
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Draft
          </p>

          <p className="mt-1 text-2xl font-semibold text-gray-700">
            {estimates.filter((estimate) => estimate.status === "draft").length}
          </p>
        </div>
      </div>

      {/* =====================================================
          TABLE
      ====================================================== */}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px]">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Estimate
                </th>

                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Project
                </th>

                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Client
                </th>

                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Date
                </th>

                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Total
                </th>

                <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Status
                </th>

                <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {/* Loading */}

              {isLoading && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-12 text-center text-sm text-gray-500"
                  >
                    Loading budget estimates...
                  </td>
                </tr>
              )}

              {/* Empty */}

              {!isLoading && filteredEstimates.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <FileText className="mb-3 h-10 w-10 text-gray-300" />

                      <p className="text-sm font-medium text-gray-700">
                        No budget estimates found
                      </p>

                      <p className="mt-1 text-sm text-gray-500">
                        Try changing your search or filters.
                      </p>

                      <button
                        type="button"
                        onClick={handleCreate}
                        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white"
                      >
                        <Plus className="h-4 w-4" />
                        Create Estimate
                      </button>
                    </div>
                  </td>
                </tr>
              )}

              {/* Rows */}

              {!isLoading &&
                filteredEstimates.map((estimate) => {
                  const statusClass =
                    STATUS_CLASSES[estimate.status] ||
                    "bg-gray-100 text-gray-700";

                  return (
                    <tr
                      key={estimate.id}
                      className="transition hover:bg-gray-50"
                    >
                      {/* Estimate */}

                      <td className="px-5 py-4">
                        <div>
                          <button
                            type="button"
                            onClick={() => handleView(estimate)}
                            className="font-medium text-primary hover:underline"
                          >
                            {estimate.estimate_number || "-"}
                          </button>

                          <p className="mt-1 max-w-[260px] truncate text-sm text-gray-700">
                            {estimate.title || "-"}
                          </p>
                        </div>
                      </td>

                      {/* Project */}

                      <td className="px-5 py-4">
                        <p className="text-sm font-medium text-gray-800">
                          {estimate.project?.name ||
                            estimate.project_name ||
                            "-"}
                        </p>

                        {estimate.location && (
                          <p className="mt-1 text-xs text-gray-500">
                            {estimate.location}
                          </p>
                        )}
                      </td>

                      {/* Client */}

                      <td className="px-5 py-4">
                        <span className="text-sm text-gray-700">
                          {estimate.client_name || "-"}
                        </span>
                      </td>

                      {/* Date */}

                      <td className="px-5 py-4">
                        <span className="text-sm text-gray-700">
                          {formatDate(
                            estimate.estimate_date || estimate.created_at,
                          )}
                        </span>
                      </td>

                      {/* Total */}

                      <td className="px-5 py-4 text-right">
                        <span className="text-sm font-semibold text-gray-900">
                          {formatCurrency(estimate.total_amount)}
                        </span>
                      </td>

                      {/* Status */}

                      <td className="px-5 py-4 text-center">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusClass}`}
                        >
                          {STATUS_LABELS[estimate.status] ||
                            estimate.status ||
                            "Unknown"}
                        </span>
                      </td>

                      {/* Actions */}

                      <td className="px-5 py-4">
                        <div className="flex items-center justify-center gap-1">
                          {/* View */}

                          <button
                            type="button"
                            title="View"
                            onClick={() => handleView(estimate)}
                            className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
                          >
                            <Eye className="h-4 w-4" />
                          </button>

                          {/* Edit */}

                          <button
                            type="button"
                            title="Edit"
                            onClick={() => handleEdit(estimate)}
                            className="rounded-lg p-2 text-gray-500 transition hover:bg-blue-50 hover:text-blue-600"
                          >
                            <Edit className="h-4 w-4" />
                          </button>

                          {/* Delete */}

                          <button
                            type="button"
                            title="Delete"
                            disabled={isDeleting}
                            onClick={() => handleDelete(estimate)}
                            className="rounded-lg p-2 text-gray-500 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>

                          {/* More */}

                          <button
                            type="button"
                            title="More"
                            className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {/* ===================================================
            FOOTER
        ==================================================== */}

        {!isLoading && filteredEstimates.length > 0 && (
          <div className="border-t border-gray-200 bg-gray-50 px-5 py-3">
            <p className="text-sm text-gray-500">
              Showing{" "}
              <span className="font-medium text-gray-700">
                {filteredEstimates.length}
              </span>{" "}
              of{" "}
              <span className="font-medium text-gray-700">
                {estimates.length}
              </span>{" "}
              estimates
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BudgetEstimateList;
