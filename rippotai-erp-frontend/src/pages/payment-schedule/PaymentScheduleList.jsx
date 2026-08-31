import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Eye, Edit3, CreditCard, Trash2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { Shell, Card, Input } from "../../hooks/shared";

import {
  useGetPaymentSchedulesQuery,
  useUpdatePaymentScheduleMutation,
  useDeletePaymentScheduleMutation,
} from "../../api/payment-schedules.api";

export default function PaymentScheduleList() {
  const nav = useNavigate();
  const [q, setQ] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  // ------------------------------------------------------------
  // Project filter
  // ------------------------------------------------------------

  const projectFilter =
    new URLSearchParams(window.location.search).get("project_id") || "";

  // ------------------------------------------------------------
  // Get payment schedules
  // ------------------------------------------------------------

  const {
    data: rows = [],
    isFetching,
    isLoading,
  } = useGetPaymentSchedulesQuery(
    projectFilter ? { project_id: projectFilter } : undefined,
  );

  // ------------------------------------------------------------
  // Mutations
  // ------------------------------------------------------------

  const [updatePaymentSchedule, { isLoading: isUpdating }] =
    useUpdatePaymentScheduleMutation();

  const [deletePaymentSchedule] = useDeletePaymentScheduleMutation();

  // ------------------------------------------------------------
  // Client-side search
  // ------------------------------------------------------------

  const filteredRows = useMemo(() => {
    const term = q.trim().toLowerCase();

    if (!term) {
      return rows;
    }

    return rows.filter((r) => {
      const title = r.title || "";

      const projectName =
        r.project_name || r.projectName || r.project?.name || "";

      const status = r.status || "";

      const totalContractValue =
        r.total_contract_value ?? r.totalContractValue ?? "";

      const totalPayable = r.total_payable ?? r.totalPayable ?? "";

      return (
        title.toLowerCase().includes(term) ||
        projectName.toLowerCase().includes(term) ||
        status.toLowerCase().includes(term) ||
        String(totalContractValue).includes(term) ||
        String(totalPayable).includes(term)
      );
    });
  }, [rows, q]);

  // ------------------------------------------------------------
  // Clear project filter
  // ------------------------------------------------------------

  const clearProjectFilter = () => {
    nav("/ledger/payment-schedule/all");
  };

  // ------------------------------------------------------------
  // Create
  // ------------------------------------------------------------

  const handleCreate = () => {
    if (projectFilter) {
      nav(`/ledger/forms/payment-schedule?project_id=${projectFilter}`);
    } else {
      nav("/ledger/forms/payment-schedule");
    }
  };

  // ------------------------------------------------------------
  // View
  // ------------------------------------------------------------

  const handleView = (id) => {
    nav(`/ledger/payment-schedule/${id}`);
  };

  // ------------------------------------------------------------
  // Edit
  // ------------------------------------------------------------

  const handleEdit = (id) => {
    nav(`/ledger/payment-schedules/${id}/edit`);
  };

  // ------------------------------------------------------------
  // Update status
  // ------------------------------------------------------------

  const handleStatusChange = async (id, status) => {
    try {
      await updatePaymentSchedule({
        id,
        status,
      }).unwrap();

      toast.success(`Payment schedule marked as ${status}.`);
    } catch (error) {
      console.error("Failed to update payment schedule status:", error);

      toast.error(
        error?.data?.message ||
          error?.error ||
          "Failed to update payment schedule status.",
      );
    }
  };

  // ------------------------------------------------------------
  // Delete
  // ------------------------------------------------------------

  const handleDelete = async (id, title) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${
        title || "this payment schedule"
      }"?\n\nThis action cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(id);

      await deletePaymentSchedule(id).unwrap();

      toast.success("Payment schedule deleted successfully.");
    } catch (error) {
      console.error("Failed to delete payment schedule:", error);

      toast.error(
        error?.data?.message ||
          error?.error ||
          "Failed to delete payment schedule.",
      );
    } finally {
      setDeletingId(null);
    }
  };

  // ------------------------------------------------------------
  // Format currency
  // ------------------------------------------------------------

  const formatCurrency = (value) => {
    if (value === null || value === undefined || value === "") {
      return "—";
    }

    const number = Number(value);

    if (Number.isNaN(number)) {
      return "—";
    }

    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(number);
  };

  // ------------------------------------------------------------
  // Status
  // ------------------------------------------------------------

  const getStatusClass = (status) => {
    switch (status) {
      case "ACTIVE":
        return "bg-[#E8F3EE] text-[#1F453B]";

      case "COMPLETED":
        return "bg-[#EAF1F8] text-[#315A7D]";

      case "CANCELLED":
        return "bg-[#FBEAEA] text-[#9B3D3D]";

      case "DRAFT":
      default:
        return "bg-[#F4F6F7] text-[#6B7B7C]";
    }
  };

  // ------------------------------------------------------------
  // Render
  // ------------------------------------------------------------

  return (
    <Shell
      title="Payment Schedules"
      subtitle={`${rows.length} schedule${
        rows.length !== 1 ? "s" : ""
      }${projectFilter ? " for this project" : " across the workspace"}`}
      action={
        <button
          onClick={handleCreate}
          className="h-10 px-4 rounded-lg bg-[#1F453B] text-white text-[14px] font-semibold inline-flex items-center gap-1.5"
          data-testid="payment-schedule-new-btn"
        >
          <Plus size={14} />
          New Payment Schedule
        </button>
      }
    >
      {/* --------------------------------------------------------
          Filters
      --------------------------------------------------------- */}

      <div className="flex gap-3 flex-wrap items-center">
        <Input
          placeholder="Search payment schedules…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="max-w-sm"
        />

        {projectFilter && (
          <button
            onClick={clearProjectFilter}
            className="text-[13px] text-[#333333] font-semibold hover:text-[#1F453B]"
          >
            Clear project filter ×
          </button>
        )}
      </div>

      {/* --------------------------------------------------------
          Table
      --------------------------------------------------------- */}

      <Card>
        <div className="overflow-x-auto">
          <table
            className="w-full text-[14px]"
            data-testid="payment-schedule-table"
          >
            <thead className="bg-[#F4F6F7]">
              <tr>
                <th className="text-left px-3 py-3 text-[13px] uppercase tracking-[0.14em] text-[#6B7B7C]">
                  Schedule
                </th>

                <th className="text-left px-3 py-3 text-[13px] uppercase tracking-[0.14em] text-[#6B7B7C]">
                  Project
                </th>

                <th className="text-left px-3 py-3 text-[13px] uppercase tracking-[0.14em] text-[#6B7B7C]">
                  Contract Value
                </th>

                <th className="text-left px-3 py-3 text-[13px] uppercase tracking-[0.14em] text-[#6B7B7C]">
                  Payable
                </th>

                <th className="text-left px-3 py-3 text-[13px] uppercase tracking-[0.14em] text-[#6B7B7C]">
                  Milestones
                </th>

                <th className="text-left px-3 py-3 text-[13px] uppercase tracking-[0.14em] text-[#6B7B7C]">
                  Status
                </th>

                <th className="text-left px-3 py-3 text-[13px] uppercase tracking-[0.14em] text-[#6B7B7C]">
                  Updated
                </th>

                <th className="text-right px-3 py-3 text-[13px] uppercase tracking-[0.14em] text-[#6B7B7C] w-[150px]">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {/* ------------------------------------------------
                  Rows
              ------------------------------------------------- */}

              {!isLoading &&
                filteredRows.map((r) => {
                  const projectName =
                    r.project_name || r.projectName || r.project?.name || "—";

                  const contractValue =
                    r.total_contract_value ?? r.totalContractValue;

                  const payable = r.total_payable ?? r.totalPayable;

                  const milestonesCount =
                    r.milestones?.length ??
                    r.total_milestones ??
                    r.totalMilestones ??
                    0;

                  const status = r.status || "DRAFT";

                  const updated =
                    r.updated_at ||
                    r.updatedAt ||
                    r.created_at ||
                    r.createdAt ||
                    "";

                  const isDeleting = deletingId === r.id;

                  return (
                    <tr
                      key={r.id}
                      onClick={() => handleView(r.id)}
                      className="border-t border-[rgba(31,69,59,0.08)] hover:bg-[#F4F6F7] cursor-pointer"
                      data-testid={`payment-schedule-row-${r.id}`}
                    >
                      {/* Schedule */}

                      <td className="px-3 py-2.5 font-semibold text-[#333333] max-w-[280px]">
                        <div className="flex items-center gap-1.5 truncate">
                          <CreditCard
                            size={14}
                            className="shrink-0 text-[#B5C4B6]"
                          />

                          <span className="truncate">
                            {r.title || "Payment Schedule"}
                          </span>
                        </div>
                      </td>

                      {/* Project */}

                      <td className="px-3 py-2.5 text-[#6B7B7C] max-w-[240px]">
                        <span className="truncate block">{projectName}</span>
                      </td>

                      {/* Contract Value */}

                      <td className="px-3 py-2.5 text-[#6B7B7C]">
                        {formatCurrency(contractValue)}
                      </td>

                      {/* Payable */}

                      <td className="px-3 py-2.5 text-[#6B7B7C] font-medium">
                        {formatCurrency(payable)}
                      </td>

                      {/* Milestones */}

                      <td className="px-3 py-2.5 text-[#6B7B7C]">
                        {milestonesCount}
                      </td>

                      {/* Status */}

                      <td
                        className="px-3 py-2.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <select
                          value={status}
                          disabled={isUpdating}
                          onChange={(e) =>
                            handleStatusChange(r.id, e.target.value)
                          }
                          className={`px-2 py-1 rounded-md text-[11px] font-semibold tracking-wide border-0 outline-none cursor-pointer ${getStatusClass(
                            status,
                          )}`}
                          data-testid={`payment-schedule-status-${r.id}`}
                        >
                          <option value="DRAFT">DRAFT</option>
                          <option value="ACTIVE">ACTIVE</option>
                          <option value="COMPLETED">COMPLETED</option>
                          <option value="CANCELLED">CANCELLED</option>
                        </select>
                      </td>

                      {/* Updated */}

                      <td className="px-3 py-2.5 text-[#6B7B7C]">
                        {String(updated).slice(0, 10) || "—"}
                      </td>

                      {/* Actions */}

                      <td
                        className="px-3 py-2.5 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="inline-flex items-center gap-0.5">
                          {/* View */}

                          <button
                            onClick={() => handleView(r.id)}
                            className="p-1.5 rounded hover:bg-[#EAEEF0] text-[#333333]"
                            title="View"
                            data-testid={`payment-schedule-view-${r.id}`}
                          >
                            <Eye size={15} />
                          </button>

                          {/* Edit */}

                          <button
                            onClick={() => handleEdit(r.id)}
                            className="p-1.5 rounded hover:bg-[#EAEEF0] text-[#333333]"
                            title="Edit"
                            data-testid={`payment-schedule-edit-${r.id}`}
                          >
                            <Edit3 size={15} />
                          </button>

                          {/* Delete */}

                          <button
                            onClick={() =>
                              handleDelete(r.id, r.title || "Payment Schedule")
                            }
                            disabled={isDeleting}
                            className="p-1.5 rounded hover:bg-[#FBEAEA] text-[#9B3D3D] disabled:opacity-50"
                            title="Delete"
                            data-testid={`payment-schedule-delete-${r.id}`}
                          >
                            {isDeleting ? (
                              <RefreshCw size={15} className="animate-spin" />
                            ) : (
                              <Trash2 size={15} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

              {/* ------------------------------------------------
                  Loading
              ------------------------------------------------- */}

              {isFetching && (
                <tr>
                  <td colSpan={8} className="text-center text-[#B5C4B6] py-8">
                    Loading payment schedules...
                  </td>
                </tr>
              )}

              {/* ------------------------------------------------
                  Empty
              ------------------------------------------------- */}

              {!isFetching && !filteredRows.length && (
                <tr>
                  <td colSpan={8} className="text-center text-[#B5C4B6] py-8">
                    {q
                      ? "No payment schedules match your search."
                      : projectFilter
                        ? "No payment schedules found for this project."
                        : "No payment schedules yet. Create the first one from a project."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </Shell>
  );
}
